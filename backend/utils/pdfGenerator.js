import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate a professional Purchase Order PDF
 * @param {Object} poData - Purchase order data including vendor, items, and totals
 * @param {String} outputPath - Path where PDF should be saved
 * @returns {Promise} - Resolves when PDF is created
 */
const generatePurchaseOrderPDF = (poData, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            // Pipe to file
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // --- HEADER SECTION ---
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text('PURCHASE ORDER', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(10)
                .font('Helvetica')
                .text(`PO Number: ${poData.poNumber}`, { align: 'center' });

            doc.text(`Date: ${new Date(poData.createdAt).toLocaleDateString()}`, { align: 'center' });

            doc.moveDown(1.5);

            // --- FROM SECTION (Store Details) ---
            const fromX = 50;
            const toX = 320;
            let currentY = doc.y;

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('FROM:', fromX, currentY);

            doc.fontSize(10)
                .font('Helvetica')
                .text(process.env.STORE_NAME || 'SuperMart', fromX, doc.y);

            doc.text(process.env.STORE_ADDRESS || '123 Main St, City', fromX, doc.y);
            doc.text(process.env.STORE_EMAIL || 'admin@store.com', fromX, doc.y);
            doc.text(process.env.STORE_PHONE || '+1-234-567-8900', fromX, doc.y);

            // --- TO SECTION (Vendor Details) ---
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('TO:', toX, currentY);

            doc.fontSize(10)
                .font('Helvetica')
                .text(poData.vendor.name, toX, currentY + 15);

            doc.text(poData.vendor.address, toX, doc.y);
            doc.text(poData.vendor.email, toX, doc.y);
            doc.text(poData.vendor.phone, toX, doc.y);

            doc.moveDown(2);

            // --- ITEMS TABLE ---
            const tableTop = doc.y;
            const tableHeaders = ['SKU', 'Product Name', 'Qty', 'Unit Price', 'Total'];
            const columnPositions = [50, 130, 350, 420, 490];
            const columnWidths = [75, 215, 65, 65, 60];

            // Table header
            doc.fontSize(10)
                .font('Helvetica-Bold');

            tableHeaders.forEach((header, i) => {
                doc.text(header, columnPositions[i], tableTop, {
                    width: columnWidths[i],
                    align: i >= 2 ? 'right' : 'left'
                });
            });

            // Header underline
            doc.moveTo(50, tableTop + 15)
                .lineTo(550, tableTop + 15)
                .stroke();

            // Table rows
            doc.font('Helvetica');
            let rowY = tableTop + 25;

            poData.items.forEach((item, index) => {
                // Check if we need a new page
                if (rowY > 700) {
                    doc.addPage();
                    rowY = 50;
                }

                doc.text(item.sku, columnPositions[0], rowY, { width: columnWidths[0] });
                doc.text(item.name, columnPositions[1], rowY, { width: columnWidths[1] });
                doc.text(item.quantity.toString(), columnPositions[2], rowY, { width: columnWidths[2], align: 'right' });
                doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, columnPositions[3], rowY, { width: columnWidths[3], align: 'right' });
                doc.text(`Rs. ${item.total.toFixed(2)}`, columnPositions[4], rowY, { width: columnWidths[4], align: 'right' });

                rowY += 25;
            });

            // Total line
            doc.moveTo(50, rowY)
                .lineTo(550, rowY)
                .stroke();

            rowY += 15;

            // Grand Total
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('GRAND TOTAL:', 420, rowY, { width: 70, align: 'right' });

            doc.text(`Rs. ${poData.totalAmount.toFixed(2)}`, 490, rowY, { width: 60, align: 'right' });

            // --- FOOTER SECTION ---
            doc.fontSize(9)
                .font('Helvetica-Oblique')
                .text(
                    'Please acknowledge receipt of this purchase order and confirm the delivery date.',
                    50,
                    rowY + 60,
                    { width: 500, align: 'left' }
                );

            doc.moveDown(2);
            doc.fontSize(10)
                .font('Helvetica')
                .text('Authorized Signature: ___________________________', 50, doc.y);

            doc.moveDown(0.5);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, doc.y);

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve(outputPath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Ensure the uploads directory exists
 */
const ensureUploadsDir = () => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'pos');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    return uploadsDir;
};

export { generatePurchaseOrderPDF, ensureUploadsDir };
