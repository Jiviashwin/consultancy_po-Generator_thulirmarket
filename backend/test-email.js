
import { sendPurchaseOrderEmail } from './utils/emailService.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const testEmail = async () => {
    try {
        console.log('Sending test email via Gmail...');
        // Use package.json as a dummy attachment
        const dummyPdfPath = path.resolve('package.json');

        await sendPurchaseOrderEmail({
            vendorEmail: process.env.SMTP_USER, // Send to self
            vendorName: 'Self Test',
            poNumber: 'PO-TEST-REAL',
            pdfPath: dummyPdfPath,
            totalAmount: 100.00
        });
        console.log("SUCCESS: Test email sent!");
    } catch (error) {
        console.error('Test Failed:', error);
    }
};

testEmail();
