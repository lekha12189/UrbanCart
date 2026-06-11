import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { Search, Heart, ShoppingCart, User } from 'lucide-react';

const Navbar = () => {
  const { cartCount } = useContext(CartContext);
  const { wishlistCount } = useContext(WishlistContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          URBANCART
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="navbar-search">
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="navbar-search-btn">
            <Search size={18} />
          </button>
        </form>

        {/* Action Icons */}
        <div className="navbar-icons">
          <Link to="/wishlist" className="navbar-icon-link" title="Wishlist">
            <Heart size={22} className="navbar-icon-svg" />
            {wishlistCount > 0 && <span className="navbar-badge">{wishlistCount}</span>}
          </Link>

          <Link to="/cart" className="navbar-icon-link" title="Cart">
            <ShoppingCart size={22} className="navbar-icon-svg" />
            {cartCount > 0 && <span className="navbar-badge">{cartCount}</span>}
          </Link>

          <Link to="/profile" className="navbar-icon-link" title="Profile">
            <User size={22} className="navbar-icon-svg" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
