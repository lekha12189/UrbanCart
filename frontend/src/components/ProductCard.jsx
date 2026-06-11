import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { ShoppingCart, Heart } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const navigate = useNavigate();

  if (!product || !product.id) {
    return null;
  }

  const isOutOfStock = (product.stock || 0) <= 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isOutOfStock) {
      addToCart(product.id, 1);
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    if (!isOutOfStock) {
      const success = await addToCart(product.id, 1);
      if (success) {
        navigate('/checkout');
      }
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`}>
        <div className="product-image-container">
          <img
            src={product.image}
            alt={product.title}
            className="product-image"
            loading="lazy"
          />
          {isOutOfStock ? (
            <span className="product-badge product-badge-outofstock">Out of Stock</span>
          ) : product.stock <= 5 ? (
            <span className="product-badge">Only {product.stock} left</span>
          ) : null}

          {/* Wishlist Heart Icon overlay */}
          <button
            onClick={handleWishlistToggle}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 5,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} fill={inWishlist ? "var(--primary)" : "none"} color="var(--primary)" />
          </button>
        </div>
      </Link>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/product/${product.id}`}>
          <h3 className="product-title" style={{ fontSize: '15px', margin: '4px 0 8px', color: '#1E1E1E', minHeight: '40px' }}>
            {product.title}
          </h3>
        </Link>
        <div className="product-price" style={{ marginBottom: '10px', fontSize: '16px' }}>
          ₹{parseFloat(product.price).toFixed(0)}
        </div>
        
        <div className="product-actions" style={{ marginTop: 'auto' }}>
          {isOutOfStock ? (
            <button className="btn btn-disabled" style={{ width: '100%' }} disabled>
              Unavailable
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddToCart}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                Add
              </button>
              <button
                onClick={handleBuyNow}
                className="btn btn-primary"
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
