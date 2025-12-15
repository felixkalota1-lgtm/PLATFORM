import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Star, Plus, Search, Heart, MessageSquare, AlertCircle, TrendingUp } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  totalOrders: number;
  isSaved: boolean;
  categories: string[];
  responseTime: string;
  reliabilityScore: number;
  lastOrder?: Date;
}

const VendorManagementPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'saved' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'orders' | 'name'>('rating');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock vendor data - in production this would come from the backend
      const mockVendors: Vendor[] = [
        {
          id: 'vendor-1',
          name: 'GlobalTech Supplies',
          email: 'sales@globaltech.com',
          phone: '+1-555-0101',
          address: '123 Industrial Way',
          city: 'New York',
          country: 'USA',
          rating: 4.8,
          totalOrders: 156,
          isSaved: true,
          categories: ['Electronics', 'Components'],
          responseTime: '2-4 hours',
          reliabilityScore: 98,
          lastOrder: new Date(),
        },
        {
          id: 'vendor-2',
          name: 'Prime Manufacturing Ltd',
          email: 'info@primemfg.com',
          phone: '+44-20-7946-0958',
          address: '45 Commerce Street',
          city: 'London',
          country: 'UK',
          rating: 4.6,
          totalOrders: 89,
          isSaved: true,
          categories: ['Manufacturing', 'Machinery'],
          responseTime: '4-6 hours',
          reliabilityScore: 95,
          lastOrder: new Date(Date.now() - 86400000),
        },
        {
          id: 'vendor-3',
          name: 'EcoSupply Solutions',
          email: 'contact@ecosupply.com',
          phone: '+61-2-8123-4567',
          address: '789 Green Boulevard',
          city: 'Sydney',
          country: 'Australia',
          rating: 4.7,
          totalOrders: 203,
          isSaved: false,
          categories: ['Eco-Products', 'Packaging'],
          responseTime: '1-2 hours',
          reliabilityScore: 99,
          lastOrder: new Date(Date.now() - 604800000),
        },
        {
          id: 'vendor-4',
          name: 'QuickShip Distributors',
          email: 'orders@quickship.com',
          phone: '+1-555-0102',
          address: '567 Distribution Center',
          city: 'Los Angeles',
          country: 'USA',
          rating: 4.4,
          totalOrders: 67,
          isSaved: false,
          categories: ['Distribution', 'Logistics'],
          responseTime: '3-5 hours',
          reliabilityScore: 92,
          lastOrder: new Date(Date.now() - 1209600000),
        },
        {
          id: 'vendor-5',
          name: 'Asian Trade Partners',
          email: 'biz@asiantradeparts.com',
          phone: '+86-21-3310-5555',
          address: '234 Import Avenue',
          city: 'Shanghai',
          country: 'China',
          rating: 4.5,
          totalOrders: 124,
          isSaved: true,
          categories: ['Textiles', 'Wholesale'],
          responseTime: '6-8 hours',
          reliabilityScore: 94,
          lastOrder: new Date(Date.now() - 2592000000),
        },
      ];

      setVendors(mockVendors);
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedVendors = React.useMemo(() => {
    let result = vendors;

    // Filter
    if (filterType === 'saved') {
      result = result.filter(v => v.isSaved);
    } else if (filterType === 'recent') {
      result = result.filter(v => v.lastOrder && (Date.now() - v.lastOrder.getTime()) < 2592000000);
    }

    // Search
    if (searchTerm) {
      result = result.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [vendors, filterType, searchTerm, sortBy]);

  const toggleSaveVendor = (vendorId: string) => {
    setVendors(vendors.map(v =>
      v.id === vendorId ? { ...v, isSaved: !v.isSaved } : v
    ));
  };

  const stats = [
    {
      label: 'Total Vendors',
      value: vendors.length,
      icon: Building2,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Saved Vendors',
      value: vendors.filter(v => v.isSaved).length,
      icon: Heart,
      color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
    {
      label: 'Avg Rating',
      value: (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1),
      icon: Star,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: 'Total Orders',
      value: vendors.reduce((sum, v) => sum + v.totalOrders, 0),
      icon: TrendingUp,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage suppliers, track ratings, and collaborate with vendors</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
              <Plus size={20} /> Add Vendor
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className={`${stat.color} border ${stat.border} rounded-lg p-4 transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-75">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon size={28} className="opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search vendors by name, city, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Vendors</option>
              <option value="saved">Saved Vendors</option>
              <option value="recent">Recent Orders</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="orders">Sort by Orders</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-900 dark:text-red-200 font-medium">Error Loading Vendors</p>
              <button
                onClick={loadVendors}
                className="mt-2 text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading vendors...</p>
            </div>
          </div>
        ) : filteredAndSortedVendors.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{vendor.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{vendor.city}, {vendor.country}</p>
                    </div>
                    <button
                      onClick={() => toggleSaveVendor(vendor.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        vendor.isSaved
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Heart size={20} fill={vendor.isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.round(vendor.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{vendor.rating}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">({vendor.totalOrders} orders)</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Mail size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Phone size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{vendor.address}</span>
                  </div>

                  {/* Categories */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">CATEGORIES</p>
                    <div className="flex flex-wrap gap-2">
                      {vendor.categories.map((cat, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Response Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{vendor.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Reliability</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{vendor.reliabilityScore}%</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Contact
                  </button>
                  <button className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Vendors Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorManagementPage;
