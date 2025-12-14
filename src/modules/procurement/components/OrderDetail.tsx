import React, { useState } from 'react';
import { Order } from '../../../services/procurementService';

interface OrderDetailProps {
  order: Order;
  tenantId: string;
  onBack: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order, tenantId: _tenantId, onBack }) => {
  const [message, setMessage] = useState('');
  const [_messages, _setMessages] = useState<any[]>([]);

  return (
    <div className="order-detail">
      <button onClick={onBack} className="btn-back">
        ← Back to Orders
      </button>

      <div className="detail-container">
        <div className="detail-main">
          <h2>{order.orderNumber}</h2>
          
          {/* Order Info */}
          <div className="info-section">
            <h3>Order Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Status</label>
                <span>{order.status}</span>
              </div>
              <div className="info-item">
                <label>Type</label>
                <span>{order.orderType === 'internal' ? '🏢 Internal' : '🌍 B2B'}</span>
              </div>
              <div className="info-item">
                <label>From</label>
                <span>{order.fromCompanyName}</span>
              </div>
              <div className="info-item">
                <label>To</label>
                <span>{order.toCompanyName}</span>
              </div>
              <div className="info-item">
                <label>Created</label>
                <span>{new Date(order.createdAt.toMillis()).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <label>Total Amount</label>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="info-section">
            <h3>Order Items ({order.items.length})</h3>
            <div className="items-table">
              <div className="table-header">
                <div>Product</div>
                <div>Qty</div>
                <div>Unit Price</div>
                <div>Total</div>
              </div>
              {order.items.map(item => (
                <div key={item.id} className="table-row">
                  <div>
                    <strong>{item.productName}</strong>
                    <p>{item.description}</p>
                  </div>
                  <div>{item.quantity} {item.unit}</div>
                  <div>${item.unitPrice.toFixed(2)}</div>
                  <div>${item.totalPrice.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Quick Actions */}
          <div className="action-section">
            <h3>Actions</h3>
            <button className="action-btn primary">Accept Order</button>
            <button className="action-btn secondary">Reject Order</button>
            <button className="action-btn secondary">Mark Complete</button>
          </div>

          {/* Messaging */}
          <div className="messaging-section">
            <h3>Messages ({order.messageCount})</h3>
            <div className="messages-list">
              {_messages.length === 0 && <p>No messages yet</p>}
            </div>
            <div className="message-input">
              <textarea
                placeholder="Type a message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button className="btn-send">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
