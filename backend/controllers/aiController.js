const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper to authenticate optionally
const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'urban_cart_jwt_secret_2026');
    } catch (err) {
      // Ignore invalid tokens
    }
  }
  return null;
};

// @desc    Handle AI shopping assistant chats
// @route   POST /api/ai/chat
// @access  Public (Optional auth)
const handleAIChat = async (req, res) => {
  const { message, history, cartItems, wishlistItems, recentlyViewed } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ reply: "Hello! How can I help you today?" });
  }

  const queryText = message.toLowerCase();
  const user = getUserFromToken(req);

  try {
    // 1. Fetch Product Catalog
    const [catalog] = await db.query('SELECT * FROM products');

    // Format catalog for prompt & search
    const formattedCatalog = catalog.map(p => {
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        price: parseFloat(p.price),
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand,
        image: p.image,
        stock: p.stock,
        gender: p.gender,
        color: p.color,
        colors: p.colors,
        sizes: p.sizes,
        discount: p.discount,
        rating: p.rating || '4.5',
        reviewsCount: p.review_count || 10
      };
    });

    // 2. Fetch User Order History (if authenticated)
    let orderHistory = [];
    if (user) {
      const [orders] = await db.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
        [user.id]
      );
      for (let order of orders) {
        const [items] = await db.query(
          `SELECT oi.quantity, oi.price, p.id as product_id, p.title 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );
        orderHistory.push({
          orderId: order.id,
          totalPrice: parseFloat(order.total_price),
          status: order.status,
          createdAt: order.created_at,
          items: items.map(it => ({
            productId: it.product_id,
            title: it.title,
            quantity: it.quantity,
            price: parseFloat(it.price)
          }))
        });
      }
    }

    // 3. Decide: OpenAI API call or Fallback Mock
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        
        // System prompt setup
        const systemPrompt = `
You are the premium AI Shopping Assistant for UrbanCart, a luxury fashion and lifestyle e-commerce platform in India.
Your goal is to assist customers with product recommendations, search assistance, category/subcategory guidance, cart assistance, checkout FAQs, and order status tracking.

CURRENCY:
- The entire platform runs on Indian Rupees (₹).
- Catalog prices are in ₹. Always display prices prefixed with ₹ (e.g. ₹1,499). Never use the dollar ($) sign.

PLATFORM FAQ CONTEXT:
- Shipping: Free Standard Delivery on all orders across India. Takes 2-4 business days. Tracking links are found in the user's Profile page.
- Returns: Hassle-free 30-day return policy. Items must be unused, in their original packaging, and with tags attached. Returns can be initiated from the Profile page.
- Payments: Cash on Delivery (COD), UPI, Credit Card, and Debit Card (Visa, Mastercard, RuPay, AMEX). All processed securely.
- Categories & Subcategories:
  * Women:
    - Ethnic Wear: Sarees, Kurtis, Salwar Suits, Lehengas, Dupattas
    - Western Wear: Dresses, Tops, Jeans, T-Shirts, Skirts, Jackets
  * Men:
    - Ethnic Wear: Kurtas, Sherwanis, Ethnic Sets
    - Western Wear: Shirts, T-Shirts, Jeans, Trousers, Jackets
  * Footwear: Sneakers, Sandals, Boots, Formal Shoes
  * Beauty: Skincare, Face Oil, Toner, Serum
  * Accessories: Bags, Belts, Scarves, Totes

PRODUCT CATALOG (UrbanCart database):
${JSON.stringify(formattedCatalog.slice(0, 150))} -- Note: Catalog truncated for context length. Use catalog properties.

USER CONTEXT:
- Authenticated User: ${user ? `${user.name} (${user.email})` : 'Anonymous Guest'}
- Cart Items: ${JSON.stringify(cartItems || [])}
- Wishlist Items: ${JSON.stringify(wishlistItems || [])}
- Recently Viewed: ${JSON.stringify(recentlyViewed || [])}
- Order History: ${JSON.stringify(orderHistory || [])}

RULES:
1. ONLY recommend products that are available in UrbanCart (based on titles, categories, and subcategories matching the catalog). Do not make up brand names or products.
2. Never suggest out-of-stock items (stock = 0).
3. Always recommend products within the user's specified budget in Indian Rupees (₹). If they state a budget in Dollars (e.g. $100), convert it to Rupees at 1 USD = 83 INR (e.g. $100 is approx ₹8300) and filter items under that limit.
4. Suggest complementary items for items in the cart or wishlist when asked (e.g. if they have shoes, suggest socks or leather belts; if they have skin toner, suggest face oils).
5. Suggest relevant category/subcategory guidance to help the user navigate.
6. Provide concise, friendly, and elegant shopping advice. Maintain the tone of a high-end luxury concierge. Keep markdown response neat (bolding and bullet lists are encouraged).

JSON OUTPUT FORMAT:
You MUST respond ONLY with a raw JSON object of the following format. Do not wrap your response in markdown code blocks:
{
  "reply": "Your helpful response text here.",
  "productIds": [1, 2, ...],
  "categories": ["Suggested Category or Action Button 1", "Suggested Category or Action Button 2", ...]
}

For "categories", you can output standard categories or specific subcategories (e.g., "Sarees", "Kurtas", "Sherwanis", "Dresses", "Deals & Offers", "Track My Order") as relevant to guide the user.
`;

        const openAIMessages = [
          { role: 'system', content: systemPrompt }
        ];

        if (history && Array.isArray(history)) {
          history.slice(-8).forEach(msg => {
            openAIMessages.push({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            });
          });
        }

        openAIMessages.push({ role: 'user', content: message });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: openAIMessages,
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 800
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`OpenAI API request failed: ${JSON.stringify(errData)}`);
        }

        const responseData = await response.json();
        let jsonText = responseData.choices[0].message.content.trim();
        
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.substring(7);
        }
        if (jsonText.endsWith('```')) {
          jsonText = jsonText.substring(0, jsonText.length - 3);
        }

        const aiResult = JSON.parse(jsonText.trim());
        const recommendedProducts = formattedCatalog.filter(p => 
          aiResult.productIds && aiResult.productIds.includes(p.id)
        );

        return res.json({
          reply: aiResult.reply,
          products: recommendedProducts,
          categories: aiResult.categories || []
        });

      } catch (openaiError) {
        console.error('OpenAI Error, falling back to local mock:', openaiError);
      }
    }

    // 4. Fallback Mock Mode (Key is missing or OpenAI fails)
    return runFallbackMock(res, queryText, user, formattedCatalog, orderHistory, cartItems, wishlistItems, recentlyViewed);

  } catch (error) {
    console.error('AI Chatbot Main Controller Error:', error);
    res.status(500).json({ 
      reply: "I'm sorry, I'm experiencing some system difficulties right now. Please try again in a moment!",
      products: [],
      categories: ["Help Me Choose", "Deals & Offers"]
    });
  }
};

