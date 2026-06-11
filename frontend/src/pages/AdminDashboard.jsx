import { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  ShoppingBag,
  ListOrdered,
  Plus,
  Edit2,
  Trash2,
  X,
  IndianRupee,
  Users,
  Archive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, products, orders

  // --- State for Dashboard Stats ---
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalSales: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // --- State for Products ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Men',
    image: '',
    stock: ''
  });

  // --- State for Orders ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({}); // orderId -> boolean

  // --- Load Stats ---
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      showToast('Failed to load dashboard statistics.', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  // --- Load Products ---
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      // Fetch products without page limit for admin management
      const res = await API.get('/products?limit=100');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Failed to load products.', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  // --- Load Orders ---
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      showToast('Failed to load orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  // --- Product CRUD Actions ---
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: '',
      category: 'Men',
      image: '',
      stock: ''
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      stock: product.stock
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const { title, description, price, category, image, stock } = productForm;

    if (!title || !description || price === '' || !category || !image || stock === '') {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    try {
      if (editingProduct) {
        // Edit Product API
        const res = await API.put(`/products/${editingProduct.id}`, {
          title,
          description,
          price: parseFloat(price),
          category,
          image,
          stock: parseInt(stock)
        });
        showToast(res.data.message || 'Product updated successfully.', 'success');
      } else {
        // Add Product API
        const res = await API.post('/products', {
          title,
          description,
          price: parseFloat(price),
          category,
          image,
          stock: parseInt(stock)
        });
        showToast(res.data.message || 'Product added successfully.', 'success');
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Product save error:', err);
      showToast(err.response?.data?.message || 'Failed to save product.', 'error');
    }
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const res = await API.delete(`/products/${productId}`);
      showToast(res.data.message || 'Product deleted successfully.', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Product delete error:', err);
      showToast('Failed to delete product.', 'error');
    }
  };

  // --- Order Management Actions ---
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await API.put(`/orders/${orderId}`, { status: newStatus });
      showToast(res.data.message || `Order status updated to "${newStatus}".`, 'success');
      fetchOrders();
    } catch (err) {
      console.error('Order status update error:', err);
      showToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    }
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  return (
    <div>
      <h1 style={{ textAlign: 'left', marginBottom: '30px' }}>Admin Dashboard</h1>

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">Control Panel</div>
          <div className="admin-sidebar-menu">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`admin-sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`admin-sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Archive size={18} />
              Manage Products
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`admin-sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ListOrdered size={18} />
              Manage Orders
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ minHeight: '400px' }}>
          {/* Tab 1: Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div>
              {statsLoading ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : (
                <>
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Total Sales</span>
                      <span className="admin-stat-value" style={{ color: 'var(--success)' }}>
                        <IndianRupee size={20} style={{ display: 'inline', marginTop: '-4px' }} />
                        {stats.totalSales.toFixed(0)}
                      </span>
                    </div>

                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Total Orders</span>
                      <span className="admin-stat-value">{stats.totalOrders}</span>
                    </div>

                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Active Products</span>
                      <span className="admin-stat-value">{stats.totalProducts}</span>
                    </div>

                    <div className="admin-stat-card">
                      <span className="admin-stat-label">Registered Customers</span>
                      <span className="admin-stat-value">
                        <Users size={20} style={{ display: 'inline', marginRight: '6px', color: 'var(--secondary)' }} />
                        {stats.totalUsers}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--card-bg)',
                    padding: '30px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-subtle)'
                  }}>
                    <h3>Welcome back, Administrator</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
                      Use the navigation sidebar to update inventory counts, manage product collections, list detailed order descriptions, and modify order delivery statuses.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Product Management */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Product Catalog</h3>
                <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ gap: '8px', padding: '10px 18px', borderRadius: '8px', fontSize: '14px' }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>

              {productsLoading ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-state-icon" />
                  <h3>No products found</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Click "Add Product" to populate inventory.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id}>
                          <td>
                            <img src={product.image} alt={product.title} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                          </td>
                          <td style={{ fontWeight: '600' }}>{product.title}</td>
                          <td>{product.category}</td>
                          <td style={{ fontWeight: '600', color: 'var(--accent)' }}>₹{parseFloat(product.price).toFixed(0)}</td>
                          <td>
                            <span style={{
                              fontWeight: '600',
                              color: product.stock <= 0 ? 'var(--danger)' : product.stock <= 5 ? 'var(--secondary)' : 'inherit'
                            }}>
                              {product.stock} {product.stock <= 0 && '(Out of stock)'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => handleOpenEditModal(product)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleProductDelete(product.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Order Management */}
          {activeTab === 'orders' && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>Customer Orders</h3>

              {ordersLoading ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <ListOrdered size={48} className="empty-state-icon" />
                  <h3>No orders found</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Orders placed by customers will appear here.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} style={{ borderBottom: expandedOrders[order.id] ? 'none' : '1px solid var(--border-color)' }}>
                          <td>
                            <button
                              onClick={() => toggleExpandOrder(order.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              {expandedOrders[order.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                          <td style={{ fontWeight: '600' }}>#{order.id}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{order.user_name || 'Customer'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.user_email}</div>
                          </td>
                          <td>
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--accent)' }}>
                            ₹{parseFloat(order.total_price).toFixed(0)}
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontWeight: '600',
                                backgroundColor: 'var(--background)',
                                outline: 'none'
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Render expanded items inline if active */}
              {orders.map(order => {
                if (!expandedOrders[order.id]) return null;
                return (
                  <div key={`expanded-${order.id}`} style={{
                    backgroundColor: 'var(--background)',
                    padding: '20px 40px',
                    borderBottom: '1px solid var(--border-color)',
                    marginTop: '-30px',
                    marginBottom: '30px'
                  }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', fontSize: '14px', color: 'var(--primary)' }}>
                      Order Items Details
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.items?.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={item.image} alt={item.title} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                            <span>{item.title} (Qty: {item.quantity})</span>
                          </div>
                          <span style={{ fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* --- Add/Edit Product Modal --- */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={productForm && handleProductSubmit}>
              <div className="form-group">
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Silk Linen Tunic"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe the fabric, fit, and care instructions..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  required
                  style={{ resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    className="form-control"
                    placeholder="1499"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="20"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL Link</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
