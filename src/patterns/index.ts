/**
 * Built-in patterns for local mock data generation
 * These patterns handle common field names without needing AI
 */

import type { PatternMatcher } from '../types';
import { randomInt, randomFrom, generateUUID, randomString } from '../utils';

// ============================================
// Data Sets
// ============================================

const firstNames = [
  'Muhammad', 'Ahmed', 'Omar', 'Ali', 'Yusuf', 'Ibrahim', 'Hassan', 'Khalid',
  'Sara', 'Fatima', 'Aisha', 'Maryam', 'Layla', 'Noor', 'Zainab', 'Hana',
  'James', 'John', 'Michael', 'David', 'Emma', 'Olivia', 'Sophia', 'Ava',
  'Carlos', 'Maria', 'Wei', 'Yuki', 'Priya', 'Arjun', 'Anna', 'Max'
];

const lastNames = [
  'Al-Hassan', 'Khan', 'Ali', 'Rahman', 'Ibrahim', 'Malik', 'Ahmad', 'Hussein',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Lee', 'Kim'
];

const domains = [
  'gmail.com', 'outlook.com', 'yahoo.com', 'company.com', 'example.org',
  'email.com', 'mail.com', 'business.net', 'work.io'
];

const cities = [
  'Riyadh', 'Jeddah', 'Dubai', 'Cairo', 'London', 'New York', 'Tokyo',
  'Paris', 'Berlin', 'Sydney', 'Toronto', 'Singapore', 'Mumbai', 'Shanghai'
];

const countries = [
  'Saudi Arabia', 'United Arab Emirates', 'Egypt', 'United States', 'United Kingdom',
  'Germany', 'France', 'Japan', 'Australia', 'Canada', 'India', 'China', 'Brazil'
];

const streets = [
  'Main Street', 'Oak Avenue', 'Park Road', 'King Fahd Road', 'Olaya Street',
  'High Street', 'Broadway', 'Market Street', 'First Avenue', 'Second Street'
];

const companies = [
  'TechCorp', 'Global Solutions', 'Digital Innovations', 'Smart Systems',
  'Future Tech', 'Cloud Services', 'Data Dynamics', 'Web Solutions'
];

const jobTitles = [
  'Software Engineer', 'Product Manager', 'Designer', 'Data Analyst',
  'Marketing Manager', 'Sales Representative', 'HR Manager', 'CEO', 'CTO'
];

const productNames = [
  'Premium Widget', 'Smart Device', 'Pro Tool', 'Essential Kit',
  'Deluxe Package', 'Basic Plan', 'Advanced System', 'Ultra Pro'
];

const colors = [
  'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Black', 'White', 'Gray'
];

const categories = [
  'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books',
  'Toys', 'Food', 'Health', 'Beauty', 'Automotive'
];

const statuses = [
  'active', 'pending', 'completed', 'cancelled', 'processing', 'shipped', 'delivered'
];

const currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'JPY', 'CNY', 'INR'];

const loremWords = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore'
];

// ============================================
// Generator Functions
// ============================================

