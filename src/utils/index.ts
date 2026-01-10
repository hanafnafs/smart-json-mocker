/**
 * Utility functions for Smart JSON Mocker
 */

import type { FieldInfo } from '../types';

/**
 * Check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (isNullish(value)) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return true;
  return false;
}

/**
 * Get the type of a value as a string
 */
export function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Set a value at a nested path in an object
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    // Handle array notation like "items[0]"
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, arrayKey, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      if (!current[arrayKey]) current[arrayKey] = [];
      if (!(current[arrayKey] as unknown[])[index]) {
        (current[arrayKey] as unknown[])[index] = {};
      }
      current = (current[arrayKey] as unknown[])[index] as Record<string, unknown>;
    } else {
      if (!current[part]) current[part] = {};
      current = current[part] as Record<string, unknown>;
    }
  }
  
  const lastPart = parts[parts.length - 1];
  const arrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);
  
  if (arrayMatch) {
    const [, arrayKey, indexStr] = arrayMatch;
    const index = parseInt(indexStr, 10);
    if (!current[arrayKey]) current[arrayKey] = [];
    (current[arrayKey] as unknown[])[index] = value;
  } else {
    current[lastPart] = value;
  }
}

/**
 * Get a value at a nested path in an object
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      current = (current as Record<string, unknown>)[arrayKey];
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  
  return current;
}

/**
 * Extract all fields that need to be filled from an object
 */
export function extractEmptyFields(
  obj: Record<string, unknown>,
  path: string = '',
  parentKey?: string
): FieldInfo[] {
  const fields: FieldInfo[] = [];
  
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key;
    const valueType = getValueType(value);
    
    const fieldInfo: FieldInfo = {
      key,
      path: currentPath,
      value,
      type: valueType,
      parentKey,
      isNull: value === null,
      isEmpty: isEmpty(value),
      isUndefined: value === undefined,
    };
    
    // Add if empty/null/undefined
    if (fieldInfo.isNull || fieldInfo.isUndefined || (typeof value === 'string' && value === '')) {
      fields.push(fieldInfo);
    }
    // Recurse into objects
    else if (valueType === 'object' && value !== null) {
      fields.push(...extractEmptyFields(value as Record<string, unknown>, currentPath, key));
    }
    // Check array items
    else if (valueType === 'array' && Array.isArray(value)) {
      if (value.length === 0) {
        fields.push(fieldInfo);
      } else {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            fields.push(...extractEmptyFields(
              item as Record<string, unknown>,
              `${currentPath}[${index}]`,
              key
            ));
          }
        });
      }
    }
  }
  
  return fields;
}

/**
 * Normalize a key for pattern matching (camelCase to words)
 */
export function normalizeKey(key: string): string[] {
  // Split camelCase and snake_case
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array
 */
export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Simple hash function for cache keys
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    // Remove markdown code blocks if present
    const cleaned = str
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

/**
 * Clean AI response (remove markdown, extra text)
 */
export function cleanAIResponse(response: string): string {
  // Remove markdown code blocks
  let cleaned = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  // Try to find JSON in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
