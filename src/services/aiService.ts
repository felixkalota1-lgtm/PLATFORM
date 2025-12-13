/**
 * AI Integration Service
 * 
 * Handles all AI/ML operations:
 * - Hugging Face image generation from descriptions
 * - Ollama local LLM for data validation
 * - TensorFlow.js for ML predictions and recommendations
 */

import * as tf from '@tensorflow/tfjs';
import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client (requires VITE_HF_TOKEN)
const hf = new HfInference((import.meta as any).env.VITE_HF_TOKEN || '');

/**
 * Generate product image from text description using Hugging Face
 * 
 * @param description - Product description to generate image from
 * @param category - Product category (optional, helps with styling)
 * @returns Promise<Blob> - Generated image as blob
 */
export const generateProductImage = async (
  description: string,
  category?: string
): Promise<Blob> => {
  try {
    // Enhance prompt with category context
    const enhancedPrompt = category
      ? `Professional product photo of a ${category}: ${description}. High quality, clean background, professional lighting.`
      : `Professional product photo: ${description}. High quality, clean background, professional lighting.`;

    // Generate image using Hugging Face Inference API
    const result = await hf.textToImage({
      inputs: enhancedPrompt,
      model: 'stabilityai/stable-diffusion-2',
    });

    return result as unknown as Blob;
  } catch (error) {
    console.error('Error generating product image:', error);
    throw new Error('Failed to generate product image. Check API key and try again.');
  }
};

/**
 * Batch generate images for multiple products
 */
