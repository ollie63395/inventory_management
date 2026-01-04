import React from 'react';

const Modal = ({ title, children, isOpen, onClose, actions }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{
                backgroundColor: 'white',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <h2>{title}</h2>
                <div style={{ marginBottom: '24px' }}>
                    {children}
                </div>
                <div className="flex" style={{ justifyContent: 'flex-end' }}>
                    {actions}
                </div>
            </div>
        </div>
    );
};

export default Modal;
