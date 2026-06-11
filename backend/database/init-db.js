const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Unsplash Photos Pool to ensure high-quality and category-consistent images
const photoPool = {
  Sarees: ['photo-1610030469983-98e550d6193c', 'photo-1617627143750-d86bc21e42bb', 'photo-1609357518652-6cf0416f0cbe', 'photo-1621184455862-c163dfb30e0f', 'photo-1625772290748-160b240004c8'],
  Kurtis: ['photo-1647897984841-a1e64115162a', 'photo-1608748010899-18f300247112', 'photo-1609357518652-6cf0416f0cbe', 'photo-1621184455862-c163dfb30e0f', 'photo-1647897984841-a1e64115162a'],
  'Salwar Suits': ['photo-1631856955401-4475cc51a44c', 'photo-1617627143750-d86bc21e42bb', 'photo-1647897984841-a1e64115162a', 'photo-1625772290748-160b240004c8', 'photo-1631856955401-4475cc51a44c'],
  Lehengas: ['photo-1583391733956-3750e0ff4e8b', 'photo-1610030469983-98e550d6193c', 'photo-1617627143750-d86bc21e42bb', 'photo-1621184455862-c163dfb30e0f', 'photo-1583391733956-3750e0ff4e8b'],
  Dupattas: ['photo-1618220179428-22790b461013', 'photo-1617627143750-d86bc21e42bb', 'photo-1621184455862-c163dfb30e0f', 'photo-1625772290748-160b240004c8', 'photo-1618220179428-22790b461013'],
  Dresses: ['photo-1595777457583-95e059d581b8', 'photo-1496747611176-843222e1e57c', 'photo-1572804013309-59a88b7e92f1', 'photo-1612336307429-8a898d10e223', 'photo-1595777457583-95e059d581b8'],
  Tops: ['photo-1503342217505-b0a15ec3261c', 'photo-1604176354204-9268737828e4', 'photo-1583743814966-8936f5b7be1a', 'photo-1554568218-0f1715e72254', 'photo-1598554747436-c9293d6a588f'],
  Jeans: ['photo-1541099649105-f69ad21f3246', 'photo-1582562124811-c09040d0a901', 'photo-1602293589930-45aad59ba3ab', 'photo-1604176354204-9268737828e4', 'photo-1541099649105-f69ad21f3246'],
  'T-Shirts': ['photo-1503341509054-9460420c4b4e', 'photo-1503342217505-b0a15ec3261c', 'photo-1554568218-0f1715e72254', 'photo-1583743814966-8936f5b7be1a', 'photo-1503341509054-9460420c4b4e'],
  Skirts: ['photo-1583391733956-3750e0ff4e8b', 'photo-1578587018452-892bacefd3f2', 'photo-1609357518652-6cf0416f0cbe', 'photo-1583391733956-3750e0ff4e8b', 'photo-1578587018452-892bacefd3f2'],
  Jackets: ['photo-1551028719-00167b16eac5', 'photo-1544923246-77307dd654cb', 'photo-1591047139829-d91aecb6caea', 'photo-1520975661595-6453be3f7070', 'photo-1551028719-00167b16eac5'],
  Kurtas: ['photo-1618244972963-dbee1a7edc95', 'photo-1624378439575-d8705ad7ae80', 'photo-1600091106804-d29218a03ca6', 'photo-1618244972963-dbee1a7edc95', 'photo-1624378439575-d8705ad7ae80'],
  Sherwanis: ['photo-1605518216938-7c31b7b14ad0', 'photo-1624378439575-d8705ad7ae80', 'photo-1618244972963-dbee1a7edc95', 'photo-1605518216938-7c31b7b14ad0', 'photo-1624378439575-d8705ad7ae80'],
  'Ethnic Sets': ['photo-1624378439575-d8705ad7ae80', 'photo-1600091106804-d29218a03ca6', 'photo-1618244972963-dbee1a7edc95', 'photo-1624378439575-d8705ad7ae80', 'photo-1600091106804-d29218a03ca6'],
  Shirts: ['photo-1596755094514-f87e34085b2c', 'photo-1602810318383-e386cc2a3ccf', 'photo-1603252109303-2751441dd157', 'photo-1620012253295-c05518e993bc', 'photo-1596755094514-f87e34085b2c'],
  Trousers: ['photo-1624378439575-d8705ad7ae80', 'photo-1624378439575-d8705ad7ae80', 'photo-1475178626620-a4d074967452', 'photo-1624378439575-d8705ad7ae80', 'photo-1475178626620-a4d074967452'],
  Footwear: ['photo-1595950653106-6c9ebd614d3a', 'photo-1549298916-b41d501d3772', 'photo-1560343090-f0409e92791a', 'photo-1606107557195-0e29a4b5b4aa', 'photo-1608231387042-66d1773070a5'],
  Accessories: ['photo-1544816155-12df9643f363', 'photo-1624222247344-550fb8ec2780', 'photo-1520903920243-00d872a2d1c9', 'photo-1598532163257-ae3c6b2524b6', 'photo-1584917865442-de89df76afd3'],
  Beauty: ['photo-1608248597279-f99d160bfcbc', 'photo-1620916566398-39f1143ab7be', 'photo-1601049541289-9b1b7bbbfe19', 'photo-1556228720-195a672e8a03', 'photo-1608248597279-f99d160bfcbc']
};

