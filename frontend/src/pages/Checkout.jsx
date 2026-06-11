import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';

const Checkout = () => {
  const { cartItems, cartTotal, clearCartLocal } = useContext(CartContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States',
    paymentMethod: 'cod',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate shipping address fields
    if (
      !formData.fullName.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.postalCode.trim() ||
      !formData.country.trim()
    ) {
      showToast('Please enter a valid shipping address.', 'error');
      return;
    }

    // 2. Validate Card fields if Credit or Debit is selected
    if (formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit') {
      if (
        !formData.cardNumber.trim() ||
        !formData.cardExpiry.trim() ||
        !formData.cardCvv.trim() ||
        !formData.cardName.trim()
      ) {
        showToast('Please fill in all credit/debit card fields.', 'error');
        return;
      }

      // Basic card length check
      const cleanCard = formData.cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 16) {
        showToast('Card number must be 16 digits.', 'error');
        return;
      }

      if (formData.cardCvv.trim().length < 3) {
        showToast('CVV must be at least 3 digits.', 'error');
        return;
      }
    }

    if (cartItems.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.post('/orders', {
        shippingDetails: {
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          paymentMethod: formData.paymentMethod
        }
      });

      showToast(res.data.message || 'Order placed successfully!', 'success');
      clearCartLocal();
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      showToast(error.response?.data?.message || 'Failed to place order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-state">
        <CheckCircle2 size={48} className="empty-state-icon" style={{ color: 'var(--success)' }} />
        <h3>Checkout Complete</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          You don't have any pending items in your cart to checkout.
        </p>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '20px' }}>
          View Order History
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>
      </div>

      <h1 style={{ marginBottom: '30px', textAlign: 'left', fontSize: '28px' }}>Secure Checkout</h1>

      <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'flex-start' }}>
        {/* Left Column: Shipping & Payment Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'var(--card-bg)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', fontSize: '18px' }}>
            Shipping Address
          </h3>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="fullName" style={{ fontSize: '13px', marginBottom: '4px' }}>Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleInputChange}
              style={{ padding: '10px 14px' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="address" style={{ fontSize: '13px', marginBottom: '4px' }}>Street Address</label>
            <input
              id="address"
              name="address"
              type="text"
              className="form-control"
              placeholder="123 Luxury Ave, Suite 400"
              value={formData.address}
              onChange={handleInputChange}
              style={{ padding: '10px 14px' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="city" style={{ fontSize: '13px', marginBottom: '4px' }}>City</label>
              <input
                id="city"
                name="city"
                type="text"
                className="form-control"
                placeholder="New York"
                value={formData.city}
                onChange={handleInputChange}
                style={{ padding: '10px 14px' }}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="postalCode" style={{ fontSize: '13px', marginBottom: '4px' }}>Postal Code</label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                className="form-control"
                placeholder="10001"
                value={formData.postalCode}
                onChange={handleInputChange}
                style={{ padding: '10px 14px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="country" style={{ fontSize: '13px', marginBottom: '4px' }}>Country</label>
            <input
              id="country"
              name="country"
              type="text"
              className="form-control"
              placeholder="e.g. United States"
              value={formData.country}
              onChange={handleInputChange}
              style={{ padding: '10px 14px' }}
              required
            />
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', fontSize: '18px' }}>
            Payment Method
          </h3>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {/* Cash on Delivery */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              border: `1px solid ${formData.paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: formData.paymentMethod === 'cod' ? 'rgba(75, 56, 50, 0.05)' : 'transparent'
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={formData.paymentMethod === 'cod'}
                onChange={handleInputChange}
                style={{ accentColor: 'var(--primary)' }}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Cash on Delivery (COD)</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pay cash upon shipment delivery</div>
              </div>
            </label>

            {/* Credit Card */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              border: `1px solid ${formData.paymentMethod === 'credit' ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: formData.paymentMethod === 'credit' ? 'rgba(75, 56, 50, 0.05)' : 'transparent'
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="credit"
                checked={formData.paymentMethod === 'credit'}
                onChange={handleInputChange}
                style={{ accentColor: 'var(--primary)' }}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Credit Card</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pay securely with your credit card</div>
              </div>
            </label>

            {/* Debit Card */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              border: `1px solid ${formData.paymentMethod === 'debit' ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: formData.paymentMethod === 'debit' ? 'rgba(75, 56, 50, 0.05)' : 'transparent'
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="debit"
                checked={formData.paymentMethod === 'debit'}
                onChange={handleInputChange}
                style={{ accentColor: 'var(--primary)' }}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Debit Card</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pay using standard banking debit cards</div>
              </div>
            </label>
          </div>

          {/* Secure Card Form when credit/debit is chosen */}
          {(formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit') && (
            <div style={{
              marginTop: '15px',
              padding: '16px',
              backgroundColor: 'var(--background)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold' }}>
                <CreditCard size={16} /> Enter Card Details
              </h4>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="cardName" style={{ fontSize: '12px', marginBottom: '2px' }}>Cardholder Name</label>
                <input
                  id="cardName"
                  name="cardName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="cardNumber" style={{ fontSize: '12px', marginBottom: '2px' }}>Card Number</label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  className="form-control"
                  placeholder="1234 5678 1234 5678"
                  maxLength="19"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    // Automatically format card digits
                    const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                    setFormData(prev => ({ ...prev, cardNumber: val }));
                  }}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="cardExpiry" style={{ fontSize: '12px', marginBottom: '2px' }}>Expiry Date</label>
                  <input
                    id="cardExpiry"
                    name="cardExpiry"
                    type="text"
                    className="form-control"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={formData.cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setFormData(prev => ({ ...prev, cardExpiry: val }));
                    }}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="cardCvv" style={{ fontSize: '12px', marginBottom: '2px' }}>CVV</label>
                  <input
                    id="cardCvv"
                    name="cardCvv"
                    type="password"
                    className="form-control"
                    placeholder="123"
                    maxLength="4"
                    value={formData.cardCvv}
                    onChange={(e) => setFormData(prev => ({ ...prev, cardCvv: e.target.value.replace(/\D/g, '') }))}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Right Column: Order Items Summary */}
        <aside className="cart-summary" style={{ position: 'sticky', top: '100px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Review Items
          </h3>

          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '5px'
          }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                <img src={item.image} alt={item.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{item.title}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Qty: {item.quantity} &times; ₹{parseFloat(item.price).toFixed(0)}</div>
                </div>
                <div style={{ fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(0)}</div>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(0)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>Free</span>
          </div>

          <div className="summary-row summary-total">
            <span>Grand Total</span>
            <span>₹{cartTotal.toFixed(0)}</span>
          </div>

          <button
            onClick={handleSubmit}
            className={`btn btn-primary ${isSubmitting ? 'btn-disabled' : ''}`}
            style={{ width: '100%', marginTop: '20px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Placing Order...' : `Pay & Place Order`}
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
