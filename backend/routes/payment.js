import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

// POST /api/payment/create-order
router.post('/create-order', createOrder);

// POST /api/payment/verify
router.post('/verify', verifyPayment);

export default router;
