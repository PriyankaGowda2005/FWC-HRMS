/**
 * JWT Token Utility Functions
 * Helper functions for decoding and checking JWT token expiration
 */

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token string
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time
 * @param {string} token - JWT token string
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000);
};

/**
 * Get time until token expires in milliseconds
 * @param {string} token - JWT token string
 * @returns {number|null} - Milliseconds until expiration or null if invalid
 */
export const getTimeUntilExpiration = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return null;
  
  return expiration.getTime() - Date.now();
};

/**
 * Get time until token expires in minutes
 * @param {string} token - JWT token string
 * @returns {number|null} - Minutes until expiration or null if invalid
 */
export const getMinutesUntilExpiration = (token) => {
  const ms = getTimeUntilExpiration(token);
  if (ms === null) return null;
  
  return Math.floor(ms / (1000 * 60));
};

/**
 * Check if token will expire within specified minutes
 * @param {string} token - JWT token string
 * @param {number} minutes - Minutes threshold
 * @returns {boolean} - True if token expires within the threshold
 */
export const expiresWithinMinutes = (token, minutes) => {
  const minutesUntilExpiration = getMinutesUntilExpiration(token);
  if (minutesUntilExpiration === null) return true;
  
  return minutesUntilExpiration <= minutes && minutesUntilExpiration > 0;
};

