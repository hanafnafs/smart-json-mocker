# 🎭 Smart JSON Mocker

[![npm version](https://badge.fury.io/js/smart-json-mocker.svg)](https://www.npmjs.com/package/smart-json-mocker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

**AI-powered JSON mock data generator** that intelligently fills null/empty values based on key names and types. Perfect for frontend development when backend APIs return incomplete data.

## ✨ Features

- 🤖 **AI-Powered**: Uses Google Gemini (free tier) to generate contextually appropriate mock data
- 🎯 **Smart Key Detection**: Automatically infers data type from key names (email, phone, name, etc.)
- 🔌 **Zero Config**: Works out of the box with 200+ built-in patterns
- 🆓 **100% Free**: Uses Gemini's generous free tier (1500 requests/day)
- 📦 **Lightweight**: Only ~50KB, no heavy dependencies
- 🔄 **Axios/Fetch Interceptors**: Automatically fill API responses
- 🎨 **Customizable**: Add your own patterns and overrides
- 💾 **Caching**: Reduces API calls with smart caching
- 📝 **TypeScript**: Full TypeScript support with type inference

## 🚀 Quick Start

### Installation

```bash
npm install smart-json-mocker
# or
yarn add smart-json-mocker
# or
pnpm add smart-json-mocker
```

### Basic Usage

```typescript
import { quickSetup, fill } from 'smart-json-mocker';

// Initialize with your free Gemini API key
// Get yours at: https://makersuite.google.com/app/apikey
quickSetup('your-gemini-api-key');

// Fill null/empty values in an object
const apiResponse = {
  user: {
    firstName: null,
    lastName: null,
    email: '',
    phone: null,
    avatar: null,
    address: {
      street: null,
      city: null,
      country: null,
    }
  }
};

const filledData = await fill(apiResponse);

console.log(filledData);
// {
//   user: {
//     firstName: 'Muhammad',
//     lastName: 'Al-Hassan',
//     email: 'muhammad.hassan@gmail.com',
//     phone: '+1-555-123-4567',
//     avatar: 'https://i.pravatar.cc/150?u=123',
//     address: {
//       street: '123 Main Street',
//       city: 'Riyadh',
//       country: 'Saudi Arabia',
//     }
//   }
// }
```

### Without AI (Local Patterns Only)

```typescript
import { quickSetup, fill } from 'smart-json-mocker';

// Works without API key using built-in patterns
quickSetup();

const data = await fill({
  email: null,
  firstName: null,
  createdAt: null,
});
// Uses 200+ built-in patterns to fill values
```

## 📖 API Reference

### Initialization

```typescript
import { init, createSmartMocker } from 'smart-json-mocker';

// Option 1: Quick setup
import { quickSetup } from 'smart-json-mocker';
quickSetup('your-api-key'); // With AI
quickSetup(); // Without AI (local patterns only)

// Option 2: Full configuration
const mocker = createSmartMocker({
  ai: {
    provider: 'gemini',
    apiKey: 'your-api-key',
    model: 'gemini-1.5-flash', // optional
    timeout: 30000, // optional
    maxRetries: 3, // optional
  },
  cache: {
    enabled: true,
    persist: true, // Save to localStorage
    ttl: 86400, // 24 hours
  },
  overrides: {
    // Global overrides
    currency: 'SAR',
    country: 'Saudi Arabia',
  },
  debug: false,
});
```

### Fill Empty Values

```typescript
import { fill } from 'smart-json-mocker';

// Basic fill
const filled = await fill(objectWithNulls);

// With options
const filled = await fill(objectWithNulls, {
  nullOnly: true, // Only fill null values
  undefinedOnly: true, // Only fill undefined values
  emptyStringsOnly: true, // Only fill empty strings
  context: 'e-commerce product', // Help AI understand context
  overrides: {
    status: 'active', // Force specific values
    price: () => Math.random() * 100, // Dynamic values
  },
});
```

### Generate Mock Data

```typescript
import { generate, generateMany } from 'smart-json-mocker';

// Generate from TypeScript interface
const user = await generate<User>(`
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    isActive: boolean;
  }
`);

// Generate from object schema
const product = await generate({
  id: 'string',
  name: 'string',
  price: 'number',
  category: 'string',
  inStock: 'boolean',
});

// Generate multiple items
const products = await generateMany(productSchema, 10);

// With context for better AI understanding
const saudiProducts = await generateMany(productSchema, 5, {
  context: 'Saudi Arabian marketplace products with prices in SAR',
});
```

### Custom Overrides

```typescript
import { createSmartMocker } from 'smart-json-mocker';

const mocker = createSmartMocker({
  ai: { provider: 'gemini', apiKey: 'your-key' },
  overrides: {
    // Static values
    currency: 'SAR',
    country: 'Saudi Arabia',
    
    // Dynamic generators
    orderId: () => `ORD-${Date.now()}`,
    
    // Enum values
    status: { enum: ['pending', 'active', 'completed'] },
    
    // Range values
    age: { min: 18, max: 65 },
    
    // Pattern-based
    phone: { pattern: 'phone' },
  },
});

// Add overrides dynamically
mocker.addOverride('customField', 'custom-value');
mocker.addOverride('timestamp', () => new Date().toISOString());

// Remove override
mocker.removeOverride('customField');
```

### Axios Interceptor

```typescript
import axios from 'axios';
import { createSmartMocker, setupAxiosInterceptor } from 'smart-json-mocker';

const mocker = createSmartMocker({
  ai: { provider: 'gemini', apiKey: 'your-key' },
});

// Setup interceptor
const interceptor = setupAxiosInterceptor(axios, mocker, {
  urlPatterns: ['/api/'], // Only intercept these URLs
  excludePatterns: ['/api/auth'], // Exclude these URLs
  methods: ['GET'], // Only intercept GET requests
});

// Now all API responses will have null values filled!
const response = await axios.get('/api/users/1');
// response.data will have all null values filled

// Remove interceptor when done
interceptor.eject();
```

### Fetch Wrapper

```typescript
import { createSmartMocker, setupFetchWrapper } from 'smart-json-mocker';

const mocker = createSmartMocker({
  ai: { provider: 'gemini', apiKey: 'your-key' },
});

// Create wrapped fetch
const smartFetch = setupFetchWrapper(mocker, {
  urlPatterns: ['/api/'],
});

// Use instead of regular fetch
const response = await smartFetch('/api/users/1');
const data = await response.json();
// data will have all null values filled!

// Or patch global fetch (use with caution)
import { patchGlobalFetch } from 'smart-json-mocker';

const restore = patchGlobalFetch(mocker);
// Now all fetch calls are intercepted

// Restore original fetch
restore();
```

## 🎯 Built-in Patterns

Smart JSON Mocker recognizes 200+ common field patterns:

| Category | Patterns |
|----------|----------|
| **Identity** | `id`, `uuid`, `guid`, `_id` |
| **Personal** | `firstName`, `lastName`, `fullName`, `email`, `phone`, `avatar`, `age`, `gender`, `bio` |
| **Location** | `address`, `street`, `city`, `country`, `zipCode`, `latitude`, `longitude` |
| **Business** | `company`, `jobTitle`, `department` |
| **E-commerce** | `price`, `quantity`, `sku`, `category`, `color`, `size`, `rating` |
| **Dates** | `createdAt`, `updatedAt`, `birthDate`, `*Date`, `*At` |
| **URLs** | `url`, `imageUrl`, `website`, `avatar`, `*Url`, `*Link` |
| **Status** | `status`, `isActive`, `isEnabled`, `is*`, `has*`, `can*` |
| **Content** | `title`, `description`, `content`, `bio`, `summary` |
| **Technical** | `ip`, `token`, `version`, `hash` |

## 🆓 Free AI Providers

### Google Gemini (Recommended)

- **Free tier**: 60 requests/minute, 1500 requests/day
- **Get API key**: https://makersuite.google.com/app/apikey

```typescript
quickSetup('your-gemini-api-key');
```

### Local Patterns (No API Key)

- **100% free**: Works offline
- **200+ patterns**: Covers most common fields

```typescript
quickSetup(); // No API key needed
```

## 💡 Use Cases

### 1. Frontend Development with Incomplete APIs

```typescript
// Backend returns incomplete data
const apiResponse = await fetch('/api/user/1');
const user = await apiResponse.json();
// { firstName: null, email: '', phone: null, ... }

// Fill the gaps
const completeUser = await fill(user);
// { firstName: 'John', email: 'john@example.com', phone: '+1-555-123-4567', ... }
```

### 2. Prototyping & Demo Data

```typescript
// Generate realistic demo data
const demoUsers = await generateMany(UserSchema, 100);
const demoProducts = await generateMany(ProductSchema, 50, {
  context: 'Electronics store products',
});
```

### 3. Testing & Development

```typescript
// Create test fixtures
const testUser = await generate<User>(UserInterface);
const testOrders = await generateMany<Order>(OrderInterface, 10);
```

### 4. React/Angular/Vue Development

```typescript
// React example
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(async (data) => {
      // Fill any null values before setting state
      const complete = await fill(data);
      setUser(complete);
    });
  }, [userId]);

  // No more null checks needed!
  return <div>{user?.firstName} {user?.lastName}</div>;
}
```

## 🔧 Advanced Configuration

### Caching

```typescript
const mocker = createSmartMocker({
  ai: { provider: 'gemini', apiKey: 'your-key' },
  cache: {
    enabled: true,
    persist: true, // Survives page refresh (localStorage)
    ttl: 3600, // 1 hour cache
    prefix: 'my-app_', // Custom prefix
  },
});

// Clear cache manually
mocker.clearCache();
```

### Debug Mode

```typescript
const mocker = createSmartMocker({
  ai: { provider: 'gemini', apiKey: 'your-key' },
  debug: true, // Logs all operations
});
```

## 📊 Bundle Size

| Import | Size (gzipped) |
|--------|---------------|
| Full package | ~15KB |
| Core only | ~8KB |
| Local patterns only | ~5KB |

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [Muhammad](https://github.com/your-username)

## 🙏 Credits

- [Google Gemini](https://ai.google.dev/) for the free AI API
- Inspired by [Faker.js](https://fakerjs.dev/) and [json-schema-faker](https://github.com/json-schema-faker/json-schema-faker)

---

<p align="center">
  Made with ❤️ for developers who are tired of null values
</p>
