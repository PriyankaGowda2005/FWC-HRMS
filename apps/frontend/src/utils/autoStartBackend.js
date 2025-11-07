/**
 * Utility to automatically detect and help start backend server
 */

const checkAndSuggestBackendStart = async () => {
  const apiURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const healthURL = apiURL.replace('/api', '') + '/health';
  
  try {
    const response = await fetch(healthURL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      return { connected: true, message: 'Backend is running' };
    }
  } catch (error) {
    // Backend is not running
    return {
      connected: false,
      message: 'Backend server is not running',
      suggestions: [
        'Run START_ALL.bat from the project root to start both servers',
        'Or manually start backend: cd apps/backend && npm start',
        'Then refresh this page'
      ],
      canAutoStart: false // Browser security prevents auto-starting processes
    };
  }
  
  return { connected: false, message: 'Unknown status' };
};

export default checkAndSuggestBackendStart;

