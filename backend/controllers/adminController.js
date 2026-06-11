const db = require('../config/db');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [[productsCount]] = await db.query('SELECT COUNT(*) as total FROM products');
    const [[ordersCount]] = await db.query('SELECT COUNT(*) as total FROM orders');
    const [[usersCount]] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'user'");
    const [[salesSum]] = await db.query("SELECT SUM(total_price) as total FROM orders WHERE status != 'cancelled'");

    res.json({
      totalProducts: productsCount.total || 0,
      totalOrders: ordersCount.total || 0,
      totalUsers: usersCount.total || 0,
      totalSales: parseFloat(salesSum.total) || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error retrieving statistics.' });
  }
};

module.exports = {
  getDashboardStats
};
