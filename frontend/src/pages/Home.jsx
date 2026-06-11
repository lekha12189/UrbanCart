import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('trending'); // trending, bestSellers, newArrivals, deals

  // Product collections
  const [trending, setTrending] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [deals, setDeals] = useState([]);

  const [ethnic, setEthnic] = useState([]);
  const [western, setWestern] = useState([]);
  const [footwear, setFootwear] = useState([]);
  const [beauty, setBeauty] = useState([]);

  const slides = [
    {
      title: "Where Luxury Meets Simplicity",
      subtitle: "Explore our curated capsule collections crafted with organic materials and refined styles. Tailored for comfort, designed to endure.",
      btnText: "Shop Collection",
      link: "/products",
      bgImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80",
      tag: "New Season Arrivals"
    },
    {
      title: "Exclusive Fashion Deals",
      subtitle: "Indulge in premium garments and tailored styles with up to 50% discount on selected luxury linen collections.",
      btnText: "Shop Deals",
      link: "/products?discountRange=over30",
      bgImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&auto=format&fit=crop&q=80",
      tag: "Limited Time Deals"
    },
    {
      title: "Exclusive Member Offers",
      subtitle: "Register an account today to get free standard delivery across all regions and a 10% welcome voucher.",
      btnText: "Join Now",
      link: "/register",
      bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
      tag: "Special Offers"
    },
    {
      title: "Featured Masterpieces",
      subtitle: "Discover statement footwear, organic beauty toners, and bespoke wool coats designed for absolute luxury.",
      btnText: "View Featured",
      link: "/products",
      bgImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80",
      tag: "Featured Products"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveSlide(prev => (prev + 1) % slides.length);
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [
          trendingRes,
          bestSellersRes,
          newArrivalsRes,
          dealsRes,
          ethnicRes,
          westernRes,
          footwearRes,
          beautyRes
        ] = await Promise.all([
          API.get('/products?minRating=4.7&limit=4'),
          API.get('/products?minRating=4.5&limit=8'),
          API.get('/products?limit=4'),
          API.get('/products?discountRange=over30&limit=4'),
          API.get('/products?search=Ethnic&limit=4'),
          API.get('/products?search=Western&limit=4'),
          API.get('/products?category=Footwear&limit=4'),
          API.get('/products?category=Beauty&limit=4')
        ]);

        setTrending(trendingRes.data.products || []);
        
        const bsAll = bestSellersRes.data.products || [];
        setBestSellers(bsAll.slice(bsAll.length > 4 ? 4 : 0, 8));

        setNewArrivals(newArrivalsRes.data.products || []);
        setDeals(dealsRes.data.products || []);
        setEthnic(ethnicRes.data.products || []);
        setWestern(westernRes.data.products || []);
        setFootwear(footwearRes.data.products || []);
        setBeauty(beautyRes.data.products || []);
      } catch (error) {
        console.error('Error loading homepage collections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div>
      {/* Hero Section Carousel */}
      <section style={{
        position: 'relative',
        height: '380px',
        backgroundColor: '#4B3832',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '60px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Active Slide Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `linear-gradient(to right, rgba(75, 56, 50, 0.95), rgba(75, 56, 50, 0.45)), url("${slides[activeSlide].bgImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.5s ease-in-out',
          zIndex: 1
        }} />

        {/* Slide Content */}
        <div style={{
          position: 'relative',
          maxWidth: '550px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 60px',
          color: '#FFFFFF',
          zIndex: 2
        }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            color: '#D6D3D1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}>
            <Sparkles size={14} /> {slides[activeSlide].tag}
          </span>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: '38px',
            fontWeight: '700',
            lineHeight: '1.2',
            textAlign: 'left',
            marginBottom: '15px'
          }}>
            {slides[activeSlide].title}
          </h1>
          <p style={{
            color: '#F8F6F3',
            fontSize: '15px',
            marginBottom: '25px',
            opacity: 0.9,
            lineHeight: '1.5'
          }}>
            {slides[activeSlide].subtitle}
          </p>
          <Link to={slides[activeSlide].link} className="btn btn-secondary" style={{
            color: '#FFFFFF',
            borderColor: '#FFFFFF',
            padding: '10px 20px',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            width: 'fit-content'
          }}>
            {slides[activeSlide].btnText} <ArrowRight size={16} />
          </Link>
        </div>

        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            zIndex: 3,
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            zIndex: 3,
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
          <ChevronRight size={20} />
        </button>

        {/* Dots Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 3
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: activeSlide === idx ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                padding: 0
              }}
            />
          ))}
        </div>
      </section>

      {/* Showcase Grid of Curated Sections */}
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Curated Highlights</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px' }}>
        Discover sections tailored for your style choices.
      </p>

      {loading ? (
        <div className="spinner-container" style={{ margin: '40px 0' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Tabbed Products Selection */}
          <section style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', borderBottom: '2px solid var(--border-color)' }}>
              {[
                { id: 'trending', label: 'Trending Products' },
                { id: 'bestSellers', label: 'Best Sellers' },
                { id: 'newArrivals', label: 'New Arrivals' },
                { id: 'deals', label: 'Deals of the Day' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 24px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '-2px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="products-grid">
              {activeTab === 'trending' && trending.map(p => <ProductCard key={p.id} product={p} />)}
              {activeTab === 'bestSellers' && bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
              {activeTab === 'newArrivals' && newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
              {activeTab === 'deals' && deals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>

          {/* Categories Banner & Showcase section: Ethnic Wear */}
          {ethnic.length > 0 && (
            <section style={{ marginBottom: '60px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
              <div style={{
                backgroundImage: 'linear-gradient(rgba(75, 56, 50, 0.35), rgba(75, 56, 50, 0.85)), url("https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                padding: '30px',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>Ethnic Wear</h3>
                <p style={{ color: '#F8F6F3', fontSize: '13px', margin: '0 0 20px 0', opacity: 0.9, lineHeight: '1.4', textAlign: 'left' }}>
                  Indulge in handloom sarees, zari border Dupattas, Banarasi silk Kurtas, and heavy sequin Lehengas.
                </p>
                <Link to="/products?search=Ethnic" className="btn btn-secondary" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}>
                  View Collection
                </Link>
              </div>
              <div className="products-grid">
                {ethnic.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* Categories Banner & Showcase section: Western Wear */}
          {western.length > 0 && (
            <section style={{ marginBottom: '60px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
              <div style={{
                backgroundImage: 'linear-gradient(rgba(75, 56, 50, 0.35), rgba(75, 56, 50, 0.85)), url("https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                padding: '30px',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>Western Wear</h3>
                <p style={{ color: '#F8F6F3', fontSize: '13px', margin: '0 0 20px 0', opacity: 0.9, lineHeight: '1.4', textAlign: 'left' }}>
                  Find curated premium dresses, linen blouses, rigid denims, and bespoke tweed blazers.
                </p>
                <Link to="/products?search=Western" className="btn btn-secondary" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}>
                  View Collection
                </Link>
              </div>
              <div className="products-grid">
                {western.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* Categories Banner & Showcase section: Footwear */}
          {footwear.length > 0 && (
            <section style={{ marginBottom: '60px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
              <div style={{
                backgroundImage: 'linear-gradient(rgba(75, 56, 50, 0.35), rgba(75, 56, 50, 0.85)), url("https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                padding: '30px',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>Footwear</h3>
                <p style={{ color: '#F8F6F3', fontSize: '13px', margin: '0 0 20px 0', opacity: 0.9, lineHeight: '1.4', textAlign: 'left' }}>
                  Shop leather brogues, performance runners, premium sandals, and hand-stitched boots.
                </p>
                <Link to="/products?category=Footwear" className="btn btn-secondary" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}>
                  View Collection
                </Link>
              </div>
              <div className="products-grid">
                {footwear.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* Categories Banner & Showcase section: Beauty */}
          {beauty.length > 0 && (
            <section style={{ marginBottom: '60px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
              <div style={{
                backgroundImage: 'linear-gradient(rgba(75, 56, 50, 0.35), rgba(75, 56, 50, 0.85)), url("https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                padding: '30px',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <h3 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>Beauty Essentials</h3>
                <p style={{ color: '#F8F6F3', fontSize: '13px', margin: '0 0 20px 0', opacity: 0.9, lineHeight: '1.4', textAlign: 'left' }}>
                  Indulge in organic Ayurveda oils, deep-cleaning toners, and clinical face serums.
                </p>
                <Link to="/products?category=Beauty" className="btn btn-secondary" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}>
                  View Collection
                </Link>
              </div>
              <div className="products-grid">
                {beauty.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
