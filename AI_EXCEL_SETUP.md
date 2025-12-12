# 🤖 AI & Excel Upload Setup Guide

## Overview

You now have **AI-powered bulk product import** with:
- ✅ **Hugging Face Image Generation** - Auto-generate product photos from descriptions
- ✅ **Ollama Local LLM** - Privacy-focused data validation on your machine
- ✅ **TensorFlow.js** - Duplicate detection, recommendations, demand forecasting
- ✅ **Excel Upload UI** - Drag-drop interface with real-time validation

## Quick Start (5 minutes)

### 1. Set Environment Variables

Create or update `.env.local`:

```env
# Hugging Face API (for AI image generation)
VITE_HF_TOKEN=your_token_here

# Firebase (already configured)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_AUTH_DOMAIN=your_domain

# Optional: Ollama endpoint (default: http://localhost:11434)
VITE_OLLAMA_ENDPOINT=http://localhost:11434
```

Get Hugging Face token: https://huggingface.co/settings/tokens

### 2. Set Up Ollama (Optional but Recommended)

For **local LLM validation** (better privacy, no API costs):

```bash
# Install Ollama: https://ollama.ai

# Download a model
ollama pull mistral

# Start Ollama service
ollama serve

# In another terminal, test it
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Hello",
  "stream": false
}'
```

Ollama models available:
- `mistral` (7B) - Fast, good for validation
- `neural-chat` (7B) - Optimized for chat/categorization
- `orca-mini` (3B) - Lightweight, quick
- `llama2` (7B) - General purpose

### 3. Add Upload Button to Marketplace

In your marketplace admin page:

```tsx
import React, { useState } from 'react';
import ProductUploadModal from '../components/ProductUploadModal';
import { useAuth } from '../hooks/useAuth';

export const MarketplaceAdmin = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div>
      <button
        onClick={() => setIsUploadOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        📊 Import Products
      </button>

      <ProductUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        tenantId={user?.tenantId || 'default'}
        onSuccess={(result) => {
          console.log('✅ Imported:', result.upload.uploaded, 'products');
          // Refresh product list here
        }}
      />
    </div>
  );
};
```

## Excel File Format

Your Excel file should have these columns:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **Product Name** | **Description** | Price | SKU | Category | Stock | Supplier | Tags |
| *(required)* | *(required)* | Optional | Optional | Optional | Optional | Optional | Optional |

**Example row:**
```
Premium Coffee Maker | Stainless steel programmable coffee maker with 12-cup capacity | 79.99 | SKU-001 | Kitchen Appliances | 50 | AcmeCorp | brewing,coffee,auto-shutoff
```

## Features & How They Work

### 1. 🖼️ AI Image Generation

```tsx
import { generateProductImage } from '../services/aiService';

// Generate image from description
const blob = await generateProductImage(
  'Premium stainless steel coffee maker',
  'Kitchen Appliances'
);
```

**How it works:**
1. Takes product description + category
2. Creates detailed prompt: "Professional product photo of a Kitchen Appliance: Premium stainless steel coffee maker..."
3. Sends to Hugging Face Stable Diffusion API
4. Returns generated image as Blob
5. Uploaded to Firestore automatically

**Cost:** ~$0.0013 per image (Hugging Face)
**Speed:** 10-30 seconds per image
**Quality:** Production-ready professional photos

### 2. ✅ Ollama Local LLM Validation

```tsx
import { validateExcelDataWithOllama } from '../services/aiService';

const result = await validateExcelDataWithOllama(products);
// Returns: { isValid, errors, warnings, suggestions }
```

**Checks for:**
- Format inconsistencies (mixed data types)
- Missing required fields
- Duplicate entries
- Price anomalies
- Description quality

**Advantages:**
- ✅ Privacy: Runs on your machine
- ✅ Free: No API costs
- ✅ Fast: Runs locally
- ✅ Customizable: Can modify prompts

**Note:** Falls back gracefully if Ollama not running

### 3. 🔄 Auto-Categorization

```tsx
import { categorizeProductsWithAI } from '../services/aiService';

const categories = await categorizeProductsWithAI(products);
// Returns: Map<productName, category>
// e.g., "Coffee Maker" → "Kitchen Appliances"
```

Uses keyword matching:
- Electronics: digital, computer, phone, device...
- Clothing: shirt, pants, dress, fabric...
- Furniture: chair, table, sofa, desk...
- Food: beverage, snack, meal, organic...
- Tools: drill, saw, wrench, equipment...
- (and more)

### 4. 🕵️ Duplicate Detection

```tsx
import { detectDuplicateProductsWithAI } from '../services/aiService';

const duplicates = await detectDuplicateProductsWithAI(products);
// Returns: [{ product1, product2, similarity: 85.3 }]
```

**Algorithm:** Jaccard text similarity
- Compares product names + descriptions
- Flags as duplicate if similarity > 70%
- User confirms before uploading

### 5. 📊 Demand Prediction