const brandsMap = {
  WomenEthnic: ['FabIndia', 'Biba', 'W', 'Aurelia', 'Libas'],
  WomenWestern: ['Zara', 'H&M', 'Only', 'Vero Moda', 'Forever 21', 'Mango'],
  MenEthnic: ['Manyavar', 'FabIndia', 'Tasva', 'Soch', 'Peter England'],
  MenWestern: ["Levi's", 'Jack & Jones', 'Tommy Hilfiger', 'US Polo', 'Blackberrys', 'Allen Solly'],
  Footwear: ['Puma', 'Nike', 'Adidas', 'Woodland', 'Bata', 'Clarks'],
  Beauty: ['Kama Ayurveda', 'Forest Essentials', 'The Derma Co', 'Plum', 'L\'Oreal'],
  Accessories: ['Hidesign', 'Baggit', 'Caprese', 'Tommy Hilfiger', 'Fastrack']
};

const colorsPool = ['Red', 'Navy Blue', 'Mustard Yellow', 'Crimson Red', 'Olive Green', 'Classic Black', 'Pure White', 'Pastel Pink', 'Beige', 'Maroon', 'Gold'];
const sizesPool = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Curated subcategories setup
const clothingCategories = [
  // WOMEN - ETHNIC WEAR
  { category: 'Women', subcategory: 'Sarees', gender: 'Women', parentCategory: 'Ethnic Wear', minPrice: 1499, maxPrice: 7999, fabrics: ['Silk', 'Georgette', 'Cotton Handloom', 'Chanderi', 'Organza', 'Linen'], fits: ['Free Size'], patterns: ['Embroidered', 'Zari Border', 'Floral Print', 'Bandhani', 'Solid'], brands: brandsMap.WomenEthnic },
  { category: 'Women', subcategory: 'Kurtis', gender: 'Women', parentCategory: 'Ethnic Wear', minPrice: 599, maxPrice: 2499, fabrics: ['Cotton', 'Rayon', 'Silk Blend', 'Georgette'], fits: ['Straight Fit', 'A-Line', 'Anarkali flared'], patterns: ['Printed', 'Solid', 'Embroidered', 'Chikankari'], brands: brandsMap.WomenEthnic },
  { category: 'Women', subcategory: 'Salwar Suits', gender: 'Women', parentCategory: 'Ethnic Wear', minPrice: 1299, maxPrice: 5999, fabrics: ['Cotton', 'Banarasi Silk', 'Chanderi', 'Georgette'], fits: ['Straight Suit Set', 'Anarkali Set', 'Palazzo Suit Set', 'Sharara Set'], patterns: ['Embroidered', 'Floral Print', 'Solid', 'Jaipuri Print'], brands: brandsMap.WomenEthnic },
  { category: 'Women', subcategory: 'Lehengas', gender: 'Women', parentCategory: 'Ethnic Wear', minPrice: 3999, maxPrice: 14999, fabrics: ['Mulberry Silk', 'Velvet', 'Georgette', 'Net'], fits: ['Semi-Stitched', 'Regular Fit'], patterns: ['Embroidered', 'Heavy Sequin Work', 'Floral Print', 'Zari Woven'], brands: brandsMap.WomenEthnic },
  { category: 'Women', subcategory: 'Dupattas', gender: 'Women', parentCategory: 'Ethnic Wear', minPrice: 299, maxPrice: 1499, fabrics: ['Banarasi Silk', 'Chiffon', 'Cotton Mulmul', 'Organza'], fits: ['Free Size'], patterns: ['Phulkari', 'Bandhani', 'Solid with Border', 'Embroidered'], brands: brandsMap.WomenEthnic },
  
  // WOMEN - WESTERN WEAR
  { category: 'Women', subcategory: 'Dresses', gender: 'Women', parentCategory: 'Western Wear', minPrice: 999, maxPrice: 4500, fabrics: ['Linen', 'Organic Cotton', 'Satin', 'Viscose'], fits: ['A-Line', 'Midi Shift', 'Bodycon', 'Maxi Tiered', 'Wrap Dress'], patterns: ['Solid', 'Floral Print', 'Striped', 'Polka Dot'], brands: brandsMap.WomenWestern },
  { category: 'Women', subcategory: 'Tops', gender: 'Women', parentCategory: 'Western Wear', minPrice: 499, maxPrice: 1999, fabrics: ['Cotton', 'Satin', 'Linen', 'Georgette'], fits: ['Peplum Fit', 'Regular Blouse', 'Crop Top', 'Smocked Top'], patterns: ['Solid', 'Floral Print', 'Ruffled', 'Striped'], brands: brandsMap.WomenWestern },
  { category: 'Women', subcategory: 'Jeans', gender: 'Women', parentCategory: 'Western Wear', minPrice: 1299, maxPrice: 3499, fabrics: ['Stretch Denim', 'Rigid Denim', 'Cotton Blend'], fits: ['High-Rise Skinny', 'Mom Fit', 'Wide-Leg Cargo', 'Bootcut Slim'], patterns: ['Solid', 'Distressed', 'Light Wash', 'Dark Wash'], brands: brandsMap.WomenWestern },
  { category: 'Women', subcategory: 'T-Shirts', gender: 'Women', parentCategory: 'Western Wear', minPrice: 399, maxPrice: 1299, fabrics: ['Organic Cotton', 'Cotton-Modal Blend'], fits: ['Oversized Tee', 'Regular Fit', 'Crop Solid', 'Boyfriend Fit'], patterns: ['Solid', 'Graphic Print', 'Striped'], brands: brandsMap.WomenWestern },
  { category: 'Women', subcategory: 'Skirts', gender: 'Women', parentCategory: 'Western Wear', minPrice: 799, maxPrice: 2499, fabrics: ['Denim', 'Satin', 'Pleated Polyester', 'Cotton Twill'], fits: ['A-Line Skirt', 'Pleated Midi', 'Wrap Skirt', 'Pencil Skirt'], patterns: ['Solid', 'Floral Print', 'Checked'], brands: brandsMap.WomenWestern },
  { category: 'Women', subcategory: 'Jackets', gender: 'Women', parentCategory: 'Western Wear', minPrice: 1999, maxPrice: 5999, fabrics: ['Denim', 'Faux Leather', 'Wool Blend', 'Nylon Puffer'], fits: ['Biker Slim', 'Oversized Trucker', 'Tailored Blazer', 'Trench Fit'], patterns: ['Solid', 'Colorblock', 'Checked Tweed'], brands: brandsMap.WomenWestern },

  // MEN - ETHNIC WEAR
  { category: 'Men', subcategory: 'Kurtas', gender: 'Men', parentCategory: 'Ethnic Wear', minPrice: 899, maxPrice: 3499, fabrics: ['Cotton Handloom', 'Art Silk', 'Pure Linen'], fits: ['Straight Fit', 'Short Casual', 'Pathani Fit'], patterns: ['Solid', 'Thread Embroidered', 'Bandhani', 'Self-Design'], brands: brandsMap.MenEthnic },
  { category: 'Men', subcategory: 'Sherwanis', gender: 'Men', parentCategory: 'Ethnic Wear', minPrice: 4999, maxPrice: 19999, fabrics: ['Brocade Silk', 'Banarasi Silk', 'Premium Velvet'], fits: ['Wedding Sherwani', 'Jodhpuri Suit', 'Indo-Western Set'], patterns: ['Intricate Zardosi', 'Brocade Floral', 'Solid Minimalist'], brands: brandsMap.MenEthnic },
  { category: 'Men', subcategory: 'Ethnic Sets', gender: 'Men', parentCategory: 'Ethnic Wear', minPrice: 1999, maxPrice: 6999, fabrics: ['Silk Blend', 'Organic Cotton', 'Linen'], fits: ['Kurta Churidar Set', 'Nehru Jacket Set', 'Pathani Pajama Suit'], patterns: ['Solid with Jacket', 'Woven Jacquard', 'Printed Kurta'], brands: brandsMap.MenEthnic },

  // MEN - WESTERN WEAR
  { category: 'Men', subcategory: 'Shirts', gender: 'Men', parentCategory: 'Western Wear', minPrice: 999, maxPrice: 2999, fabrics: ['Oxford Cotton', 'Pure Linen', 'Flannel', 'Chambray Denim'], fits: ['Slim Fit', 'Relaxed Casual', 'Button-Down Classic'], patterns: ['Checked', 'Solid', 'Striped', 'Micro Print'], brands: brandsMap.MenWestern },
  { category: 'Men', subcategory: 'T-Shirts', gender: 'Men', parentCategory: 'Western Wear', minPrice: 499, maxPrice: 1499, fabrics: ['100% Pima Cotton', 'Cotton Pique', 'Cotton Blend'], fits: ['Crewneck Slim', 'Classic Polo', 'Oversized Tee', 'Henley Collar'], patterns: ['Solid', 'Striped', 'Chest Print'], brands: brandsMap.MenWestern },
  { category: 'Men', subcategory: 'Jeans', gender: 'Men', parentCategory: 'Western Wear', minPrice: 1499, maxPrice: 3999, fabrics: ['Rigid Denim', 'Stretch Denim', 'Selvedge Denim'], fits: ['511 Slim Fit', '501 Straight Original', 'Tapered Comfort', 'Cargo Jeans'], patterns: ['Indigo Wash', 'Classic Black', 'Distressed', 'Light Fade'], brands: brandsMap.MenWestern },
  { category: 'Men', subcategory: 'Trousers', gender: 'Men', parentCategory: 'Western Wear', minPrice: 1199, maxPrice: 3499, fabrics: ['Cotton Twill Chino', 'Linen Blend', 'Poly-Viscose Stretch'], fits: ['Slim Fit Tapered', 'Flat Front Classic', 'Pleated Tailored'], patterns: ['Solid', 'Self-Pattern', 'Houndstooth Plaid'], brands: brandsMap.MenWestern },
  { category: 'Men', subcategory: 'Jackets', gender: 'Men', parentCategory: 'Western Wear', minPrice: 1999, maxPrice: 7999, fabrics: ['Heavy Denim', 'Genuine Leather', 'Nylon Puffer', 'Wool Tweed'], fits: ['Trucker Fit', 'Bomber Casual', 'Tweed Blazer', 'Puffer Winter Coat'], patterns: ['Solid', 'Checked Plaid', 'Distressed Finish'], brands: brandsMap.MenWestern }
];

