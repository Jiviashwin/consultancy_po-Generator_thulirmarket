import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';

// Load environment variables
dotenv.config();

/**
 * Seed Database with Demo Data
 * Run once to populate initial data for testing
 */
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Check if data already exists
        const userCount = await User.countDocuments();
        const vendorCount = await Vendor.countDocuments();
        const productCount = await Product.countDocuments();

        if (userCount > 0 && vendorCount > 0 && productCount > 0) {
            console.log('⚠️  Database already has data. Skipping seed.');
            console.log(`   Users: ${userCount}, Vendors: ${vendorCount}, Products: ${productCount}`);
            process.exit(0);
        }

        console.log('🌱 Seeding database with demo data...');

        // 1. Create Admin User
        let adminUser = await User.findOne({ email: 'admin@supermart.com' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@supermart.com',
                password: 'admin123',
                role: 'ADMIN'
            });
            console.log('✅ Admin user created: admin@supermart.com / admin123');
        }

        // 2. Create Vendor
        let vendor = await Vendor.findOne({ name: 'Thulir Supplier' });
        if (!vendor) {
            vendor = await Vendor.create({
                name: 'Thulir Supplier',
                email: 'thulir@supplier.com',
                phone: '9999999999',
                whatsappNumber: '9999999999',
                address: '123 Supply Street, Chennai, Tamil Nadu',
                preferredCommunication: 'WHATSAPP'
            });
            console.log('✅ Vendor created: Thulir Supplier');
        }

        // 3. Create Demo Products (some with low stock)
        const productsData = [
            {
                sku: '001',
                name: 'Rice',
                description: 'Basmati rice 1kg',
                vendor: vendor._id,
                currentStock: 5,
                reorderPoint: 10,
                reorderQuantity: 50,
                unitPrice: 80,
                unit: 'kg',
                category: 'Grains'
            },
            {
                sku: '002',
                name: 'Biscuit',
                description: 'Cream biscuits pack',
                vendor: vendor._id,
                currentStock: 2,
                reorderPoint: 5,
                reorderQuantity: 20,
                unitPrice: 25,
                unit: 'pcs',
                category: 'Snacks'
            },
            {
                sku: '003',
                name: 'Oil',
                description: 'Sunflower oil 1L',
                vendor: vendor._id,
                currentStock: 3,
                reorderPoint: 8,
                reorderQuantity: 30,
                unitPrice: 150,
                unit: 'L',
                category: 'Cooking'
            },
            {
                sku: '004',
                name: 'Sugar',
                description: 'White sugar 1kg',
                vendor: vendor._id,
                currentStock: 100,
                reorderPoint: 20,
                reorderQuantity: 50,
                unitPrice: 45,
                unit: 'kg',
                category: 'Grains'
            },
            {
                sku: '005',
                name: 'Tea Powder',
                description: 'Premium tea powder 250g',
                vendor: vendor._id,
                currentStock: 1,
                reorderPoint: 5,
                reorderQuantity: 15,
                unitPrice: 120,
                unit: 'pcs',
                category: 'Beverages'
            }
        ];

        for (const productData of productsData) {
            const existingProduct = await Product.findOne({ sku: productData.sku });
            if (!existingProduct) {
                await Product.create(productData);
                console.log(`✅ Product created: ${productData.name} (SKU: ${productData.sku})`);
            }
        }

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Admin: admin@supermart.com / admin123`);
        console.log(`   - Vendor: Thulir Supplier (WhatsApp: 9999999999)`);
        console.log(`   - Products: ${productsData.length} items (4 are low stock)`);
        console.log('\n💡 Tip: Run "Generate PO" to create purchase orders for low-stock items.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seed Error:', error);
        process.exit(1);
    }
};

// Run seed
seedDatabase();
