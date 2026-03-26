import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storeImage from '../assets/images/aisle-1.jpg';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Login failed');
        }

        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="responsive-flex" style={{
            minHeight: '100dvh',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            boxSizing: 'border-box'
        }}>
            {/* Left Side - Store Image */}
            <div className="hide-on-mobile" style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${storeImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div style={{
                    color: 'white',
                    textAlign: 'center',
                    padding: '2rem',
                    zIndex: 1
                }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem'
                    }}>🌱</div>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        margin: '0 0 1rem 0',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        Thulir Market
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        opacity: 0.95,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}>
                        Intelligent Inventory Management
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                background: '#f9fafb',
                overflowY: 'auto'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '2rem',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    {/* Logo */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            width: '4rem',
                            height: '4rem',
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            marginBottom: '1rem',
                            color: 'white'
                        }}>
                            🌱
                        </div>
                        <h2 style={{
                            fontSize: '1.875rem',
                            fontWeight: 700,
                            color: '#111827',
                            margin: '0 0 0.5rem 0'
                        }}>
                            Welcome Back
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            margin: 0
                        }}>
                            Sign in to manage your inventory
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label required">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@thulir.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading}
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Credentials Info */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#065f46'
                    }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Demo Credentials:
                        </strong>
                        <div>Email: <code>admin@supermart.com</code></div>
                        <div>Password: <code>admin123</code></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
