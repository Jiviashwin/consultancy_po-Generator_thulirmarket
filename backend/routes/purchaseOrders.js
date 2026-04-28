import express from 'express';
import {
    generatePurchaseOrders,
    generateCustomPurchaseOrders,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    sendPurchaseOrder,
    getPurchaseOrderPDF,
    deletePurchaseOrder
} from '../controllers/purchaseOrderController.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// Public route - no authentication required
router.post('/generate', generatePurchaseOrders);
router.post('/custom', generateCustomPurchaseOrders);

// All other PO routes require authentication
router.use(requireAuth);

// Special routes (must be before /:id)
router.get('/:id/pdf', getPurchaseOrderPDF);
router.post('/:id/send', sendPurchaseOrder);

router.route('/')
    .get(getAllPurchaseOrders);

router.route('/:id')
    .get(getPurchaseOrderById)
    .put(updatePurchaseOrder)
    .delete(deletePurchaseOrder);

export default router;
