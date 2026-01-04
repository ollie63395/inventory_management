import React, { useState, useEffect } from 'react';
import ProductManager from './components/ProductManager';
import SalesCounter from './components/SalesCounter';
import HistoryViewer from './components/HistoryViewer';
import { ToastProvider } from './components/Toast';
import { seedData } from './utils/storage';
import { Package, ShoppingCart, Search, Plus } from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    seedData();
  }, []);

  /* Navigation Guard State */
  const [isSalesDirty, setIsSalesDirty] = useState(false);

  const handleTabChange = (tab) => {
    if (activeTab === 'sales' && isSalesDirty && tab !== 'sales') {
      if (!window.confirm("Bạn đang có đơn hàng chưa hoàn tất. Bạn có chắc muốn rời khỏi trang này?")) {
        return;
      }
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductManager />;
      case 'sales':
        return <SalesCounter setIsDirty={setIsSalesDirty} />;
      case 'history':
        return <HistoryViewer />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="app-container">
        {/* Header Section */}
        <header className="app-header">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <h1>Cửa hàng Thắng Hạnh</h1>
            <p>Quản lý kho phụ liệu may mặc</p>
          </div>
        </header>

        {/* Navigation Section */}
        <nav className="nav-container">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '12px', width: '100%' }}>
            <button
              className={`nav-pill ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => handleTabChange('products')}
            >
              <Package size={20} />
              Danh Sách Hàng
            </button>

            <button
              className={`nav-pill ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => handleTabChange('sales')}
            >
              <ShoppingCart size={20} />
              Bán Hàng
            </button>

            <button
              className={`nav-pill ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabChange('history')}
            >
              <Search size={20} />
              Tìm Kiếm & Lịch Sử
            </button>
          </div>
        </nav>

        <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
          {renderContent()}
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
