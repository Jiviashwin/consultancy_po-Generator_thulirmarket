
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const resetAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Use the connection string from initDB.js as fallback
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/po-generator');
        console.log('Connected to MongoDB');

        const email = 'admin@supermart.com';
        const newPassword = 'admin123';

        let user = await User.findOne({ email });
        if (user) {
            console.log(`User ${email} found. Updating password...`);
            user.password = newPassword;
            await user.save();
            console.log(`✅ Password for ${email} successfully reset to: ${newPassword}`);
        } else {
            console.log(`User ${email} not found. Creating new user...`);
            await User.create({
                email,
                password: newPassword,
                name: 'Admin User',
                role: 'ADMIN'
            });
            console.log(`✅ Created user ${email} with password: ${newPassword}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting admin password:', error);
        process.exit(1);
    }
};

resetAdmin();
