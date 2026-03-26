import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { productsAPI, vendorsAPI, purchaseOrdersAPI, billingAPI } from '../services/api';
import heroBanner from '../assets/images/aisle-1.jpg';

// ─── helpers ────────────────────────────────────────────────────────────────
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
const fmtDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const RANGE_OPTIONS = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
];

// ─── Stock Bar Component ─────────────────────────────────────────────────────
const StockBar = ({ product }) => {
    const max = Math.max(product.reorderPoint * 2, product.currentStock, 1);
    const pct = Math.min((product.currentStock / max) * 100, 100);
    const isLow = product.currentStock <= product.reorderPoint;
    const color = isLow ? '#ef4444' : product.currentStock <= product.reorderPoint * 1.5 ? '#f59e0b' : '#10b981';

    return (
        <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {isLow && '⚠️ '}{product.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: isLow ? '#ef4444' : 'var(--text-secondary)' }}>
                    {product.currentStock} / {product.reorderPoint} reorder
                </span>
            </div>
            <div style={{ background: 'var(--gray-200)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '999px',
                    transition: 'width 0.6s ease'
                }} />
            </div>
        </div>
    );
};

// ─── Custom Tooltip for chart ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'white', border: '1px solid var(--border-color)',
            borderRadius: '8px', padding: '0.75rem', boxShadow: 'var(--shadow-md)',
            fontSize: '0.8rem'
        }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color }}>
                    {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value} bills`}
                </div>
            ))}
        </div>
    );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = () => {
    const [range, setRange] = useState('week');
    const [stats, setStats] = useState({ lowStockCount: 0, totalVendors: 0, pendingPOs: 0, draftPOs: 0 });
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [analytics, setAnalytics] = useState({ revenueData: [], topProducts: [], summary: { revenue: 0, bills: 0 } });
    const [stockLevels, setStockLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

    // fetch core stats once
    useEffect(() => {
        const fetchCore = async () => {
            try {
                const [lowStockRes, vendorsRes, posRes, stockRes] = await Promise.all([
                    productsAPI.getLowStock(),
                    vendorsAPI.getAll(),
                    purchaseOrdersAPI.getAll(),
                    billingAPI.getStockLevels()
                ]);
                const allPOs = posRes.data.data || [];
                setStats({
                    lowStockCount: lowStockRes.data.count || 0,
                    totalVendors: vendorsRes.data.count || 0,
                    pendingPOs: allPOs.filter(p => p.status === 'SENT').length,
                    draftPOs: allPOs.filter(p => p.status === 'DRAFT').length,
                });
                setLowStockProducts(lowStockRes.data.data || []);
                setStockLevels(stockRes.data.data || []);
            } catch (e) {
                console.error('Dashboard core fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchCore();
    }, []);

    // fetch analytics on range change
    const fetchAnalytics = useCallback(async (r) => {
        setAnalyticsLoading(true);
        try {
            const res = await billingAPI.getAnalytics(r);
            setAnalytics(res.data.data);
        } catch (e) {
            console.error('Analytics fetch error:', e);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAnalytics(range); }, [range, fetchAnalytics]);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container"><div className="spinner" /></div>
            </div>
        );
    }

    const chartData = analytics.revenueData.map(d => ({ ...d, date: fmtDate(d.date) }));

    return (
        <div className="page-container">

            {/* ── Hero Banner ── */}
            <div style={{
                position: 'relative', borderRadius: '12px', overflow: 'hidden',
                marginBottom: '2rem', height: '200px',
                background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroBanner})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                    <h1 style={{ fontSize: 'calc(1.5rem + 1vw)', fontWeight: 700, margin: '0 0 0.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                        Welcome to Thulir Market
                    </h1>
                    <p style={{ fontSize: '1.125rem', margin: 0, opacity: 0.95, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                        Manage your inventory and purchase orders efficiently
                    </p>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="dashboard-grid">
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)' }}>
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-label">Low Stock Items</div>
                    <div className="stat-value">{stats.lowStockCount}</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)' }}>
                    <div className="stat-icon">👥</div>
                    <div className="stat-label">Total Vendors</div>
                    <div className="stat-value">{stats.totalVendors}</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)' }}>
                    <div className="stat-icon">📦</div>
                    <div className="stat-label">Pending POs</div>
                    <div className="stat-value">{stats.pendingPOs}</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)' }}>
                    <div className="stat-icon">📄</div>
                    <div className="stat-label">Draft POs</div>
                    <div className="stat-value">{stats.draftPOs}</div>
                </div>
            </div>

            {/* ── Date Range Filter + Revenue Summary ── */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>📊 Sales Analytics</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Revenue: <strong style={{ color: 'var(--primary)' }}>{formatCurrency(analytics.summary.revenue)}</strong>
                            &nbsp;·&nbsp; Bills: <strong>{analytics.summary.bills}</strong>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Range selector */}
                        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                            {RANGE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setRange(opt.value)}
                                    style={{
                                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        background: range === opt.value ? 'white' : 'transparent',
                                        color: range === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                                        boxShadow: range === opt.value ? 'var(--shadow-sm)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >{opt.label}</button>
                            ))}
                        </div>
                        {/* Chart type toggle */}
                        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                            {[['bar', '📊'], ['line', '📈']].map(([type, icon]) => (
                                <button
                                    key={type}
                                    onClick={() => setChartType(type)}
                                    style={{
                                        padding: '0.35rem 0.6rem', fontSize: '0.85rem',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        background: chartType === type ? 'white' : 'transparent',
                                        boxShadow: chartType === type ? 'var(--shadow-sm)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >{icon}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Revenue Chart */}
                {analyticsLoading ? (
                    <div className="loading-container"><div className="spinner" /></div>
                ) : chartData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                        <p style={{ margin: 0 }}>No billing data for this period yet.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        {chartType === 'bar' ? (
                            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="revenue" name="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="count" name="bills" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : (
                            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="revenue" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="count" name="bills" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Top Selling Products + Stock Levels (side by side on desktop) ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem'
            }}>
                {/* Top Selling */}
                <div className="card" style={{ margin: 0 }}>
                    <div className="card-header">
                        <h2 className="card-title">🏆 Top Selling Products</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {RANGE_OPTIONS.find(o => o.value === range)?.label}
                        </span>
                    </div>
                    {analyticsLoading ? (
                        <div className="loading-container"><div className="spinner" /></div>
                    ) : analytics.topProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>No sales data yet.</p>
                        </div>
                    ) : (
                        <div>
                            {analytics.topProducts.map((p, i) => (
                                <div key={p.name} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.6rem 0',
                                    borderBottom: i < analytics.topProducts.length - 1 ? '1px solid var(--border-color)' : 'none'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                        background: ['#f59e0b','#9ca3af','#b45309','#10b981','#3b82f6'][i],
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 700, color: 'white'
                                    }}>{i + 1}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {p.totalQty} units sold
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', flexShrink: 0 }}>
                                        {formatCurrency(p.totalRevenue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stock Levels */}
                <div className="card" style={{ margin: 0 }}>
                    <div className="card-header">
                        <h2 className="card-title">📦 Stock Levels</h2>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                            {stockLevels.filter(p => p.currentStock <= p.reorderPoint).length} low
                        </span>
                    </div>
                    {stockLevels.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>No products found.</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {stockLevels.map(p => <StockBar key={p._id} product={p} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Low Stock Alert ── */}
            {stats.lowStockCount > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">⚠️ Low Stock Alerts</h2>
                        <Link to="/purchase-orders" className="btn btn-primary">Generate POs</Link>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>SKU</th><th>Product Name</th><th>Vendor</th>
                                    <th>Current Stock</th><th>Reorder Point</th><th>Reorder Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockProducts.slice(0, 5).map(product => (
                                    <tr key={product._id}>
                                        <td>
                                            <code style={{ background: 'var(--gray-100)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                {product.sku}
                                            </code>
                                        </td>
                                        <td className="font-medium">{product.name}</td>
                                        <td>{product.vendor?.name}</td>
                                        <td><span className="badge badge-danger">{product.currentStock}</span></td>
                                        <td>{product.reorderPoint}</td>
                                        <td>{product.reorderQuantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {lowStockProducts.length > 5 && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link to="/inventory" className="btn btn-secondary">View All Low Stock Items</Link>
                        </div>
                    )}
                </div>
            )}

            {/* ── Quick Actions ── */}
            <div className="card">
                <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <Link to="/vendors" className="btn btn-secondary" style={{ padding: '1.5rem', flexDirection: 'column' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <div>Manage Vendors</div>
                    </Link>
                    <Link to="/inventory" className="btn btn-secondary" style={{ padding: '1.5rem', flexDirection: 'column' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                        <div>Manage Inventory</div>
                    </Link>
                    <Link to="/purchase-orders" className="btn btn-secondary" style={{ padding: '1.5rem', flexDirection: 'column' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                        <div>Purchase Orders</div>
                    </Link>
                    <Link to="/billing" className="btn btn-secondary" style={{ padding: '1.5rem', flexDirection: 'column' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
                        <div>New Bill</div>
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
