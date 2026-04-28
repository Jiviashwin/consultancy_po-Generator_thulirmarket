import express from 'express';
import { login, getCurrentUser, logout } from '../controllers/authController.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireAuth, logout);

export default router;
