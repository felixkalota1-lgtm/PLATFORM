import React from 'react';
import { Order } from '../../../services/procurementService';

interface OrderTrackingProps {
  orders: Order[];
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orders }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#6b7280',
      sent: '#3b82f6',
      received: '#10b981',
      accepted: '#10b981',
      'in-progress': '#f59e0b',
      completed: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="order-tracking">
      <div className="tracking-header">
        <h2>Order Tracking</h2>
        <p>Track the status of all your orders in real-time</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders to track yet</p>
        </div>
      ) : (
        <div className="tracking-list">
          {orders.map(order => (
            <div key={order.id} className="tracking-item">
              <div className="tracking-left">
                <h3>{order.orderNumber}</h3>
                <p>{order.fromCompanyName} → {order.toCompanyName}</p>
              </div>

              <div className="tracking-timeline">
                {['sent', 'received', 'in-progress', 'completed'].map((step, idx) => {
                  const isCompleted = ['sent', 'received', 'in-progress', 'completed'].indexOf(order.status) >= idx;
                  return (
                    <div key={step} className={`timeline-step ${isCompleted ? 'completed' : ''}`}>
                      <div className="step-dot" style={{ backgroundColor: isCompleted ? getStatusColor(step) : '#d1d5db' }} />
                      <span className="step-label">{step}</span>
                    </div>
                  );
                })}
              </div>

              <div className="tracking-status">
                <span className="status-label">Current Status:</span>
                <span className="status-value">{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
