import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'po-generator-secret-key-2024';

/**
 * Authentication Middleware
 * Validates JWT token from Authorization header
 */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userName = decoded.name;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.'
        });
    }
};

export default requireAuth;
