const db = require('../config/db');

// @desc    Create a new order from cart items
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const userId = req.user.id;
  const connection = await db.getConnection();

  try {
    // Start Transaction
    await connection.beginTransaction();

    // 1. Get user cart items
    const [cartItems] = await connection.query(
      `SELECT c.id, c.product_id, c.quantity, p.price, p.stock, p.title 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // 2. Validate stock for each item & calculate total price
    let totalPrice = 0;
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await connection.rollback();
        return res.status(400).json({
          message: `Insufficient stock for product "${item.title}". Only ${item.stock} items left.`
        });
      }
      totalPrice += item.price * item.quantity;
    }

    // 3. Create the order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
      [userId, totalPrice, 'pending']
    );
    const orderId = orderResult.insertId;

    // 4. Create order items and update product stock
    for (const item of cartItems) {
      // Insert order item
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Deduct stock from product
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 5. Clear user's cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    // Commit Transaction
    await connection.commit();

    res.status(201).json({
      message: 'Order placed successfully.',
      orderId,
      totalPrice
    });
  } catch (error) {
    // Rollback on any error
    await connection.rollback();
    console.error('Order creation transaction failed:', error);
    res.status(500).json({ message: 'Server error placing order.' });
  } finally {
    connection.release();
  }
};

// @desc    Get user orders or all orders if admin
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    let ordersQuery = '';
    let queryParams = [];

    if (isAdmin) {
      // Admin gets all orders with user names
      ordersQuery = `
        SELECT o.*, u.name as user_name, u.email as user_email 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        ORDER BY o.id DESC`;
    } else {
      // User gets only their own orders
      ordersQuery = `
        SELECT * FROM orders 
        WHERE user_id = ? 
        ORDER BY id DESC`;
      queryParams.push(userId);
    }

    const [orders] = await db.query(ordersQuery, queryParams);

    if (orders.length === 0) {
      return res.json([]);
    }

    // Bulk fetch order items to avoid N+1 query problem
    const orderIds = orders.map(o => o.id);
    const [orderItems] = await db.query(
      `SELECT oi.*, p.title, p.image, p.category 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id IN (${orderIds.join(',')})`
    );

    // Group items by order_id
    const itemsByOrderId = {};
    orderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push(item);
    });

    // Attach items to their respective orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: itemsByOrderId[order.id] || []
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error retrieving orders.' });
  }
};

// @desc    Update order status / Cancel order
// @route   PUT /api/orders/:id
// @access  Private (User can cancel pending, Admin can update to any)
const updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch current order state
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    // 2. Authorization check
    if (!isAdmin) {
      // Regular users can only cancel their own pending orders
      if (order.user_id !== userId) {
        await connection.rollback();
        return res.status(403).json({ message: 'Not authorized to modify this order.' });
      }

      if (status !== 'cancelled') {
        await connection.rollback();
        return res.status(400).json({ message: 'Users can only update status to "cancelled".' });
      }

      if (order.status !== 'pending') {
        await connection.rollback();
        return res.status(400).json({ message: 'Only pending orders can be cancelled.' });
      }
    }

    const oldStatus = order.status;
    const newStatus = status;

    // 3. Update status
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);

    // 4. Handle Inventory Adjustments
    // Case A: Transitioning to 'cancelled' from a non-cancelled state -> Restore stock
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }
    // Case B: Transitioning FROM 'cancelled' to a active state (Admin only) -> Deduct stock again
    else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      const [items] = await connection.query('SELECT product_id, quantity, price FROM order_items WHERE order_id = ?', [orderId]);
      
      // First verify stock for all items
      for (const item of items) {
        const [products] = await connection.query('SELECT stock, title FROM products WHERE id = ?', [item.product_id]);
        if (products.length === 0 || products[0].stock < item.quantity) {
          await connection.rollback();
          return res.status(400).json({
            message: `Cannot reactivate order. Product "${products[0]?.title || 'Unknown'}" has insufficient stock.`
          });
        }
      }

      // Deduct stock
      for (const item of items) {
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.commit();
    res.json({ message: `Order status updated to "${newStatus}".`, orderId, status: newStatus });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating order.' });
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus
};
