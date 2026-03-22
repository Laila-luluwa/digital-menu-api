// Simple test to check if all imports work
import('./src/server.js')
  .then(() => {
    console.log('✓ Server imports are working!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Server error:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  });
