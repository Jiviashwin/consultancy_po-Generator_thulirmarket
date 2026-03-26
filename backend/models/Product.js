import mongoose from 'mongoose';

/**
 * Product Schema
 * Represents inventory items (SKUs) with stock tracking and reorder automation
 */
const productSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor is required']
    },
    currentStock: {
        type: Number,
        required: [true, 'Current stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    reorderPoint: {
        type: Number,
        required: [true, 'Reorder point is required'],
        min: [0, 'Reorder point cannot be negative']
    },
    reorderQuantity: {
        type: Number,
        required: [true, 'Reorder quantity is required'],
        min: [1, 'Reorder quantity must be at least 1']
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative']
    },
    unit: {
        type: String,
        enum: ['pcs', 'PCS', 'kg', 'KG', 'g', 'G', 'l', 'L', 'ml', 'ML', 'ltr', 'LTR', 'packets', 'packet', 'PACKET', 'boxes', 'box', 'BOX', 'dozens', 'dozen', 'DOZEN'],
        default: 'pcs',
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual field to check if product needs reordering
productSchema.virtual('needsReorder').get(function () {
    return this.currentStock <= this.reorderPoint;
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
