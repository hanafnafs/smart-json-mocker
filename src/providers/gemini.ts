/**
 * Google Gemini AI Provider
 * Free tier: 60 requests/minute, 1500 requests/day
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIResponse, FieldInfo, FieldOverrides } from '../types';
import { cleanAIResponse, safeJsonParse } from '../utils';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
}

export class GeminiProvider {
  private client: GoogleGenerativeAI;
  private model: string;
  private timeout: number;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required. Get your free key at https://makersuite.google.com/app/apikey');
    }
    
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-1.5-flash';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Generate mock values for empty fields
   */
  async generateForFields(
    fields: FieldInfo[],
    context?: string,
    overrides?: FieldOverrides
  ): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      
      const prompt = this.buildPrompt(fields, context, overrides);
      
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);

      const text = result.response.text();
      const cleaned = cleanAIResponse(text);
      const data = safeJsonParse<Record<string, unknown>>(cleaned, {});

      if (Object.keys(data).length === 0) {
        return {
          success: false,
          error: 'Failed to parse AI response',
        };
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
   * Generate complete mock object from schema
   */
  async generateFromSchema(
    schema: string | object,
    count: number = 1,
    context?: string
  ): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      
      const schemaStr = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
      
      const prompt = `You are a mock data generator. Generate ${count} realistic mock object(s) based on this schema/interface.

SCHEMA:
${schemaStr}

${context ? `CONTEXT: ${context}\n` : ''}

RULES:
1. Generate realistic, contextually appropriate data based on field names
2. For 'email' fields, generate valid email formats
3. For 'name' fields, generate realistic human names
4. For 'phone' fields, generate valid phone number formats
5. For 'date/time' fields, generate ISO format dates
6. For 'price/amount' fields, generate realistic numeric values
7. For 'url' fields, generate valid URL formats
8. For 'id/uuid' fields, generate unique identifiers
9. Make data diverse and realistic, not repetitive
10. Return ONLY valid JSON, no markdown, no explanation

${count === 1 ? 'Return a single JSON object.' : `Return a JSON array with exactly ${count} objects.`}`;

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);

      const text = result.response.text();
      const cleaned = cleanAIResponse(text);
      
      // Try parsing as array first, then as object
      let data: unknown;
      try {
        data = JSON.parse(cleaned);
      } catch {
        return {
          success: false,
          error: 'Failed to parse AI response as JSON',
        };
      }

      return {
        success: true,
        data: data as Record<string, unknown>,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build the prompt for field generation
   */
  private buildPrompt(
    fields: FieldInfo[],
    context?: string,
    overrides?: FieldOverrides
  ): string {
    const fieldDescriptions = fields.map(f => {
      let desc = `- "${f.path}": key name is "${f.key}"`;
      if (f.parentKey) desc += `, parent is "${f.parentKey}"`;
      if (f.type !== 'null' && f.type !== 'undefined') desc += `, expected type: ${f.type}`;
      return desc;
    }).join('\n');

    const overrideInstructions = overrides 
      ? `\nFIELD OVERRIDES (use these exact values):\n${JSON.stringify(overrides, null, 2)}`
      : '';

    return `You are a smart mock data generator. Generate realistic values for the following empty/null fields based on their key names.

FIELDS TO FILL:
${fieldDescriptions}

${context ? `CONTEXT: ${context}\n` : ''}
${overrideInstructions}

RULES:
1. Infer the appropriate data type from the field name (e.g., "email" → email format, "firstName" → person name)
2. Generate realistic, contextually appropriate data
3. Use these common patterns:
   - *email* → valid email address
   - *name*, *Name* → human name
   - *phone*, *mobile* → phone number
   - *date*, *At* → ISO date string
   - *price*, *amount*, *cost* → decimal number
   - *url*, *link* → valid URL
   - *id*, *Id* → unique identifier
   - *address* → street address
   - *city* → city name
   - *country* → country name
   - *description*, *bio* → descriptive text
   - is*, has*, can* → boolean
4. Return ONLY a valid JSON object with paths as keys
5. No markdown code blocks, no explanation, just pure JSON

Example output format:
{
  "user.email": "john.doe@example.com",
  "user.firstName": "John",
  "user.phone": "+1-555-123-4567"
}

Generate the values now:`;
  }
}

/**
 * Create a Gemini provider instance
 */
export function createGeminiProvider(config: GeminiConfig): GeminiProvider {
  return new GeminiProvider(config);
}
