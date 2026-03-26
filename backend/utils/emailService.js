import nodemailer from 'nodemailer';
// Force default import for some ESM environments where nodemailer might be exported differently
const { createTransport } = nodemailer;

/**
 * Create email transporter using SMTP configuration
 */
const createTransporter = () => {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  SMTP not configured. Email sending will not work.');
        return null;
    }

    return createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Send Purchase Order email to vendor
 * @param {Object} options - Email options
 * @param {String} options.vendorEmail - Vendor's email address
 * @param {String} options.vendorName - Vendor's name
 * @param {String} options.poNumber - Purchase order number
 * @param {String} options.pdfPath - Path to PDF attachment
 * @param {Number} options.totalAmount - Total order amount
 * @returns {Promise} - Resolves when email is sent
 */
const sendPurchaseOrderEmail = async (options) => {
    const transporter = createTransporter();

    if (!transporter) {
        throw new Error('SMTP not configured. Please set SMTP credentials in .env file.');
    }

    const { vendorEmail, vendorName, poNumber, pdfPath, totalAmount } = options;

    const mailOptions = {
        from: `"${process.env.STORE_NAME || 'Thulir Market'}" <${process.env.SMTP_USER}>`,
        to: vendorEmail,
        subject: `Purchase Order ${poNumber} from ${process.env.STORE_NAME || 'Thulir Market'}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Purchase Order</h2>
        <p>Dear ${vendorName},</p>
        <p>Please find attached Purchase Order <strong>${poNumber}</strong> with a total amount of <strong>₹${totalAmount.toFixed(2)}</strong>.</p>
        <p>Please review the order details and confirm the delivery date at your earliest convenience.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from ${process.env.STORE_NAME || 'Thulir Market'}.<br>
          For any queries, please contact us at ${process.env.STORE_EMAIL || 'admin@store.com'}
        </p>
      </div>
    `,
        attachments: [
            {
                filename: `${poNumber}.pdf`,
                path: pdfPath
            }
        ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${vendorEmail}: ${info.messageId}`);
        // Preview only available when sending through an Ethereal account
        console.log(`📬 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        return info;
    } catch (error) {
        console.error(`❌ Email sending failed: ${error.message}`);
        throw error;
    }
};

/**
 * Send Low Stock Alert email to admin
 * @param {Object} options - Email options
 * @param {String} options.productName - Product name
 * @param {String} options.sku - Product SKU
 * @param {Number} options.currentStock - Current stock level
 * @param {Number} options.reorderPoint - Reorder point
 * @returns {Promise} - Resolves when email is sent
 */
const sendLowStockAlert = async (options) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.warn('⚠️ SMTP not configured. Low stock alert not sent.');
        return;
    }

    const { productName, sku, currentStock, reorderPoint } = options;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (!adminEmail) {
        console.warn('⚠️ Admin email not configured. Low stock alert not sent.');
        return;
    }

    const mailOptions = {
        from: `"${process.env.STORE_NAME || 'Thulir Market'}" <${process.env.SMTP_USER}>`,
        to: adminEmail,
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
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Low stock alert sent to ${adminEmail}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Low stock email failed: ${error.message}`);
        // Don't throw error to prevent blocking the billing process
    }
};

export { sendPurchaseOrderEmail, sendLowStockAlert };
