import React, { useState, useEffect } from 'react';
import { vendorsAPI } from '../services/api';
import Modal from '../components/UI/Modal';
import headerBanner from '../assets/images/cosmetics-section.jpg';

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        address: '',
        preferredCommunication: 'EMAIL'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await vendorsAPI.getAll();
            setVendors(response.data.data || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (vendor = null) => {
        if (vendor) {
            setEditingVendor(vendor);
            setFormData({
                name: vendor.name,
                email: vendor.email,
                phone: vendor.phone,
                whatsappNumber: vendor.whatsappNumber || '',
                address: vendor.address,
                preferredCommunication: vendor.preferredCommunication
            });
        } else {
            setEditingVendor(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                whatsappNumber: '',
                address: '',
                preferredCommunication: 'EMAIL'
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingVendor(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingVendor) {
                await vendorsAPI.update(editingVendor._id, formData);
            } else {
                await vendorsAPI.create(formData);
            }
            fetchVendors();
            handleCloseModal();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving vendor');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) {
            return;
        }

        try {
            await vendorsAPI.delete(id);
            fetchVendors();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting vendor');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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
            {/* Header Banner */}
            <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '2rem',
                height: '150px',
                background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${headerBanner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        margin: 0,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        👥 Vendor Management
                    </h2>
                </div>
            </div>

            <div className="page-header responsive-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Vendors</h1>
                    <p className="page-description">Manage your suppliers and vendors</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    + Add Vendor
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>WhatsApp</th>
                                <th>Preferred Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                        No vendors found. Add your first vendor to get started.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor._id}>
                                        <td className="font-medium">{vendor.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <span>📧</span>
                                                <span>{vendor.email}</span>
                                            </div>
                                        </td>
                                        <td>{vendor.phone}</td>
                                        <td>
                                            {vendor.whatsappNumber ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <span>💬</span>
                                                    <span>{vendor.whatsappNumber}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${vendor.preferredCommunication === 'EMAIL' ? 'badge-info' : 'badge-success'}`}>
                                                {vendor.preferredCommunication}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleOpenModal(vendor)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(vendor._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            >
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label required">Vendor Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">WhatsApp Number</label>
                        <input
                            type="tel"
                            name="whatsappNumber"
                            className="form-input"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Address</label>
                        <textarea
                            name="address"
                            className="form-textarea"
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Preferred Communication</label>
                        <select
                            name="preferredCommunication"
                            className="form-select"
                            value={formData.preferredCommunication}
                            onChange={handleChange}
                        >
                            <option value="EMAIL">Email</option>
                            <option value="WHATSAPP">WhatsApp</option>
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingVendor ? 'Update' : 'Create'} Vendor
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Vendors;
