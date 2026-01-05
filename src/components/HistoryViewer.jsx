import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import Modal from './Modal';
import { Search } from 'lucide-react';

const HistoryViewer = () => {
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [viewTransaction, setViewTransaction] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setProducts(storage.getProducts());
        setTransactions(storage.getTransactions());
    };

    // Filter products based on search
    const filteredProducts = products.filter(p =>
        searchTerm && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get history related to specific product
    const getProductHistory = (productId) => {
        // Sort by date new to old
        return transactions
            .filter(t => t.items.some(item => item.id === productId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const handleProductSelect = (product) => {
        // Refresh data to make sure we have latest stock info
        loadData();
        setSelectedProduct(product);
        setSearchTerm('');
    };

    const calculateStats = (product, history) => {
        const stats = history.reduce((acc, t) => {
            const item = t.items.find(i => i.id === product.id);
            if (!item) return acc;

            if (t.type === 'import') {
                acc.totalImported += item.buyQty;
            } else {
                acc.totalSold += item.buyQty;
            }
            return acc;
        }, { totalSold: 0, totalImported: 0 });
        return stats;
    };

    const formatDate = (dateString) => {
        const dateObj = new Date(dateString);
        const date = dateObj.toLocaleDateString('vi-VN');
        const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
            <span>
                <strong>Ngày:</strong> {date} • <strong>Giờ:</strong> {time}
            </span>
        );
    };

    return (
        <div>
            <h1>🔍 Tìm Kiếm & Lịch Sử</h1>

            {/* Search Bar */}
            {!selectedProduct && (
                <>
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Nhập tên sản phẩm để xem thông tin..."
                            style={{ fontSize: '20px', padding: '16px 16px 16px 16px', width: '100%' }}
                            autoFocus
                        />
                    </div>

                    <div className="list-group">
                        {searchTerm && filteredProducts.map(p => (
                            <div
                                key={p.id}
                                className="card"
                                onClick={() => handleProductSelect(p)}
                                style={{ cursor: 'pointer', border: '1px solid #ddd' }}
                            >
                                <h3>{p.name}</h3>
                                <p>Kho hiện tại: <strong>{p.quantity}</strong> {p.unit}</p>
                            </div>
                        ))}
                        {searchTerm && filteredProducts.length === 0 && <p className="text-center">Không tìm thấy sản phẩm nào.</p>}
                    </div>

                    {!searchTerm && (
                        <div className="recent-transactions" style={{ marginTop: '32px' }}>
                            {transactions.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>Chưa có giao dịch nào.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {transactions.slice(0, 50).map(t => (
                                        <div
                                            key={t.id}
                                            className="card"
                                            onClick={() => setViewTransaction(t)}
                                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '1.2rem', color: '#111' }}>{formatDate(t.date)}</div>
                                                <div>
                                                    {t.type === 'import' ? (
                                                        <span style={{ color: 'green', fontWeight: 'bold' }}>📦 Nhập hàng</span>
                                                    ) : (
                                                        <span><strong>Khách:</strong> {t.customerName}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: t.type === 'import' ? 'green' : 'var(--color-primary)' }}>
                                                    {t.type === 'import' ? '+ ' : ''}{t.items.length} món
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Product Detail View */}
            {selectedProduct && (() => {
                const history = getProductHistory(selectedProduct.id);
                const { totalSold, totalImported } = calculateStats(selectedProduct, history);

                return (
                    <div className="detail-view">
                        <button className="secondary" onClick={() => setSelectedProduct(null)} style={{ marginBottom: '16px' }}>
                            ⬅ <text style={{ marginLeft: '8px' }}>Quay lại tìm kiếm</text>
                        </button>

                        <div className="card" style={{ backgroundColor: '#f3f4f6', border: '2px solid var(--color-primary)', marginBottom: '36px', marginTop: '16px' }}>
                            <h2 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>{selectedProduct.name}</h2>

                            <div className="flex" style={{ flexWrap: 'wrap', gap: '32px' }}>
                                <div>
                                    <p className="text-primary" style={{ fontSize: '0.9rem' }}>Số lượng ban đầu</p>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                        {selectedProduct.initialQuantity || selectedProduct.quantity + totalSold} {selectedProduct.unit}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-primary" style={{ fontSize: '0.9rem' }}>Số lượng hiện tại</p>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'green' }}>
                                        {selectedProduct.quantity} {selectedProduct.unit}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-primary" style={{ fontSize: '0.9rem' }}>Đã bán</p>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                        {totalSold} {selectedProduct.unit}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-primary" style={{ fontSize: '0.9rem' }}>Đã nhập thêm</p>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'green' }}>
                                        {totalImported} {selectedProduct.unit}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h3>Lịch sử giao dịch ({history.length})</h3>
                        <div className="history-list">
                            {history.map(t => {
                                const item = t.items.find(i => i.id === selectedProduct.id);
                                return (
                                    <div key={t.id} className="card flex justify-between items-center" onClick={() => setViewTransaction(t)} style={{ cursor: 'pointer' }}>
                                        <div>
                                            <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{formatDate(t.date)}</div>
                                            <div style={{ color: '#555' }}>
                                                {t.type === 'import' ? '📦 Nhập kho' : `Khách: ${t.customerName}`}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', color: t.type === 'import' ? 'green' : 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            {t.type === 'import' ? '+ ' : '- '}{item.buyQty} {selectedProduct.unit}
                                        </div>
                                    </div>
                                );
                            })}
                            {history.length === 0 && <p className="text-center" style={{ fontStyle: 'italic', color: '#666' }}>Chưa có giao dịch bán hàng nào.</p>}
                        </div>
                    </div>
                );
            })()}

            {/* Transaction Detail Modal */}
            <Modal
                isOpen={!!viewTransaction}
                title={viewTransaction?.type === 'import' ? "Chi Tiết Nhập Kho" : "Chi Tiết Đơn Hàng"}
                onClose={() => setViewTransaction(null)}
                actions={<button className="primary" onClick={() => setViewTransaction(null)}>Đóng</button>}
            >
                {viewTransaction && (
                    <div>
                        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                            <p style={{ display: 'flex', alignItems: 'center' }}>
                                {formatDate(viewTransaction.date)}
                            </p>
                            {viewTransaction.type !== 'import' && (
                                <p style={{ marginTop: '8px' }}><strong>Khách hàng:</strong> {viewTransaction.customerName}</p>
                            )}
                        </div>

                        <h4 style={{ marginBottom: '12px' }}>{viewTransaction.type === 'import' ? 'Sản phẩm nhập:' : 'Danh sách sản phẩm:'}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {viewTransaction.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between" style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <span>{item.name}</span>
                                    <strong>x {item.buyQty} {item.unit}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default HistoryViewer;
