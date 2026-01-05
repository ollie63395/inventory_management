import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import Modal from './Modal';
import { useToast } from './Toast';
import { Plus, PackageOpen, Edit2, Copy, Trash2, Search, ChevronDown } from 'lucide-react';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        unit: 'Cái',
        quantity: '',
        initialQuantity: 0,
        image: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'recent', 'quantity-desc', 'quantity-asc'

    // Delete Modal State
    const [units, setUnits] = useState([]);

    // Modal States
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [isRestockMode, setIsRestockMode] = useState(false);

    // Restock Specific State
    const [restockItem, setRestockItem] = useState(null);
    const [restockQty, setRestockQty] = useState('');

    // Delete Modal State
    const [deleteId, setDeleteId] = useState(null);

    const addToast = useToast();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = () => {
        setProducts(storage.getProducts());
        setUnits(storage.getUnits());
    };

    const resetForm = () => {
        setFormData({ id: '', name: '', unit: '', quantity: '', initialQuantity: 0, image: '' });
        setShowForm(false);
        setIsRestockMode(false);
        setRestockItem(null);
        setRestockQty('');
    };

    const handleSave = (e) => {
        e.preventDefault();

        let newProduct = { ...formData };
        // Ensure quantity is a number efficiently
        if (newProduct.quantity === '') newProduct.quantity = 0;

        if (!newProduct.id) {
            newProduct.id = Date.now().toString();
            newProduct.initialQuantity = newProduct.quantity;
        } else {
            if (!newProduct.initialQuantity) newProduct.initialQuantity = newProduct.quantity;
        }

        storage.saveProduct(newProduct);
        if (newProduct.unit) storage.saveUnit(newProduct.unit);

        loadProducts();
        resetForm();
        addToast(formData.id ? '✅ Đã lưu thay đổi!' : '✅ Đã thêm sản phẩm mới!');
    };

    const handleRestockSave = () => {
        if (!restockItem || !restockQty || restockQty <= 0) return;

        // 1. Update Product Quantity
        const updatedProduct = { ...restockItem, quantity: restockItem.quantity + parseInt(restockQty) };
        storage.saveProduct(updatedProduct);

        // 2. Log Transaction (Import)
        const transaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: 'import',
            items: [{ ...updatedProduct, buyQty: parseInt(restockQty) }] // "buyQty" here represents added qty
        };
        storage.logTransaction(transaction);

        loadProducts();
        resetForm();
        addToast(`✅   Đã nhập thêm ${restockQty} ${updatedProduct.unit} cho "${updatedProduct.name}"`);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteUnit = (unit) => {
        if (window.confirm(`Xóa đơn vị "${unit}" khỏi danh sách gợi ý?`)) {
            storage.removeUnit(unit);
            setUnits(storage.getUnits());
        }
    };

    const handleEdit = (product) => {
        setFormData({ ...product });
        setShowForm(true);
    };

    const handleDuplicate = (product) => {
        setFormData({
            ...product,
            id: '',
            name: `${product.name} (Sao chép)`,
            quantity: product.quantity,
            initialQuantity: product.quantity
        });
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    const handleDeleteConfirm = () => {
        if (deleteId) {
            storage.deleteProduct(deleteId);
            loadProducts();
            setDeleteId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'recent') return b.id - a.id;
        if (sortBy === 'quantity-desc') return b.quantity - a.quantity;
        if (sortBy === 'quantity-asc') return a.quantity - b.quantity;
        return 0;
    });

    return (
        <div>
            {/* Action Bar */}
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: 1, marginRight: '16px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} size={20} />
                    <input
                        type="text"
                        placeholder="Tìm tên sản phẩm trong kho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 0, width: '100%', paddingLeft: '40px' }}
                    />
                </div>

                <div style={{ marginRight: '16px', position: 'relative' }}>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            height: '100%',
                            marginBottom: 0,
                            paddingLeft: '12px',
                            paddingRight: '40px',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="name">Tên (A-Z)</option>
                        <option value="name-desc">Tên (Z-A)</option>
                        <option value="recent">Mới tạo nhất</option>
                        <option value="quantity-desc">Số lượng (Cao - Thấp)</option>
                        <option value="quantity-asc">Số lượng (Thấp - Cao)</option>
                    </select>
                    <ChevronDown
                        size={16}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: '#222'
                        }}
                    />
                </div>

                <button className="primary" onClick={() => setShowSelectionModal(true)} style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={20} /> Thêm Hàng Mới
                </button>
            </div>

            {/* Stats Bar */}
            <div style={{
                backgroundColor: '#12182A',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontWeight: 'bold',
                fontSize: '1.1rem'
            }}>
                Tổng sản phẩm: {products.length}
            </div>

            {/* Product List */}
            <div className="product-list">
                {filteredProducts.map(p => (
                    <div key={p.id} className="card flex" style={{ padding: 0, overflow: 'hidden', alignItems: 'stretch' }}>
                        {/* Full Height Image - Left Side */}
                        {p.image && (
                            <div style={{ width: '140px', flexShrink: 0, borderRight: '1px solid #eee' }}>
                                <img
                                    src={p.image}
                                    alt={p.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        )}

                        {/* Content Section */}
                        <div style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {/* Product Details */}
                            <div style={{ flex: 1, paddingRight: '16px' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '16px', color: '#111', lineHeight: '1.2' }}>
                                    {p.name}
                                </h3>
                                <p style={{ color: '#666', fontSize: '18px', marginBottom: '8px' }}>
                                    Đơn vị: <strong>{p.unit}</strong>
                                </p>
                                <p style={{ color: '#598468', fontSize: '20px', marginTop: '12px' }}>
                                    Số lượng: <strong>{p.quantity}</strong>
                                </p>
                            </div>

                            {/* Right Actions */}
                            <div className="flex-col" style={{ gap: '12px' }}>
                                <button
                                    className="btn-edit"
                                    style={{ minWidth: '140px' }}
                                    onClick={() => handleEdit(p)}
                                >
                                    <Edit2 size={18} /> Sửa
                                </button>
                                <button
                                    className="btn-copy"
                                    style={{ minWidth: '140px' }}
                                    onClick={() => handleDuplicate(p)}
                                >
                                    <Copy size={18} /> Sao Chép
                                </button>
                                <button
                                    className="btn-delete"
                                    style={{ minWidth: '140px' }}
                                    onClick={() => setDeleteId(p.id)}
                                >
                                    <Trash2 size={18} /> Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <div className="empty-state">
                    <PackageOpen size={64} color="#9ca3af" style={{ marginBottom: '16px' }} strokeWidth={1.5} />
                    <h2>Chưa có sản phẩm nào trong kho</h2>
                    <p>Hãy thêm sản phẩm đầu tiên để bắt đầu quản lý kho hàng của bạn</p>
                    <button className="primary" onClick={() => setShowSelectionModal(true)} style={{ backgroundColor: '#2e7d32' }}>
                        <Plus size={20} /> Thêm Sản Phẩm Đầu Tiên
                    </button>
                </div>
            )}

            {/* Show message if filtered results are empty but products exist */}
            {products.length > 0 && filteredProducts.length === 0 && (
                <div className="text-center" style={{ padding: '40px', color: '#666' }}>
                    <p>Không tìm thấy sản phẩm nào khớp với "{searchTerm}".</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showForm}
                title={formData.id ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                onClose={resetForm}
                actions={
                    <>
                        <button className="secondary" onClick={resetForm}>Hủy</button>
                        <button className="primary" onClick={handleSave}>Lưu Lại</button>
                    </>
                }
            >
                <form id="product-form">
                    <label>Hình ảnh sản phẩm (Tùy chọn):</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ marginBottom: '16px' }}
                    />
                    {formData.image && (
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '10px' }}>
                            <img src={formData.image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginLeft: '12px', marginBottom: '8px' }} />
                            <button type="button" onClick={() => setFormData({ ...formData, image: '' })} className="small destructive" style={{ marginLeft: '10px' }}>Xóa ảnh</button>
                        </div>
                    )}

                    <label>Tên sản phẩm:</label>
                    <input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ví dụ: Đinh 5mm"
                    />

                    <label>Đơn vị tính:</label>
                    <input
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="Nhập hoặc chọn bên dưới..."
                        style={{ marginBottom: '8px' }}
                    />

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '16px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        padding: '8px'
                    }}>
                        {units.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>Chưa có đơn vị nào.</p>}
                        {units.map(u => (
                            <div
                                key={u}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    backgroundColor: formData.unit === u ? '#eef2ff' : 'white',
                                    borderRadius: '6px',
                                    border: formData.unit === u ? '1px solid #12182A' : '1px solid transparent',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setFormData({ ...formData, unit: u })}
                            >
                                <span style={{ fontWeight: formData.unit === u ? 'bold' : 'normal' }}>{u}</span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteUnit(u); }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '4px',
                                        color: '#999',
                                        minHeight: 'auto',
                                        cursor: 'pointer',
                                    }}
                                    className="hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <label>{formData.id ? 'Số lượng hiện tại:' : 'Số lượng nhập kho:'}</label>
                    <input
                        type="number"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    />
                </form>
            </Modal>

            {/* Selection Modal (New or Restock) */}
            <Modal
                isOpen={showSelectionModal}
                title="Chọn thao tác"
                onClose={() => setShowSelectionModal(false)}
                actions={<button className="secondary" onClick={() => setShowSelectionModal(false)}>Đóng</button>}
            >
                <div className="flex-col gap-4">
                    <button
                        className="btn-large"
                        style={{
                            padding: '24px',
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            border: '2px solid #e0e0e0',
                            backgroundColor: 'white',
                            color: '#333'
                        }}
                        onClick={() => {
                            setShowSelectionModal(false);
                            setIsRestockMode(true);
                        }}
                    >
                        <PackageOpen size={32} /> Nhập hàng đang có
                    </button>
                    <button
                        className="btn-large primary"
                        style={{
                            padding: '24px',
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}
                        onClick={() => {
                            setShowSelectionModal(false);
                            setFormData({ id: '', name: '', unit: '', quantity: '', initialQuantity: 0, image: '' });
                            setShowForm(true);
                        }}
                    >
                        <Plus size={32} /> Thêm mặt hàng mới
                    </button>
                </div>
            </Modal>

            {/* Restock Modal */}
            <Modal
                isOpen={isRestockMode}
                title="📦 Nhập Hàng"
                onClose={() => { setIsRestockMode(false); setRestockItem(null); }}
                actions={
                    <>
                        <button className="secondary" onClick={() => { setIsRestockMode(false); setRestockItem(null); }}>Hủy</button>
                        <button className="primary" onClick={handleRestockSave} disabled={!restockItem}>Xác Nhận Nhập</button>
                    </>
                }
            >
                {!restockItem ? (
                    <div>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} size={20} />
                            <input
                                placeholder="Tìm hàng để nhập..."
                                autoFocus
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    style={{
                                        padding: '12px',
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => { setRestockItem(p); setRestockQty(''); }}
                                    className="hover:bg-gray-50"
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Hiện có: {p.quantity} {p.unit}</div>
                                    </div>
                                    <Plus size={20} color="green" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
                            <h3 style={{ margin: 0 }}>{restockItem.name}</h3>
                            <p style={{ margin: '8px 0 0 0', color: '#666' }}>Tồn kho hiện tại: <strong>{restockItem.quantity} {restockItem.unit}</strong></p>
                        </div>
                        <label style={{ fontSize: '24px', fontWeight: 'bold', paddingLeft: '16px' }}>Số lượng nhập thêm:</label>
                        <input
                            type="number"
                            value={restockQty}
                            onChange={e => setRestockQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                            placeholder="Nhập số lượng..."
                            autoFocus
                            style={{ fontSize: '20px', fontWeight: 'bold', paddingLeft: '18px', marginTop: '10px' }}
                        />
                        <button className="text-button" onClick={() => setRestockItem(null)} style={{ marginTop: '10px', color: '#666' }}>
                            ⬅ <text style={{ marginLeft: '8px' }}>Chọn sản phẩm khác</text>
                        </button>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteId}
                title="⚠️ Cảnh báo xóa!"
                onClose={() => setDeleteId(null)}
                actions={
                    <>
                        <button className="secondary" onClick={() => setDeleteId(null)}>Hủy Bỏ</button>
                        <button className="danger" onClick={handleDeleteConfirm} autoFocus>Xác Nhận Xóa</button>
                    </>
                }
            >
                <p style={{ fontSize: '22px', fontWeight: 'bold' }}>
                    Bạn có chắc chắn muốn xóa sản phẩm này không?
                </p>
                <p>Hành động này không thể hoàn tác.</p>
            </Modal>
        </div>
    );
};

export default ProductManager;
