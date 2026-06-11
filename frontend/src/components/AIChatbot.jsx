import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { MessageSquare, X, Send, Sparkles, ShoppingCart, Info, Mic, MicOff, Star } from 'lucide-react';

const AIChatbot = () => {
  const { token, user } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { wishlistItems } = useContext(WishlistContext);
  const navigate = useNavigate();

  // Session-persistent open state and message history
  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem('chat_open') === 'true';
  });
  
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [
      {
        sender: 'ai',
        text: "Hello! I am your **UrbanCart AI Assistant**. 🌟\n\nI can help you search the catalog, get personalized product suggestions, track your orders, or answer questions about payments and returns.\n\nWhat are you shopping for today?"
      }
    ];
  });

  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  // Sync open state and messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('chat_open', isOpen);
  }, [isOpen]);

  useEffect(() => {
    sessionStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when messages change or typing begins
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize browser speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputMsg(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Fetch recently viewed items from localStorage
  const getRecentlyViewed = () => {
    try {
      const saved = localStorage.getItem('recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse recently viewed items:', e);
      return [];
    }
  };

  const handleSendMessage = async (textToSend) => {
    const msgText = textToSend || inputMsg;
    if (!msgText.trim()) return;

    // Add user message to history
    const userMessage = { sender: 'user', text: msgText };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    
    setIsTyping(true);

    try {
      // Gather context
      const recentlyViewed = getRecentlyViewed();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Call backend AI API
      const res = await API.post('/ai/chat', { 
        message: msgText,
        history: messages, // Sends previous messages to keep conversation context
        cartItems,
        wishlistItems,
        recentlyViewed
      }, { headers });
      
      const aiReply = {
        sender: 'ai',
        text: res.data.reply,
        products: res.data.products,
        categories: res.data.categories
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (error) {
      console.error('AI chatbot error:', error);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: "I'm having some trouble connecting right now. Please try again in a bit!" }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Quick Action Buttons
  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  // Simple Markdown Parser to translate bold (**bold**) and bullet lists (• bullet) to React elements
  const renderMessageText = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let parts = line.split(/\*\*(.*?)\*\*/g);
      let renderedLine = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx}>{part}</strong>;
        }
        return part;
      });

      // Handle bullets
      if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
        const cleanText = line.replace(/^[•*]\s*/, '');
        parts = cleanText.split(/\*\*(.*?)\*\*/g);
        renderedLine = parts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx}>{part}</strong>;
          }
          return part;
        });
        return (
          <li key={idx} style={{ marginLeft: '12px', listStyleType: 'disc', margin: '4px 0 4px 12px', color: 'inherit' }}>
            {renderedLine}
          </li>
        );
      }

      return (
        <p key={idx} style={{ margin: '0 0 6px 0', minHeight: '1.2em', color: 'inherit' }}>
          {renderedLine}
        </p>
      );
    });
  };

  const quickActionsList = [
    { label: 'Recommend Products', query: 'Recommend Products' },
    { label: 'Deals & Offers', query: 'Deals & Offers' },
    { label: 'Track My Order', query: 'Track My Order' },
    { label: 'Help Me Choose', query: 'Help Me Choose' },
    { label: 'What\'s Trending', query: 'What\'s Trending' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'var(--font-family)' }}>
      {/* Minimized Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(75, 56, 50, 0.35)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s',
          }}
          className="ai-chat-bubble"
          title="Open AI Shopping Assistant"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Expanded Conversation Window */}
      {isOpen && (
        <div style={{
          width: '390px',
          height: '560px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 12px 40px rgba(75, 56, 50, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatFadeIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        className="ai-chat-window"
        >
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#2CD46B',
                boxShadow: '0 0 8px #2CD46B'
              }} />
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  UrbanCart Concierge <Sparkles size={14} fill="#FFD700" color="#FFD700" />
                </h4>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>AI Shopping Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', opacity: 0.85, padding: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1.0'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: '#FAF9F7',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}
          className="ai-messages-scroll"
          >
            {messages.map((msg, index) => (
              <div key={index} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : '#FFFFFF',
                  color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)',
                }}>
                  {renderMessageText(msg.text)}
                </div>

                {/* Custom Suggested Action Pills */}
                {msg.categories && msg.categories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {msg.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleQuickAction(cat)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: '1px solid var(--primary)',
                          background: 'transparent',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        className="ai-suggest-pill"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Premium Interactive Product Recommendation Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '8px',
                    width: '100%'
                  }}>
                    {msg.products.map((prod) => (
                      <div
                        key={prod.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          padding: '12px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.02)',
                          transition: 'transform 0.2s',
                        }}
                        className="ai-product-card"
                      >
                        <img
                          src={prod.image}
                          alt={prod.title}
                          style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12.5px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {prod.title}
                          </div>
                          
                          {/* Rating display */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                            <div style={{ display: 'flex', color: '#D4AF37' }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={10}
                                  fill={s <= Math.round(parseFloat(prod.rating || 5)) ? "#D4AF37" : "none"}
                                  color="#D4AF37"
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              ({prod.rating || '5.0'})
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 'bold' }}>
                            ₹{parseFloat(prod.price).toFixed(0)}
                            {prod.discount > 0 && (
                              <span style={{ fontSize: '10px', color: 'var(--success)', marginLeft: '6px', fontWeight: 'normal' }}>
                                ({prod.discount}% off)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/product/${prod.id}`);
                          }}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--primary)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(75, 56, 50, 0.2)'
                          }}
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block', animation: 'typingBlink 1.4s infinite both' }}></span>
                <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.2s' }}></span>
                <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Scrollable Panel */}
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
          className="ai-quick-actions-bar"
          >
            {quickActionsList.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.query)}
                disabled={isTyping}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#FAF9F7',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                className="ai-quick-action-btn"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Footer Input Area */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {/* Voice Input Button */}
            <button
              onClick={toggleListening}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#E53E3E' : 'var(--background)',
                color: isListening ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: isListening ? '0 0 10px rgba(229, 62, 62, 0.4)' : 'none'
              }}
              title={isListening ? "Listening... Click to stop" : "Use Voice Input"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening..." : "Ask for recommendations, deals..."}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                backgroundColor: 'var(--background)'
              }}
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMsg.trim() || isTyping}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: inputMsg.trim() && !isTyping ? 'var(--primary)' : 'var(--border-color)',
                color: '#FFFFFF',
                border: 'none',
                cursor: inputMsg.trim() && !isTyping ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
