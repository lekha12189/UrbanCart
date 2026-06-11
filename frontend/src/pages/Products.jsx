import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, Inbox } from 'lucide-react';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read URL search params
  const category = searchParams.get('category') || 'All';
  const subcategory = searchParams.get('subcategory') || 'All';
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const age = searchParams.get('age') || 'All';
  const gender = searchParams.get('gender') || 'All';
  const color = searchParams.get('color') || 'All';
  const size = searchParams.get('size') || 'All';
  const brand = searchParams.get('brand') || 'All';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || 'All';
  const inStock = searchParams.get('inStock') || 'All';
  const discountRange = searchParams.get('discountRange') || 'All';

  // Local state for search and price inputs to avoid laggy sliders
  const [searchInput, setSearchInput] = useState(search);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalProducts: 0,
    currentPage: 1
  });

  // Sync states with URL changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLocalMinPrice(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setLocalMaxPrice(maxPrice);
  }, [maxPrice]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', 12); // Perfect grid size for 4 columns (4x3)
        
        if (category !== 'All') queryParams.append('category', category);
        if (subcategory !== 'All') queryParams.append('subcategory', subcategory);
        if (search) queryParams.append('search', search);
        if (age !== 'All') queryParams.append('age', age);
        if (gender !== 'All') queryParams.append('gender', gender);
        if (color !== 'All') queryParams.append('color', color);
        if (size !== 'All') queryParams.append('size', size);
        if (brand !== 'All') queryParams.append('brand', brand);
        if (minPrice) queryParams.append('minPrice', minPrice);
        if (maxPrice) queryParams.append('maxPrice', maxPrice);
        if (minRating !== 'All') queryParams.append('minRating', minRating);
        if (inStock !== 'All') queryParams.append('inStock', inStock);
        if (discountRange !== 'All') queryParams.append('discountRange', discountRange);

        const res = await API.get(`/products?${queryParams.toString()}`);
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { totalPages: 1, totalProducts: 0, currentPage: 1 });
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, subcategory, page, search, age, gender, color, size, brand, minPrice, maxPrice, minRating, inStock, discountRange]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat && cat !== 'All') {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    newParams.delete('subcategory'); // Clear subcategory on main category change
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    
    if (localMinPrice) {
      newParams.set('minPrice', localMinPrice);
    } else {
      newParams.delete('minPrice');
    }

    if (localMaxPrice) {
      newParams.set('maxPrice', localMaxPrice);
    } else {
      newParams.delete('maxPrice');
    }

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // context-aware subcategories list helper
  const getSubcategories = (cat) => {
    switch (cat) {
      case 'Women':
        return [
          { label: 'All Women Wear', value: 'All' },
          { label: 'Sarees (Ethnic)', value: 'Sarees' },
          { label: 'Kurtis (Ethnic)', value: 'Kurtis' },
          { label: 'Salwar Suits (Ethnic)', value: 'Salwar Suits' },
          { label: 'Lehengas (Ethnic)', value: 'Lehengas' },
          { label: 'Dupattas (Ethnic)', value: 'Dupattas' },
          { label: 'Dresses (Western)', value: 'Dresses' },
          { label: 'Tops (Western)', value: 'Tops' },
          { label: 'Jeans (Western)', value: 'Jeans' },
          { label: 'T-Shirts (Western)', value: 'T-Shirts' },
          { label: 'Skirts (Western)', value: 'Skirts' },
          { label: 'Jackets (Western)', value: 'Jackets' }
        ];
      case 'Men':
        return [
          { label: 'All Men Wear', value: 'All' },
          { label: 'Kurtas (Ethnic)', value: 'Kurtas' },
          { label: 'Sherwanis (Ethnic)', value: 'Sherwanis' },
          { label: 'Ethnic Sets (Ethnic)', value: 'Ethnic Sets' },
          { label: 'Shirts (Western)', value: 'Shirts' },
          { label: 'T-Shirts (Western)', value: 'T-Shirts' },
          { label: 'Jeans (Western)', value: 'Jeans' },
          { label: 'Trousers (Western)', value: 'Trousers' },
          { label: 'Jackets (Western)', value: 'Jackets' }
        ];
      case 'Footwear':
        return [
          { label: 'All Footwear', value: 'All' },
          { label: 'Sneakers', value: 'Sneakers' },
          { label: 'Sandals', value: 'Sandals' },
          { label: 'Boots', value: 'Boots' },
          { label: 'Formal Shoes', value: 'Formal Shoes' }
        ];
      case 'Accessories':
        return [
          { label: 'All Accessories', value: 'All' },
          { label: 'Bags', value: 'Bags' },
          { label: 'Belts', value: 'Belts' },
          { label: 'Scarves', value: 'Scarves' },
          { label: 'Totes', value: 'Totes' }
        ];
      case 'Beauty':
        return [
          { label: 'All Beauty', value: 'All' },
          { label: 'Skincare', value: 'Skincare' },
          { label: 'Face Oil', value: 'Face Oil' },
          { label: 'Toner', value: 'Toner' },
          { label: 'Serum', value: 'Serum' }
        ];
      default:
        return [];
    }
  };

  const categories = ['All', 'Men', 'Women', 'Accessories', 'Footwear', 'Beauty'];
  const genderOptions = ['All', 'Men', 'Women', 'Unisex'];
  const ratingOptions = [
    { label: 'All Ratings', value: 'All' },
    { label: '4.0+ Stars ⭐', value: '4.0' },
    { label: '4.2+ Stars ⭐', value: '4.2' },
    { label: '4.5+ Stars ⭐', value: '4.5' },
    { label: '4.7+ Stars ⭐', value: '4.7' }
  ];
  const colorOptions = ['All', 'Crimson Red', 'Navy Blue', 'Mustard Yellow', 'Olive Green', 'Classic Black', 'Pure White', 'Pastel Pink', 'Beige', 'Maroon', 'Gold', 'Clear'];
  const sizeOptions = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '7', '8', '9', '10', 'One Size', '50ml', '100ml'];
  
  const brandOptions = [
    'All', 'FabIndia', 'Biba', 'W', 'Aurelia', 'Libas', // Women Ethnic
    'Zara', 'H&M', 'Only', 'Vero Moda', 'Forever 21', 'Mango', // Women Western
    'Manyavar', 'Tasva', 'Soch', 'Peter England', // Men Ethnic
    "Levi's", 'Jack & Jones', 'Tommy Hilfiger', 'US Polo', 'Blackberrys', 'Allen Solly', // Men Western
    'Puma', 'Nike', 'Adidas', 'Woodland', 'Bata', 'Clarks', // Footwear
    'Kama Ayurveda', 'Forest Essentials', 'The Derma Co', 'Plum', "L'Oreal", // Beauty
    'Hidesign', 'Baggit', 'Caprese', 'Fastrack' // Accessories
  ];

  const discountOptions = [
    { label: 'All Discounts', value: 'All' },
    { label: 'Regular Pricing (< 10%)', value: 'under10' },
    { label: '10% - 30% Off', value: '10-30' },
    { label: 'Premium Discounts (> 30%)', value: 'over30' }
  ];

  const subcats = getSubcategories(category);

  return (
    <div>
      <h1 style={{ marginBottom: '10px', textAlign: 'left' }}>Our Collection</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
        Discover luxury garments, ethnic/western capsules, curated footwear, and organic beauty distillations.
      </p>

      <div className="products-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="filter-section" style={{ marginBottom: '10px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
              <SlidersHorizontal size={16} /> Filters
            </h4>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Categories</h4>
            <div className="filter-categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`filter-category-btn ${category === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories (Dynamic) */}
          {subcats.length > 0 && (
            <div className="filter-section">
              <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Subcategories</h4>
              <select
                className="form-control"
                value={subcategory}
                onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
              >
                {subcats.map(sub => <option key={sub.value} value={sub.value}>{sub.label}</option>)}
              </select>
            </div>
          )}

          {/* Brand Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Brand</h4>
            <select
              className="form-control"
              value={brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              {brandOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Price Range (₹)</h4>
            <form onSubmit={handlePriceApply} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                className="form-control"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                style={{ padding: '6px 8px', fontSize: '13px', borderRadius: '6px', width: '70px' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input
                type="number"
                placeholder="Max"
                className="form-control"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                style={{ padding: '6px 8px', fontSize: '13px', borderRadius: '6px', width: '70px' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
              >
                Go
              </button>
            </form>
          </div>

          {/* Size Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Size</h4>
            <select
              className="form-control"
              value={size}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              {sizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Color Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Color</h4>
            <select
              className="form-control"
              value={color}
              onChange={(e) => handleFilterChange('color', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              {colorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Gender</h4>
            <select
              className="form-control"
              value={gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Minimum Rating</h4>
            <select
              className="form-control"
              value={minRating}
              onChange={(e) => handleFilterChange('minRating', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              {ratingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Discount Filter */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Discount</h4>
            <select
              className="form-control"
              value={discountRange}
              onChange={(e) => handleFilterChange('discountRange', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              {discountOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Availability Toggle */}
          <div className="filter-section">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Availability</h4>
            <select
              className="form-control"
              value={inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
            >
              <option value="All">All Items</option>
              <option value="true">In Stock Only</option>
              <option value="false">Out of Stock Only</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchParams({});
              setSearchInput('');
              setLocalMinPrice('');
              setLocalMaxPrice('');
            }}
            style={{ width: '100%', padding: '10px', fontSize: '14px', marginTop: '10px' }}
          >
            Clear All Filters
          </button>
        </aside>

        {/* Catalog Section */}
        <main>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search products, brands, collections..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Search className="search-icon" size={20} />
            </button>
          </form>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Inbox size={48} className="empty-state-icon" />
              <h3>No products available</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                We couldn't find any products matching your filters.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '20px' }}
                onClick={() => {
                  setSearchParams({});
                  setSearchInput('');
                  setLocalMinPrice('');
                  setLocalMaxPrice('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
