import mongoose from 'mongoose';

/**
 * Purchase Order Schema
 * Represents purchase orders generated for vendors
 */
const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: true,
        unique: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        sku: String,
        name: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'],
        default: 'DRAFT'
    },
    deliveryMethod: {
        type: String,
        enum: ['EMAIL', 'WHATSAPP'],
        default: null
    },
    sentAt: {
        type: Date
    },
    receivedAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Auto-generate PO number before saving
purchaseOrderSchema.pre('save', async function (next) {
    if (!this.poNumber) {
        // Generate PO number format: PO-YYYYMMDD-XXX
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Find the count of POs created today
        const count = await mongoose.model('PurchaseOrder').countDocuments({
            createdAt: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        });

        const sequence = String(count + 1).padStart(3, '0');
        this.poNumber = `PO-${dateStr}-${sequence}`;
    }
    next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
