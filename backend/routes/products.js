import express from 'express';
import {
    getAllProducts,
    getLowStockProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// All product routes require authentication
router.use(requireAuth);

// Special route for low stock products (must be before /:id)
router.get('/low-stock', getLowStockProducts);

router.route('/')
    .get(getAllProducts)
    .post(createProduct);

router.route('/:id')
    .get(getProductById)
    .put(updateProduct)
    .delete(deleteProduct);

export default router;