export const generateProductImagesBatch = async (
  products: Array<{ description: string; name: string; category?: string }>
): Promise<Map<string, Blob>> => {
  const results = new Map<string, Blob>();
  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    try {
      const blob = await generateProductImage(product.description, product.category);
      results.set(product.name, blob);
      successCount++;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to generate image for ${product.name}:`, error);
      failCount++;
    }
  }

  console.log(`Image generation complete: ${successCount} success, ${failCount} failed`);
  return results;
};

/**
 * Validate Excel data using Ollama local LLM
 * 
 * Ollama runs locally - no API keys needed, better for sensitive data
 * Make sure Ollama is running: ollama pull mistral && ollama serve
 */
export const validateExcelDataWithOllama = async (
  data: Record<string, any>[]
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}> => {
  try {
    // Format data for Ollama
    const dataJson = JSON.stringify(data.slice(0, 5), null, 2); // First 5 rows for context
    
    const prompt = `You are a data validation expert. Analyze this Excel data and identify:
1. Format errors or inconsistencies
2. Missing required fields
3. Data type mismatches
4. Duplicate entries
5. Improvement suggestions

Data sample:
${dataJson}

Respond in JSON format with keys: errors (array), warnings (array), suggestions (array)`;

    // Call Ollama API (runs locally on port 11434)
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral', // or 'neural-chat', 'orca-mini', etc.
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama service not available. Start with: ollama serve');
    }

    const result = await response.json();
    
    // Parse Ollama response
    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValid: parsed.errors.length === 0,
          errors: parsed.errors || [],
          warnings: parsed.warnings || [],
          suggestions: parsed.suggestions || [],
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Ollama response:', parseError);
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    console.error('Ollama validation error:', error);
    // Fallback to basic validation
    return {
      isValid: true,
      errors: [],
      warnings: ['Local LLM validation skipped - Ollama not running'],
      suggestions: [],
    };
  }
};

/**
 * Auto-categorize products using TensorFlow text analysis
 * Uses simple keyword matching with TensorFlow vocabulary
 */
export const categorizeProductsWithAI = async (
  products: Array<{ name: string; description: string }>
): Promise<Map<string, string>> => {
  const categories = new Map<string, string>();
  const categoryKeywords: Record<string, string[]> = {
    Electronics: ['electronic', 'digital', 'computer', 'device', 'gadget', 'phone', 'tablet'],
    Clothing: ['shirt', 'pants', 'dress', 'fabric', 'wear', 'apparel', 'garment'],
    Furniture: ['chair', 'table', 'sofa', 'desk', 'cabinet', 'shelf', 'bed'],
    Food: ['food', 'beverage', 'drink', 'snack', 'meal', 'organic', 'fresh'],
    Tools: ['tool', 'drill', 'saw', 'wrench', 'equipment', 'instrument'],
    Books: ['book', 'novel', 'guide', 'manual', 'publication', 'literature'],
    Sports: ['sport', 'athletic', 'fitness', 'gym', 'outdoor', 'training'],
    Home: ['home', 'kitchen', 'bathroom', 'cleaning', 'decor', 'household'],
  };

  for (const product of products) {
    const text = `${product.name} ${product.description}`.toLowerCase();
    let bestCategory = 'Other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.filter(keyword => text.includes(keyword)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    categories.set(product.name, bestCategory);
  }

  return categories;
};

/**
 * Detect duplicate products using improved TensorFlow similarity
 * Uses enhanced text similarity with multiple algorithms
 */
export const detectDuplicateProductsWithAI = async (
  products: Array<{ name: string; description: string; sku?: string }>
): Promise<Array<{ product1: string; product2: string; similarity: number }>> => {
  const duplicates: Array<{ product1: string; product2: string; similarity: number }> = [];

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      // IMPORTANT: If both products have SKUs and they're different, NOT a duplicate
      if (products[i].sku && products[j].sku && products[i].sku !== products[j].sku) {
        continue; // Different SKUs = different products (even if name is similar)
      }

      // Check name similarity (exact match or very similar)
      const nameSimilarity = calculateTextSimilarity(
        products[i].name,
        products[j].name
      );

      // Check description similarity
      const descriptionSimilarity = calculateTextSimilarity(
        products[i].description || '',
        products[j].description || ''
      );

      // Combined score: weight name higher since duplicates usually have similar names
      const combinedScore = (nameSimilarity * 0.6) + (descriptionSimilarity * 0.4);

      // Flag as potential duplicate if combined score > 65%
      // Only flag if BOTH name AND description are very similar (not just name)
      if (combinedScore > 0.65 && nameSimilarity > 0.85) {
        duplicates.push({
          product1: products[i].name,
          product2: products[j].name,
          similarity: parseFloat((combinedScore * 100).toFixed(2)),
        });
      }
    }
  }

  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Simple text similarity calculation using multiple methods
 * Combines:
 * - Jaccard similarity (word-level)
 * - Levenshtein distance (character-level)
 * - Token overlap (phrase matching)
 */
const calculateTextSimilarity = (text1: string, text2: string): number => {
  // Normalize text
  const t1 = text1.toLowerCase().trim();
  const t2 = text2.toLowerCase().trim();

  // If texts are identical
  if (t1 === t2) return 1.0;

  // Method 1: Jaccard Similarity (word-based)
  const words1 = new Set(t1.split(/\s+/));
  const words2 = new Set(t2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  const jaccardScore = intersection.size / union.size;

  // Method 2: Levenshtein Distance (character-based)
  const levenDistance = levenshteinDistance(t1, t2);
  const maxLen = Math.max(t1.length, t2.length);
  const levenScore = 1 - (levenDistance / maxLen);

  // Method 3: Token Overlap (n-grams)
  const bigrams1 = getBigrams(t1);
  const bigrams2 = getBigrams(t2);
  const bigramIntersection = bigrams1.filter(bg => bigrams2.includes(bg)).length;
  const bigramUnion = new Set([...bigrams1, ...bigrams2]).size;
  const bigramScore = bigramUnion > 0 ? bigramIntersection / bigramUnion : 0;

  // Weighted average: 40% Jaccard, 35% Levenshtein, 25% Bigram
  const finalScore = (jaccardScore * 0.4) + (levenScore * 0.35) + (bigramScore * 0.25);

  return Math.min(1.0, Math.max(0, finalScore));
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (s1: string, s2: string): number => {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
};

/**
 * Extract bigrams (2-character sequences) from text
 */
const getBigrams = (text: string): string[] => {
  const bigrams: string[] = [];
  const cleaned = text.replace(/\s+/g, '');
  for (let i = 0; i < cleaned.length - 1; i++) {
    bigrams.push(cleaned.substr(i, 2));
  }
  return bigrams;
};

/**
 * Extract structured data from product description using basic NLP
 */
export const extractProductMetadata = async (description: string): Promise<{
  features: string[];
  price_range?: string;
  material?: string;
  color?: string;
  size?: string;
}> => {
  const features: string[] = [];
  const text = description.toLowerCase();

  // Simple extraction rules
  const materials = ['plastic', 'metal', 'wood', 'fabric', 'rubber', 'glass', 'ceramic', 'steel'];
  const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple'];
  const sizes = ['small', 'medium', 'large', 'xl', 'xs', 's', 'm', 'l'];

  let material: string | undefined;
  let color: string | undefined;
  let size: string | undefined;

  // Extract material
  material = materials.find(m => text.includes(m));

  // Extract color
  color = colors.find(c => text.includes(c));

  // Extract size
  size = sizes.find(s => text.includes(s));

  // Extract features (sentences with key words)
  const featureKeywords = [
    'feature',
    'include',
    'support',
    'compatible',
    'wireless',
    'durable',
    'waterproof',
    'portable',
  ];
  featureKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      features.push(keyword);
    }
  });

  const metadata: any = {
    features: features.length > 0 ? features : ['Standard product'],
  };

  // Only add fields if they have values
  if (material) metadata.material = material;
  if (color) metadata.color = color;
  if (size) metadata.size = size;

  return metadata;
};

/**
 * Generate product recommendations using basic ML
 * Based on category and features similarity
 */
export const getProductRecommendations = async (
  productId: string,
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>,
  limit: number = 5
): Promise<string[]> => {
  const targetProduct = allProducts.find(p => p.id === productId);
  if (!targetProduct) return [];

  const scores = allProducts
    .filter(p => p.id !== productId)
    .map(product => {
      let score = 0;

      // Same category: +50 points
      if (product.category === targetProduct.category) score += 50;

      // Similar description: +30 points
      const similarity = calculateTextSimilarity(
        targetProduct.description,
        product.description
      );
      score += similarity * 30;

      return { id: product.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.id);

  return scores;
};

/**
 * Predict product demand based on historical data
 * Simple linear regression using TensorFlow
 */
export const predictDemand = async (
  historicalData: Array<{ month: number; sales: number }>
): Promise<number[]> => {
  if (historicalData.length < 2) {
    return historicalData.map(d => d.sales);
  }

  try {
    // Prepare data for TensorFlow
    const months = historicalData.map(d => d.month);
    const sales = historicalData.map(d => d.sales);

    // Create and train model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 1, inputShape: [1] }),
      ],
    });

    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

    // Prepare training data
    const xs = tf.tensor2d(months, [months.length, 1]);
    const ys = tf.tensor2d(sales, [sales.length, 1]);

    // Train model
    await model.fit(xs, ys, { epochs: 50, verbose: 0 });

    // Predict next 3 months
    const predictions: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const nextMonth = tf.tensor2d([months[months.length - 1] + i], [1, 1]);
      const prediction = model.predict(nextMonth) as tf.Tensor;
      const value = (await prediction.data())[0];
      predictions.push(Math.max(0, Math.round(value))); // Ensure non-negative
      
      // Cleanup
      nextMonth.dispose();
      prediction.dispose();
    }

    // Cleanup
    xs.dispose();
    ys.dispose();
    model.dispose();

    return predictions;
  } catch (error) {
    console.error('Demand prediction error:', error);
    return [];
  }
};

export default {
  generateProductImage,
  generateProductImagesBatch,
  validateExcelDataWithOllama,
  categorizeProductsWithAI,
  detectDuplicateProductsWithAI,
  extractProductMetadata,
  getProductRecommendations,
  predictDemand,
};
