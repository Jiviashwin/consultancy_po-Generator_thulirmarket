import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import PurchaseOrders from './pages/PurchaseOrders';
import Header from './components/Layout/Header';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Layout Component
const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <div className="main-content">
                <Header />
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/vendors"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Vendors />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/inventory"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Inventory />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/billing"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Billing />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/purchase-orders"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <PurchaseOrders />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
