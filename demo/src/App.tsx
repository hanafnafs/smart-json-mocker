import React, { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// Types
// ============================================

interface FieldInfo {
  key: string;
  path: string;
  value: unknown;
}

// ============================================
// Built-in Patterns (Lightweight version for demo)
// ============================================

const firstNames = ['Muhammad', 'Ahmed', 'Sara', 'Fatima', 'Omar', 'Layla', 'James', 'Emma', 'Carlos', 'Wei'];
const lastNames = ['Al-Hassan', 'Khan', 'Ali', 'Smith', 'Garcia', 'Lee', 'Kim', 'Martinez'];
const domains = ['gmail.com', 'outlook.com', 'company.com', 'example.org'];
const cities = ['Riyadh', 'Dubai', 'London', 'New York', 'Tokyo', 'Paris'];
const countries = ['Saudi Arabia', 'UAE', 'USA', 'UK', 'Japan', 'France'];
const statuses = ['active', 'pending', 'completed', 'processing'];

const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomString = (len: number) => Math.random().toString(36).substring(2, 2 + len);

const generators: Record<string, () => unknown> = {
  id: () => randomInt(1, 999999),
  uuid: () => crypto.randomUUID(),
  firstName: () => randomFrom(firstNames),
  lastName: () => randomFrom(lastNames),
  fullName: () => `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
  email: () => `${randomFrom(firstNames).toLowerCase()}${randomInt(10, 99)}@${randomFrom(domains)}`,
  phone: () => `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
  avatar: () => `https://i.pravatar.cc/150?u=${randomInt(1, 1000)}`,
  city: () => randomFrom(cities),
  country: () => randomFrom(countries),
  address: () => `${randomInt(1, 999)} ${randomFrom(['Main St', 'Oak Ave', 'Park Rd'])}`,
  zipCode: () => randomInt(10000, 99999).toString(),
  price: () => +(randomInt(10, 1000) + Math.random()).toFixed(2),
  quantity: () => randomInt(1, 100),
  rating: () => +(randomInt(1, 5) + Math.random()).toFixed(1),
  status: () => randomFrom(statuses),
  isActive: () => Math.random() > 0.5,
  createdAt: () => new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000)).toISOString(),
  title: () => ['Amazing', 'Premium', 'Best', 'Pro'][randomInt(0, 3)] + ' ' + ['Product', 'Item', 'Widget'][randomInt(0, 2)],
  description: () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  url: () => `https://example.com/${randomString(8)}`,
  imageUrl: () => `https://picsum.photos/seed/${randomString(8)}/400/300`,
};

// Pattern matching
const patterns: Array<{ match: (k: string) => boolean; gen: string }> = [
  { match: k => k === 'id' || k === '_id', gen: 'id' },
  { match: k => k === 'uuid' || k === 'guid', gen: 'uuid' },
  { match: k => k === 'email' || k.includes('email'), gen: 'email' },
  { match: k => k === 'phone' || k.includes('phone') || k.includes('mobile'), gen: 'phone' },
  { match: k => k === 'firstname' || k === 'first_name', gen: 'firstName' },
  { match: k => k === 'lastname' || k === 'last_name', gen: 'lastName' },
  { match: k => k === 'name' || k === 'fullname' || k.includes('name'), gen: 'fullName' },
  { match: k => k === 'avatar' || k.includes('avatar') || k.includes('profileimage'), gen: 'avatar' },
  { match: k => k === 'city', gen: 'city' },
  { match: k => k === 'country', gen: 'country' },
  { match: k => k === 'address' || k.includes('address'), gen: 'address' },
  { match: k => k.includes('zip') || k.includes('postal'), gen: 'zipCode' },
  { match: k => k === 'price' || k.includes('price') || k.includes('amount'), gen: 'price' },
  { match: k => k === 'quantity' || k === 'qty' || k === 'stock', gen: 'quantity' },
  { match: k => k === 'rating' || k === 'score', gen: 'rating' },
  { match: k => k === 'status' || k === 'state', gen: 'status' },
  { match: k => k.startsWith('is') || k.startsWith('has') || k.startsWith('can'), gen: 'isActive' },
  { match: k => k.includes('date') || k.endsWith('at') || k.endsWith('_at'), gen: 'createdAt' },
  { match: k => k === 'title' || k.includes('title'), gen: 'title' },
  { match: k => k === 'description' || k === 'desc' || k.includes('description'), gen: 'description' },
  { match: k => k === 'url' || k === 'link' || k.endsWith('url'), gen: 'url' },
  { match: k => k.includes('image') || k.includes('img') || k.includes('photo'), gen: 'imageUrl' },
];

