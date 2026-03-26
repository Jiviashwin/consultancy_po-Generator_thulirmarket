import React, { useState, useEffect } from 'react';
import { purchaseOrdersAPI } from '../services/api';
import Modal from '../components/UI/Modal';
import emptyStateImg from '../assets/images/aisle-1.jpg';

const PurchaseOrders = () => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [deliveryMethod, setDeliveryMethod] = useState('EMAIL');
    const [sending, setSending] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchPurchaseOrders();
    }, []);

    const fetchPurchaseOrders = async () => {
        try {
            const response = await purchaseOrdersAPI.getAll();
            setPurchaseOrders(response.data.data || []);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePOs = async () => {
        if (!window.confirm('This will generate purchase orders for all low-stock items. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await purchaseOrdersAPI.generate();
            alert(response.data.message);
            fetchPurchaseOrders();
        } catch (error) {
            alert(error.response?.data?.message || 'Error generating purchase orders');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewPO = (po) => {
        setSelectedPO(po);
        setDeliveryMethod(po.vendor.preferredCommunication || 'EMAIL');
        setWhatsappLink(null);
        setShowReviewModal(true);
    };

    const handleSendPO = async () => {
        if (!selectedPO) return;

        setSending(true);
        try {
            const response = await purchaseOrdersAPI.send(selectedPO._id, deliveryMethod);

            if (deliveryMethod === 'WHATSAPP') {
                setWhatsappLink(response.data.pdfLink);
                alert('PDF generated! Copy the link below to share via WhatsApp.');
            } else {
                alert(response.data.message);
                setShowReviewModal(false);
            }

            fetchPurchaseOrders();
        } catch (error) {
            alert(error.response?.data?.message || 'Error sending purchase order');
        } finally {
            setSending(false);
        }
    };

    const handleDownloadPDF = (poId) => {
        window.open(purchaseOrdersAPI.getPDF(poId), '_blank');
    };

    const handleUpdateStatus = async (poId, status) => {
        try {
            await purchaseOrdersAPI.update(poId, { status });
            fetchPurchaseOrders();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating status');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            DRAFT: 'badge-gray',
            SENT: 'badge-info',
            RECEIVED: 'badge-success',
            CANCELLED: 'badge-danger'
        };
        return badges[status] || 'badge-gray';
    };

    const filteredPOs = filter === 'all'
        ? purchaseOrders
        : purchaseOrders.filter(po => po.status === filter);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header responsive-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Purchase Orders</h1>
                    <p className="page-description">Generate and manage purchase orders for vendors</p>
                </div>
                <button className="btn btn-primary" onClick={handleGeneratePOs}>
                    🔄 Generate POs
                </button>
            </div>

            {/* Filter Buttons */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                    className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    All ({purchaseOrders.length})
                </button>
                <button
                    className={`btn btn-sm ${filter === 'DRAFT' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('DRAFT')}
                >
                    Draft ({purchaseOrders.filter(po => po.status === 'DRAFT').length})
                </button>
                <button
                    className={`btn btn-sm ${filter === 'SENT' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('SENT')}
                >
                    Sent ({purchaseOrders.filter(po => po.status === 'SENT').length})
                </button>
                <button
                    className={`btn btn-sm ${filter === 'RECEIVED' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('RECEIVED')}
                >
                    Received ({purchaseOrders.filter(po => po.status === 'RECEIVED').length})
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>PO Number</th>
                                <th>Vendor</th>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPOs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '3rem 2rem',
                                            background: `linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url(${emptyStateImg})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>📄</div>
                                            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                                                No purchase orders generated yet
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPOs.map((po) => (
                                    <tr key={po._id}>
                                        <td>
                                            <code style={{
                                                background: 'var(--gray-100)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                {po.poNumber}
                                            </code>
                                        </td>
                                        <td className="font-medium">{po.vendor?.name}</td>
                                        <td>{po.items?.length || 0} items</td>
                                        <td className="font-semibold">₹{po.totalAmount.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="text-sm text-muted">
                                            {new Date(po.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {po.status === 'DRAFT' && (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleReviewPO(po)}
                                                    >
                                                        Review & Send
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleDownloadPDF(po._id)}
                                                >
                                                    📄 PDF
                                                </button>

                                                {po.status === 'SENT' && (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleUpdateStatus(po._id, 'RECEIVED')}
                                                    >
                                                        Received
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review & Send Modal */}
            <Modal
                isOpen={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    setWhatsappLink(null);
                }}
                title={`Review Purchase Order: ${selectedPO?.poNumber}`}
                size="lg"
            >
                {selectedPO && (
                    <div>
                        {/* Vendor Info */}
                        <div style={{
                            background: 'var(--gray-50)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem'
                        }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Vendor Details</h4>
                            <div style={{ fontSize: '0.875rem' }}>
                                <strong>{selectedPO.vendor?.name}</strong><br />
                                {selectedPO.vendor?.email}<br />
                                {selectedPO.vendor?.phone}
                                {selectedPO.vendor?.whatsappNumber && (
                                    <><br />WhatsApp: {selectedPO.vendor.whatsappNumber}</>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <h4 style={{ marginBottom: '0.5rem' }}>Order Items</h4>
                        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPO.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted">{item.sku}</div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.unitPrice.toFixed(2)}</td>
                                            <td className="font-semibold">₹{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                                        <td colSpan="3" style={{ textAlign: 'right' }}>GRAND TOTAL:</td>
                                        <td>₹{selectedPO.totalAmount.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Delivery Method Selection */}
                        {!whatsappLink && (
                            <>
                                <h4 style={{ marginBottom: '0.5rem' }}>Delivery Method</h4>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        border: '2px solid',
                                        borderColor: deliveryMethod === 'EMAIL' ? 'var(--primary)' : 'var(--border-color)',
                                        borderRadius: '8px',
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="EMAIL"
                                            checked={deliveryMethod === 'EMAIL'}
                                            onChange={(e) => setDeliveryMethod(e.target.value)}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        <div>
                                            <div className="font-medium">📧 Email</div>
                                            <div className="text-xs text-muted">
                                                Send PDF directly to {selectedPO.vendor?.email}
                                            </div>
                                        </div>
                                    </label>

                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        border: '2px solid',
                                        borderColor: deliveryMethod === 'WHATSAPP' ? 'var(--primary)' : 'var(--border-color)',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="WHATSAPP"
                                            checked={deliveryMethod === 'WHATSAPP'}
                                            onChange={(e) => setDeliveryMethod(e.target.value)}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        <div>
                                            <div className="font-medium">💬 WhatsApp</div>
                                            <div className="text-xs text-muted">
                                                Generate shareable PDF link for WhatsApp
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </>
                        )}

                        {/* WhatsApp Link Display */}
                        {whatsappLink && (
                            <div className="alert alert-success">
                                <strong>PDF Generated Successfully!</strong>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>
                                        Share this link via WhatsApp:
                                    </label>
                                    <input
                                        type="text"
                                        value={whatsappLink}
                                        readOnly
                                        className="form-input"
                                        onClick={(e) => e.target.select()}
                                        style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    />
                                    <button
                                        className="btn btn-sm btn-success"
                                        style={{ marginTop: '0.5rem', width: '100%' }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(whatsappLink);
                                            alert('Link copied to clipboard!');
                                        }}
                                    >
                                        📋 Copy Link
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setWhatsappLink(null);
                                }}
                            >
                                {whatsappLink ? 'Close' : 'Cancel'}
                            </button>

                            {!whatsappLink && (
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleSendPO}
                                    disabled={sending}
                                >
                                    {sending ? 'Sending...' : `Send via ${deliveryMethod}`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PurchaseOrders;
