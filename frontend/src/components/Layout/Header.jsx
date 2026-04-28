import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', path: '/' },
        { name: 'Vendors', path: '/vendors' },
        { name: 'Inventory', path: '/inventory' },
        { name: 'Billing', path: '/billing' },
        { name: 'Purchase Orders', path: '/purchase-orders' }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <header className="app-header">
            <div className="header-container">
                {/* Logo and Hamburger Container */}
                <div className="header-top-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            background: 'white',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: '#10b981',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.2) rotate(10deg)';
                                e.currentTarget.innerText = '🌿';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                                e.currentTarget.innerText = '🌱';
                            }}
                        >
                            🌱
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                            Thulir Market
                        </h1>
                    </div>

                    <button 
                        className="hamburger-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? '✖' : '☰'}
                    </button>
                </div>

                {/* Desktop Navigation */}
                <nav className="desktop-nav" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    {navigation.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                background: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.background = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.background = 'transparent';
                                }
                            }}
                        >
                            {item.name}
                        </Link>
                    ))}

                    {/* User Info & Logout */}
                    <div style={{
                        marginLeft: '1rem',
                        paddingLeft: '1rem',
                        borderLeft: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <span style={{ fontSize: '0.875rem', opacity: 0.9, whiteSpace: 'nowrap' }}>
                            {user?.name || user?.email}
                        </span>
                        <button
                            onClick={logout}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                background: 'transparent',
                                color: 'white',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                {/* Mobile Navigation Dropdown */}
                {isMenuOpen && (
                    <nav className="mobile-nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navigation.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    background: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div style={{
                            marginTop: '0.5rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                {user?.name || user?.email}
                            </span>
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    logout();
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    background: 'transparent',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;