// OTHERS Categories
const otherCategories = [
  { category: 'Footwear', subcategories: ['Sneakers', 'Sandals', 'Boots', 'Formal Shoes'], minPrice: 999, maxPrice: 7999, brands: brandsMap.Footwear },
  { category: 'Accessories', subcategories: ['Bags', 'Belts', 'Scarves', 'Totes'], minPrice: 499, maxPrice: 4999, brands: brandsMap.Accessories },
  { category: 'Beauty', subcategories: ['Skincare', 'Face Oil', 'Toner', 'Serum'], minPrice: 299, maxPrice: 2499, brands: brandsMap.Beauty }
];

// Generate products helper function
function generateRealisticCatalog() {
  const seededProducts = [];

  // Generate Clothing (Men & Women) - 22 products per subcategory
  clothingCategories.forEach(sub => {
    for (let i = 1; i <= 22; i++) {
      const brand = sub.brands[i % sub.brands.length];
      const fabric = sub.fabrics[i % sub.fabrics.length];
      const fit = sub.fits[i % sub.fits.length];
      const pattern = sub.patterns[i % sub.patterns.length];
      
      const title = `${brand} ${fabric} ${sub.subcategory}`;
      const description = `A premium quality ${fabric} ${sub.subcategory} designed by ${brand}. Featuring a perfect ${fit} and a classic ${pattern} pattern. Made with highly breathable, comfortable fibers, this capsule piece is perfect for both daily elegance and special occasions. Pair it with complementary accessories from UrbanCart to elevate your styling.`;
      
      // Calculate price within boundaries
      const priceGap = sub.maxPrice - sub.minPrice;
      const basePrice = sub.minPrice + (Math.round((i * 13) % 100) / 100) * priceGap;
      const price = Math.round(basePrice / 50) * 50 - 1; // Round to nearest 50 and make it end in 99 (e.g. 1499)
      
      const discount = i % 5 === 0 ? 0 : [10, 15, 20, 25, 30, 40][i % 6];
      const stock = i % 15 === 0 ? 0 : 5 + (i * 7) % 45; // 0 stock for some, to test out-of-stock
      
      // Get photo pool base
      const pool = photoPool[sub.subcategory] || photoPool['Shirts'];
      const imgList = [];
      for (let j = 0; j < 3; j++) {
        const photoId = pool[(i + j) % pool.length];
        imgList.push(`https://images.unsplash.com/${photoId}?w=600&auto=format&fit=crop&q=80`);
      }
      
      const image = imgList[0];
      const images = imgList.join(',');

      // Colors and sizes
      const colors = [colorsPool[i % colorsPool.length], colorsPool[(i + 3) % colorsPool.length]].join(',');
      const sizes = sizesPool.slice(i % 3, 4 + i % 3).join(',');

      // Precomputed rating & reviews
      const rating = (4.0 + (i % 11) * 0.1).toFixed(1);
      const review_count = 5 + (i * 9) % 140;

      // Specifications
      const specifications = JSON.stringify({
        "Brand": brand,
        "Fabric": fabric,
        "Fit": fit,
        "Pattern": pattern,
        "Style": sub.parentCategory,
        "Origin": "Made in India",
        "Wash Care": i % 2 === 0 ? "Machine Wash" : "Dry Clean Only"
      });

      seededProducts.push({
        title,
        description,
        price,
        category: sub.category,
        subcategory: sub.subcategory,
        brand,
        image,
        images,
        stock,
        age: 'Adult',
        gender: sub.gender,
        color: colorsPool[i % colorsPool.length],
        colors,
        sizes,
        discount,
        rating,
        review_count,
        specifications
      });
    }
  });

  // Generate Footwear, Accessories, Beauty - 22 products per category
  otherCategories.forEach(sub => {
    sub.subcategories.forEach((subcat, sIdx) => {
      // 6 products per subcategory to reach around 24 per parent category
      for (let i = 1; i <= 6; i++) {
        const brand = sub.brands[(i + sIdx) % sub.brands.length];
        const title = `${brand} Classic ${subcat}`;
        const description = `Indulge in our premium ${brand} ${subcat}. Expertly crafted with organic, long-lasting elements. Known for its luxury texture, ergonomic comfort, and minimalist aesthetic. The ideal addition to your self-care or style capsule collections.`;

        const priceGap = sub.maxPrice - sub.minPrice;
        const basePrice = sub.minPrice + (Math.round((i * 19) % 100) / 100) * priceGap;
        const price = Math.round(basePrice / 50) * 50 - 1;
        const discount = i % 4 === 0 ? 0 : [10, 15, 20, 30][i % 4];
        const stock = i % 12 === 0 ? 0 : 8 + (i * 6) % 30;

        const pool = photoPool[sub.category] || photoPool['Accessories'];
        const imgList = [];
        for (let j = 0; j < 3; j++) {
          const photoId = pool[(i + j + sIdx) % pool.length];
          imgList.push(`https://images.unsplash.com/${photoId}?w=600&auto=format&fit=crop&q=80`);
        }
        const image = imgList[0];
        const images = imgList.join(',');

        const colors = sub.category === 'Beauty' ? 'Clear' : [colorsPool[(i + 4) % colorsPool.length], colorsPool[(i + 6) % colorsPool.length]].join(',');
        const sizes = sub.category === 'Footwear' ? '7,8,9,10' : (sub.category === 'Beauty' ? '50ml,100ml' : 'One Size');

        const rating = (4.2 + (i % 9) * 0.1).toFixed(1);
        const review_count = 8 + (i * 11) % 120;

        const specifications = JSON.stringify({
          "Brand": brand,
          "Category": sub.category,
          "Type": subcat,
          "Material": sub.category === 'Footwear' ? 'Leather & Rubber' : (sub.category === 'Beauty' ? 'Organic Herbal Extracts' : 'Full-Grain Leather/Canvas'),
          "Origin": "Made in India",
          "Warranty/Shelf Life": sub.category === 'Beauty' ? '24 Months' : '1 Year'
        });

        seededProducts.push({
          title,
          description,
          price,
          category: sub.category,
          subcategory: subcat,
          brand,
          image,
          images,
          stock,
          age: 'Adult',
          gender: 'Unisex',
          color: sub.category === 'Beauty' ? 'Clear' : colorsPool[(i + 4) % colorsPool.length],
          colors,
          sizes,
          discount,
          rating,
          review_count,
          specifications
        });
      }
    });
  });

  return seededProducts;
}

