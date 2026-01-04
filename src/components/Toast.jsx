import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
            <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 90%;
          max-width: 400px;
        }
        .toast {
          padding: 16px;
          border-radius: 8px;
          color: white;
          font-weight: bold;
          font-size: 1.1rem;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease;
        }
        .toast-success { background-color: var(--color-success); }
        .toast-error { background-color: var(--color-danger); }
        
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
