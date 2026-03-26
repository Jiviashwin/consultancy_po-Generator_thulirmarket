
import express from 'express';
import { createBill, getAllBills, getBillById, getDashboardAnalytics, getStockLevels } from '../controllers/billingController.js';


const router = express.Router();

// Middleware to check authentication could be added here if not global
// router.use(protect); 

router.route('/')
    .post(createBill)
    .get(getAllBills);

router.route('/analytics').get(getDashboardAnalytics);
router.route('/stock-levels').get(getStockLevels);

router.route('/:id')
    .get(getBillById);

export default router;