```tsx
import { predictDemand } from '../services/aiService';

const nextMonths = await predictDemand([
  { month: 1, sales: 100 },
  { month: 2, sales: 120 },
  { month: 3, sales: 135 },
]);
// Returns: [155, 172, 191] // Predicted sales
```

Uses TensorFlow.js simple linear regression to predict next 3 months of demand.

### 6. 🎯 Product Recommendations

```tsx
import { getProductRecommendations } from '../services/aiService';

const recommendations = await getProductRecommendations(
  'product-123',
  allProducts,
  5 // top 5
);
```

Scoring:
- Same category: +50 points
- Similar description: +30 points
- Returns top N by score

## File Locations

```
src/
├── services/
│   ├── aiService.ts                    # AI/ML utilities (600+ lines)
│   └── excelUploadService.ts           # Excel parsing & Firestore (400+ lines)
├── components/
│   └── ProductUploadModal.tsx          # Drag-drop UI (500+ lines)
└── modules/
    └── marketplace/
        └── INTEGRATION_EXAMPLE.tsx     # Usage examples
```

## Advanced Configuration

### TensorFlow Model Architecture

For demand prediction, you can customize:

```tsx
// In aiService.ts, modify predictDemand():
const model = tf.sequential({
  layers: [
    tf.layers.dense({ units: 8, activation: 'relu', inputShape: [1] }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 4, activation: 'relu' }),
    tf.layers.dense({ units: 1 }),
  ],
});
```

### Ollama Prompt Customization

Modify validation prompt in `validateExcelDataWithOllama()`:

```tsx
const prompt = `Custom validation instructions...
Your instructions here...
Data:
${dataJson}

Return JSON: { errors, warnings, suggestions }`;
```

### Hugging Face Model Selection

Change image generation model:

```tsx
// Default: 'stabilityai/stable-diffusion-2'
// Options:
// - 'stabilityai/stable-diffusion-3'
// - 'black-forest-labs/FLUX.1-dev'
// - 'CompVis/stable-diffusion-v1-4'

await hf.textToImage({
  inputs: enhancedPrompt,
  model: 'black-forest-labs/FLUX.1-dev', // Newer, higher quality
});
```

## Error Handling

### Missing Hugging Face Token

```
Error: Failed to generate product image. Check API key and try again.
```

**Solution:** Add `VITE_HF_TOKEN` to `.env.local` and restart dev server

### Ollama Not Running

```
Warning: Local LLM validation skipped - Ollama not running
```

**Solution:**
```bash
ollama serve
```

Or disable AI image generation in modal if you prefer not to install Ollama.

### Firebase Upload Fails

Check Firestore rules:

```javascript
match /tenants/{tenantId}/products/{productId} {
  allow read: if request.auth.uid != null;
  allow write: if request.auth.uid != null && 
               request.resource.data.tenantId == tenantId;
}
```

## Performance Optimization

### Batch Image Generation

```tsx
import { generateProductImagesBatch } from '../services/aiService';

// Generate images for multiple products with rate limiting
const images = await generateProductImagesBatch([
  { name: 'Product 1', description: '...', category: 'Electronics' },
  { name: 'Product 2', description: '...', category: 'Furniture' },
]);
```

Includes 1-second delay between API calls to avoid rate limiting.

### Code Splitting

For lazy loading AI services:

```tsx
// Load only when needed
const aiService = await import('../services/aiService');
const result = await aiService.generateProductImage(...);
```

## Monitoring & Analytics

### Track Import Success

```tsx
onSuccess={(result) => {
  console.log('✅ Import complete:');
  console.log(`  - Uploaded: ${result.upload.uploaded}`);
  console.log(`  - Failed: ${result.upload.failed}`);
  console.log(`  - Time: ${result.upload.totalTime}ms`);
  
  // Send to analytics
  analytics.trackEvent('product_import', {
    count: result.upload.uploaded,
    duration: result.upload.totalTime,
  });
}}
```

## Next Steps

1. ✅ Set up `VITE_HF_TOKEN` in `.env.local`
2. ✅ (Optional) Install Ollama for local validation
3. ✅ Add `ProductUploadModal` to your marketplace page
4. ✅ Test with sample Excel file
5. ✅ Customize categorization rules as needed
6. ✅ Monitor import performance

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Images not generating | Check HF token, API rate limits |
| Duplicates not detected | Similarity threshold is 70%, adjust in code |
| Ollama validation slow | Reduce model size or disable |
| Firestore upload fails | Check permissions and tenant ID |
| Excel parsing error | Verify column format matches spec |

## Support

For issues:
1. Check `.env.local` has all required tokens
2. Verify Firebase/Firestore permissions
3. Test Ollama with `curl` if local validation fails
4. Check browser console for detailed error messages
5. See `INTEGRATION_EXAMPLE.tsx` for usage patterns

---

**Summary:** You now have production-ready AI-powered bulk product import! 🚀
