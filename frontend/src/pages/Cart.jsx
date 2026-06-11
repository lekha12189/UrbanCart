import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Cart = () => {
  const { cartItems, loading, updateCartQty, removeFromCart, cartTotal, cartCount } = useContext(CartContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleQtyChange = async (item, newQty) => {
    if (newQty <= 0) return;
    if (newQty > item.stock) {
      showToast(`Only ${item.stock} items are available in stock.`, 'error');
      return;
    }
    await updateCartQty(item.id, newQty);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingBag size={48} className="empty-state-icon" />
        <h3>Your cart is empty</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Looks like you haven't added any luxury fashion items to your cart yet.
        </p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '35px', textAlign: 'left' }}>Shopping Cart ({cartCount} items)</h1>

      <div className="cart-layout">
        {/* Left Column: Cart Items */}
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.image}
                alt={item.title}
                className="cart-item-image"
              />
              
              <div className="cart-item-details">
                <span className="cart-item-category">{item.category}</span>
                <Link to={`/product/${item.product_id}`}>
                  <h3 className="cart-item-title">{item.title}</h3>
                </Link>
                <div className="cart-item-price">₹{parseFloat(item.price).toFixed(0)}</div>
                
                {item.stock <= 5 && (
                  <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'block', marginTop: '4px' }}>
                    Only {item.stock} left in stock - order soon!
                  </span>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="cart-item-qty">
                <button
                  className="qty-btn"
                  onClick={() => handleQtyChange(item, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="qty-val">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => handleQtyChange(item, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>

              {/* Price Calculation */}
              <div style={{ fontWeight: '700', fontSize: '18px', width: '120px', textAlign: 'right' }}>
                ₹{(item.price * item.quantity).toFixed(0)}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  padding: '5px'
                }}
                title="Remove item"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Right Column: Summary */}
        <aside className="cart-summary">
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Order Summary
          </h3>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(0)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>Free</span>
          </div>

          <div className="summary-row" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            <span>Estimated Taxes</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>₹{cartTotal.toFixed(0)}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', gap: '8px' }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
          
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <Link to="/products" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Continue Shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
