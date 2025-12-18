import React, { useState } from 'react';

export interface BulkUploadResult {
  id: string;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  validationStatus: 'pending' | 'validated' | 'failed';
  aiSuggestions: string[];
  uploadedAt: Date;
  processedAt?: Date;
}

export const BulkUploadWithAI: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const validateWithAI = async () => {
    if (!file) return;

    setValidating(true);
    try {
      // Simulate AI validation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const suggestions = [
        '✓ Format validated: Product names are consistent',
        'Alert: 15 rows have missing descriptions - using AI to generate',
        '✓ Prices validated: All numeric values correct',
        '✓ SKU format is correct',
        'Alert: 3 image URLs are invalid - will attempt to download alternatives',
      ];

      setAiSuggestions(suggestions);

      const result: BulkUploadResult = {
        id: `upload-${Date.now()}`,
        fileName: file.name,
        totalRows: 245,
        successfulRows: 242,
        failedRows: 3,
        validationStatus: 'validated',
        aiSuggestions: suggestions,
        uploadedAt: new Date(),
        processedAt: new Date(),
      };

      setUploadResult(result);
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadResult) return;

    setUploading(true);
    try {
      // Simulate upload process
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Upload successful
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Upload with AI</h2>
        <p className="text-gray-600">Upload products from Excel/CSV with AI-powered validation and correction</p>
      </div>

      <div className="p-6">
        {!uploadResult ? (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition cursor-pointer mb-6">
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-600 font-semibold mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">Excel (.xlsx, .xls) or CSV files supported</p>
              </label>
            </div>

            {file && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">File Selected: {file.name}</h3>
                <p className="text-sm text-blue-800">Size: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={validateWithAI}
                disabled={!file || validating}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  file && !validating
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {validating ? 'Validating with AI...' : '🤖 Validate with AI'}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                  setAiSuggestions([]);
                }}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-green-900 text-lg mb-2">✓ Validation Complete</h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-green-800">Total Rows</p>
                  <p className="text-3xl font-bold text-green-600">{uploadResult.totalRows}</p>
                </div>
                <div>
                  <p className="text-sm text-green-800">Successful</p>
                  <p className="text-3xl font-bold text-green-600">{uploadResult.successfulRows}</p>
                </div>
                <div>
                  <p className="text-sm text-red-800">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{uploadResult.failedRows}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">🤖 AI Suggestions & Corrections:</h3>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                  !uploading
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {uploading ? 'Uploading...' : '✓ Upload Products'}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                  setAiSuggestions([]);
                }}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadWithAI;
