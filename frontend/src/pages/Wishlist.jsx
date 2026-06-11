import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import { CartContext } from '../context/CartContext';
import { Trash2, ShoppingCart, Heart, Compass } from 'lucide-react';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = async (product) => {
    if (product.stock > 0) {
      await addToCart(product.id, 1);
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="empty-state">
        <Heart size={48} className="empty-state-icon" style={{ color: 'var(--text-secondary)' }} />
        <h3>Your Wishlist is Empty</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Explore our collections and save your favorite pieces here.
        </p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '35px', textAlign: 'left' }}>My Wishlist ({wishlistItems.length} items)</h1>

      <div className="products-grid">
        {wishlistItems.map((product) => {
          const isOutOfStock = product.stock <= 0;
          return (
            <div key={product.id} className="product-card">
              <Link to={`/product/${product.id}`}>
                <div className="product-image-container">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="product-image"
                  />
                  {isOutOfStock && (
                    <span className="product-badge product-badge-outofstock">Out of Stock</span>
                  )}
                </div>
              </Link>

              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <Link to={`/product/${product.id}`}>
                  <h3 className="product-title" style={{ fontSize: '16px', margin: '4px 0 8px', color: '#1E1E1E' }}>
                    {product.title}
                  </h3>
                </Link>
                <div className="product-price">₹{parseFloat(product.price).toFixed(0)}</div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  {isOutOfStock ? (
                    <button className="btn btn-disabled" style={{ flex: 1, padding: '8px', fontSize: '13px' }} disabled>
                      Out of Stock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '13px', gap: '6px' }}
                    >
                      <ShoppingCart size={14} /> Add
                    </button>
                  )}

                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', border: '1px solid var(--border-color)', color: 'var(--danger)' }}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
