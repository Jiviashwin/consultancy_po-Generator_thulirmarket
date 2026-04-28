import Vendor from '../models/Vendor.js';

/**
 * Get all vendors
 * GET /api/vendors
 */
const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({ isActive: true }).sort({ name: 1 });

        res.json({
            success: true,
            count: vendors.length,
            data: vendors
        });
    } catch (error) {
        console.error('Get vendors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendors'
        });
    }
};

/**
 * Get single vendor
 * GET /api/vendors/:id
 */
const getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            data: vendor
        });
    } catch (error) {
        console.error('Get vendor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendor'
        });
    }
};

/**
 * Create new vendor
 * POST /api/vendors
 */
const createVendor = async (req, res) => {
    try {
        const { name, email, phone, whatsappNumber, address, preferredCommunication } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const vendor = await Vendor.create({
            name,
            email,
            phone,
            whatsappNumber,
            address,
            preferredCommunication
        });

        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            data: vendor
        });
    } catch (error) {
        console.error('Create vendor error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating vendor'
        });
    }
};

/**
 * Update vendor
 * PUT /api/vendors/:id
 */
const updateVendor = async (req, res) => {
    try {
        const { name, email, phone, whatsappNumber, address, preferredCommunication } = req.body;

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, whatsappNumber, address, preferredCommunication },
            { new: true, runValidators: true }
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor updated successfully',
            data: vendor
        });
    } catch (error) {
        console.error('Update vendor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating vendor'
        });
    }
};

/**
 * Delete vendor (soft delete)
 * DELETE /api/vendors/:id
 */
const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        console.error('Delete vendor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting vendor'
        });
    }
};

export {
    getAllVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
};
