/**
 * Data Cleaning Utilities for Firestore
 * Removes undefined values and cleans data before posting to Firebase
 */

/**
 * Recursively removes undefined values from an object/array
 * Preserves null, 0, false, and empty strings as valid values
 * @param data - Any data structure (object, array, primitive)
 * @returns Cleaned data without any undefined values
 */
export function removeUndefinedValues(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }

  if (Array.isArray(data)) {
    return data
      .map(item => removeUndefinedValues(item))
      .filter(item => item !== undefined);
  }

  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = removeUndefinedValues(data[key]);
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  return data;
}

/**
 * Validates that no undefined values exist in the data structure
 * Throws an error with specific field paths if undefined values are found
 * @param data - Data to validate
 * @param context - Optional context for error message
 * @returns true if validation passes
 * @throws Error if undefined values are found
 */
export function validateNoUndefinedValues(data: any, context?: string): boolean {
  const undefinedFields: string[] = [];

  function checkForUndefined(obj: any, path: string = '') {
    if (obj === undefined) {
      undefinedFields.push(path || 'root');
      return;
    }

    if (obj === null || typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkForUndefined(item, `${path}[${index}]`);
      });
    } else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          checkForUndefined(obj[key], newPath);
        }
      }
    }
  }

  checkForUndefined(data);

  if (undefinedFields.length > 0) {
    const fieldList = undefinedFields.join(', ');
    const contextMsg = context ? ` in ${context}` : '';
    throw new Error(`Found undefined values${contextMsg}: ${fieldList}`);
  }

  return true;
}

/**
 * Cleans data and validates in one operation
 * @param data - Data to clean and validate
 * @param context - Optional context for error messages
 * @returns Cleaned data
 * @throws Error if undefined values found after cleaning (which shouldn't happen)
 */
export function cleanAndValidate(data: any, context?: string): any {
  const cleaned = removeUndefinedValues(data);
  validateNoUndefinedValues(cleaned, context);
  return cleaned;
}

/**
 * Ensures all object keys have string values (no undefined)
 * Useful for form data where some fields might be undefined
 * @param obj - Object to sanitize
 * @returns Sanitized object with empty strings instead of undefined
 */
export function sanitizeFormData(obj: any): any {
  const sanitized: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (value === undefined || value === null) {
        sanitized[key] = '';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Ensures all required fields exist and are not undefined
 * @param obj - Object to check
 * @param requiredFields - Array of required field names
 * @throws Error if any required field is missing or undefined
 */
export function validateRequiredFields(obj: any, requiredFields: string[]): boolean {
  const missingFields = requiredFields.filter(
    field => obj[field] === undefined || obj[field] === null || obj[field] === ''
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
}

/**
 * Safely access nested properties without errors
 * @param obj - Object to access
 * @param path - Dot-notation path (e.g., 'user.profile.name')
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or default
 */
export function safeGet(obj: any, path: string, defaultValue: any = ''): any {
  try {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }

    return current === undefined ? defaultValue : current;
  } catch {
    return defaultValue;
  }
}
