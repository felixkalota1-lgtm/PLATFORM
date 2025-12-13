/**
 * Duplicate Detection Modal Component
 * 
 * Displays detected duplicates and provides three handling options:
 * 1. Skip Duplicates - Upload only new products
 * 2. Confirm & Upload All - Upload all products including duplicates
 * 3. Cancel - Don't upload anything
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Upload,
} from 'lucide-react';
import { DuplicateDetectionResult, DuplicateMatch } from '../services/duplicateDetectionService';

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  detection: DuplicateDetectionResult;
  onSkipDuplicates: () => void;
  onConfirmAll: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type TabType = 'summary' | 'file-duplicates' | 'inventory-duplicates' | 'new-products';

export const DuplicateDetectionModal: React.FC<DuplicateDetectionModalProps> = ({
  isOpen,
  detection,
  onSkipDuplicates,
  onConfirmAll,
  onCancel,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [expandedDuplicates, setExpandedDuplicates] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedDuplicates);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDuplicates(newExpanded);
  };

  const DuplicateCard = ({
    duplicate,
    index,
    type,
  }: {
    duplicate: DuplicateMatch;
    index: number;
    type: 'file' | 'inventory';
  }) => {
    const isExpanded = expandedDuplicates.has(index);

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Card Header */}
        <button
          onClick={() => toggleExpanded(index)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <div className="flex items-center gap-3 text-left">
            {type === 'file' ? (
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-orange-600 dark:text-orange-400">
                <Copy size={18} />
              </div>
            ) : (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400">
                <AlertTriangle size={18} />
              </div>
            )}

            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {duplicate.sourceProduct}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {type === 'file' ? '🔄 Matches' : '📦 Already in inventory'} -{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {duplicate.matchedProduct}
                </span>
              </p>
            </div>

            {/* Similarity Score Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full whitespace-nowrap ${
                duplicate.similarity >= 90
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : duplicate.similarity >= 80
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              }`}
            >
              <span className="text-sm font-bold">{duplicate.similarity}%</span>
              <span className="text-xs">match</span>
            </div>
          </div>

          {isExpanded ? (
            <ChevronUp className="text-gray-600 dark:text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-600 dark:text-gray-400" size={20} />
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 space-y-3">
            {/* Similarity Breakdown */}
            {duplicate.details && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Similarity Breakdown:
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Product Name:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{
                            width: `${duplicate.details.nameSimilarity}%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 w-12 text-right">
                        {duplicate.details.nameSimilarity}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{
                            width: `${duplicate.details.descriptionSimilarity}%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 w-12 text-right">
                        {duplicate.details.descriptionSimilarity}%
                      </span>
                    </div>
                  </div>
                  {duplicate.details.skuMatch && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-semibold">SKU Match</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Reason: </span>
              {duplicate.reason}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle size={28} />
              Duplicate Products Detected
            </h2>
            <p className="text-orange-100 mt-1 text-sm">
              We found {detection.duplicatesFound.length} potential duplicates in your upload
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {detection.summary.total}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">📊 Total</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {detection.summary.new}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 font-medium mt-1">✅ Can Upload</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {detection.fileInternalDuplicates.length}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 font-medium mt-1">🔄 In File</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {detection.inventoryDuplicates.length}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 font-medium mt-1">📦 Have</p>
            </div>
          </div>

          {/* Summary Info Box */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">📊 What you can do</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-bold text-green-600 dark:text-green-400">{detection.summary.new} product{detection.summary.new !== 1 ? 's' : ''}</span> can be added to your inventory.
              <br />
              <span className="text-xs text-gray-600 dark:text-gray-400 block mt-2">
                ❌ {detection.fileInternalDuplicates.length + detection.inventoryDuplicates.length} product{detection.fileInternalDuplicates.length + detection.inventoryDuplicates.length !== 1 ? 's' : ''} {detection.fileInternalDuplicates.length + detection.inventoryDuplicates.length === 1 ? 'is' : 'are'} duplicate{detection.fileInternalDuplicates.length + detection.inventoryDuplicates.length !== 1 ? 's' : ''} (will be skipped if you choose "Add New Products")
              </span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'summary' as TabType, label: 'Summary' },
              {
                id: 'file-duplicates' as TabType,
                label: `File Duplicates (${detection.fileInternalDuplicates.length})`,
              },
              {
                id: 'inventory-duplicates' as TabType,
                label: `Inventory Duplicates (${detection.inventoryDuplicates.length})`,
              },
              { id: 'new-products' as TabType, label: `New Products (${detection.newProducts.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-48">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    What does this mean?
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    We've detected products that appear to be duplicates. This helps prevent uploading the
                    same product multiple times, which could clutter your inventory.
                  </p>
                </div>

                <div className="space-y-3">
                  {detection.fileInternalDuplicates.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                        <Copy size={18} className="text-orange-600 dark:text-orange-400" />
                        File Internal Duplicates ({detection.fileInternalDuplicates.length})
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Products in your Excel file that are very similar to each other
                      </p>
                    </div>
                  )}

                  {detection.inventoryDuplicates.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                        Inventory Duplicates ({detection.inventoryDuplicates.length})
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Products that already exist in your current inventory
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'file-duplicates' && (
              <div className="space-y-3">
                {detection.fileInternalDuplicates.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="mx-auto text-green-600 dark:text-green-400 mb-2" size={32} />
                    <p className="text-gray-600 dark:text-gray-400">No internal duplicates found</p>
                  </div>
                ) : (
                  detection.fileInternalDuplicates.map((dup, idx) => (
                    <DuplicateCard key={idx} duplicate={dup} index={idx} type="file" />
                  ))
                )}
              </div>
            )}

            {activeTab === 'inventory-duplicates' && (
              <div className="space-y-3">
                {detection.inventoryDuplicates.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="mx-auto text-green-600 dark:text-green-400 mb-2" size={32} />
                    <p className="text-gray-600 dark:text-gray-400">
                      No duplicates in your existing inventory
                    </p>
                  </div>
                ) : (
                  detection.inventoryDuplicates.map((dup, idx) => (
                    <DuplicateCard
                      key={idx}
                      duplicate={dup}
                      index={detection.fileInternalDuplicates.length + idx}
                      type="inventory"
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'new-products' && (
              <div className="space-y-2">
                {detection.newProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto text-orange-600 dark:text-orange-400 mb-2" size={32} />
                    <p className="text-gray-600 dark:text-gray-400">
                      All products are duplicates
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {detection.newProducts.map((product, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{product}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Option 1: Add New Products (Skip Duplicates) */}
            <button
              onClick={onSkipDuplicates}
              disabled={isLoading || detection.newProducts.length === 0}
              className="w-full px-4 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition flex items-center justify-center gap-3 text-lg"
            >
              <CheckCircle2 size={24} />
              <div className="text-left">
                <p>✅ Add {detection.summary.new} New Product{detection.summary.new !== 1 ? 's' : ''}</p>
                <p className="text-xs text-green-100 font-normal">Skip {detection.fileInternalDuplicates.length + detection.inventoryDuplicates.length} duplicate{detection.fileInternalDuplicates.length + detection.inventoryDuplicates.length !== 1 ? 's' : ''}</p>
              </div>
            </button>

            {/* Option 2: Upload All Products */}
            <button
              onClick={onConfirmAll}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              <div className="text-left">
                <p>📤 Upload All {detection.summary.total} Products</p>
                <p className="text-xs text-blue-100">Including duplicates (may cause conflicts)</p>
              </div>
            </button>

            {/* Option 3: Cancel */}
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              <div className="text-left">
                <p>Cancel</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Don't upload anything
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateDetectionModal;
