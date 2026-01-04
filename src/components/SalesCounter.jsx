import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import Modal from './Modal';
import { useToast } from './Toast';

const SalesCounter = ({ setIsDirty }) => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);

    // Customer Selection State
    const [customerName, setCustomerName] = useState('');
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Product Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [qtyInput, setQtyInput] = useState(1);
    const [errorMsg, setErrorMsg] = useState('');

    const addToast = useToast();

    useEffect(() => {
        if (setIsDirty) {
            setIsDirty(cart.length > 0);
        }
    }, [cart, setIsDirty]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setProducts(storage.getProducts());
        setCustomers(storage.getCustomers());
    };

    const handleCustomerChange = (e) => {
        const val = e.target.value;
        setCustomerName(val);
        const exists = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
        setIsNewCustomer(!exists && val.length > 0);
    };

    const addToCart = () => {
        if (!selectedProduct) return;

        if (qtyInput <= 0) {
            setErrorMsg('Số lượng phải lớn hơn 0');
            return;
        }

        if (qtyInput > selectedProduct.quantity) {
            setErrorMsg(`Không đủ hàng! Kho chỉ còn ${selectedProduct.quantity} ${selectedProduct.unit}`);
            return;
        }

        // Check if already in cart
        const existingItemIndex = cart.findIndex(item => item.id === selectedProduct.id);
        let newCart = [...cart];

        if (existingItemIndex >= 0) {
            // Update quantity if total doesn't exceed stock
            const currentQtyInCart = newCart[existingItemIndex].buyQty;
            if (currentQtyInCart + qtyInput > selectedProduct.quantity) {
                setErrorMsg(`Không đủ hàng! Tổng mua vượt quá tồn kho (${selectedProduct.quantity})`);
                return;
            }
            newCart[existingItemIndex].buyQty += qtyInput;
        } else {
            newCart.push({ ...selectedProduct, buyQty: qtyInput });
        }

        setCart(newCart);
        setSelectedProduct(null);
        setQtyInput(1);
        setErrorMsg('');
        setSearchTerm(''); // Reset search to allow quick next pick
        addToast(`Đã thêm ${qtyInput} ${selectedProduct.unit} vào giỏ`, 'success');
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            addToast('Giỏ hàng đang trống!', 'error');
            return;
        }
        if (!customerName.trim()) {
            addToast('Vui lòng nhập tên khách hàng!', 'error');
            return;
        }

        if (window.confirm(`Xác nhận bán cho khách "${customerName}"?`)) {
            // 1. Process Customer
            let finalCustomerName = customerName;
            // You could save ID if existing, but keeping it simple with names for now
            // Logic to save new customer if needed
            const existingCust = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            if (!existingCust) {
                const newCust = { id: Date.now().toString(), name: customerName };
                storage.saveCustomer(newCust);
            }

            // 2. Process Stock Deduction
            cart.forEach(item => {
                const productInStore = products.find(p => p.id === item.id);
                if (productInStore) {
                    productInStore.quantity -= item.buyQty;
                    storage.saveProduct(productInStore);
                }
            });

            // 3. Save Transaction
            const transaction = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                customerName: finalCustomerName,
                items: cart
            };
            storage.addTransaction(transaction);

            // 4. Reset
            setCart([]);
            setCustomerName('');
            loadData(); // Reload products to get fresh stock
            addToast('✅ Đã bán hàng thành công!', 'success');
        }
    };

    // Filter products for picker
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="sales-container flex" style={{ flexDirection: 'column', gap: '20px' }}>
            {/* 1. Customer Section */}
            <div className="card">
                <h2>👤 Khách Hàng</h2>
                <div className="flex" style={{ flexWrap: 'wrap' }}>
                    <input
                        list="customers-list"
                        value={customerName}
                        onChange={handleCustomerChange}
                        placeholder="Nhập tên hoặc chọn khách cũ..."
                        style={{ flex: 1, marginBottom: 0 }}
                    />
                    <datalist id="customers-list">
                        {customers.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                    {isNewCustomer && <span style={{ marginLeft: '10px', color: 'green', alignSelf: 'center' }}>Khách mới</span>}
                </div>
            </div>

            <div className="sales-split-view flex">
                {/* 2. Product Picker (Left/Top) */}
                <div className="card" style={{ flex: 1 }}>
                    <h2>📦 Chọn Sản Phẩm</h2>
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        style={{ marginBottom: '10px' }}
                    />

                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee' }}>
                        {filteredProducts.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { setSelectedProduct(p); setErrorMsg(''); }}
                                style={{
                                    padding: '12px',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: selectedProduct?.id === p.id ? '#e3f2fd' : 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Kho: {p.quantity} {p.unit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Add to Cart Controls (Middle/Modal-like on mobile) */}
                {selectedProduct && (
                    <div className="card" style={{ flex: '0 0 250px', border: '2px solid var(--color-primary)' }}>
                        <h3>Thêm: {selectedProduct.name}</h3>
                        <p>Kho: {selectedProduct.quantity}</p>

                        <label>Số lượng bán:</label>
                        <input
                            type="number"
                            value={qtyInput}
                            onChange={e => setQtyInput(parseInt(e.target.value))}
                            style={{ fontSize: '24px', fontWeight: 'bold' }}
                            autoFocus
                        />

                        {errorMsg && <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</p>}

                        <div className="flex-col">
                            <button className="primary" onClick={addToCart}>Thêm vào Đơn</button>
                            <button className="secondary" onClick={() => setSelectedProduct(null)}>Hủy</button>
                        </div>
                    </div>
                )}

                {/* 4. Cart (Right/Bottom) */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2>🛒 Giỏ Hàng ({cart.length})</h2>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>
                                <div>
                                    <strong>{item.name}</strong>
                                    <div>SL: {item.buyQty} {item.unit}</div>
                                </div>
                                <button
                                    className="danger"
                                    onClick={() => removeFromCart(idx)}
                                    style={{ padding: '4px 12px', minHeight: '40px', fontSize: '16px' }}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}
                        {cart.length === 0 && <p style={{ fontStyle: 'italic', color: '#888' }}>Chưa có gì trong giỏ.</p>}
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '10px' }}>
                        <button className="primary w-full" style={{ backgroundColor: '#598468', fontSize: '24px', marginTop: '10px' }} onClick={handleCheckout}>
                            Hoàn tất
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        /* Responsive Split View */
        @media (min-width: 768px) {
           .sales-split-view {
              flex-direction: row;
              align-items: flex-start;
           }
        }
        @media (max-width: 767px) {
           .sales-split-view {
              flex-direction: column;
           }
        }
      `}</style>
        </div>
    );
};

export default SalesCounter;
