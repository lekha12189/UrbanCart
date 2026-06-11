import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';
import { useToast } from './ToastContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get('/cart');
      setCartItems(res.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      showToast('Please login to add items to cart.', 'error');
      return false;
    }
    try {
      const res = await API.post('/cart/add', { product_id: productId, quantity });
      showToast(res.data.message || 'Added to cart successfully.', 'success');
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast(error.response?.data?.message || 'Failed to add to cart.', 'error');
      return false;
    }
  };

  const updateCartQty = async (cartItemId, quantity) => {
    try {
      await API.put(`/cart/${cartItemId}`, { quantity });
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Update cart qty error:', error);
      showToast(error.response?.data?.message || 'Failed to update quantity.', 'error');
      return false;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const res = await API.delete(`/cart/${cartItemId}`);
      showToast(res.data.message || 'Removed from cart.', 'success');
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Remove from cart error:', error);
      showToast(error.response?.data?.message || 'Failed to remove from cart.', 'error');
      return false;
    }
  };

  const clearCartLocal = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateCartQty,
      removeFromCart,
      fetchCart,
      clearCartLocal,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