const generators = {
  // Identity
  uuid: () => generateUUID(),
  id: () => randomInt(1, 999999),
  
  // Personal
  firstName: () => randomFrom(firstNames),
  lastName: () => randomFrom(lastNames),
  fullName: () => `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
  username: () => `${randomFrom(firstNames).toLowerCase()}${randomInt(100, 999)}`,
  email: () => `${randomFrom(firstNames).toLowerCase()}${randomInt(10, 99)}@${randomFrom(domains)}`,
  phone: () => `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
  avatar: () => `https://i.pravatar.cc/150?u=${randomInt(1, 1000)}`,
  age: () => randomInt(18, 65),
  gender: () => randomFrom(['male', 'female', 'other']),
  bio: () => `${randomFrom(firstNames)} is a ${randomFrom(jobTitles)} with ${randomInt(1, 20)} years of experience.`,
  
  // Location
  city: () => randomFrom(cities),
  country: () => randomFrom(countries),
  street: () => `${randomInt(1, 9999)} ${randomFrom(streets)}`,
  address: () => `${randomInt(1, 9999)} ${randomFrom(streets)}, ${randomFrom(cities)}`,
  zipCode: () => randomInt(10000, 99999).toString(),
  postalCode: () => randomInt(10000, 99999).toString(),
  latitude: () => +(randomInt(-90, 90) + Math.random()).toFixed(6),
  longitude: () => +(randomInt(-180, 180) + Math.random()).toFixed(6),
  
  // Business
  company: () => randomFrom(companies),
  jobTitle: () => randomFrom(jobTitles),
  department: () => randomFrom(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']),
  
  // E-commerce
  productName: () => `${randomFrom(colors)} ${randomFrom(productNames)}`,
  price: () => +(randomInt(10, 1000) + Math.random()).toFixed(2),
  quantity: () => randomInt(1, 100),
  sku: () => `SKU-${randomString(8).toUpperCase()}`,
  category: () => randomFrom(categories),
  color: () => randomFrom(colors),
  size: () => randomFrom(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  brand: () => randomFrom(companies),
  rating: () => +(randomInt(1, 5) + Math.random()).toFixed(1),
  
  // Financial
  amount: () => +(randomInt(100, 10000) + Math.random()).toFixed(2),
  currency: () => randomFrom(currencies),
  accountNumber: () => randomInt(1000000000, 9999999999).toString(),
  cardNumber: () => `****-****-****-${randomInt(1000, 9999)}`,
  
  // Dates
  date: () => new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
  datetime: () => new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000)).toISOString(),
  timestamp: () => Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000),
  time: () => `${randomInt(0, 23).toString().padStart(2, '0')}:${randomInt(0, 59).toString().padStart(2, '0')}`,
  
  // URLs
  url: () => `https://example.com/${randomString(8)}`,
  imageUrl: () => `https://picsum.photos/seed/${randomString(8)}/400/300`,
  websiteUrl: () => `https://www.${randomFrom(companies).toLowerCase().replace(/\s/g, '')}.com`,
  
  // Content
  title: () => loremWords.slice(0, randomInt(3, 6)).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  description: () => loremWords.slice(0, randomInt(10, 20)).join(' ') + '.',
  paragraph: () => Array(randomInt(2, 4)).fill(null).map(() => 
    loremWords.slice(0, randomInt(8, 15)).join(' ') + '.'
  ).join(' '),
  content: () => Array(randomInt(3, 5)).fill(null).map(() => 
    loremWords.slice(0, randomInt(15, 25)).join(' ') + '.'
  ).join('\n\n'),
  
  // Status
  status: () => randomFrom(statuses),
  isActive: () => Math.random() > 0.3,
  isVerified: () => Math.random() > 0.5,
  isEnabled: () => Math.random() > 0.2,
  
  // Counts
  count: () => randomInt(0, 1000),
  total: () => randomInt(1, 10000),
  
  // Technical
  ip: () => `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`,
  mac: () => Array(6).fill(null).map(() => randomInt(0, 255).toString(16).padStart(2, '0')).join(':'),
  version: () => `${randomInt(1, 10)}.${randomInt(0, 20)}.${randomInt(0, 100)}`,
  token: () => randomString(32),
  hash: () => randomString(64),
  
  // Tags
  tags: () => Array(randomInt(2, 5)).fill(null).map(() => randomFrom(categories).toLowerCase()),
};

// ============================================
// Pattern Matchers
// ============================================

/**
 * Create a pattern matcher from a generator
 */
function createMatcher(
  name: string,
  match: (key: string) => boolean,
  generator: () => unknown,
  priority: number = 50
): PatternMatcher {
  return {
    name,
    priority,
    match: (key) => match(key.toLowerCase()),
    generate: generator,
  };
}

/**
 * All built-in patterns sorted by priority
 */
