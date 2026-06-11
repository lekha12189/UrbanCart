import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (isAdmin && !adminSecret) {
      showToast('Please provide the admin secret passcode.', 'error');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password, isAdmin ? 'admin' : 'user', adminSecret);
    setLoading(false);

    if (result.success) {
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } else {
      showToast(result.error || 'Registration failed. Try again.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="auth-container" style={{ margin: '10px auto', padding: '24px 30px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '24px' }}>Create Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Join UrbanCart to experience luxury shopping
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" htmlFor="name" style={{ fontSize: '14px', marginBottom: '4px' }}>Full Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: '10px 14px' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" htmlFor="email" style={{ fontSize: '14px', marginBottom: '4px' }}>Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="e.g. customer@urbancart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '10px 14px' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" htmlFor="password" style={{ fontSize: '14px', marginBottom: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '10px 40px 10px 14px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
            <input
              id="isAdmin"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="isAdmin" style={{ cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Register as Admin</label>
          </div>

          {isAdmin && (
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" htmlFor="adminSecret" style={{ fontSize: '14px', marginBottom: '4px' }}>Admin Secret Passcode</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminSecret"
                  type={showAdminSecret ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter passcode (default: admin123)"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  style={{ padding: '10px 40px 10px 14px' }}
                  required={isAdmin}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showAdminSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
            style={{ width: '100%', marginTop: '6px', padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
