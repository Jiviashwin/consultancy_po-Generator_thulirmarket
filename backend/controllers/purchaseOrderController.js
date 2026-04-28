import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import path from 'path';
import { generatePurchaseOrderPDF, ensureUploadsDir } from '../utils/pdfGenerator.js';
import { sendPurchaseOrderEmail } from '../utils/emailService.js';

/**
 * Generate Purchase Orders from low stock products
 * POST /api/purchase-orders/generate
 */
const generatePurchaseOrders = async (req, res) => {
    try {
        // 1. Get low stock products
        const lowStockProducts = await Product.find({
            $expr: { $lte: ["$currentStock", "$reorderPoint"] }
        }).populate("vendor");

        if (!lowStockProducts || lowStockProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No low-stock products available"
            });
        }

        // 2. Group by vendor
        const groupedByVendor = {};

        lowStockProducts.forEach((product) => {
            if (!product.vendor || !product.vendor._id) {
                console.warn("Product without vendor:", product._id);
                return;
            }

            const vendorId = product.vendor._id.toString();

            if (!groupedByVendor[vendorId]) {
                groupedByVendor[vendorId] = {
                    vendor: product.vendor,
                    items: []
                };
            }

            groupedByVendor[vendorId].items.push({
                product: product._id,
                sku: product.sku,
                name: product.name,
                quantity: product.reorderQuantity,
                unitPrice: product.unitPrice,
                total: product.reorderQuantity * product.unitPrice
            });
        });

        const createdPOs = [];

        // 3. Create POs
        for (const vendorId in groupedByVendor) {
            const group = groupedByVendor[vendorId];

            const totalAmount = group.items.reduce(
                (sum, item) => sum + item.total,
                0
            );

            const po = new PurchaseOrder({
                poNumber: `PO-${Date.now()}`,
                vendor: vendorId,
                vendorSnapshot: {
                    vendorName: group.vendor.name,
                    email: group.vendor.email,
                    whatsappNumber: group.vendor.whatsappNumber
                },
                items: group.items,
                totalAmount,
                status: "DRAFT",
                deliveryMethod: "WHATSAPP"
            });

            await po.save();
            createdPOs.push(po);
        }

        if (createdPOs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Failed to generate any purchase orders"
            });
        }

        return res.status(201).json({
            success: true,
            count: createdPOs.length,
            data: createdPOs
        });
    } catch (error) {
        console.error("Generate PO Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while generating purchase orders"
        });
    }
};

/**
 * Generate Custom Purchase Orders from selected products
 * POST /api/purchase-orders/custom
 */
const generateCustomPurchaseOrders = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No items provided for purchase order"
            });
        }

        // 1. Fetch products and group by vendor
        const groupedByVendor = {};

        for (const item of items) {
            const product = await Product.findById(item.productId).populate("vendor");

            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
            }

            if (!product.vendor || !product.vendor._id) {
                console.warn("Product without vendor:", product._id);
                continue; // Skip products without vendors
            }

            const vendorId = product.vendor._id.toString();

            if (!groupedByVendor[vendorId]) {
                groupedByVendor[vendorId] = {
                    vendor: product.vendor,
                    items: []
                };
            }

            groupedByVendor[vendorId].items.push({
                product: product._id,
                sku: product.sku,
                name: product.name,
                quantity: item.quantity,
                unitPrice: product.unitPrice,
                total: item.quantity * product.unitPrice
            });
        }

        const createdPOs = [];

        // 2. Create POs per vendor
        for (const vendorId in groupedByVendor) {
            const group = groupedByVendor[vendorId];

            const totalAmount = group.items.reduce(
                (sum, item) => sum + item.total,
                0
            );

            const po = new PurchaseOrder({
                poNumber: `PO-${Date.now()}`,
                vendor: vendorId,
                vendorSnapshot: {
                    vendorName: group.vendor.name,
                    email: group.vendor.email,
                    whatsappNumber: group.vendor.whatsappNumber
                },
                items: group.items,
                totalAmount,
                status: "DRAFT",
                deliveryMethod: "WHATSAPP"
            });

            await po.save();
            createdPOs.push(po);
        }

        if (createdPOs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Failed to generate any custom purchase orders"
            });
        }

        return res.status(201).json({
            success: true,
            count: createdPOs.length,
            message: `Successfully created ${createdPOs.length} purchase order(s)`,
            data: createdPOs
        });
    } catch (error) {
        console.error("Generate Custom PO Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while generating custom purchase orders"
        });
    }
};

/**
 * Get all purchase orders
 * GET /api/purchase-orders
 */
const getAllPurchaseOrders = async (req, res) => {
    try {
        const purchaseOrders = await PurchaseOrder.find()
            .populate('vendor')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: purchaseOrders.length,
            data: purchaseOrders
        });
    } catch (error) {
        console.error('Get all purchase orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching purchase orders'
        });
    }
};

/**
 * Get single purchase order
 * GET /api/purchase-orders/:id
 */
