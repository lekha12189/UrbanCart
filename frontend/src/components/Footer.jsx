import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#4B3832',
      color: 'rgba(255,255,255,0.7)',
      padding: '40px 20px',
      marginTop: 'auto',
      borderTop: '1px solid #7B5E57',
      fontFamily: "'Times New Roman', Times, serif"
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
      }}>
        <div>
          <h3 style={{ color: '#FFFFFF', marginBottom: '15px', letterSpacing: '1px' }}>URBANCART</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            Elevate your everyday wardrobe with our curated collections of premium fabrics and classic silhouettes. Designed for the modern individual who values luxury and comfort.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: '15px' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}><Link to="/products" style={{ color: 'inherit' }}>Shop Collection</Link></li>
            <li style={{ marginBottom: '8px' }}><Link to="/cart" style={{ color: 'inherit' }}>Shopping Cart</Link></li>
            <li style={{ marginBottom: '8px' }}><Link to="/orders" style={{ color: 'inherit' }}>Track Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: '15px' }}>Customer Support</h4>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>Email: support@urbancart.com</p>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>Phone: +1 (800) 555-0199</p>
          <p style={{ fontSize: '14px' }}>Hours: Mon - Fri, 9am - 6pm EST</p>
        </div>
      </div>
      <div style={{
        maxWidth: '1200px',
        margin: '30px auto 0',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        fontSize: '13px',
      }}>
        &copy; {new Date().getFullYear()} UrbanCart. All rights reserved. Made for premium fashion.
      </div>
    </footer>
  );
};

export default Footer;
