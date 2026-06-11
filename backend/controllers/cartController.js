const db = require('../config/db');

// @desc    Get current user's cart items
// @route   GET /api/cart
// @access  Private
const getCartItems = async (req, res) => {
  const userId = req.user.id;

  try {
    const [cartItems] = await db.query(
      `SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image, p.stock, p.category 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ? 
       ORDER BY c.id DESC`,
      [userId]
    );

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Server error retrieving cart.' });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  const qty = parseInt(quantity) || 1;

  if (!product_id) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  try {
    // 1. Verify product exists and check stock
    const [products] = await db.query('SELECT stock, title FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[0];
    if (product.stock <= 0) {
      return res.status(400).json({ message: `Product "${product.title}" is out of stock.` });
    }

    // 2. Check if product is already in user's cart
    const [existingCartItems] = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existingCartItems.length > 0) {
      const item = existingCartItems[0];
      const newQty = item.quantity + qty;

      if (newQty > product.stock) {
        return res.status(400).json({
          message: `Cannot add more. Only ${product.stock} items available in stock, and you have ${item.quantity} in your cart.`
        });
      }

      await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, item.id]);
      return res.json({ message: 'Cart updated successfully.', cartItemId: item.id });
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          message: `Cannot add ${qty} items. Only ${product.stock} items available in stock.`
        });
      }

      const [result] = await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, qty]
      );
      return res.status(201).json({ message: 'Product added to cart.', cartItemId: result.insertId });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error adding product to cart.' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = async (req, res) => {
  const userId = req.user.id;
  const cartItemId = req.params.id;
  const { quantity } = req.body;

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Please provide a valid quantity greater than 0.' });
  }

  try {
    // Check if cart item exists and belongs to user
    const [cartItems] = await db.query(
      'SELECT c.product_id, p.stock, p.title FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?',
      [cartItemId, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const item = cartItems[0];
    if (qty > item.stock) {
      return res.status(400).json({
        message: `Only ${item.stock} items available in stock for "${item.title}".`
      });
    }

    await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [qty, cartItemId]);
    res.json({ message: 'Cart quantity updated.' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error updating cart.' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeCartItem = async (req, res) => {
  const userId = req.user.id;
  const cartItemId = req.params.id;

  try {
    // Check if cart item exists and belongs to user
    const [cartItems] = await db.query('SELECT id FROM cart WHERE id = ? AND user_id = ?', [cartItemId, userId]);
    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    await db.query('DELETE FROM cart WHERE id = ?', [cartItemId]);
    res.json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error removing item from cart.' });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartItem,
  removeCartItem
};