export const builtInPatterns: PatternMatcher[] = [
  // Exact matches (highest priority)
  createMatcher('uuid', k => k === 'uuid' || k === 'guid', generators.uuid, 100),
  createMatcher('id', k => k === 'id' || k === '_id', generators.id, 100),
  createMatcher('email', k => k === 'email' || k === 'mail', generators.email, 100),
  createMatcher('phone', k => k === 'phone' || k === 'mobile' || k === 'telephone', generators.phone, 100),
  createMatcher('avatar', k => k === 'avatar' || k === 'profilepicture' || k === 'profileimage', generators.avatar, 100),
  createMatcher('username', k => k === 'username' || k === 'login', generators.username, 100),
  createMatcher('password', k => k === 'password' || k === 'passwd', () => randomString(12), 100),
  
  // Name patterns
  createMatcher('firstName', k => k === 'firstname' || k === 'first_name' || k === 'givenname', generators.firstName, 90),
  createMatcher('lastName', k => k === 'lastname' || k === 'last_name' || k === 'surname' || k === 'familyname', generators.lastName, 90),
  createMatcher('fullName', k => k === 'fullname' || k === 'full_name' || k === 'name' || k === 'displayname', generators.fullName, 85),
  
  // Location exact
  createMatcher('city', k => k === 'city' || k === 'town', generators.city, 90),
  createMatcher('country', k => k === 'country' || k === 'nation', generators.country, 90),
  createMatcher('street', k => k === 'street' || k === 'streetname', generators.street, 90),
  createMatcher('zipCode', k => k === 'zipcode' || k === 'zip' || k === 'postalcode' || k === 'postal', generators.zipCode, 90),
  createMatcher('address', k => k === 'address' || k === 'location', generators.address, 85),
  
  // Date exact
  createMatcher('createdAt', k => k === 'createdat' || k === 'created_at' || k === 'creationdate', generators.datetime, 90),
  createMatcher('updatedAt', k => k === 'updatedat' || k === 'updated_at' || k === 'modifiedat', generators.datetime, 90),
  createMatcher('deletedAt', k => k === 'deletedat' || k === 'deleted_at', generators.datetime, 90),
  createMatcher('birthDate', k => k === 'birthdate' || k === 'birthday' || k === 'dob' || k === 'dateofbirth', generators.date, 90),
  
  // Business
  createMatcher('company', k => k === 'company' || k === 'organization' || k === 'org', generators.company, 90),
  createMatcher('jobTitle', k => k === 'jobtitle' || k === 'job_title' || k === 'title' || k === 'position' || k === 'role', generators.jobTitle, 85),
  
  // E-commerce exact
  createMatcher('price', k => k === 'price' || k === 'cost' || k === 'amount', generators.price, 90),
  createMatcher('quantity', k => k === 'quantity' || k === 'qty' || k === 'stock', generators.quantity, 90),
  createMatcher('sku', k => k === 'sku' || k === 'productcode', generators.sku, 90),
  createMatcher('category', k => k === 'category' || k === 'type', generators.category, 85),
  createMatcher('color', k => k === 'color' || k === 'colour', generators.color, 90),
  createMatcher('rating', k => k === 'rating' || k === 'score' || k === 'stars', generators.rating, 90),
  
  // Status
  createMatcher('status', k => k === 'status' || k === 'state', generators.status, 90),
  
  // Content
  createMatcher('description', k => k === 'description' || k === 'desc' || k === 'summary', generators.description, 85),
  createMatcher('content', k => k === 'content' || k === 'body' || k === 'text', generators.content, 85),
  
  // URL patterns
  createMatcher('url', k => k === 'url' || k === 'link' || k === 'href', generators.url, 90),
  createMatcher('website', k => k === 'website' || k === 'site' || k === 'homepage', generators.websiteUrl, 90),
  
  // Contains patterns (medium priority)
  createMatcher('containsEmail', k => k.includes('email'), generators.email, 70),
  createMatcher('containsPhone', k => k.includes('phone') || k.includes('mobile') || k.includes('tel'), generators.phone, 70),
  createMatcher('containsName', k => k.includes('name') && !k.includes('file') && !k.includes('user'), generators.fullName, 60),
  createMatcher('containsUrl', k => k.includes('url') || k.includes('link'), generators.url, 70),
  createMatcher('containsImage', k => k.includes('image') || k.includes('img') || k.includes('photo') || k.includes('picture'), generators.imageUrl, 70),
  createMatcher('containsPrice', k => k.includes('price') || k.includes('cost') || k.includes('fee'), generators.price, 70),
  createMatcher('containsDate', k => k.includes('date') || k.includes('time'), generators.datetime, 65),
  createMatcher('containsAddress', k => k.includes('address') || k.includes('location'), generators.address, 65),
  createMatcher('containsCity', k => k.includes('city'), generators.city, 70),
  createMatcher('containsCountry', k => k.includes('country'), generators.country, 70),
  createMatcher('containsDescription', k => k.includes('description') || k.includes('desc'), generators.description, 65),
  createMatcher('containsTitle', k => k.includes('title') || k.includes('heading'), generators.title, 65),
  createMatcher('containsCount', k => k.includes('count') || k.includes('total') || k.includes('num'), generators.count, 65),
  
  // Suffix patterns
  createMatcher('suffixId', k => k.endsWith('id') && k !== 'id', generators.id, 60),
  createMatcher('suffixAt', k => k.endsWith('at') || k.endsWith('_at'), generators.datetime, 60),
  createMatcher('suffixDate', k => k.endsWith('date'), generators.date, 60),
  createMatcher('suffixTime', k => k.endsWith('time'), generators.time, 60),
  createMatcher('suffixUrl', k => k.endsWith('url'), generators.url, 60),
  createMatcher('suffixCount', k => k.endsWith('count'), generators.count, 60),
  
  // Prefix patterns
  createMatcher('prefixIs', k => k.startsWith('is') || k.startsWith('is_'), generators.isActive, 55),
  createMatcher('prefixHas', k => k.startsWith('has') || k.startsWith('has_'), generators.isActive, 55),
  createMatcher('prefixCan', k => k.startsWith('can') || k.startsWith('can_'), generators.isActive, 55),
  createMatcher('prefixTotal', k => k.startsWith('total') || k.startsWith('total_'), generators.total, 55),
  createMatcher('prefixNum', k => k.startsWith('num') || k.startsWith('num_'), generators.count, 55),
  
  // Geo patterns
  createMatcher('latitude', k => k === 'lat' || k === 'latitude', generators.latitude, 90),
  createMatcher('longitude', k => k === 'lng' || k === 'lon' || k === 'longitude', generators.longitude, 90),
  
  // Technical
  createMatcher('ip', k => k === 'ip' || k === 'ipaddress' || k === 'ip_address', generators.ip, 90),
  createMatcher('token', k => k === 'token' || k === 'accesstoken' || k === 'refreshtoken', generators.token, 90),
  createMatcher('version', k => k === 'version' || k === 'ver', generators.version, 90),
].sort((a, b) => b.priority - a.priority);

/**
 * Try to find a matching pattern for a key
 */
export function findPattern(key: string, path: string): PatternMatcher | null {
  for (const pattern of builtInPatterns) {
    if (pattern.match(key, path)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Generate a value using local patterns
 */
export function generateLocal(key: string, path: string = key): unknown {
  const pattern = findPattern(key, path);
  if (pattern) {
    return pattern.generate();
  }
  return null;
}

/**
 * Get all available generators
 */
export function getGenerators() {
  return generators;
}

export { generators };
