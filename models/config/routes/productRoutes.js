// routes/productRoutes.js

/**
 * PRODUCT ROUTES MODULE
 * 
 * This module defines all API endpoints for product CRUD operations.
 * It uses Express Router to organize routes and includes advanced features
 * like filtering, sorting, and pagination.
 */

// Import Express and create a router instance
const express = require('express');
const router = express.Router();

const Product = require('../models/Product'); // Import the Product model to interact with the database


/**
 * ============================================================================
 * ROUTE 1: CREATE A NEW PRODUCT
 * ============================================================================
 * 
 * POST /api/products
 * 
 * Creates a new product in the database based on the request body.
 * 
 * Request Body Example:
 * {
 *   "name": "Wireless Mouse",
 *   "description": "Ergonomic wireless mouse with 2.4GHz connectivity",
 *   "price": 29.99,
 *   "category": "electronics",
 *   "tags": ["wireless", "computer", "accessories"]
 * }
 * 
 * Success Response: 201 Created with product object
 * Error Response: 400 Bad Request with validation errors
 */
router.post('/', async (req, res) => {
  try {
    /**
     * STEP 1: Extract product data from request body
     * req.body contains the JSON data sent by the client
     */
    const productData = req.body;

    /**
     * STEP 2: Create new product instance
     * This doesn't save to database yet, just creates a Mongoose document
     */
    const newProduct = new Product(productData);

    /**
     * STEP 3: Save to database
     * .save() triggers validation and saves the document to MongoDB
     * It returns a promise that resolves to the saved document
     */
    const savedProduct = await newProduct.save();

    /**
     * STEP 4: Send success response
     * Status 201 indicates a resource was successfully created
     */
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });

  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * Mongoose validation errors have a specific structure.
     * We check if it's a validation error and return appropriate message.
     */
    if (error.name === 'ValidationError') {
      // Extract validation error messages
      const errors = Object.values(error.errors).map(err => err.message);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // For other errors, return generic 500 error
    res.status(500).json({
      success: false,
      message: 'Server error while creating product',
      error: error.message
    });
  }
});


/**
 * ============================================================================
 * ROUTE 2: GET A SINGLE PRODUCT BY ID
 * ============================================================================
 * 
 * GET /api/products/:id
 * 
 * Retrieves a single product by its unique MongoDB _id.
 * 
 * URL Parameter:
 * - id: MongoDB ObjectId (24-character hex string)
 * 
 * Success Response: 200 OK with product object
 * Error Response: 404 Not Found if product doesn't exist
 */
router.get('/:id', async (req, res) => {
  try {
    /**
     * STEP 1: Extract product ID from URL parameters
     * req.params.id contains the :id value from the route
     */
    const productId = req.params.id;

    /**
     * STEP 2: Find product by ID
     * .findById() is a Mongoose method that searches by _id field
     * Returns null if no document is found
     */
    const product = await Product.findById(productId);

    /**
     * STEP 3: Check if product exists
     * If findById returns null, the product doesn't exist
     */
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`
      });
    }

    /**
     * STEP 4: Send success response
     * Status 200 indicates successful retrieval
     */
    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * CastError occurs when the ID format is invalid (not a valid ObjectId)
     */
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: error.message
    });
  }
});


/**
 * ============================================================================
 * ROUTE 3: UPDATE A PRODUCT BY ID
 * ============================================================================
 * 
 * PUT /api/products/:id
 * 
 * Updates an existing product with new data from the request body.
 * 
 * URL Parameter:
 * - id: MongoDB ObjectId
 * 
 * Request Body: Fields to update (partial update allowed)
 * 
 * Success Response: 200 OK with updated product
 * Error Response: 404 Not Found if product doesn't exist
 */
router.put('/:id', async (req, res) => {
  try {
    /**
     * STEP 1: Extract ID and update data
     */
    const productId = req.params.id;
    const updateData = req.body;

    /**
     * STEP 2: Find and update product
     * 
     * .findByIdAndUpdate() finds a document by ID and updates it.
     * Options:
     * - new: true - Returns the updated document instead of the original
     * - runValidators: true - Runs schema validators on update
     */
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,          // ID to find
      updateData,         // Data to update
      { 
        new: true,        // Return updated document
        runValidators: true  // Run schema validation
      }
    );

    /**
     * STEP 3: Check if product was found
     * If no product matches the ID, findByIdAndUpdate returns null
     */
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`
      });
    }

    /**
     * STEP 4: Send success response
     */
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: error.message
    });
  }
});