// Fallback Mock Logic
const runFallbackMock = (res, queryText, user, catalog, orderHistory, cartItems, wishlistItems, recentlyViewed) => {
  let reply = "";
  let products = [];
  let categories = ["Recommend Products", "Deals & Offers", "Track My Order", "Help Me Choose", "What's Trending"];

  // A. FAQ - Shipping
  if (queryText.includes('shipping') || queryText.includes('delivery') || queryText.includes('ship')) {
    reply = "We offer **Free Standard Delivery** on all orders across India! Standard delivery takes between **2 - 4 business days**. Once your order ships, you will receive a tracking link in your profile.";
    categories = ["Recommend Products", "Track My Order"];
  }
  // B. FAQ - Returns & Refund
  else if (queryText.includes('return') || queryText.includes('refund') || queryText.includes('exchange')) {
    reply = "At UrbanCart, customer satisfaction is our top priority. We offer a hassle-free **30-day return policy**. Items must be unused, in their original packaging, and with tags attached. You can initiate a return from your profile page.";
    categories = ["Help Me Choose", "Recommend Products"];
  }
  // C. FAQ - Payments & UPI
  else if (queryText.includes('payment') || queryText.includes('credit') || queryText.includes('debit') || queryText.includes('cod') || queryText.includes('pay') || queryText.includes('upi')) {
    reply = "We support multiple secure payment options: **Cash on Delivery (COD)**, **UPI (GPay, PhonePe, Paytm)**, **Credit Card**, and **Debit Card** (Visa, Mastercard, RuPay, Amex). All transactions are encrypted.";
    categories = ["Recommend Products", "Deals & Offers"];
  }
  // D. Order Tracking Support
  else if (queryText.includes('order') || queryText.includes('track') || queryText.includes('purchase')) {
    if (!user) {
      reply = "To assist you with your orders, please **Log In** first. This helps me verify your account and display your order status securely.";
      categories = ["Deals & Offers", "Recommend Products"];
    } else if (orderHistory.length === 0) {
      reply = `Hello ${user.name}, I checked your account but couldn't find any recent orders. Let me know if you would like some recommendations to get started!`;
      categories = ["Recommend Products", "What's Trending"];
    } else {
      const latest = orderHistory[0];
      const itemsStr = latest.items.map(item => `${item.quantity}x ${item.title}`).join(', ');
      reply = `Hello ${user.name}! I found your latest order **#${latest.orderId}** placed recently.\n\n**Status:** ${latest.status.toUpperCase()}\n**Total Price:** ₹${latest.totalPrice.toFixed(0)}\n**Items:** ${itemsStr}.\n\nYou can track and manage all orders directly from your profile page.`;
      categories = ["Recommend Products", "What's Trending"];
    }
  }
  // E. Deals & Offers / Trending
  else if (queryText.includes('deal') || queryText.includes('offer') || queryText.includes('discount') || queryText.includes('trending') || queryText.includes('trend') || queryText.includes('popular') || queryText.includes('best seller')) {
    products = catalog.filter(p => p.stock > 0 && (p.discount > 15 || parseFloat(p.rating) >= 4.7)).slice(0, 3);
    reply = "Here are some of our **hottest deals and trending products** currently at UrbanCart:\n\n" + 
      products.map(p => `• **${p.title}** - ₹${p.price.toFixed(0)} (${p.discount}% Off) ⭐ ${p.rating}`).join('\n') +
      "\n\nGrab them before they are out of stock!";
    categories = ["Help Me Choose", "Deals & Offers"];
  }
  // F. Cart Assistance (complementary suggestions)
  else if (queryText.includes('cart') || queryText.includes('bought') || queryText.includes('complement') || queryText.includes('match') || queryText.includes('go with')) {
    const cartTitles = (cartItems || []).map(c => c.title.toLowerCase());
    
    const hasFootwear = cartTitles.some(t => t.includes('shoe') || t.includes('boot') || t.includes('sandal') || t.includes('sneaker'));
    const hasClothing = cartTitles.some(t => t.includes('shirt') || t.includes('trouser') || t.includes('blazer') || t.includes('dress') || t.includes('skirt') || t.includes('cardigan') || t.includes('kurti') || t.includes('saree') || t.includes('kurta'));
    const hasSkincare = cartTitles.some(t => t.includes('toner') || t.includes('serum') || t.includes('oil'));

    if (hasFootwear) {
      products = catalog.filter(p => p.stock > 0 && p.category === 'Accessories').slice(0, 2);
      reply = "Since you have footwear in your cart, we highly recommend matching them with our full-grain leather accessories, like a classic belt or canvas tote, to complete your look:";
    } else if (hasClothing) {
      products = catalog.filter(p => p.stock > 0 && p.category === 'Footwear').slice(0, 2);
      reply = "To complement your selected wardrobe apparel, here are some elegant footwear options that fit perfectly:";
    } else if (hasSkincare) {
      products = catalog.filter(p => p.stock > 0 && p.category === 'Beauty' && !cartTitles.includes(p.title.toLowerCase())).slice(0, 2);
      reply = "To maximize your skincare routine, we recommend combining your products with these complementary organic beauty blends:";
    } else {
      products = catalog.filter(p => p.stock > 0 && p.category === 'Accessories').slice(0, 2);
      reply = "Here are some premium accessories that go well with almost any outfit:";
    }
    categories = ["Recommend Products", "Deals & Offers"];
  }
  // G. Product Recommendations / Search Assistance with Budget Parser (Rupee-based)
  else {
    let budgetInr = Infinity;
    
    // Attempt to parse budget (under X, below Y)
    const budgetMatch = queryText.match(/(?:under|below|less than|budget of)\s*(?:rs\.?|inr|₹|\$)?\s*(\d+)/i);
    if (budgetMatch) {
      const budgetVal = parseInt(budgetMatch[1]);
      if (queryText.includes('$')) {
        budgetInr = budgetVal * 83; // Convert dollars to rupees
      } else {
        budgetInr = budgetVal;
      }
    }

    // Determine target category/subcategory keywords
    let targetSubcategory = null;
    let targetCategory = null;

    if (queryText.includes('saree')) targetSubcategory = 'Sarees';
    else if (queryText.includes('kurti')) targetSubcategory = 'Kurtis';
    else if (queryText.includes('suit') || queryText.includes('salwar')) targetSubcategory = 'Salwar Suits';
    else if (queryText.includes('lehenga')) targetSubcategory = 'Lehengas';
    else if (queryText.includes('dupatta')) targetSubcategory = 'Dupattas';
    else if (queryText.includes('kurta')) targetSubcategory = 'Kurtas';
    else if (queryText.includes('sherwani')) targetSubcategory = 'Sherwanis';
    else if (queryText.includes('ethnic set') || queryText.includes('nehru')) targetSubcategory = 'Ethnic Sets';
    else if (queryText.includes('shirt')) targetSubcategory = 'Shirts';
    else if (queryText.includes('t-shirt') || queryText.includes('tee')) targetSubcategory = 'T-Shirts';
    else if (queryText.includes('trouser') || queryText.includes('pant') || queryText.includes('chino')) targetSubcategory = 'Trousers';
    else if (queryText.includes('jeans') || queryText.includes('denim')) targetSubcategory = 'Jeans';
    else if (queryText.includes('jacket') || queryText.includes('blazer') || queryText.includes('coat')) targetSubcategory = 'Jackets';
    else if (queryText.includes('skirt')) targetSubcategory = 'Skirts';
    else if (queryText.includes('dress')) targetSubcategory = 'Dresses';

    // Generic category filters
    if (!targetSubcategory) {
      if (queryText.includes('footwear') || queryText.includes('shoe') || queryText.includes('sneaker') || queryText.includes('sandal')) targetCategory = 'Footwear';
      else if (queryText.includes('beauty') || queryText.includes('skincare') || queryText.includes('oil') || queryText.includes('toner') || queryText.includes('serum')) targetCategory = 'Beauty';
      else if (queryText.includes('accessory') || queryText.includes('accessories') || queryText.includes('bag') || queryText.includes('belt') || queryText.includes('scarf')) targetCategory = 'Accessories';
      else if (queryText.includes('women') || queryText.includes('ethnic') || queryText.includes('western')) targetCategory = 'Women';
      else if (queryText.includes('men')) targetCategory = 'Men';
    }

    // Filter catalog
    let filtered = catalog.filter(p => p.stock > 0 && p.price <= budgetInr);
    
    if (targetSubcategory) {
      filtered = filtered.filter(p => p.subcategory === targetSubcategory);
    } else if (targetCategory) {
      filtered = filtered.filter(p => p.category === targetCategory);
    }

    // Gender specific
    if (queryText.includes('men') && !queryText.includes('women')) {
      filtered = filtered.filter(p => p.gender === 'Men' || p.gender === 'Unisex');
    } else if (queryText.includes('women')) {
      filtered = filtered.filter(p => p.gender === 'Women' || p.gender === 'Unisex');
    }

    // If still empty, fall back to general stock items under budget
    if (filtered.length === 0) {
      filtered = catalog.filter(p => p.stock > 0 && p.price <= budgetInr);
    }

    // Sort by rating and slice 3
    products = filtered.sort(() => 0.5 - Math.random()).slice(0, 3);

    if (products.length > 0) {
      const budgetMessage = budgetInr !== Infinity ? ` within your budget (under ₹${budgetInr.toFixed(0)})` : "";
      const itemTitle = targetSubcategory || targetCategory || "essentials";
      reply = `Here are some of our finest, in-stock **${itemTitle}**${budgetMessage} available at UrbanCart:\n\n` +
        products.map(p => `• **${p.title}** - ₹${p.price.toFixed(0)} (⭐ ${p.rating})`).join('\n') +
        "\n\nLet me know if you would like to filter by brand, color, size, or explore another collection!";
    } else {
      reply = "I couldn't find any products matching those exact criteria. However, here are some of our popular new arrivals:";
      products = catalog.filter(p => p.stock > 0).slice(0, 2);
    }
    
    categories = ["Sarees", "Kurtas", "Dresses", "Shirts", "Sneakers", "Skincare", "Deals & Offers"];
  }

  return res.json({
    reply,
    products,
    categories
  });
};

module.exports = { handleAIChat };
