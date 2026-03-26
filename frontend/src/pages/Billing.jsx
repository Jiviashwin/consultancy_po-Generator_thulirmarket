
import React, { useState, useEffect } from 'react';
import { productsAPI, billingAPI, paymentAPI } from '../services/api';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Billing = () => {
    const [products, setProducts] = useState([]);
    const [skuInput, setSkuInput] = useState('');
    const [currentBillItems, setCurrentBillItems] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    // QR Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [mockOrderDetails, setMockOrderDetails] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productsAPI.getAll();
            if (response.data.success) {
                setProducts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const addToBill = (e) => {
        e.preventDefault();
        setError('');

        const scannedSku = skuInput.trim();
        if (!scannedSku) {
            setError('Please enter a valid SKU.');
            return;
        }

        const product = products.find(p => p.sku === scannedSku.toUpperCase() || p.sku === scannedSku);

        if (!product) {
            setError('Product not found!');
            return;
        }

        if (product.currentStock <= 0) {
            setError('Product is out of stock!');
            return;
        }

        const existingItem = currentBillItems.find(item => item.product._id === product._id);

        if (existingItem) {
            if (existingItem.quantity + 1 > product.currentStock) {
                setError(`Only ${product.currentStock} items in stock!`);
                return;
            }

            setCurrentBillItems(prev => prev.map(item =>
                item.product._id === product._id
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            setCurrentBillItems(prev => [...prev, {
                product: product, // Store full product object for display
                sku: product.sku,
                name: product.name,
                unitPrice: product.unitPrice,
                unit: product.unit,
                quantity: 1,
                total: product.unitPrice
            }]);
        }
        setSkuInput('');
    };

    const updateQuantity = (sku, newQty) => {
        if (newQty < 1) return;

        const item = currentBillItems.find(i => i.sku === sku);
        if (!item) return;

        // Find original product to check stock
        const product = products.find(p => p.sku === sku);
        if (newQty > product.currentStock) {
            setError(`Only ${product.currentStock} items in stock!`);
            return;
        }

        setCurrentBillItems(prev => prev.map(i =>
            i.sku === sku
                ? { ...i, quantity: newQty, total: newQty * i.unitPrice }
                : i
        ));
        setError('');
    };

    const removeFromBill = (sku) => {
        setCurrentBillItems(prev => prev.filter(item => item.sku !== sku));
    };

    const calculateTotal = () => {
        return currentBillItems.reduce((sum, item) => sum + item.total, 0);
    };

    const generatePDFBill = (billItems, total, customerName, cPhone, payMethod) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Thulir Market", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("GSTIN: 33XXXXX0000X1Z5", 105, 28, { align: "center" });
        doc.text("123 Market Street, City, State 12345", 105, 34, { align: "center" });
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 45);
        
        // Customer Info
        if (customerName) {
            doc.text(`Customer Name: ${customerName}`, 14, 55);
            if (cPhone) doc.text(`Phone: ${cPhone}`, 14, 61);
        }
        
        doc.text(`Payment Method: ${payMethod}`, 14, customerName ? 67 : 55);

        // Table
        const tableColumn = ["Item", "Qty", "Price", "Total"];
        const tableRows = [];

        billItems.forEach(item => {
            const itemData = [
                item.name,
                `${item.quantity} ${item.unit || ''}`,
                `Rs. ${item.unitPrice.toFixed(2)}`,
                `Rs. ${item.total.toFixed(2)}`
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            startY: customerName ? 75 : 65,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 40, halign: 'right' },
            }
        });

        // Totals Calculation (assuming 18% GST overall for this example)
        const finalY = doc.lastAutoTable.finalY || 150;
        const subtotal = total / 1.18; // Reverse engineer subtotal before 18% tax
        const taxAmount = total - subtotal;

        doc.setFontSize(10);
        doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 140, finalY + 10);
        doc.text(`GST (18%): Rs. ${taxAmount.toFixed(2)}`, 140, finalY + 18);
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Grand Total: Rs. ${total.toFixed(2)}`, 140, finalY + 28);
        
        // Footer
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for shopping with us!", 105, finalY + 45, { align: "center" });

        doc.save(`Invoice_ThulirMarket_${Date.now()}.pdf`);
    };

    const handleCheckout = async () => {
        if (currentBillItems.length === 0) {
            setError('No items in the bill!');
            return;
        }

        const cName = customerName.trim();
        if (cName && cName.length < 2) {
            setError('Customer Name must be at least 2 characters if provided.');
            return;
        }

        const nameRegex = /^[a-zA-Z0-9\s]*$/;
        if (cName && !nameRegex.test(cName)) {
            setError('Customer Name can only contain alphanumeric characters and spaces.');
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (customerPhone && !phoneRegex.test(customerPhone)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }

        const validMethods = ['CASH', 'ONLINE', 'CARD'];
        if (!validMethods.includes(paymentMethod)) {
            setError('Please select a valid payment method.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const billData = {
                items: currentBillItems.map(item => ({
                    sku: item.sku,
                    quantity: item.quantity
                })),
                customerName: cName,
                customerPhone: customerPhone,
                paymentMethod
            };

            if (paymentMethod === 'ONLINE' || paymentMethod === 'CARD') {
                // Mock Payment Processing for Demo/Project
                const orderResponse = await paymentAPI.createOrder(billData);
                if (!orderResponse.data.success) {
                    throw new Error(orderResponse.data.message || 'Error creating payment order');
                }

                // Show QR Code Modal
                const totalAmount = calculateTotal();
                setMockOrderDetails({
                    orderId: orderResponse.data.order.id,
                    amount: totalAmount,
                    billData: billData
                });
                setShowQRModal(true);

            } else {
                // Cash / Offline Flow
                const response = await billingAPI.create(billData);

                if (response.data.success) {
                    setSuccessMessage('Bill created successfully!');
                    generatePDFBill(currentBillItems, calculateTotal(), cName, customerPhone, paymentMethod);
                    setCurrentBillItems([]);
                    setCustomerName('');
                    setCustomerPhone('');
                    setPaymentMethod('CASH');
                    fetchProducts(); // Refresh stock
                }
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setError(error.message || error.response?.data?.message || 'Error processing bill');
        } finally {
            setLoading(false);
        }
    };

    const handleMockPaymentSuccess = async () => {
        if (!mockOrderDetails) return;

        setShowQRModal(false);
        setProcessingPayment(true);

        // Simulate 1.5 seconds network delay for verification
        setTimeout(async () => {
            try {
                const verifyData = {
                    razorpay_order_id: mockOrderDetails.orderId,
                    razorpay_payment_id: `pay_demo_${Date.now()}`,
                    razorpay_signature: "mock_signature_valid",
                    billData: mockOrderDetails.billData
                };

                const verifyRes = await paymentAPI.verifyPayment(verifyData);
                if (verifyRes.data.success) {
                    setSuccessMessage('Payment successful & Bill created!');
                    generatePDFBill(currentBillItems, calculateTotal(), customerName, customerPhone, paymentMethod);
                    setCurrentBillItems([]);
                    setCustomerName('');
                    setCustomerPhone('');
                    setPaymentMethod('CASH');
                    fetchProducts(); // Refresh stock
                } else {
                    setError('Payment verification failed.');
                }
            } catch (err) {
                console.error('Verify error:', err);
                setError(err.response?.data?.message || 'Payment Verification Error');
            } finally {
                setProcessingPayment(false);
                setMockOrderDetails(null);
            }
        }, 1500);
    };

    const handleMockPaymentCancel = () => {
        setShowQRModal(false);
        setMockOrderDetails(null);
        setError('Payment was cancelled by user.');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', filter: (showQRModal || processingPayment) ? 'blur(2px)' : 'none', transition: 'filter 0.3s' }}>
                <div className="responsive-flex" style={{ gap: '2rem' }}>
                    {/* Left Side: Billing Form */}
                    <div style={{ flex: 2 }}>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: '#111827' }}>New Bill</h2>

                            {/* Product Entry */}
                            <form onSubmit={addToBill} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>Scan SKU / Product ID</label>
                                    <input
                                        type="text"
                                        value={skuInput}
                                        onChange={(e) => setSkuInput(e.target.value)}
                                        placeholder="Enter SKU (e.g., 001)"
                                        className="form-input"
                                        autoFocus
                                    />
                                </div>
                                <div style={{ alignSelf: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary">
                                        Add Item
                                    </button>
                                </div>
                            </form>

                            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
                            {successMessage && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

                            {/* Bill Items Table */}
                            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Product</th>
                                            <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Price</th>
                                            <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Qty</th>
                                            <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Total</th>
                                            <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentBillItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No items added yet</td>
                                            </tr>
                                        ) : (
                                            currentBillItems.map((item, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>SKU: {item.sku}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>₹{item.unitPrice}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                                                                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer' }}
                                                            >-</button>
                                                            <span>{item.quantity} {item.unit}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                                                                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer' }}
                                                            >+</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{item.total}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <button
                                                            onClick={() => removeFromBill(item.sku)}
                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        >✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Customer & Checkout */}
                            <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '2rem' }}>
                                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label className="form-label">Customer Name (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Guest"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Customer Phone (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={customerPhone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setCustomerPhone(value);
                                            }}
                                            placeholder="10-digit number"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Payment Method</label>
                                        <select
                                            className="form-input"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="ONLINE">Online</option>
                                            <option value="CARD">Card</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="responsive-flex" style={{ justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Amount</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>₹{calculateTotal()}</div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={loading || currentBillItems.length === 0}
                                        className="btn btn-primary btn-lg"
                                        style={{ padding: '0.75rem 2rem' }}
                                    >
                                        {loading ? 'Processing...' : 'Complete Bill'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Product List Reference */}
                    <div style={{ flex: 1 }}>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Product Reference</h3>
                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {products.map(product => (
                                    <div
                                        key={product._id}
                                        onClick={() => { setSkuInput(product.sku); }}
                                        style={{
                                            padding: '0.75rem',
                                            borderBottom: '1px solid #f3f4f6',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                            <span>SKU: {product.sku}</span>
                                            <span style={{ color: product.currentStock > 0 ? '#059669' : '#ef4444' }}>
                                                Stock: {product.currentStock} {product.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mock QR Code Modal */}
            {showQRModal && mockOrderDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '2.5rem', borderRadius: '20px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', minWidth: '350px', animation: 'scaleInQR 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Scan to Pay</h2>
                            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Amount: <span style={{ fontWeight: 700, color: '#10b981' }}>₹{mockOrderDetails.amount}</span></p>
                        </div>

                        <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                            <QRCode
                                value={` UPI://pay?pa=demo@ybl&pn=ThulirMarket&am=${mockOrderDetails.amount}&cu=INR`}
                                size={200}
                                level="H"
                            />
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', fontWeight: 500 }}>Demo Controls (Click to Simulate App Payment)</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={handleMockPaymentCancel}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMockPaymentSuccess}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                                >
                                    Simulate Success
                                </button>
                            </div>
                        </div>

                        <style>
                            {`
                            @keyframes scaleInQR { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
                            `}
                        </style>
                    </div>
                </div>
            )}

            {/* Mock Payment Gateway Processing Overlay */}
            {processingPayment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', minWidth: '320px', animation: 'scaleIn 0.3s ease-out' }}>
                        <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #10b981', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Verifying Payment...</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Waiting for bank confirmation</p>
                        <style>
                            {`
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            @keyframes scaleIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                            `}
                        </style>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