/**
 * ============================================================================
 * ROUTE 4: DELETE A PRODUCT BY ID
 * ============================================================================
 * 
 * DELETE /api/products/:id
 * 
 * Permanently deletes a product from the database.
 * 
 * URL Parameter:
 * - id: MongoDB ObjectId
 * 
 * Success Response: 200 OK with success message
 * Error Response: 404 Not Found if product doesn't exist
 */
router.delete('/:id', async (req, res) => {
  try {
    /**
     * STEP 1: Extract product ID
     */
    const productId = req.params.id;

    /**
     * STEP 2: Find and delete product
     * .findByIdAndDelete() finds a document by ID and removes it
     * Returns the deleted document or null if not found
     */
    const deletedProduct = await Product.findByIdAndDelete(productId);

    /**
     * STEP 3: Check if product was found and deleted
     */
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`
      });
    }

    /**
     * STEP 4: Send success response
     */
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct  // Optional: return deleted product data
    });

  } catch (error) {
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: error.message
    });
  }
});


/**
 * ============================================================================
 * ROUTE 5: GET ALL PRODUCTS WITH ADVANCED QUERYING
 * ============================================================================
 * 
 * GET /api/products
 * 
 * Retrieves all products with support for:
 * - Filtering by category and price range
 * - Sorting by various fields
 * - Pagination
 * 
 * Query Parameters:
 * - category: Filter by category (string)
 * - minPrice: Minimum price filter (number)
 * - maxPrice: Maximum price filter (number)
 * - sortBy: Sort field and order (e.g., "price_asc", "price_desc", "name_asc")
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 10)
 * 
 * Example: /api/products?category=electronics&minPrice=20&maxPrice=100&sortBy=price_asc&page=2&limit=5
 * 
 * Success Response: 200 OK with array of products and pagination info
 */
router.get('/', async (req, res) => {
  try {
    /**
     * STEP 1: Extract and parse query parameters
     * req.query contains all URL query parameters as strings
     */
    const { 
      category, 
      minPrice, 
      maxPrice, 
      sortBy, 
      page = 1,      // Default to page 1
      limit = 10     // Default to 10 items per page
    } = req.query;

    /**
     * STEP 2: Build filter object dynamically
     * 
     * We only add filters if the corresponding query parameter exists.
     * This creates a flexible query that adapts to user input.
     */
    const filter = {};

    // Add category filter if provided
    if (category) {
      filter.category = category.toLowerCase();
    }

    // Add price range filter if provided
    // MongoDB uses $gte (greater than or equal) and $lte (less than or equal)
    if (minPrice || maxPrice) {
      filter.price = {};
      
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);  // Convert string to number
      }
      
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
      }
    }

    /**
     * STEP 3: Build sort object
     * 
     * Sort format: "fieldName_order" (e.g., "price_asc" or "name_desc")
     * We parse this and create a MongoDB sort object
     */
    let sort = {};
    
    if (sortBy) {
      // Split sortBy into field and order
      // Example: "price_asc" -> ["price", "asc"]
      const [field, order] = sortBy.split('_');
      
      // MongoDB uses 1 for ascending, -1 for descending
      sort[field] = order === 'asc' ? 1 : -1;
    } else {
      // Default sort: newest first
      sort.createdAt = -1;
    }

    /**
     * STEP 4: Calculate pagination values
     * 
     * - skip: Number of documents to skip (for pagination)
     * - limitNum: Number of documents to return
     */
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    /**
     * STEP 5: Execute database query with all features
     * 
     * We chain multiple Mongoose methods:
     * - .find(filter): Apply filters
     * - .sort(sort): Apply sorting
     * - .skip(skip): Skip documents for pagination
     * - .limit(limitNum): Limit number of results
     */
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    /**
     * STEP 6: Get total count for pagination metadata
     * 
     * .countDocuments() returns the total number of documents
     * that match the filter (ignoring pagination)
     */
    const totalProducts = await Product.countDocuments(filter);

    /**
     * STEP 7: Calculate pagination metadata
     */
    const totalPages = Math.ceil(totalProducts / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    /**
     * STEP 8: Send success response with data and metadata
     */
    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalProducts: totalProducts,
        limit: limitNum,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage
      },
      filters: {
        category: category || 'all',
        minPrice: minPrice || 'none',
        maxPrice: maxPrice || 'none',
        sortBy: sortBy || 'createdAt_desc'
      },
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: error.message
    });
  }
});


/**
 * EXPORT ROUTER
 * 
 * Export the router so it can be used in server.js
 */
module.exports = router;