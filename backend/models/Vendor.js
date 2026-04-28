import mongoose from 'mongoose';

/**
 * Vendor Schema
 * Represents suppliers/vendors who supply products to the store
 */
const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    whatsappNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    preferredCommunication: {
        type: String,
        enum: ['EMAIL', 'WHATSAPP'],
        default: 'EMAIL'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
