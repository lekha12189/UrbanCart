import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, XSquare, Calendar, CreditCard, Clock } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load order history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will restore item inventory.')) {
      return;
    }

    try {
      await API.put(`/orders/${orderId}`, { status: 'cancelled' });
      showToast('Order cancelled successfully.', 'success');
      fetchOrders(); // Refresh order history
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast(error.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'shipped': return 'badge-shipped';
      case 'delivered': return 'badge-delivered';
      case 'cancelled': return 'badge-cancelled';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingBag size={48} className="empty-state-icon" />
        <h3>No orders placed yet</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Explore our collection and place your first order.
        </p>
        <RouterLink to="/products" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Shop Collection
        </RouterLink>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '35px', textAlign: 'left' }}>Your Order History</h1>

      <div style={{ maxWidth: '850px' }}>
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            {/* Order Header */}
            <div className="order-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
                  Order #{order.id}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Ordered: {new Date(order.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span className={`order-badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status}
                </span>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="btn btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      borderColor: 'var(--danger)',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '8px'
                    }}
                  >
                    <XSquare size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="order-items-container">
              {order.items?.map((item) => (
                <div key={item.id} className="order-item-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="order-item-thumb"
                    />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Qty: {item.quantity} &times; ₹{parseFloat(item.price).toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '600' }}>
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Footer summary info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={14} /> Payment Method: Cash on Delivery
              </span>
              <span style={{ fontSize: '16px', fontWeight: '700' }}>
                Total Paid:{' '}
                <span style={{ color: 'var(--accent)', fontSize: '18px' }}>
                  ₹{parseFloat(order.total_price).toFixed(0)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
