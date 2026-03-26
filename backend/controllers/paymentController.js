import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import { sendLowStockAlert } from '../utils/emailService.js';

/**
 * Mock Create Order (Project Demo Purpose)
 * POST /api/payment/create-order
 */
export const createOrder = async (req, res) => {
    try {
        const { items, customerName, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in the bill' });
        }

        let subtotal = 0;
        for (const item of items) {
            const product = await Product.findOne({ sku: item.sku });
            if (!product) {
                return res.status(404).json({ success: false, message: `Product with SKU ${item.sku} not found` });
            }
            if (product.currentStock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name} (Available: ${product.currentStock})` });
            }
            subtotal += product.unitPrice * item.quantity;
        }

        const tax = 0;
        const totalAmount = subtotal + tax;

        // Mock Order created
        const order = {
            id: `order_demo_${Date.now()}`,
            amount: Math.round(totalAmount * 100),
            currency: 'INR'
        };

        res.status(200).json({
            success: true,
            order,
            totalAmount
        });

    } catch (error) {
        console.error('Error creating mock order:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

/**
 * Mock Verify Payment (Project Demo Purpose)
 * POST /api/payment/verify
 */
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            billData
        } = req.body;

        // Automatically accept mock payments starting with pay_demo_
        const isAuthentic = true;

        if (isAuthentic) {
            const { items, customerName } = billData;

            let billItems = [];
            let subtotal = 0;

            for (const item of items) {
                const product = await Product.findOne({ sku: item.sku });

                const itemTotal = product.unitPrice * item.quantity;
                subtotal += itemTotal;

                billItems.push({
                    product: product._id,
                    sku: product.sku,
                    name: product.name,
                    quantity: item.quantity,
                    unitPrice: product.unitPrice,
                    total: itemTotal
                });

                product.currentStock -= item.quantity;
                await product.save();

                if (product.currentStock <= product.reorderPoint) {
                    sendLowStockAlert({
                        productName: product.name,
                        sku: product.sku,
                        currentStock: product.currentStock,
                        reorderPoint: product.reorderPoint
                    });
                }
            }

            const tax = 0;
            const totalAmount = subtotal + tax;

            const bill = await Bill.create({
                items: billItems,
                subtotal,
                tax,
                totalAmount,
                customerName,
                paymentMethod: 'ONLINE',
                paymentStatus: 'PAID',
                paymentId: razorpay_payment_id,
                createdBy: req.session?.userId
            });

            res.status(200).json({
                success: true,
                message: "Mock payment verified successfully",
                data: bill
            });
        }
    } catch (error) {
        console.error('Error verifying mock payment:', error);
        res.status(500).json({ success: false, message: 'Server error during payment verification' });
    }
};
