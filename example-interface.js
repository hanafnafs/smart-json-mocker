// Example usage of the new generateFromInterface function
const { createSmartMocker } = require('./dist/index.js');

async function example() {
  // Initialize SmartMocker
  const mocker = createSmartMocker({
    ai: {
      provider: 'gemini',
      apiKey: 'your-api-key-here', // Replace with actual API key
    },
    cache: {
      enabled: true,
      persist: true,
    },
  });

  // TypeScript interface definition
  const userInterface = `
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  address: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}`;

  try {
    console.log('=== Single User Example ===');
    
    // Generate a single user with context
    const user = await mocker.generateFromInterface(
      userInterface,
      'Generate realistic user data for a social media platform'
    );
    
    console.log('Generated User:', JSON.stringify(user, null, 2));

    console.log('\n=== Multiple Users Example ===');
    
    // Generate multiple users
    const users = await mocker.generateManyFromInterface(
      userInterface,
      3,
      'Generate diverse users from different countries for testing'
    );
    
    console.log('Generated Users:', JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: Make sure to provide a valid Gemini API key in the example.');
  }
}

// Run example if API key is provided
if (process.argv.includes('--run')) {
  example();
} else {
  console.log('Example file created. To run it:');
  console.log('1. Add your Gemini API key to the example');
  console.log('2. Run: node example-interface.js --run');
}