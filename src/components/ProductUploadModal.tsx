/**
 * Product Upload Modal Component
 * 
 * Features:
 * - Drag & drop Excel file upload
 * - Real-time validation feedback
 * - Duplicate detection with user confirmation
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
} from '../services/excelUploadService';

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess?: (result: { validation: ValidationResult; upload: UploadResult }) => void;
}

type UploadStep = 'idle' | 'parsing' | 'validating' | 'uploading' | 'complete';

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
  const [confirmDuplicates, setConfirmDuplicates] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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

        const result = await importProductsFromExcel(file, tenantId, {
          generateImages,
          onProgress: (step, current, total) => {
            setStatusMessage(step);
            if (current && total) {
              setProgress(Math.round((current / total) * 100));
            }
          },
        });

        setValidation(result.validation);
        setUpload(result.upload);

        // Check for duplicates
        if (result.validation.duplicates.length > 0) {
          setStep('validating');
          setStatusMessage(
            `⚠️ Found ${result.validation.duplicates.length} potential duplicates. Review and confirm?`
          );
        } else if (result.validation.errors.length === 0) {
          setStep('complete');
          setStatusMessage('✅ Upload complete!');
          onSuccess?.(result);
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          setStep('validating');
          setStatusMessage('❌ Validation failed. Review errors below.');
        }
      } catch (error) {
        setStep('idle');
        setStatusMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [tenantId, generateImages, onSuccess, onClose]
  );

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

          {/* Validation Results */}
          {step === 'validating' && validation && (
            <>
              {/* Errors */}
              {validation.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle size={20} /> Errors ({validation.errors.length})
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                    {validation.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-700 dark:text-red-300">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    ⚠️ Warnings ({validation.warnings.length})
                  </h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
                    {validation.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {validation.duplicates.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-600 dark:text-purple-400">
                    🔍 Potential Duplicates ({validation.duplicates.length})
                  </h3>
                  <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2 max-h-32 overflow-y-auto">
                    {validation.duplicates.map((dup, idx) => (
                      <div key={idx} className="text-sm text-purple-700 dark:text-purple-300">
                        <strong>{dup.name1}</strong> ↔ <strong>{dup.name2}</strong>
                        <span className="ml-2 text-purple-600 dark:text-purple-400">
                          ({dup.similarity.toFixed(1)}% similar)
                        </span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center space-x-3 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmDuplicates}
                      onChange={(e) => setConfirmDuplicates(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      I understand and want to proceed with duplicate products
                    </span>
                  </label>
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Summary:</strong> {validation.products.length} products ready to upload
                  {validation.errors.length > 0 && ` (${validation.errors.length} have errors)`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (validation.errors.length === 0 || confirmDuplicates) {
                      setStep('uploading');
                      // Re-upload with confirmation
                    }
                  }}
                  disabled={validation.errors.length > 0 && !confirmDuplicates}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Upload {validation.products.length} Products
                </button>
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
  );
};

export default ProductUploadModal;
