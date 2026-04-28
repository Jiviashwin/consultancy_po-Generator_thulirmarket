import express from 'express';
import {
    getAllVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
} from '../controllers/vendorController.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// All vendor routes require authentication
router.use(requireAuth);

router.route('/')
    .get(getAllVendors)
    .post(createVendor);

router.route('/:id')
    .get(getVendorById)
    .put(updateVendor)
    .delete(deleteVendor);

export default router;
