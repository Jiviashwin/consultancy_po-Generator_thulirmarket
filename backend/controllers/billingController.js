import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import { sendLowStockAlert } from '../utils/emailService.js';

/**
 * Get dashboard analytics: revenue chart data + top selling products
 * GET /api/billing/analytics?range=today|week|month
 */
const getDashboardAnalytics = async (req, res) => {
    try {
        const { range = 'week' } = req.query;
        const now = new Date();
        let startDate;

        if (range === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (range === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            // week default
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        }

        // Daily revenue grouped by date
        const revenueData = await Bill.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', revenue: 1, count: 1, _id: 0 } }
        ]);

        // Top selling products by quantity sold
        const topProducts = await Bill.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalQty: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
            { $project: { name: '$_id', totalQty: 1, totalRevenue: 1, _id: 0 } }
        ]);

        // Total summary
        const summary = revenueData.reduce(
            (acc, d) => ({ revenue: acc.revenue + d.revenue, bills: acc.bills + d.count }),
            { revenue: 0, bills: 0 }
        );

        res.json({ success: true, data: { revenueData, topProducts, summary, range } });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
};

/**
 * Get stock levels for all products (for progress bars)
 * GET /api/billing/stock-levels
 */
const getStockLevels = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .select('name sku currentStock reorderPoint')
            .sort({ name: 1 });

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Stock levels error:', error);
        res.status(500).json({ success: false, message: 'Error fetching stock levels' });
    }
};


/**
 * Create a new bill
 * POST /api/billing
 */
const createBill = async (req, res) => {
    try {
        const { items, customerName, customerPhone, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in the bill'
            });
        }

        // Validate items and check stock
        let billItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findOne({ sku: item.sku }); // Find by SKU
            // Or find by ID if passed: const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with SKU ${item.sku} not found`
                });
            }

            if (product.currentStock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name} (Available: ${product.currentStock})`
                });
            }

            const itemTotal = product.unitPrice * item.quantity;
            subtotal += itemTotal;

            billItems.push({
                product: product._id,
                sku: product.sku,
                name: product.name,
                unit: product.unit,
                quantity: item.quantity,
                unitPrice: product.unitPrice,
                total: itemTotal
            });

            // Decrease stock
            // Use findOneAndUpdate to bypass validation of other fields like 'unit' which might have historical invalid values
            await Product.findOneAndUpdate(
                { _id: product._id },
                { $inc: { currentStock: -item.quantity } },
                { runValidators: false }
            );

            // Refetch product to check currentStock if needed
            product.currentStock -= item.quantity;

            // Check if stock is low after update
            if (product.currentStock <= product.reorderPoint) {
                // Send alert asynchronously (don't await)
                sendLowStockAlert({
                    productName: product.name,
                    sku: product.sku,
                    currentStock: product.currentStock,
                    reorderPoint: product.reorderPoint
                });
            }
        }

        // For simplicity, we can assume tax is 0 or calculated
        const tax = 0;
        const totalAmount = subtotal + tax;

        const bill = await Bill.create({
            items: billItems,
            subtotal,
            tax,
            totalAmount,
            customerName,
            customerPhone,
            paymentMethod,
            createdBy: req.session.userId // record who made the bill
        });

        res.status(201).json({
            success: true,
            data: bill,
            message: 'Bill created successfully'
        });

    } catch (error) {
        console.error('Create bill error:', error);
        console.trace(error); 
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating bill'
        });
    }
};

/**
 * Get all bills
 * GET /api/billing
 */
const getAllBills = async (req, res) => {
    try {
        const bills = await Bill.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bills.length,
            data: bills
        });
    } catch (error) {
        console.error('Get bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bills'
        });
    }
};

/**
 * Get bill by ID
 * GET /api/billing/:id
 */
const getBillById = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            data: bill
        });
    } catch (error) {
        console.error('Get bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bill'
        });
    }
};

export { createBill, getAllBills, getBillById, getDashboardAnalytics, getStockLevels };
