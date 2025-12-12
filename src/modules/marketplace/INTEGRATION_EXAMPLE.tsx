/**
 * Integration Example: Using AI & Excel Upload Services
 * 
 * This file shows how to integrate the new AI and Excel upload
 * services into your marketplace module.
 */

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import ProductUploadModal from '../components/ProductUploadModal';
import { useAuth } from '../hooks/useAuth'; // Your auth hook

/**
 * Example: Marketplace Admin Panel with Excel Upload
 * Add this to your marketplace module
 */
export const MarketplaceAdminExample: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Get tenant ID from user (multi-tenant support)
  const tenantId = user?.tenantId || 'default';

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">📊 Bulk Product Import</h1>
        <p className="text-blue-100">
          Upload an Excel file with product data. AI will auto-generate images and validate data.
        </p>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        <Upload size={20} />
        Import Products from Excel
      </button>

      {/* Upload Modal */}
      <ProductUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        tenantId={tenantId}
        onSuccess={(result) => {
          console.log('✅ Import successful:', result);
          // Refresh product list, show success message, etc.
        }}
      />
    </div>
  );
};

/**
 * Integration Steps:
 * 
 * 1. Add ProductUploadModal to your marketplace module
 *    - Import: `import ProductUploadModal from '../components/ProductUploadModal'`
 *    - Place in your admin/dashboard page
 * 
 * 2. Set up Firebase environment variables
 *    .env.local:
 *    VITE_HF_TOKEN=your_hugging_face_api_token
 *    VITE_FIREBASE_PROJECT_ID=your_project_id
 *    VITE_FIREBASE_API_KEY=your_api_key
 * 
 * 3. Optional: Set up Ollama for local LLM validation
 *    # Install Ollama from https://ollama.ai
 *    ollama pull mistral
 *    ollama serve
 * 
 * 4. Update your marketplace page to include the upload button
 * 
 * Features Available:
 * ✅ AI Image Generation (Hugging Face)
 * ✅ Local LLM Validation (Ollama)
 * ✅ Duplicate Detection (TensorFlow similarity)
 * ✅ Auto-Categorization
 * ✅ Metadata Extraction
 * ✅ Batch Firestore Upload
 */

/**
 * Advanced: Direct Service Usage
 */
export const advancedServiceExamples = {
  /**
   * Example: Generate a single product image
   */
  generateImage: async () => {
    const { generateProductImage } = await import('../services/aiService');
    
    const blob = await generateProductImage(
      'Premium stainless steel coffee maker with programmable timer',
      'Electronics'
    );
    
    console.log('Generated image:', blob);
  },

  /**
   * Example: Validate Excel data with local LLM
   */
  validateWithOllama: async () => {
    const { validateExcelDataWithOllama } = await import('../services/aiService');
    
    const validation = await validateExcelDataWithOllama([
      {
        name: 'Product 1',
        description: 'A high-quality product',
        price: 99.99,
      },
      {
        name: 'Product 2',
        description: 'Another great product',
        price: 149.99,
      },
    ]);
    
    console.log('Validation result:', validation);
  },

  /**
   * Example: Parse and validate Excel file
   */
  parseExcel: async (file: File) => {
    const { parseExcelFile, validateExcelProducts } = await import(
      '../services/excelUploadService'
    );
    
    const products = await parseExcelFile(file);
    console.log('Parsed products:', products);
    
    const validation = await validateExcelProducts(products);
    console.log('Validation:', validation);
  },

  /**
   * Example: Get product recommendations
   */
  getRecommendations: async () => {
    const { getProductRecommendations } = await import('../services/aiService');
    
    const recommendations = await getProductRecommendations(
      'product-123',
      [
        { id: 'p1', name: 'Laptop', category: 'Electronics', description: 'Dell XPS laptop' },
        { id: 'p2', name: 'Mouse', category: 'Electronics', description: 'Wireless mouse' },
        { id: 'p3', name: 'Keyboard', category: 'Electronics', description: 'Mechanical keyboard' },
      ]
    );
    
    console.log('Recommendations:', recommendations);
  },

  /**
   * Example: Predict product demand
   */
  predictDemand: async () => {
    const { predictDemand } = await import('../services/aiService');
    
    const nextMonths = await predictDemand([
      { month: 1, sales: 100 },
      { month: 2, sales: 120 },
      { month: 3, sales: 135 },
      { month: 4, sales: 155 },
      { month: 5, sales: 170 },
      { month: 6, sales: 185 },
    ]);
    
    console.log('Predicted sales for next 3 months:', nextMonths);
  },
};

export default MarketplaceAdminExample;
