import { Resend } from 'resend';
import fs from 'fs';

/**
 * Email Service using Resend API (works on Render free tier)
 * Resend uses HTTPS, not SMTP — avoids Render's outbound port blocks
 */

const getResend = () => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY not set. Email sending will not work.');
        return null;
    }
    return new Resend(process.env.RESEND_API_KEY);
};

const FROM_ADDRESS = `${process.env.STORE_NAME || 'Thulir Market'} <onboarding@resend.dev>`;

/**
 * Send Purchase Order email to vendor
 */
const sendPurchaseOrderEmail = async (options) => {
    const resend = getResend();
    if (!resend) throw new Error('RESEND_API_KEY not configured.');

    const { vendorEmail, vendorName, poNumber, pdfPath, totalAmount } = options;

    // Read PDF file for attachment
    let attachments = [];
    if (pdfPath && fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        attachments = [{
            filename: `${poNumber}.pdf`,
            content: pdfBuffer
        }];
    }

    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [vendorEmail],
        subject: `Purchase Order ${poNumber} from ${process.env.STORE_NAME || 'Thulir Market'}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Purchase Order</h2>
        <p>Dear ${vendorName},</p>
        <p>Please find attached Purchase Order <strong>${poNumber}</strong> with a total amount of <strong>&#8377;${totalAmount.toFixed(2)}</strong>.</p>
        <p>Please review the order details and confirm the delivery date at your earliest convenience.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from ${process.env.STORE_NAME || 'Thulir Market'}.<br>
          For any queries, please contact us at ${process.env.STORE_EMAIL || 'admin@store.com'}
        </p>
      </div>
    `,
        attachments
    });

    if (error) {
        console.error('❌ Email sending failed:', error);
        throw new Error(error.message);
    }

    console.log(`✅ Email sent to ${vendorEmail}: ${data.id}`);
    return data;
};

/**
 * Send Low Stock Alert email to admin
 */
const sendLowStockAlert = async (options) => {
    const resend = getResend();
    if (!resend) {
        console.warn('⚠️ RESEND_API_KEY not set. Low stock alert not sent.');
        return;
    }

    const { productName, sku, currentStock, reorderPoint } = options;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (!adminEmail) {
        console.warn('⚠️ Admin email not configured. Low stock alert not sent.');
        return;
    }

    const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [adminEmail],
        subject: `⚠️ Low Stock Alert: ${productName} (${sku})`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e53e3e; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e53e3e; padding: 15px; color: white;">
            <h2 style="margin: 0;">Low Stock Alert</h2>
        </div>
        <div style="padding: 20px;">
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>SKU:</strong> ${sku}</p>
            <p style="font-size: 1.25rem; color: #e53e3e;"><strong>Current Stock: ${currentStock}</strong></p>
            <p><strong>Reorder Point:</strong> ${reorderPoint}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p>Please restock this item immediately.</p>
        </div>
      </div>
    `
    });

    if (error) {
        console.error('❌ Low stock email failed:', error);
        return;
    }

    console.log(`✅ Low stock alert sent to ${adminEmail}`);
};

export { sendPurchaseOrderEmail, sendLowStockAlert };
