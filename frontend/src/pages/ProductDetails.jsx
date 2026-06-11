import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Star, Send } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductAndReviews = async () => {
    const numericId = Number(id);
    if (!id || isNaN(numericId) || numericId <= 0) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const prodRes = await API.get(`/products/${numericId}`);
      const prodData = prodRes.data;
      if (!prodData || !prodData.id) {
        setError(true);
        setLoading(false);
        return;
      }

      setProduct(prodData);
      setActiveImage(prodData.image || '');

      const colorsList = typeof prodData.colors === 'string' ? prodData.colors.split(',') : [];
      const sizesList = typeof prodData.sizes === 'string' ? prodData.sizes.split(',') : [];
      setSelectedColor(colorsList[0] || '');
      setSelectedSize(sizesList[0] || '');

      // Fetch reviews safely
      try {
        const revRes = await API.get(`/products/${numericId}/reviews`);
        setReviews(revRes.data || []);
      } catch (revErr) {
        console.error('Error fetching reviews:', revErr);
        setReviews([]);
      }

      // Fetch related products safely
      try {
        if (prodData.category) {
          const relRes = await API.get(`/products?category=${encodeURIComponent(prodData.category)}&limit=5`);
          setRelatedProducts((relRes.data?.products || []).filter(p => p && p.id !== prodData.id).slice(0, 4));
        } else {
          setRelatedProducts([]);
        }
      } catch (relErr) {
        console.error('Error fetching related products:', relErr);
        setRelatedProducts([]);
      }

      // Fetch similar products safely
      try {
        if (prodData.subcategory) {
          const simRes = await API.get(`/products?subcategory=${encodeURIComponent(prodData.subcategory)}&limit=5`);
          setSimilarProducts((simRes.data?.products || []).filter(p => p && p.id !== prodData.id).slice(0, 4));
        } else {
          setSimilarProducts([]);
        }
      } catch (simErr) {
        console.error('Error fetching similar products:', simErr);
        setSimilarProducts([]);
      }

    } catch (err) {
      console.error('Error fetching details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  useEffect(() => {
    if (product && product.id) {
      try {
        const key = 'recently_viewed';
        const saved = localStorage.getItem(key);
        let items = saved ? JSON.parse(saved) : [];
        items = [product, ...items.filter(item => item && item.id && item.id !== product.id)];
        items = items.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to update recently viewed items', e);
      }
    }
  }, [product]);

  const handleIncrement = () => {
    if (product && qty < product.stock) {
      setQty(prev => prev + 1);
    } else {
      showToast(`Only ${product?.stock} items are available in stock.`, 'error');
    }
  };

  const handleDecrement = () => {
    if (qty > 1) {
      setQty(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, qty);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const success = await addToCart(product.id, qty);
    if (success) {
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      showToast('Please type a comment.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      await API.post(`/products/${id}/reviews`, {
        rating: newRating,
        comment: newComment.trim()
      });
      showToast('Review submitted successfully!', 'success');
      setNewComment('');
      setNewRating(5);
      
      // Refresh reviews list
      const revRes = await API.get(`/products/${id}/reviews`);
      setReviews(revRes.data || []);
    } catch (err) {
      console.error('Failed to submit review:', err);
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state">
        <h3>Product Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          The product you are trying to view does not exist or has been removed.
        </p>
        <Link to="/products" className="btn btn-secondary" style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = (product?.stock || 0) <= 0;

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) 
    : parseFloat(product?.rating || 4.5).toFixed(1);

  const totalReviews = reviews.length > 0 ? reviews.length : (product?.review_count || 12);

  // Split images
  const imageList = typeof product?.images === 'string' && product.images 
    ? product.images.split(',') 
    : (product?.image ? [product.image] : []);

  // Parse specifications
  let specs = null;
  if (product?.specifications) {
    try {
      specs = typeof product.specifications === 'string'
        ? JSON.parse(product.specifications)
        : product.specifications;
    } catch (e) {
      console.error('Error parsing specifications:', e);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Shop
        </Link>
      </div>

      <h2 style={{ textAlign: 'left', marginBottom: '20px', fontSize: '24px' }}>Product Details</h2>

      {/* Main product display section fits cleanly in a grid */}
      <div className="product-details-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        padding: '24px'
      }}>
        {/* Left Column: Images Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9F7', borderRadius: '12px', padding: '10px', border: '1px solid var(--border-color)' }}>
            <img
              src={activeImage || product?.image || 'https://via.placeholder.com/400?text=No+Image'}
              alt={product?.title || 'Product'}
              className="product-details-image"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
          
          {/* Thumbnails list */}
          {imageList.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
              {imageList.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`${product?.title || 'Product'} view ${idx + 1}`}
                  onClick={() => setActiveImage(imgUrl)}
                  style={{
                    width: '65px',
                    height: '65px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: (activeImage === imgUrl) ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info & Action */}
        <div className="product-details-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="product-category" style={{ fontSize: '13px', letterSpacing: '1px' }}>{product?.category || 'General'}</span>
            {product?.brand && (
              <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--primary)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FAF9F7' }}>
                {product.brand}
              </span>
            )}
          </div>
          <h1 className="product-details-title" style={{ fontSize: '26px', margin: '8px 0 10px', textAlign: 'left' }}>{product?.title || 'Product Details'}</h1>
          
          {/* Rating Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', color: '#D4AF37' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={16} 
                  fill={star <= Math.round(parseFloat(avgRating)) ? "#D4AF37" : "none"} 
                  color="#D4AF37"
                />
              ))}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              {avgRating} ({totalReviews} reviews)
            </span>
          </div>

          <div className="product-details-price" style={{ fontSize: '22px', marginBottom: '12px', color: 'var(--accent)', fontWeight: '700' }}>
            ₹{parseFloat(product?.price || 0).toFixed(0)}
          </div>
          
          <p className="product-details-description" style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}>
            {product?.description || 'No description available.'}
          </p>

          {/* Colors Selection */}
          {typeof product?.colors === 'string' && product.colors.trim() !== '' && (
            <div style={{ marginBottom: '15px' }}>
              <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Available Colors:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.colors.split(',').map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: selectedColor === col ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: selectedColor === col ? 'var(--primary)' : 'var(--card-bg)',
                      color: selectedColor === col ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes Selection */}
          {typeof product?.sizes === 'string' && product.sizes.trim() !== '' && (
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Select Size:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.sizes.split(',').map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: selectedSize === sz ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: selectedSize === sz ? 'var(--primary)' : 'var(--card-bg)',
                      color: selectedSize === sz ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-details-meta" style={{ padding: '12px 0', marginBottom: '15px', fontSize: '14px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <strong>Availability:</strong>{' '}
              {isOutOfStock ? (
                <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Out of Stock</span>
              ) : (
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>In Stock ({product?.stock || 0} left)</span>
              )}
            </div>
            <div style={{ marginTop: '4px' }}>
              <strong>Standard Delivery:</strong> Free shipping across India (2 - 4 business days)
            </div>
          </div>

          {!isOutOfStock && (
            <div className="qty-selector" style={{ marginBottom: '15px' }}>
              <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handleDecrement} className="qty-btn" style={{ width: '30px', height: '30px' }} disabled={qty <= 1}>-</button>
                <span className="qty-val" style={{ fontSize: '16px' }}>{qty}</span>
                <button onClick={handleIncrement} className="qty-btn" style={{ width: '30px', height: '30px' }} disabled={qty >= (product?.stock || 1)}>+</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {isOutOfStock ? (
              <button className="btn btn-disabled" style={{ flex: 1 }} disabled>
                Out of Stock
              </button>
            ) : (
              <>
                <button onClick={handleAddToCart} className="btn btn-secondary" style={{ flex: 1, gap: '8px', fontSize: '14px', padding: '10px' }}>
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button onClick={handleBuyNow} className="btn btn-primary" style={{ flex: 1, fontSize: '14px', padding: '10px' }}>
                  Buy Now
                </button>
              </>
            )}
          </div>

          {/* Highlights */}
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '15px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}>
            <div>
              <ShieldCheck size={16} style={{ color: 'var(--primary)', margin: '0 auto 4px' }} />
              100% Genuine
            </div>
            <div>
              <Truck size={16} style={{ color: 'var(--primary)', margin: '0 auto 4px' }} />
              Free Shipping
            </div>
            <div>
              <RotateCcw size={16} style={{ color: 'var(--primary)', margin: '0 auto 4px' }} />
              30-Day Returns
            </div>
          </div>

          {/* Specifications Table */}
          {specs && typeof specs === 'object' && !Array.isArray(specs) && Object.keys(specs).length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px', display: 'block', marginBottom: '10px' }}>Product Specifications:</span>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {Object.entries(specs).map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-secondary)', width: '40%', fontWeight: '500' }}>{key}</td>
                      <td style={{ padding: '6px 0', color: 'var(--text-primary)', fontWeight: '600' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reviews section placed cleanly right below, styled in a single screen-friendly container */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '40px',
        backgroundColor: 'var(--card-bg)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-subtle)',
        maxHeight: '380px'
      }}>
        {/* Left Column: Reviews List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
            Customer Reviews ({reviews.length})
          </h3>
          
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '14px', padding: '10px 0' }}>
                No reviews yet for this product. Be the first to share your experience!
              </p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} style={{ borderBottom: '1px solid #EDEDED', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>{rev.user_name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', color: '#D4AF37', marginBottom: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={12} fill={star <= rev.rating ? "#D4AF37" : "none"} color="#D4AF37" />
                    ))}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Submit Review Form */}
        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px' }}>
          <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
            Write a Review
          </h3>
          
          {user ? (
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '4px' }}>Rating</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star
                        size={20}
                        fill={star <= newRating ? "#D4AF37" : "none"}
                        color={star <= newRating ? "#D4AF37" : "var(--border-color)"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="comment" style={{ fontSize: '13px', marginBottom: '4px' }}>Comment</label>
                <textarea
                  id="comment"
                  className="form-control"
                  rows="3"
                  placeholder="Share details of your experience with this item..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 12px', resize: 'none', borderRadius: '8px' }}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${submittingReview ? 'btn-disabled' : ''}`}
                style={{ width: '100%', padding: '10px', fontSize: '13px', gap: '6px' }}
                disabled={submittingReview}
              >
                <Send size={14} /> Submit Review
              </button>
            </form>
          ) : (
            <div style={{
              backgroundColor: 'var(--background)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '13px'
            }}>
              Please <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Log In</Link> to write a review.
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: '50px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', textAlign: 'left' }}>Related Products</h3>
          <div className="products-grid">
            {relatedProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div style={{ marginTop: '50px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', textAlign: 'left' }}>Similar Products</h3>
          <div className="products-grid">
            {similarProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