function findGenerator(key: string): (() => unknown) | null {
  const k = key.toLowerCase();
  for (const p of patterns) {
    if (p.match(k)) return generators[p.gen];
  }
  return null;
}

// ============================================
// Core Functions
// ============================================

function extractEmptyFields(obj: Record<string, unknown>, path = ''): FieldInfo[] {
  const fields: FieldInfo[] = [];
  
  for (const key in obj) {
    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key;
    
    if (value === null || value === undefined || value === '') {
      fields.push({ key, path: currentPath, value });
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      fields.push(...extractEmptyFields(value as Record<string, unknown>, currentPath));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          fields.push(...extractEmptyFields(item as Record<string, unknown>, `${currentPath}[${index}]`));
        }
      });
    }
  }
  
  return fields;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
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
  current[lastPart] = value;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================
// AI Generation
// ============================================

async function generateWithAI(
  fields: FieldInfo[],
  apiKey: string,
  context?: string
): Promise<Record<string, unknown>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  
  const fieldDescriptions = fields.map(f => `- "${f.path}": key name is "${f.key}"`).join('\n');
  
  const prompt = `You are a smart mock data generator. Generate realistic values for these empty/null fields based on their key names.

FIELDS TO FILL:
${fieldDescriptions}

${context ? `CONTEXT: ${context}\n` : ''}

RULES:
1. Infer data type from field name (email → email format, firstName → person name, etc.)
2. Generate realistic, diverse data
3. Return ONLY valid JSON with paths as keys, no markdown, no explanation

Example format:
{
  "user.email": "john.doe@example.com",
  "user.firstName": "John"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Clean response
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];
  
  return JSON.parse(cleaned);
}

async function generateSchemaWithAI(
  schema: string,
  count: number,
  apiKey: string,
  context?: string
): Promise<unknown> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  
  const prompt = `Generate ${count} realistic mock object(s) based on this schema/interface.

SCHEMA:
${schema}

${context ? `CONTEXT: ${context}\n` : ''}

RULES:
1. Generate realistic, contextually appropriate data
2. Make data diverse, not repetitive
3. Return ONLY valid JSON, no markdown, no explanation
${count === 1 ? 'Return a single JSON object.' : `Return a JSON array with exactly ${count} objects.`}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) cleaned = jsonMatch[0];
  
  return JSON.parse(cleaned);
}

// ============================================
// Demo Component
// ============================================


const sampleSchemas = {
  user: `interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  age: number;
  isVerified: boolean;
  createdAt: string;
}`,
  product: `interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  rating: number;
  inStock: boolean;
  imageUrl: string;
}`,
  employee: `interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
}`,
};

function JsonHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
  
  return (
    <pre 
      className="code-editor text-sm overflow-auto"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<'fill' | 'generate'>('fill');
  const [inputJson, setInputJson] = useState('{\n  "id": null,\n  "firstName": null,\n  "email": "",\n  "phone": null\n}');
  const [schema, setSchema] = useState(sampleSchemas.user);
  const [count, setCount] = useState(1);
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFill = useCallback(async () => {
    setLoading(true);
    setError('');
    setOutput('');
    
    try {
      const obj = JSON.parse(inputJson);
      const cloned = deepClone(obj);
      const fields = extractEmptyFields(cloned);
      
      if (fields.length === 0) {
        setOutput(JSON.stringify(cloned, null, 2));
        setLoading(false);
        return;
      }
      
      // Use AI for all fields if API key is available, otherwise use local patterns as fallback
      if (apiKey) {
        const aiResult = await generateWithAI(fields, apiKey, context);
        for (const [path, value] of Object.entries(aiResult)) {
          setNestedValue(cloned, path, value);
        }
      } else {
        // Fallback to local patterns
        for (const field of fields) {
          const gen = findGenerator(field.key);
          if (gen) {
            setNestedValue(cloned, field.path, gen());
          } else {
            setNestedValue(cloned, field.path, `mock_${field.key}`);
          }
        }
      }
      
      setOutput(JSON.stringify(cloned, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [inputJson, apiKey, context]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError('');
    setOutput('');
    
    try {
      if (!apiKey) {
        throw new Error('API key is required for schema generation');
      }
      
      const result = await generateSchemaWithAI(schema, count, apiKey, context);
      setOutput(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [schema, count, apiKey, context]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎭</span>
            <div>
              <h1 className="text-xl font-bold gradient-text">Smart JSON Mocker</h1>
              <p className="text-xs text-gray-400">AI-Powered Mock Data Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/your-username/smart-json-mocker" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="https://www.npmjs.com/package/smart-json-mocker"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              npm install
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* API Key Input */}
        <div className="mb-8 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Google Gemini API Key (Free)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm whitespace-nowrap"
            >
              Get free API key →
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 API key enables AI-powered generation. Without it, fill mode uses built-in patterns as fallback.
          </p>
        </div>


        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('fill')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'fill'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Fill Empty Values
          </button>
          <button
            onClick={() => setMode('generate')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'generate'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Generate from Schema
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-200">
                {mode === 'fill' ? 'Input JSON (with nulls/empty values)' : 'Schema / Interface'}
              </h2>
              {/* {mode === 'generate' && (
                <select
                  onChange={(e) => setSchema(sampleSchemas[e.target.value as keyof typeof sampleSchemas])}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300"
                >
                  <option value="user">User</option>
                  <option value="product">Product</option>
                  <option value="employee">Employee</option>
                </select>
              )} */}
            </div>
            <div className="p-4">
              <textarea
                value={mode === 'fill' ? inputJson : schema}
                onChange={(e) => mode === 'fill' ? setInputJson(e.target.value) : setSchema(e.target.value)}
                className="w-full h-80 bg-gray-950 border border-gray-800 rounded-lg p-4 code-editor text-sm text-gray-300 focus:outline-none focus:border-purple-500 resize-none"
                spellCheck={false}
              />
            </div>
            
            {/* Options */}
            <div className="px-4 pb-4 space-y-3">
              {mode === 'generate' && (
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-400">Count:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add context (e.g., 'Saudi e-commerce products')"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                />
              </div>


              <button
                onClick={mode === 'fill' ? handleFill : handleGenerate}
                disabled={loading || (mode === 'generate' && !apiKey)}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  loading
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : mode === 'fill' ? (
                  '🪄 Fill Empty Values'
                ) : (
                  '✨ Generate Mock Data'
                )}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-200">Output</h2>
              {output && (
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Copy
                </button>
              )}
            </div>
            <div className="p-4 h-[calc(100%-52px)] overflow-auto">
              {error ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
                  {error}
                </div>
              ) : output ? (
                <JsonHighlight json={output} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600">
                  <p>Output will appear here...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8 gradient-text">
            Why Smart JSON Mocker?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-lg mb-2">AI-Powered Intelligence</h3>
              <p className="text-gray-400 text-sm">
                Uses Google Gemini to understand context and generate realistic, appropriate mock data based on field names.
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="font-semibold text-lg mb-2">100% Free</h3>
              <p className="text-gray-400 text-sm">
                Uses Gemini's generous free tier (1500 requests/day). Fully AI-powered generation.
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Developer Friendly</h3>
              <p className="text-gray-400 text-sm">
                Simple API, TypeScript support, Axios/Fetch interceptors. Perfect for frontend development.
              </p>
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section className="mt-16 bg-gray-900/50 rounded-xl border border-gray-800 p-8">
          <h2 className="text-xl font-bold mb-6">Quick Start</h2>
          <div className="space-y-4">
            <div className="bg-gray-950 rounded-lg p-4">
              <code className="text-green-400">npm install smart-json-mocker</code>
            </div>
            
            <div className="text-sm font-medium text-gray-300 mb-2">1. Fill Empty Values</div>
            <div className="bg-gray-950 rounded-lg p-4 code-editor text-sm overflow-auto">
              <pre className="text-gray-300">{`import { quickSetup, fill } from 'smart-json-mocker';

// Initialize (API key optional)
quickSetup('your-gemini-api-key');

// Fill null/empty values
const apiResponse = { firstName: null, email: '', phone: null };
const filledData = await fill(apiResponse);

console.log(filledData);
// { firstName: 'John', email: 'john@example.com', phone: '+1-555-123-4567' }`}</pre>
            </div>

            <div className="text-sm font-medium text-gray-300 mb-2 mt-6">2. Generate from TypeScript Interfaces</div>
            <div className="bg-gray-950 rounded-lg p-4 code-editor text-sm overflow-auto">
              <pre className="text-gray-300">{`import { generateFromInterface, generateManyFromInterface } from 'smart-json-mocker';

// Define your interface
const userInterface = \`interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  isActive: boolean;
}\`;

// Generate single user with context
const user = await generateFromInterface(
  userInterface,
  'Generate realistic user for a social media platform'
);

// Generate multiple users
const users = await generateManyFromInterface(
  userInterface,
  5,
  'Diverse international users for testing'
);`}</pre>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>Made with ❤️ for developers who are tired of null values</p>
        <p className="mt-2">
          <a href="https://github.com/your-username/smart-json-mocker" className="text-purple-400 hover:text-purple-300">
            GitHub
          </a>
          {' • '}
          <a href="https://www.npmjs.com/package/smart-json-mocker" className="text-purple-400 hover:text-purple-300">
            npm
          </a>
        </p>
      </footer>
    </div>
  );
}
