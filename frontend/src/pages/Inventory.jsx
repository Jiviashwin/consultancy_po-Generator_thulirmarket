import React, { useState, useEffect } from 'react';
import { productsAPI, vendorsAPI } from '../services/api';
import Modal from '../components/UI/Modal';
import emptyStateImg from '../assets/images/fruits-section.jpg';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        vendor: '',
        currentStock: 0,
        reorderPoint: 0,
        reorderQuantity: 0,
        unitPrice: 0,
        unit: 'pcs',
        category: ''
    });
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' or 'low-stock'
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [showCustomPOModal, setShowCustomPOModal] = useState(false);
    const [customPOQuantities, setCustomPOQuantities] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, vendorsRes] = await Promise.all([
                productsAPI.getAll(),
                vendorsAPI.getAll()
            ]);
            setProducts(productsRes.data.data || []);
            setVendors(vendorsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                sku: product.sku,
                name: product.name,
                description: product.description || '',
                vendor: product.vendor._id,
                currentStock: product.currentStock,
                reorderPoint: product.reorderPoint,
                reorderQuantity: product.reorderQuantity,
                unitPrice: product.unitPrice,
                unit: product.unit || 'pcs',
                category: product.category || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                sku: '',
                name: '',
                description: '',
                vendor: '',
                currentStock: 0,
                reorderPoint: 0,
                reorderQuantity: 0,
                unitPrice: 0,
                unit: 'pcs',
                category: ''
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingProduct) {
                await productsAPI.update(editingProduct._id, formData);
            } else {
                await productsAPI.create(formData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await productsAPI.delete(id);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting product');
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const filteredProducts = filter === 'low-stock'
        ? products.filter(p => p.currentStock <= p.reorderPoint)
        : products;

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
            <div className="page-header responsive-flex" style={{ marginBottom: '1rem', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="page-description">Manage your product inventory and stock levels</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedProducts.size > 0 && (
                        <button className="btn btn-success" onClick={() => setShowCustomPOModal(true)}>
                            📦 Generate Custom PO ({selectedProducts.size})
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        + Add Product
                    </button>
                </div>
            </div>

            {/* Filter Buttons */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    All Products ({products.length})
                </button>
                <button
                    className={`btn ${filter === 'low-stock' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setFilter('low-stock')}
                >
                    Low Stock ({products.filter(p => p.currentStock <= p.reorderPoint).length})
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedProducts(new Set(filteredProducts.map(p => p._id)));
                                            } else {
                                                setSelectedProducts(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                <th>SKU</th>
                                <th>Product Name</th>
                                <th>Vendor</th>
                                <th>Current Stock</th>
                                <th>Reorder Point</th>
                                <th>Reorder Qty</th>
                                <th>Unit Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ padding: 0 }}>
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
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>📦</div>
                                            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                                                {filter === 'low-stock'
                                                    ? 'No low stock items found'
                                                    : 'No products added yet'
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const isLowStock = product.currentStock <= product.reorderPoint;
                                    return (
                                        <tr key={product._id} style={isLowStock ? { background: '#fee2e2' } : {}}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.has(product._id)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedProducts);
                                                        if (e.target.checked) {
                                                            newSet.add(product._id);
                                                            // Initialize auto-quantity to reorderQuantity if possible
                                                            setCustomPOQuantities(prev => ({
                                                                ...prev,
                                                                [product._id]: product.reorderQuantity || 1
                                                            }));
                                                        } else {
                                                            newSet.delete(product._id);
                                                        }
                                                        setSelectedProducts(newSet);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <code style={{
                                                    background: 'var(--gray-100)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {product.sku}
                                                </code>
                                            </td>
                                            <td className="font-medium">{product.name}</td>
                                            <td>{product.vendor?.name}</td>
                                            <td>
                                                <div>
                                                    <span className={`badge ${isLowStock ? 'badge-danger' : 'badge-success'}`}>
                                                        {product.currentStock}
                                                    </span>
                                                    <div style={{ marginTop: '0.25rem', background: '#e5e7eb', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            background: isLowStock ? '#ef4444' : '#10b981',
                                                            height: '100%',
                                                            width: `${Math.min(100, (product.currentStock / product.reorderPoint) * 100)}%`,
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{product.reorderPoint}</td>
                                            <td>{product.reorderQuantity}</td>
                                            <td>₹{product.unitPrice.toFixed(2)}</td>
                                            <td>
                                                {isLowStock ? (
                                                    <span className="badge badge-warning">⚠️ Low</span>
                                                ) : (
                                                    <span className="badge badge-success">✓ OK</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => handleOpenModal(product)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(product._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                size="lg"
            >
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label required">SKU</label>
                            <input
                                type="text"
                                name="sku"
                                className="form-input"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Product Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            className="form-textarea"
                            value={formData.description}
                            onChange={handleChange}
                            rows="2"
                        />
                    </div>

                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label required">Vendor</label>
                            <select
                                name="vendor"
                                className="form-select"
                                value={formData.vendor}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a vendor</option>
                                {vendors.map((vendor) => (
                                    <option key={vendor._id} value={vendor._id}>
                                        {vendor.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <input
                                type="text"
                                name="category"
                                className="form-input"
                                value={formData.category}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label required">Current Stock</label>
                            <input
                                type="number"
                                name="currentStock"
                                className="form-input"
                                value={formData.currentStock}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Reorder Point</label>
                            <input
                                type="number"
                                name="reorderPoint"
                                className="form-input"
                                value={formData.reorderPoint}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Reorder Quantity</label>
                            <input
                                type="number"
                                name="reorderQuantity"
                                className="form-input"
                                value={formData.reorderQuantity}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label required">Unit Price (₹)</label>
                            <input
                                type="number"
                                name="unitPrice"
                                className="form-input"
                                value={formData.unitPrice}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Unit</label>
                            <select
                                name="unit"
                                className="form-select"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                            >
                                <option value="pcs">Pieces (pcs)</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="g">Grams (g)</option>
                                <option value="l">Liters (l)</option>
                                <option value="ml">Milliliters (ml)</option>
                                <option value="packets">Packets</option>
                                <option value="boxes">Boxes</option>
                                <option value="dozens">Dozens</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingProduct ? 'Update' : 'Create'} Product
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Custom PO Modal */}
            <Modal
                isOpen={showCustomPOModal}
                onClose={() => setShowCustomPOModal(false)}
                title={`Generate Purchase Order (${selectedProducts.size} Items)`}
                size="lg"
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>Please verify the quantities for the selected products.</p>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Vendor</th>
                                    <th>Current Stock</th>
                                    <th>Order Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(selectedProducts).map(id => {
                                    const product = products.find(p => p._id === id);
                                    if (!product) return null;
                                    return (
                                        <tr key={product._id}>
                                            <td>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted">{product.sku}</div>
                                            </td>
                                            <td>{product.vendor?.name}</td>
                                            <td>{product.currentStock}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                                                    min="1"
                                                    value={customPOQuantities[product._id] || 1}
                                                    onChange={(e) => {
                                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                                        setCustomPOQuantities(prev => ({
                                                            ...prev,
                                                            [product._id]: val
                                                        }));
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCustomPOModal(false)}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={async () => {
                            try {
                                const { purchaseOrdersAPI } = await import('../services/api');
                                const itemsToOrder = Array.from(selectedProducts).map(id => ({
                                    productId: id,
                                    quantity: customPOQuantities[id] || 1
                                }));

                                const response = await purchaseOrdersAPI.generateCustom(itemsToOrder);
                                alert(response.data.message || 'PO generated successfully');
                                setShowCustomPOModal(false);
                                setSelectedProducts(new Set()); // Clear selection
                            } catch (error) {
                                console.error('Error generating Custom PO:', error);
                                alert(error.response?.data?.message || 'Error generating custom PO');
                            }
                        }}
                    >
                        Generate POs
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Inventory;
