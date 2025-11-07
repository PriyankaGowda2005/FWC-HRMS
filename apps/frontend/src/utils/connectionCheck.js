/**
 * Utility to check backend server connection
 */

const checkBackendConnection = async (baseURL = null) => {
  const apiURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const healthURL = apiURL.replace('/api', '') + '/health';
  
  try {
    const response = await fetch(healthURL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        status: data.status,
        message: 'Backend server is running',
        data
      };
    } else {
      return {
        connected: false,
        status: response.status,
        message: `Backend server responded with status ${response.status}`,
        error: 'Server error'
      };
    }
  } catch (error) {
    return {
      connected: false,
      status: 'error',
      message: 'Cannot connect to backend server',
      error: error.message,
      suggestions: [
        'Ensure the backend server is running: cd apps/backend && npm start',
        `Check if the server is accessible at: ${healthURL}`,
        'Verify the backend port (default: 3001) is not in use',
        'Check firewall settings if on a network'
      ]
    };
  }
};

export default checkBackendConnection;

