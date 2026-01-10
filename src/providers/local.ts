/**
 * Local Provider - Fallback when AI is not available
 * Uses built-in patterns for generation
 */

import type { AIResponse, FieldInfo, FieldOverrides } from '../types';
import { findPattern, generators } from '../patterns';
import { randomFrom, randomInt, generateUUID } from '../utils';

export class LocalProvider {
  /**
   * Generate mock values for empty fields using local patterns
   */
  async generateForFields(
    fields: FieldInfo[],
    _context?: string,
    overrides?: FieldOverrides
  ): Promise<AIResponse> {
    try {
      const data: Record<string, unknown> = {};

      for (const field of fields) {
        // Check for overrides first
        if (overrides && overrides[field.key] !== undefined) {
          const override = overrides[field.key];
          if (typeof override === 'function') {
            data[field.path] = override();
          } else if (typeof override === 'object' && override !== null && 'generator' in override) {
            data[field.path] = (override as { generator: () => unknown }).generator();
          } else if (typeof override === 'object' && override !== null && 'enum' in override) {
            data[field.path] = randomFrom((override as { enum: unknown[] }).enum);
          } else if (typeof override === 'object' && override !== null && 'value' in override) {
            data[field.path] = (override as { value: unknown }).value;
          } else {
            data[field.path] = override;
          }
          continue;
        }

        // Try to find a matching pattern
        const pattern = findPattern(field.key, field.path);
        if (pattern) {
          data[field.path] = pattern.generate();
        } else {
          // Fallback: generate based on inferred type
          data[field.path] = this.generateFallback(field);
        }
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate complete mock object from schema using local patterns
   */
  async generateFromSchema(
    schema: string | object,
    count: number = 1,
    _context?: string
  ): Promise<AIResponse> {
    try {
      // Parse schema if string
      const schemaObj = typeof schema === 'string' 
        ? this.parseSchemaString(schema)
        : schema;

      const results: Record<string, unknown>[] = [];

      for (let i = 0; i < count; i++) {
        const item = this.generateFromObject(schemaObj);
        results.push(item);
      }

      return {
        success: true,
        data: count === 1 ? results[0] : results as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse a TypeScript interface string into a schema object
   */
  private parseSchemaString(schema: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Simple regex-based parser for TypeScript interfaces
    const propertyRegex = /(\w+)\s*[?]?\s*:\s*([^;]+)/g;
    let match;
    
    while ((match = propertyRegex.exec(schema)) !== null) {
      const [, key, type] = match;
      result[key] = type.trim();
    }
    
    return result;
  }

  /**
   * Generate mock object from schema object
   */
  private generateFromObject(schema: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(schema)) {
      // Try pattern matching first
      const pattern = findPattern(key, key);
      if (pattern) {
        result[key] = pattern.generate();
        continue;
      }

      // Handle nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.generateFromObject(value as Record<string, unknown>);
        continue;
      }

      // Handle type strings
      if (typeof value === 'string') {
        result[key] = this.generateFromType(key, value);
        continue;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object') {
          result[key] = [this.generateFromObject(value[0] as Record<string, unknown>)];
        } else {
          result[key] = [];
        }
        continue;
      }

      // Fallback
      result[key] = this.generateFallback({ key, path: key, value: null, type: 'null', isNull: true, isEmpty: true, isUndefined: false });
    }

    return result;
  }

  /**
   * Generate value from TypeScript type string
   */
  private generateFromType(key: string, type: string): unknown {
    const normalizedType = type.toLowerCase().trim();

    // Check for pattern match first
    const pattern = findPattern(key, key);
    if (pattern) {
      return pattern.generate();
    }

    // Type-based generation
    if (normalizedType === 'string') return generators.title();
    if (normalizedType === 'number') return randomInt(1, 1000);
    if (normalizedType === 'boolean') return Math.random() > 0.5;
    if (normalizedType === 'date') return generators.datetime();
    if (normalizedType.includes('[]') || normalizedType.includes('array')) {
      return [];
    }

    return generators.title();
  }

  /**
   * Generate fallback value based on field info
   */
  private generateFallback(field: FieldInfo): unknown {
    // Try to infer from the original type
    switch (field.type) {
      case 'string':
        return generators.title();
      case 'number':
        return randomInt(1, 100);
      case 'boolean':
        return Math.random() > 0.5;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        // Try to infer from key name patterns
        const key = field.key.toLowerCase();
        
        if (key.includes('id')) return generateUUID();
        if (key.includes('name')) return generators.fullName();
        if (key.includes('email')) return generators.email();
        if (key.includes('date') || key.includes('time')) return generators.datetime();
        if (key.includes('url') || key.includes('link')) return generators.url();
        if (key.includes('phone')) return generators.phone();
        if (key.includes('price') || key.includes('amount')) return generators.price();
        if (key.includes('count') || key.includes('total')) return generators.count();
        if (key.startsWith('is') || key.startsWith('has')) return Math.random() > 0.5;
        
        // Default to a string
        return generators.title();
    }
  }
}

/**
 * Create a local provider instance
 */
export function createLocalProvider(): LocalProvider {
  return new LocalProvider();
}
