const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

router.use(authenticate, isAdmin); // All admin routes require admin privileges

router.get('/stats', getDashboardStats);

module.exports = router;
