import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

/**
 * Database Initialization Script
 * This script creates an admin user for first-time setup
 */

const ADMIN_USER = {
    email: 'admin@supermart.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'ADMIN'
};

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/po-generator');
        console.log('✅ Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: ADMIN_USER.email });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   Email: ${ADMIN_USER.email}`);
            console.log('   Skipping user creation...');
        } else {
            // Create admin user (password will be hashed by schema pre-save middleware)
            await User.create({
                email: ADMIN_USER.email,
                password: ADMIN_USER.password,
                name: ADMIN_USER.name,
                role: ADMIN_USER.role
            });

            console.log('✅ Admin user created successfully!');
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('   LOGIN CREDENTIALS');
            console.log('═══════════════════════════════════════');
            console.log(`   Email:    ${ADMIN_USER.email}`);
            console.log(`   Password: ${ADMIN_USER.password}`);
            console.log('═══════════════════════════════════════');
            console.log('');
            console.log('⚠️  Please change the password after first login!');
        }

        // Close connection
        await mongoose.connection.close();
        console.log('✅ Database initialization complete');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();
