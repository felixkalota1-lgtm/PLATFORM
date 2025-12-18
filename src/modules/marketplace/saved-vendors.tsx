import React, { useState } from 'react';
import { useSavedVendorsStore } from './saved-vendors-store';
import { SavedVendor } from './saved-vendors-store';

export const SavedVendorsComponent: React.FC = () => {
  const [activeView, setActiveView] = useState<'list' | 'add'>('list');
  const [newVendor, setNewVendor] = useState<Partial<SavedVendor>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [contactingVendor, setContactingVendor] = useState<string | null>(null);

  const { vendors, addVendor, removeVendor } = useSavedVendorsStore();

  // Filter vendors by search term
  const filteredVendors = vendors.filter(v =>
    v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVendor = () => {
    if (newVendor.vendorName && newVendor.vendorId) {
      const vendor: SavedVendor = {
        id: `vendor-${Date.now()}`,
        companyId: 'current-company',
        vendorId: newVendor.vendorId || '',
        vendorName: newVendor.vendorName || '',
        contactEmail: newVendor.contactEmail || '',
        phoneNumber: newVendor.phoneNumber || '',
        address: newVendor.address || '',
        category: newVendor.category || 'general',
        totalTransactions: 0,
        rating: 5,
        savedDate: new Date(),
      };
      addVendor(vendor);
      setNewVendor({});
      setActiveView('list');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Vendors</h2>
        <p className="text-gray-600">Quick access to your trusted business partners</p>
      </div>

      <div className="p-6">
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  activeView === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                My Vendors ({vendors.length})
              </button>
              <button
                onClick={() => setActiveView('add')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  activeView === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                + Add Vendor
              </button>
            </div>
          </div>
          {activeView === 'list' && vendors.length > 0 && (
            <input
              type="text"
              placeholder="🔍 Search vendors by name, email, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {activeView === 'add' && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg mb-4">Add New Vendor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={newVendor.vendorName || ''}
                  onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  value={newVendor.contactEmail || ''}
                  onChange={(e) => setNewVendor({ ...newVendor, contactEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newVendor.phoneNumber || ''}
                  onChange={(e) => setNewVendor({ ...newVendor, phoneNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newVendor.category || ''}
                  onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Category</option>
                  <option value="supplier">Supplier</option>
                  <option value="distributor">Distributor</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="logistics">Logistics</option>
                  <option value="service">Service Provider</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={newVendor.address || ''}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Business address"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddVendor}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Save Vendor
              </button>
              <button
                onClick={() => {
                  setNewVendor({});
                  setActiveView('list');
                }}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeView === 'list' && (
          <div>
            {filteredVendors.length === 0 && vendors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">No saved vendors yet</p>
                <button
                  onClick={() => setActiveView('add')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Your First Vendor
                </button>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">📭 No vendors match your search</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{vendor.vendorName}</h3>
                        <p className="text-xs text-gray-500 uppercase">{vendor.category}</p>
                      </div>
                      <span className="text-yellow-500 font-bold">{vendor.rating}⭐</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>📧 {vendor.contactEmail}</p>
                      <p>📞 {vendor.phoneNumber}</p>
                      <p className="text-xs">Transactions: {vendor.totalTransactions}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setContactingVendor(vendor.vendorId);
                          setTimeout(() => {
                            window.location.href = `mailto:${vendor.contactEmail}`;
                            setContactingVendor(null);
                          }, 300);
                        }}
                        disabled={contactingVendor === vendor.vendorId}
                        className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {contactingVendor === vendor.vendorId ? 'Sending...' : '📧 Contact'}
                      </button>
                      <button
                        onClick={() => removeVendor(vendor.vendorId)}
                        className="flex-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded font-semibold text-sm transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedVendorsComponent;
