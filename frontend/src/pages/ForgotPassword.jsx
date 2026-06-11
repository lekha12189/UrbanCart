import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [demoResetLink, setDemoResetLink] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      showToast(res.data.message || 'Reset link generated!', 'success');
      setSuccess(true);
      if (res.data.resetLink) {
        setDemoResetLink(res.data.resetLink);
      }
    } catch (error) {
      console.error('Forgot password submit error:', error);
      showToast(error.response?.data?.message || 'Failed to generate reset link.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="auth-container" style={{ margin: '0', padding: '30px 40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Reset Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '14px' }}>
          Enter your registered email address to receive a password reset link.
        </p>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="e.g. customer@urbancart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Generating Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#C6F6D5',
              color: '#22543D',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              A password reset link has been successfully logged to the server console.
            </div>

            {demoResetLink && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: 'var(--background)',
                borderRadius: '8px',
                textAlign: 'left',
                border: '1px solid var(--border-color)'
              }}>
                <strong style={{ fontSize: '13px', color: 'var(--primary)', display: 'block', marginBottom: '5px' }}>
                  Demo Testing Link:
                </strong>
                <a
                  href={demoResetLink}
                  style={{
                    fontSize: '12px',
                    color: 'var(--secondary)',
                    textDecoration: 'underline',
                    wordBreak: 'break-all',
                    display: 'block'
                  }}
                >
                  {demoResetLink}
                </a>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                  (Click above or copy/paste it in your browser address bar to reset password)
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
