import connectDB from './config/db.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
connectDB().then(async () => {
    const products = await mongoose.connection.collection('products').countDocuments();
    const vendors = await mongoose.connection.collection('vendors').countDocuments();
    console.log(`DB Count - Products: ${products}, Vendors: ${vendors}`);
    process.exit();
}).catch(console.error);
