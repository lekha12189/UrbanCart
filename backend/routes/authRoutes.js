const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getUserProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
