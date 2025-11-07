import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { getMinutesUntilExpiration, isTokenExpired } from '../utils/tokenUtils';
import Modal from './UI/Modal';
import Button from './UI/Button';
import Icon from './UI/Icon';

/**
 * Session Expiry Warning Component
 * Monitors token expiration and shows warning before session expires
 */
const SessionExpiryWarning = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      // If no tokens, don't show warning
      if (!token && !refreshToken) {
        setShowWarning(false);
        return;
      }

      // Check if access token is expired
      if (token && isTokenExpired(token)) {
        // Token expired - try to refresh automatically
        handleAutoRefresh();
        return;
      }

      // Check if access token will expire soon (within 5 minutes)
      if (token) {
        const minutes = getMinutesUntilExpiration(token);
        setMinutesRemaining(minutes);

        // Show warning if token expires within 5 minutes and we haven't shown it yet
        if (minutes !== null && minutes <= 5 && minutes > 0 && !warningShown) {
          setShowWarning(true);
          setWarningShown(true);
        }

        // Auto-logout if token is expired
        if (minutes !== null && minutes <= 0) {
          handleAutoRefresh();
        }
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);

    return () => clearInterval(interval);
  }, [user, warningShown]);

  const handleAutoRefresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken || isTokenExpired(refreshToken)) {
      // Refresh token expired - logout
      handleLogout();
      return;
    }

    // Try to refresh token automatically
    try {
      setIsRefreshing(true);
      const response = await authAPI.refreshToken(refreshToken);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        setShowWarning(false);
        setWarningShown(false);
        setMinutesRemaining(null);
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
      handleLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      handleLogout();
      return;
    }

    try {
      setIsRefreshing(true);
      const response = await authAPI.refreshToken(refreshToken);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        setShowWarning(false);
        setWarningShown(false);
        setMinutesRemaining(null);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
    window.location.href = '/login';
  };

  const handleContinue = () => {
    setShowWarning(false);
    // Reset warning flag so it can show again if needed
    setTimeout(() => setWarningShown(false), 60000);
  };

  if (!showWarning) return null;

  return (
    <Modal
      isOpen={showWarning}
      onClose={handleContinue}
      title="Session Expiring Soon"
      size="md"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon 
              name="exclamation-triangle" 
              className="w-6 h-6 text-amber-500" 
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              Your session will expire in{' '}
              <span className="font-semibold text-amber-600">
                {minutesRemaining !== null 
                  ? `${Math.max(0, minutesRemaining)} minute${minutesRemaining !== 1 ? 's' : ''}`
                  : 'a few moments'
                }
              </span>
              .
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Would you like to extend your session?
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleLogout}
            disabled={isRefreshing}
          >
            Logout
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            loading={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Extend Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionExpiryWarning;

