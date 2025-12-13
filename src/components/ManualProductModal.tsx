import React, { useState, useCallback } from 'react';
import { X, Upload, Loader, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ManualProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess?: () => void;
  targetCollection?: 'products' | 'warehouse_inventory';
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price?: number;
  sku?: string;
  quantity?: number;
  supplier?: string;
  imageFile?: File;
  imagePreview?: string;
}

export default function ManualProductModal({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
  targetCollection = 'products',
}: ManualProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 5242880, // 5MB
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || '' : value,
    }));
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageFile: undefined,
      imagePreview: undefined,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.category.trim()) {
      setError('Category is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let imageUrl = '';

      // Upload image if provided
      if (formData.imageFile) {
        const imageRef = ref(
          storage,
          `products/${tenantId}/${Date.now()}-${formData.imageFile.name}`
        );
        await uploadBytes(imageRef, formData.imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add product to Firestore - using correct nested collection path
      const productsRef = targetCollection === 'warehouse_inventory'
        ? collection(db, 'warehouse_inventory')
        : collection(db, 'tenants', tenantId, 'products');
      console.log('Adding product with tenantId:', tenantId, 'and data:', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
      });
      
      const q = query(
        productsRef,
        where('name', '==', formData.name.trim())
      );
      const existingDocs = await getDocs(q);

      if (existingDocs.size > 0) {
        setError('A product with this name already exists');
        setIsLoading(false);
        return;
      }

      await addDoc(productsRef, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        price: formData.price || 0,
        sku: formData.sku || '',
        stock: formData.quantity || 0,
        supplier: formData.supplier || null,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true, // Required for ProductsList filter
        type: 'manual', // Mark as manually added
      });

      console.log('✅ Product added successfully');

      setSuccessMessage('✅ Product added successfully!');
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          category: '',
        });
        setSuccessMessage('');
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Error adding product:', err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Detailed error:', { err, tenantId, formData });
      setError(errorMessage || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">➕ Add Product/Service</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
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

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product/Service Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Premium Steel Fasteners"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed description of the product/service..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
              disabled={isLoading}
            >
              <option value="">Select a category</option>
              <option value="raw-materials">Raw Materials</option>
              <option value="components">Components</option>
              <option value="finished-goods">Finished Goods</option>
              <option value="services">Services</option>
              <option value="equipment">Equipment</option>
              <option value="packaging">Packaging</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit Price (Optional)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SKU (Optional)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku || ''}
                onChange={handleInputChange}
                placeholder="e.g., SKU-2024-001"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Quantity (Optional)
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity || ''}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supplier (Optional)
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier || ''}
                onChange={handleInputChange}
                placeholder="Supplier name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📷 Product Image (Optional)
            </label>

            {formData.imagePreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border-2 border-purple-300 dark:border-purple-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isLoading}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <input {...getInputProps()} disabled={isLoading} />
                <ImageIcon className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Drop image here or click to select
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
