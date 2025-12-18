import React, { useState } from 'react';
import { X, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSalesStore } from '../store';

interface CreateSaleQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  productName?: string;
  productId?: string;
  initialPrice?: number;
}

export default function CreateSaleQuoteModal({
  isOpen,
  onClose,
  tenantId,
  productName = '',
  productId = '',
  initialPrice = 0,
}: CreateSaleQuoteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { addQuotation } = useSalesStore();

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    productName: productName,
    description: '',
    quantity: 1,
    unitPrice: initialPrice,
    discount: 0,
    discountType: 'percentage' as const,
    validUntil: '',
    notes: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'quantity' || name === 'unitPrice' || name === 'discount'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const calculateTotalAmount = () => {
    const subtotal = formData.quantity * formData.unitPrice;
    let finalAmount = subtotal;

    if (formData.discount > 0) {
      if (formData.discountType === 'percentage') {
        finalAmount = subtotal - (subtotal * formData.discount) / 100;
      } else {
        finalAmount = subtotal - formData.discount;
      }
    }

    return { subtotal, finalAmount };
  };

  const { subtotal, finalAmount } = calculateTotalAmount();

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      setError('Customer name is required');
      return false;
    }
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return false;
    }
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return false;
    }
    if (formData.unitPrice < 0) {
      setError('Unit price cannot be negative');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Generate quotation number
      const quotationNumber = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const newQuotation = {
        id: `sales-${Date.now()}-${Math.random()}`,
        tenantId,
        quotationNumber,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        productId: productId || undefined,
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalAmount: subtotal,
        discount: formData.discount || undefined,
        discountType: formData.discountType,
        finalAmount,
        status: 'draft' as const,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
        notes: formData.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addQuotation(newQuotation);
      setSuccessMessage('✅ Sale quotation created successfully!');

      setTimeout(() => {
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          productName,
          description: '',
          quantity: 1,
          unitPrice: initialPrice,
          discount: 0,
          discountType: 'percentage',
          validUntil: '',
          notes: '',
        });
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating quotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quotation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">💰 Create Sale Quotation</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-900 dark:text-red-100">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-900 dark:text-green-100">
              <CheckCircle2 size={20} />
              {successMessage}
            </div>
          )}

          {/* Customer Information */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 Customer Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Product name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product specifications and details..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">💵 Pricing</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    disabled={isLoading}
                  />
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    disabled={isLoading}
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">$</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${finalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valid Until (Optional)
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional terms, conditions, or notes..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold text-gray-900 dark:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  💾 Create Quotation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
