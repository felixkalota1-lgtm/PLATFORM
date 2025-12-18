import React from 'react';
import { Order } from '../../../services/procurementService';
import './ProcurementDashboard.css';

interface ProcurementDashboardProps {
  sentOrdersCount: number;
  receivedOrdersCount: number;
  unreadCount: number;
  recentOrders: Order[];
  onViewOrders: () => void;
}

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({
  sentOrdersCount,
  receivedOrdersCount,
  unreadCount,
  recentOrders,
  onViewOrders,
}) => {
  const totalValue = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="procurement-dashboard">
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon sent">📤</div>
            <div className="metric-text">
              <h3>Sent Orders</h3>
              <p className="metric-value">{sentOrdersCount}</p>
              <span className="metric-label">Active outgoing orders</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon received">📥</div>
            <div className="metric-text">
              <h3>Received Orders</h3>
              <p className="metric-value">{receivedOrdersCount}</p>
              <span className="metric-label">Incoming orders from vendors</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon unread">💬</div>
            <div className="metric-text">
              <h3>Unread Messages</h3>
              <p className="metric-value">{unreadCount}</p>
              <span className="metric-label">Pending responses</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon total">$</div>
            <div className="metric-text">
              <h3>Total Order Value</h3>
              <p className="metric-value">${totalValue.toFixed(2)}</p>
              <span className="metric-label">Across all orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn primary">
          <span className="icon">✏️</span>
          Create New Order
        </button>
        <button className="action-btn secondary">
          <span className="icon">📋</span>
          Create RFQ
        </button>
        <button className="action-btn secondary" onClick={onViewOrders}>
          <span className="icon">[Order]</span>
          View All Orders
        </button>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button className="view-all-btn" onClick={onViewOrders}>
            View All →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <p>📭 No orders yet</p>
            <span>Get started by creating your first order</span>
          </div>
        ) : (
          <div className="orders-list">
            {recentOrders.slice(0, 5).map(order => (
              <div key={order.id} className="order-item">
                <div className="order-header">
                  <div className="order-info">
                    <h3>{order.orderNumber}</h3>
                    <p className="order-type">
                      {order.orderType === 'internal' ? '🏢 Internal' : '🌍 B2B'}
                      {' • '}
                      {order.orderType === 'internal'
                        ? `${order.fromCompanyName} ↔ Warehouse`
                        : `${order.fromCompanyName} → ${order.toCompanyName}`}
                    </p>
                  </div>
                  <div className={`status-badge ${order.status}`}>
                    {order.status.replace('-', ' ').toUpperCase()}
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail">
                    <span className="label">Items:</span>
                    <span className="value">{order.items.length}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Amount:</span>
                    <span className="value">${order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Date:</span>
                    <span className="value">
                      {new Date(order.createdAt.toMillis()).toLocaleDateString()}
                    </span>
                  </div>
                  {order.hasUnreadMessages && (
                    <div className="detail unread">
                      <span className="value">💬 {order.messageCount} messages</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="tips-section">
        <h3>💡 Tips for Efficient Procurement</h3>
        <ul className="tips-list">
          <li>
            <strong>Internal Orders:</strong> Use for requesting goods from your warehouse to branches
          </li>
          <li>
            <strong>B2B Orders:</strong> Send purchase orders to vendors from other companies
          </li>
          <li>
            <strong>Real-time Communication:</strong> Message vendors directly within each order
          </li>
          <li>
            <strong>Track Everything:</strong> Monitor order status from creation to completion
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
