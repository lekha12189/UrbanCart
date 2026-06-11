const express = require('express');
const router = express.Router();
const { getCartItems, addToCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate); // Protect all routes below

router.get('/', getCartItems);
router.post('/add', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);

module.exports = router;
