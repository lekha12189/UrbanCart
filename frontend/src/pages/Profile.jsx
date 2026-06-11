import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, KeyRound, Lock, LogOut, ShoppingBag, LayoutDashboard } from 'lucide-react';

const Profile = () => {
  const { user, changePassword, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All fields are required.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      showToast(result.message || 'Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(result.error || 'Failed to change password.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto' }}>
      <h1 style={{ textAlign: 'left', marginBottom: '8px' }}>My Account</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Manage your profile settings and update your security credentials.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* Profile Info Card */}
        <div className="filters-sidebar" style={{ width: '100%', height: 'fit-content', padding: '30px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} /> Personal Information
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'sans-serif'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '20px' }}>{user?.name}</h4>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: user?.role === 'admin' ? '#FED7D7' : '#EBF8FF',
                  color: user?.role === 'admin' ? '#9B2C2C' : '#2B6CB0',
                  marginTop: '4px',
                  display: 'inline-block'
                }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</div>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>{user?.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={16} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Access Level</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', textTransform: 'capitalize' }}>{user?.role} Privileges</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/orders" className="btn btn-secondary" style={{ width: '100%', gap: '8px', padding: '10px' }}>
                  <ShoppingBag size={16} /> My Orders
                </Link>
                
                {user?.role === 'admin' && (
                  <Link to="/admin" className="btn btn-secondary" style={{ width: '100%', gap: '8px', padding: '10px' }}>
                    <LayoutDashboard size={16} /> Admin Panel
                  </Link>
                )}

                <Link to="/products" className="btn btn-secondary" style={{ width: '100%', gap: '8px', padding: '10px' }}>
                  Shop Collection
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn btn-danger"
                  style={{ width: '100%', gap: '8px', padding: '10px', marginTop: '10px' }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="filters-sidebar" style={{ width: '100%', padding: '30px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} /> Security Settings
          </h3>

          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="currentPassword"
                  type="password"
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
