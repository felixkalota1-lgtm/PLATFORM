import { Star, Phone, Mail, MapPin, Shield, Clock, Package } from 'lucide-react';
import { Vendor } from '../types';
import { useMarketplaceStore } from '../store';

interface VendorProfileProps {
  vendor: Vendor;
  onClose: () => void;
}

export default function VendorProfile({ vendor, onClose }: VendorProfileProps) {
  const products = useMarketplaceStore((state) =>
    state.products.filter((p) => p.vendor.id === vendor.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded"
          >
            ✕
          </button>
        </div>

        {/* Vendor Info */}
        <div className="px-6 pb-6">
          {/* Logo & Basic Info */}
          <div className="flex items-start gap-4 -mt-16 mb-6 relative z-10">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-lg border-4 border-white dark:border-gray-900 overflow-hidden">
              {vendor.logo ? (
                <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                  {vendor.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="pt-2 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {vendor.name}
                </h2>
                {vendor.isVerified && (
                  <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {vendor.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({vendor.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {vendor.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <Package size={20} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {products.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Products</p>
            </div>
            <div className="text-center">
              <Clock size={20} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                24hrs
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Response Time</p>
            </div>
            <div className="text-center">
              <Shield size={20} className="mx-auto text-purple-600 dark:text-purple-400 mb-1" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Verified
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Seller</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                <a
                  href={`mailto:${vendor.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {vendor.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                <a
                  href={`tel:${vendor.phone}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {vendor.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-600 dark:text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Location</p>
                <p className="text-gray-900 dark:text-white">{vendor.address}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Contact Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
