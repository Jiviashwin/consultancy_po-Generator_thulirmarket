import Product from '../models/Product.js';

/**
 * Get all products
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('vendor', 'name email')
            .sort({ name: 1 });

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
};

/**
 * Get low stock products (currentStock <= reorderPoint)
 * GET /api/products/low-stock
 */
const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('vendor', 'name email phone whatsappNumber address preferredCommunication');

        // Filter products where currentStock <= reorderPoint
        const lowStockProducts = products.filter(
            product => product.currentStock <= product.reorderPoint
        );

        res.json({
            success: true,
            count: lowStockProducts.length,
            data: lowStockProducts
        });
    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products'
        });
    }
};

/**
 * Get single product
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('vendor');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product'
        });
    }
};

/**
 * Create new product
 * POST /api/products
 */
const createProduct = async (req, res) => {
    try {
        const {
            sku,
            name,
            description,
            vendor,
            currentStock,
            reorderPoint,
            reorderQuantity,
            unitPrice,
            unit,
            category
        } = req.body;

        // Validate required fields
        if (!sku || !name || !vendor || currentStock === undefined ||
            !reorderPoint || !reorderQuantity || !unitPrice) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const product = await Product.create({
            sku,
            name,
            description,
            vendor,
            currentStock,
            reorderPoint,
            reorderQuantity,
            unitPrice,
            unit,
            category
        });

        // Populate vendor details
        await product.populate('vendor', 'name email');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating product'
        });
    }
};

/**
 * Update product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
    try {
        const {
            sku,
            name,
            description,
            vendor,
            currentStock,
            reorderPoint,
            reorderQuantity,
            unitPrice,
            unit,
            category
        } = req.body;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                sku,
                name,
                description,
                vendor,
                currentStock,
                reorderPoint,
                reorderQuantity,
                unitPrice,
                unit,
                category
            },
            { new: true, runValidators: true }
        ).populate('vendor', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product'
        });
    }
};

/**
 * Delete product (soft delete)
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product'
        });
    }
};

export {
    getAllProducts,
    getLowStockProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
