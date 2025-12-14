import React, { useState, useEffect } from 'react';
import procurementService, { Vendor } from '../../../services/procurementService';

interface VendorManagementProps {
  tenantId: string;
}

const VendorManagement: React.FC<VendorManagementProps> = ({ tenantId }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [_filterCategory, _setFilterCategory] = useState('all');

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const vendorsList = await procurementService.getVendorsByCompany(tenantId);
        setVendors(vendorsList);
      } catch (error) {
        console.error('Error loading vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, [tenantId]);

  return (
    <div className="vendor-management">
      <div className="vendor-header">
        <div>
          <h2>Vendor Management</h2>
          <p>Manage your supplier relationships and preferred vendors</p>
        </div>
        <button className="btn-add-vendor">➕ Add Vendor</button>
      </div>

      {loading ? (
        <div className="loading">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <p>No vendors added yet</p>
          <span>Add your first vendor to start sending B2B orders</span>
        </div>
      ) : (
        <div className="vendors-grid">
          {vendors.map(vendor => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-header-card">
                <h3>{vendor.companyName}</h3>
                {vendor.isFavorite && <span className="favorite-star">⭐</span>}
              </div>
              
              <div className="vendor-info">
                <p><strong>Contact:</strong> {vendor.contactPerson}</p>
                <p><strong>Email:</strong> {vendor.email}</p>
                <p><strong>Phone:</strong> {vendor.phone}</p>
              </div>

              <div className="vendor-stats">
                <div className="stat">
                  <span className="label">Rating</span>
                  <span className="value">⭐ {vendor.rating}/5</span>
                </div>
                <div className="stat">
                  <span className="label">Orders</span>
                  <span className="value">{vendor.totalOrders}</span>
                </div>
                <div className="stat">
                  <span className="label">Completed</span>
                  <span className="value">{vendor.completedOrders}</span>
                </div>
              </div>

              <div className="vendor-actions">
                <button className="btn-secondary">View Orders</button>
                <button className="btn-primary">Send Order</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
