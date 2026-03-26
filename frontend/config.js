// config.js - API URL Configuration
// This file helps switch between local and production URLs

// Get current hostname
const hostname = window.location.hostname;

// Define API URLs
const API_URLS = {
    local: 'http://localhost:5000/api',
    production: 'https://lpg-booking-api.onrender.com/api'  // ✅ Your actual Render URL
};

// Auto-detect environment
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

// Export API URL
const API_URL = isLocal ? API_URLS.local : API_URLS.production;

// For debugging
console.log(`🌐 API Environment: ${isLocal ? 'Local' : 'Production'}`);
console.log(`📡 API URL: ${API_URL}`);

// Make it available everywhere
window.API_URL = API_URL;