const getPurchaseOrderById = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('vendor')
            .populate('items.product');

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        res.json({
            success: true,
            data: po
        });
    } catch (error) {
        console.error('Get purchase order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching purchase order'
        });
    }
};

/**
 * Update purchase order status
 * PUT /api/purchase-orders/:id
 */
const updatePurchaseOrder = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        // Fetch the existing PO to check current status
        const existingPO = await PurchaseOrder.findById(req.params.id).populate('items.product');

        if (!existingPO) {
            return res.status(404).json({
                success: false,
                message: 'Purchase Order not found'
            });
        }

        // Check for status transition to RECEIVED
        if (status === 'RECEIVED' && existingPO.status !== 'RECEIVED') {
            updateData.receivedAt = new Date();

            // Update stock for each product
            console.log(`📦 Restocking items for PO ${existingPO.poNumber}...`);
            for (const item of existingPO.items) {
                if (item.product) {
                    await Product.findByIdAndUpdate(
                        item.product._id,
                        { $inc: { currentStock: item.quantity } }
                    );
                    console.log(`   + Added ${item.quantity} to ${item.name} (SKU: ${item.sku})`);
                }
            }
        }

        const po = await PurchaseOrder.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('vendor');

        res.json({
            success: true,
            message: 'Purchase order updated successfully',
            data: po
        });
    } catch (error) {
        console.error('Update purchase order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating purchase order'
        });
    }
};

/**
 * Send purchase order to vendor
 * POST /api/purchase-orders/:id/send
 */
const sendPurchaseOrder = async (req, res) => {
    try {
        const { deliveryMethod } = req.body;

        if (!deliveryMethod || !['EMAIL', 'WHATSAPP'].includes(deliveryMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid delivery method (EMAIL or WHATSAPP)'
            });
        }

        const po = await PurchaseOrder.findById(req.params.id)
            .populate('vendor')
            .populate('items.product');

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Generate PDF
        const uploadsDir = ensureUploadsDir();
        const pdfFilename = `${po.poNumber}.pdf`;
        const pdfPath = path.join(uploadsDir, pdfFilename);

        await generatePurchaseOrderPDF(po, pdfPath);

        // Send based on delivery method
        if (deliveryMethod === 'EMAIL') {
            try {
                await sendPurchaseOrderEmail({
                    vendorEmail: po.vendor.email,
                    vendorName: po.vendor.name,
                    poNumber: po.poNumber,
                    pdfPath,
                    totalAmount: po.totalAmount
                });

                // Update PO status
                po.status = 'SENT';
                po.deliveryMethod = 'EMAIL';
                po.sentAt = new Date();
                await po.save();

                res.json({
                    success: true,
                    message: `Purchase order sent via email to ${po.vendor.email}`,
                    data: po
                });

            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                return res.status(500).json({
                    success: false,
                    message: 'PDF generated but email sending failed. Please check SMTP configuration.',
                    pdfPath: `/api/purchase-orders/${po._id}/pdf`
                });
            }

        } else if (deliveryMethod === 'WHATSAPP') {
            // For WhatsApp, we generate a shareable link
            const pdfLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/purchase-orders/${po._id}/pdf`;

            // Update PO status
            po.status = 'SENT';
            po.deliveryMethod = 'WHATSAPP';
            po.sentAt = new Date();
            await po.save();

            res.json({
                success: true,
                message: 'Purchase order PDF generated. Share the link via WhatsApp.',
                whatsappNumber: po.vendor.whatsappNumber,
                pdfLink,
                data: po
            });
        }

    } catch (error) {
        console.error('Send purchase order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending purchase order'
        });
    }
};

/**
 * Get PDF file of purchase order
 * GET /api/purchase-orders/:id/pdf
 */
const getPurchaseOrderPDF = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('vendor')
            .populate('items.product');

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        const uploadsDir = ensureUploadsDir();
        const pdfFilename = `${po.poNumber}.pdf`;
        const pdfPath = path.join(uploadsDir, pdfFilename);

        // Check if PDF exists, if not generate it
        const fs = await import('fs');
        if (!fs.existsSync(pdfPath)) {
            await generatePurchaseOrderPDF(po, pdfPath);
        }

        // Send PDF file
        res.download(pdfPath, pdfFilename);

    } catch (error) {
        console.error('Get PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving PDF'
        });
    }
};

/**
 * Delete purchase order
 * DELETE /api/purchase-orders/:id
 */
const deletePurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        // Only allow deletion of DRAFT orders
        if (po.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: 'Only draft purchase orders can be deleted'
            });
        }

        await po.deleteOne();

        res.json({
            success: true,
            message: 'Purchase order deleted successfully'
        });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting purchase order'
        });
    }
};

export {
    generatePurchaseOrders,
    generateCustomPurchaseOrders,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    sendPurchaseOrder,
    getPurchaseOrderPDF,
    deletePurchaseOrder
};