async function initializeDatabase() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Database connected successfully.');

    // Drop tables if they exist to apply structural updates
    console.log('Dropping existing tables...');
    await connection.query('DROP TABLE IF EXISTS reviews, order_items, cart, orders, products, users;');
    console.log('Tables dropped.');

    // Read schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Schema executed successfully.');

    // Seed Users
    console.log('Checking users table...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const customerPasswordHash = await bcrypt.hash('user123', 10);

    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['UrbanCart Admin', 'admin@urbancart.com', adminPasswordHash, 'admin']
    );

    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Test Customer', 'customer@urbancart.com', customerPasswordHash, 'user']
    );
    console.log('Users seeded: admin@urbancart.com (admin123) & customer@urbancart.com (user123)');

    // Generate products
    console.log('Generating realistic catalog items...');
    const seedProducts = generateRealisticCatalog();
    console.log(`Generated ${seedProducts.length} items. Seeding products into DB...`);

    const insertValues = seedProducts.map(p => [
      p.title, p.description, p.price, p.category, p.subcategory, p.brand, p.image, p.images, p.stock, p.age, p.gender, p.color, p.colors, p.sizes, p.discount, p.rating, p.review_count, p.specifications
    ]);

    await connection.query(
      'INSERT INTO products (title, description, price, category, subcategory, brand, image, images, stock, age, gender, color, colors, sizes, discount, rating, review_count, specifications) VALUES ?',
      [insertValues]
    );
    console.log('Products seeded successfully.');
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await connection.end();
  }
}

initializeDatabase();
