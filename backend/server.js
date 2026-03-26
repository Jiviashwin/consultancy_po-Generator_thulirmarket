import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import productRoutes from './routes/products.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import billingRoutes from './routes/billing.js';
import paymentRoutes from './routes/payment.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payment', paymentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'PO Generator API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 5002;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════╗
║  🚀 PO Generator Server is running!          ║
║  📍 Port: ${PORT}                              ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                ║
║  📡 API: http://localhost:${PORT}/api        ║
╚══════════════════════════════════════════════╝
  `);
});

// Gracefully handle port already in use
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9\n`);
        process.exit(1); // exit so nodemon can cleanly restart
    } else {
        throw err;
    }
});

export default app;
