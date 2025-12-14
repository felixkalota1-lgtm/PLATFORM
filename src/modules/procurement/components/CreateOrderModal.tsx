import React, { useState } from 'react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  tenantId: _tenantId,
  onSuccess: _onSuccess,
}) => {
  const [orderType, setOrderType] = useState<'internal' | 'external'>('external');
  const [toCompany, setToCompany] = useState('');
  const [_items, _setItems] = useState<any[]>([]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Order</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Order Type Selection */}
          <div className="form-section">
            <label>Order Type</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  value="internal"
                  checked={orderType === 'internal'}
                  onChange={e => setOrderType(e.target.value as any)}
                />
                <span>🏢 Internal (Warehouse/Branch)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="external"
                  checked={orderType === 'external'}
                  onChange={e => setOrderType(e.target.value as any)}
                />
                <span>🌍 B2B (Other Company)</span>
              </label>
            </div>
          </div>

          {/* Recipient Selection */}
          <div className="form-section">
            <label>
              {orderType === 'internal' ? 'Send to Branch/Warehouse' : 'Send to Company'}
              <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder={orderType === 'internal' ? 'Select warehouse or branch' : 'Enter vendor company'}
              value={toCompany}
              onChange={e => setToCompany(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Items Section */}
          <div className="form-section">
            <label>Order Items</label>
            <div className="items-input">
              <p>Item management interface coming soon</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Create Order</button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;
