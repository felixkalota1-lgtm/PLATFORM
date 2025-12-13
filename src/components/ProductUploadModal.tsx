/**
 * Product Upload Modal Component
 * 
 * Features:
 * - Drag & drop Excel file upload
 * - Real-time validation feedback
 * - Advanced duplicate detection with user confirmation
 * - Progress tracking during upload
 * - AI image generation option
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, AlertCircle, CheckCircle2, FileUp, Loader } from 'lucide-react';
import {
  importProductsFromExcel,
  ValidationResult,
  UploadResult,
  parseExcelFile,
  validateExcelProducts,
  uploadProductsToFirestore,
} from '../services/excelUploadService';
import {
  detectAllDuplicates,
  DuplicateDetectionResult,
  filterProductsByDuplicateOption,
} from '../services/duplicateDetectionService';
import DuplicateDetectionModal from './DuplicateDetectionModal';

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess?: (result: { validation: ValidationResult; upload: UploadResult }) => void;
}

type UploadStep = 'idle' | 'parsing' | 'detecting-duplicates' | 'validating' | 'uploading' | 'complete';

export const ProductUploadModal: React.FC<ProductUploadModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}) => {
  const [step, setStep] = useState<UploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [generateImages, setGenerateImages] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [duplicateDetection, setDuplicateDetection] = useState<DuplicateDetectionResult | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setStatusMessage('❌ Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      try {
        setStep('parsing');
        setStatusMessage('📄 Parsing Excel file...');

        // Step 1: Parse Excel file
        const products = await parseExcelFile(file);
        setParsedProducts(products);

        if (products.length === 0) {
          setStatusMessage('❌ No valid products found in the Excel file');
          setStep('idle');
          return;
        }

        // Step 2: Detect duplicates
        setStep('detecting-duplicates');
        setStatusMessage('🔍 Detecting duplicates...');
        const detection = await detectAllDuplicates(products, tenantId);
        setDuplicateDetection(detection);

        // Show duplicate modal if duplicates found
        if (detection.hasDuplicates) {
          setShowDuplicateModal(true);
          // Don't proceed until user makes a choice
        } else {
          // No duplicates, proceed with upload
          proceedWithUpload(products, false);
        }
      } catch (error) {
        setStep('idle');
        setStatusMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [tenantId, generateImages, onSuccess, onClose]
  );

  const proceedWithUpload = async (products: any[], skipDuplicates: boolean) => {
    try {
      setShowDuplicateModal(false);
      setStep('uploading');
      setStatusMessage('⏳ Processing upload...');

      // Filter products if skipping duplicates
      let productsToUpload = products;
      if (skipDuplicates && duplicateDetection) {
        productsToUpload = filterProductsByDuplicateOption(
          products,
          duplicateDetection.duplicatesFound,
          'skip'
        );
        setStatusMessage(`📋 Uploading ${productsToUpload.length} new products (skipped ${duplicateDetection.duplicatesFound.length} duplicates)...`);
      }

      // Validate products
      const validation = await validateExcelProducts(productsToUpload, tenantId);
      setValidation(validation);

      if (validation.errors.length > 0) {
        setStep('idle');
        setStatusMessage('❌ Validation failed. Please review your products.');
        return;
      }

      // Upload products
      const uploadResult = await uploadProductsToFirestore(productsToUpload, tenantId, {
        generateImages,
        onProgress: (current, total) => {
          setProgress(Math.round((current / total) * 100));
          setStatusMessage(`⏳ Uploading products: ${current}/${total}`);
        },
      });

      setUpload(uploadResult);

      if (uploadResult.success && uploadResult.uploaded > 0) {
        setStep('complete');
        setStatusMessage('✅ Upload complete!');
        onSuccess?.({
          validation,
          upload: uploadResult,
        });

        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else if (uploadResult.errors.length > 0) {
        setStep('idle');
        setStatusMessage(`❌ ${uploadResult.failed} products failed to upload`);
      }
    } catch (error) {
      setStep('idle');
      setStatusMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    disabled: step !== 'idle',
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Duplicate Detection Modal */}
      <DuplicateDetectionModal
        isOpen={showDuplicateModal}
        detection={duplicateDetection || { hasDuplicates: false, duplicatesFound: [], fileInternalDuplicates: [], inventoryDuplicates: [], newProducts: [], summary: { total: 0, new: 0, potential: 0, confirmed: 0 } }}
        onSkipDuplicates={() => {
          if (duplicateDetection) {
            proceedWithUpload(parsedProducts, true);
          }
        }}
        onConfirmAll={() => {
          if (duplicateDetection) {
            proceedWithUpload(parsedProducts, false);
          }
        }}
        onCancel={() => {
          setShowDuplicateModal(false);
          setStep('idle');
          setParsedProducts([]);
          setDuplicateDetection(null);
        }}
      />

      {/* Main Upload Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">📊 Import Products from Excel</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              disabled={step === 'uploading'}
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-900 dark:text-blue-100">
              {statusMessage}
            </div>
          )}

          {/* Progress Bar */}
          {step !== 'idle' && step !== 'complete' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Area */}
          {step === 'idle' && (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <FileUp className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Drop your Excel file here
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  or click to select a file (.xlsx or .xls)
                </p>
              </div>

              {/* Options */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateImages}
                    onChange={(e) => setGenerateImages(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🤖 Generate product images using AI (Hugging Face)
                  </span>
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
                  Creates professional product photos from descriptions. This may take longer.
                </p>
              </div>

              {/* Excel Template Info */}
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  📋 Excel Template Format:
                </h4>
                <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1 font-mono">
                  <p><strong>Column A:</strong> Product Name (required)</p>
                  <p><strong>Column B:</strong> Description (required)</p>
                  <p><strong>Column C:</strong> Price (optional)</p>
                  <p><strong>Column D:</strong> SKU (optional)</p>
                  <p><strong>Column E:</strong> Category (optional)</p>
                  <p><strong>Column F:</strong> Stock Quantity (optional)</p>
                  <p><strong>Column G:</strong> Supplier (optional)</p>
                  <p><strong>Column H:</strong> Tags (optional, comma-separated)</p>
                </div>
              </div>
            </>
          )}



          {/* Upload Complete */}
          {step === 'complete' && upload && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                <CheckCircle2 className="mx-auto mb-4 text-green-600 dark:text-green-400" size={48} />
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                  ✅ Upload Successful!
                </h3>
                <div className="space-y-2 text-green-800 dark:text-green-200">
                  <p>
                    <strong>{upload.uploaded}</strong> products uploaded successfully
                  </p>
                  {upload.failed > 0 && (
                    <p className="text-orange-600 dark:text-orange-400">
                      <strong>{upload.failed}</strong> products failed
                    </p>
                  )}
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Time: {(upload.totalTime / 1000).toFixed(2)}s
                  </p>
                </div>
              </div>

              {upload.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Errors:</h4>
                  <div className="space-y-1 text-sm text-red-700 dark:text-red-300 max-h-32 overflow-y-auto">
                    {upload.errors.map((error, idx) => (
                      <p key={idx}>• {error}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          )}

          {/* Loading State */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader className="animate-spin text-blue-600" size={48} />
              <p className="text-lg text-gray-700 dark:text-gray-300">Uploading products...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Do not close this window
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default ProductUploadModal;
