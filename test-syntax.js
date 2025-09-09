// Test if the server.js file has valid syntax
try {
  require('./server.js');
  console.log('✅ Server.js syntax is valid');
} catch (error) {
  console.error('❌ Syntax error in server.js:', error.message);
  console.error('Stack:', error.stack);
}