
import mongoose from 'mongoose';

/**
 * Bill Schema
 * Represents customer billing transactions
 */
const billSchema = new mongoose.Schema({
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        sku: String,
        name: String,
        unit: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'ONLINE', 'OTHER'],
        default: 'CASH'
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    paymentId: {
        type: String,
        trim: true
    },
    customerName: {
        type: String,
        trim: true
    },
    customerPhone: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
