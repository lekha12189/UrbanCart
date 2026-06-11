import { createContext, useState, useEffect, useContext } from 'react';
import { useToast } from './ToastContext';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load wishlist from localStorage on mount or when user changes
  useEffect(() => {
    const storageKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setWishlistItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse wishlist', e);
        setWishlistItems([]);
      }
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  // Persist to localStorage whenever wishlist changes
  const saveWishlist = (items) => {
    setWishlistItems(items);
    const storageKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  const addToWishlist = (product) => {
    if (wishlistItems.some((item) => item.id === product.id)) {
      return;
    }
    const updated = [...wishlistItems, product];
    saveWishlist(updated);
    showToast(`Added "${product.title}" to your wishlist.`, 'success');
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlistItems.filter((item) => item.id !== productId);
    saveWishlist(updated);
    showToast('Removed item from your wishlist.', 'success');
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        wishlistCount
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
