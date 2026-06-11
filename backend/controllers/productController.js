const db = require('../config/db');

// @desc    Get all products (with search, filter, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { 
      category, 
      subcategory, 
      brand, 
      search, 
      age, 
      gender, 
      color, 
      size, 
      minPrice, 
      maxPrice, 
      minRating, 
      inStock, 
      discountRange 
    } = req.query;

    let query = 'SELECT * FROM products';
    let countQuery = 'SELECT COUNT(*) as total FROM products';
    let queryParams = [];
    let whereClauses = [];

    // Filter by category
    if (category && category !== 'All') {
      whereClauses.push('category = ?');
      queryParams.push(category);
    }

    // Filter by subcategory
    if (subcategory && subcategory !== 'All') {
      whereClauses.push('subcategory = ?');
      queryParams.push(subcategory);
    }

    // Filter by brand
    if (brand && brand !== 'All') {
      whereClauses.push('brand = ?');
      queryParams.push(brand);
    }

    // Filter by size (comma separated in DB)
    if (size && size !== 'All') {
      whereClauses.push('sizes LIKE ?');
      queryParams.push(`%${size}%`);
    }

    // Filter by color (matching colors list or primary color)
    if (color && color !== 'All') {
      whereClauses.push('colors LIKE ?');
      queryParams.push(`%${color}%`);
    }

    // Filter by price range
    if (minPrice !== undefined && minPrice !== '') {
      whereClauses.push('price >= ?');
      queryParams.push(parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      whereClauses.push('price <= ?');
      queryParams.push(parseFloat(maxPrice));
    }

    // Filter by minimum rating
    if (minRating !== undefined && minRating !== 'All' && minRating !== '') {
      whereClauses.push('rating >= ?');
      queryParams.push(parseFloat(minRating));
    }

    // Filter by availability
    if (inStock === 'true') {
      whereClauses.push('stock > 0');
    } else if (inStock === 'false') {
      whereClauses.push('stock = 0');
    }

    // Search by title, description, brand, category, subcategory
    if (search && search.trim() !== '') {
      whereClauses.push('(title LIKE ? OR description LIKE ? OR brand LIKE ? OR category LIKE ? OR subcategory LIKE ?)');
      const searchWildcard = `%${search.trim()}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    // Filter by age
    if (age && age !== 'All') {
      whereClauses.push('age = ?');
      queryParams.push(age);
    }

    // Filter by gender
    if (gender && gender !== 'All') {
      whereClauses.push('gender = ?');
      queryParams.push(gender);
    }

    // Filter by discount range
    if (discountRange && discountRange !== 'All') {
      if (discountRange === 'under10') {
        whereClauses.push('discount < 10');
      } else if (discountRange === '10-30') {
        whereClauses.push('discount >= 10 AND discount <= 30');
      } else if (discountRange === 'over30') {
        whereClauses.push('discount > 30');
      }
    }

    // Construct queries with WHERE clauses
    if (whereClauses.length > 0) {
      const whereString = ' WHERE ' + whereClauses.join(' AND ');
      query += whereString;
      countQuery += whereString;
    }

    // Sort by created date (newest first)
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    
    const queryParamsWithLimit = [...queryParams, limit, offset];

    // Execute count query
    const [countResult] = await db.query(countQuery, queryParams);
    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Execute products query
    const [products] = await db.query(query, queryParamsWithLimit);

    res.json({
      products,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error retrieving products.' });
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Server error retrieving product.' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { title, description, price, category, image, stock } = req.body;

  if (!title || !description || price === undefined || !category || !image || stock === undefined) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO products (title, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, price, category, image, stock]
    );

    res.status(201).json({
      message: 'Product created successfully.',
      product: {
        id: result.insertId,
        title,
        description,
        price,
        category,
        image,
        stock
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error creating product.' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, image, stock } = req.body;

  if (!title || !description || price === undefined || !category || !image || stock === undefined) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if product exists
    const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await db.query(
      'UPDATE products SET title = ?, description = ?, price = ?, category = ?, image = ?, stock = ? WHERE id = ?',
      [title, description, price, category, image, stock, id]
    );

    res.json({
      message: 'Product updated successfully.',
      product: { id: parseInt(id), title, description, price, category, image, stock }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error updating product.' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists
    const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error deleting product.' });
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  const { id } = req.params;
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ message: 'Server error retrieving reviews.' });
  }
};

// @desc    Add a review for a product
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
  }

  try {
    // Check if product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Insert the review
    await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [id, userId, rating, comment]
    );

    res.status(201).json({ message: 'Review added successfully.' });
  } catch (error) {
    console.error('Error adding product review:', error);
    res.status(500).json({ message: 'Server error adding review.' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  addProductReview
};
