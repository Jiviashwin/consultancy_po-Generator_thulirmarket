import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';

dotenv.config();

const runTest = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/po-generator');
        console.log('✅ Connected');

        // 1. Create Test Vendor
        const vendor = await Vendor.create({
            name: 'Test Vendor Restock',
            email: 'test@restock.com',
            code: 'T-RESTOCK',
            address: '123 Test Lane',
            phone: '555-555-5555'
        });
        console.log(`Created Vendor: ${vendor._id}`);

        // 2. Create Test Product with stock 10
        const product = await Product.create({
            sku: 'TEST-SKU-RESTOCK',
            name: 'Restock Test Item',
            vendor: vendor._id,
            currentStock: 10,
            reorderPoint: 5,
            reorderQuantity: 20,
            unitPrice: 50
        });
        console.log(`Created Product: Stock = ${product.currentStock}`);

        // 3. Create PO for 5 items
        const po = await PurchaseOrder.create({
            poNumber: `PO-TEST-${Date.now()}`,
            vendor: vendor._id,
            items: [{
                product: product._id,
                sku: product.sku,
                name: product.name,
                quantity: 5,
                unitPrice: 50,
                total: 250
            }],
            totalAmount: 250,
            status: 'SENT' // Start as SENT
        });
        console.log(`Created PO: ${po._id} (Qty: 5)`);

        console.log('🚀 Triggering Restock Logic (Simulating API Update)...');

        // SIMULATING THE CONTROLLER LOGIC HERE to verify it works against models
        // NOTE: In a real e2e we would hit the API, but this verifies the *logic* works with Mongoose
        // and doesn't rely on the server port which might vary.

        // --- LOGIC FROM CONTROLLER START ---
        const existingPO = await PurchaseOrder.findById(po._id).populate('items.product');
        const status = 'RECEIVED';

        if (status === 'RECEIVED' && existingPO.status !== 'RECEIVED') {
            console.log(`📦 Restocking items for PO ${existingPO.poNumber}...`);
            for (const item of existingPO.items) {
                if (item.product) {
                    await Product.findByIdAndUpdate(
                        item.product._id,
                        { $inc: { currentStock: item.quantity } }
                    );
                    console.log(`   + Added ${item.quantity} to ${item.name} (SKU: ${item.sku})`);
                }
            }
        }

        await PurchaseOrder.findByIdAndUpdate(po._id, { status: 'RECEIVED', receivedAt: new Date() });
        // --- LOGIC FROM CONTROLLER END ---

        // 4. Verify Stock
        const updatedProduct = await Product.findById(product._id);
        console.log(`\n📊 Final Stock Check:`);
        console.log(`   Initial: 10`);
        console.log(`   Added:   5`);
        console.log(`   Expected: 15`);
        console.log(`   Actual:   ${updatedProduct.currentStock}`);

        if (updatedProduct.currentStock === 15) {
            console.log('✅ TEST PASSED: Stock updated successfully!');
        } else {
            console.error('❌ TEST FAILED: Stock mismatch.');
        }

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await PurchaseOrder.findByIdAndDelete(po._id);
        await Product.findByIdAndDelete(product._id);
        await Vendor.findByIdAndDelete(vendor._id);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

runTest();
