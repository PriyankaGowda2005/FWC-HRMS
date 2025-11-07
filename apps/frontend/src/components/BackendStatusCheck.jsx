import React, { useState, useEffect } from 'react';
import checkBackendConnection from '../utils/connectionCheck';
import Icon from './UI/Icon';

const BackendStatusCheck = ({ onStatusChange, showInstructions = true }) => {
  const [status, setStatus] = useState('checking');
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await checkBackendConnection();
        setConnectionInfo(result);
        
        if (result.connected) {
          setStatus('connected');
          setRetryCount(0);
        } else {
          setStatus('disconnected');
          // Auto-retry up to 3 times
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
          }
        }
        
        if (onStatusChange) {
          onStatusChange(result);
        }
      } catch (error) {
        setStatus('error');
        setConnectionInfo({ error: error.message });
      }
    };

    checkConnection();
    
    // Check every 10 seconds if disconnected, 30 seconds if connected
    const interval = setInterval(checkConnection, status === 'disconnected' ? 10000 : 30000);
    
    return () => clearInterval(interval);
  }, [onStatusChange, status, retryCount]);

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Checking backend connection...</span>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Icon name="check-circle" className="w-4 h-4" />
        <span>Backend connected</span>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <Icon name="exclamation-triangle" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-2">Backend Server Not Connected</h4>
          <p className="text-sm text-red-700 mb-2">{connectionInfo?.message || 'Cannot connect to backend server'}</p>
          
          {showInstructions && (
            <>
              <div className="bg-white rounded p-3 mt-3 mb-3 border border-red-200">
                <p className="text-sm font-semibold text-red-800 mb-2">Quick Fix:</p>
                <ol className="text-sm text-red-700 list-decimal list-inside space-y-1">
                  <li>Open a new terminal/command prompt</li>
                  <li>Navigate to project root: <code className="bg-red-100 px-1 rounded">cd D:\ATRIA</code></li>
                  <li>Double-click: <code className="bg-red-100 px-1 rounded font-bold">START_ALL.bat</code></li>
                  <li>Wait for "Backend server is running" message</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
              
              {connectionInfo?.suggestions && (
                <ul className="text-sm text-red-600 list-disc list-inside space-y-1 mb-2">
                  {connectionInfo.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </>
          )}
          
          <div className="flex gap-2 mt-3">
            <a
              href="http://localhost:3001/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Check backend health →
            </a>
            {retryCount < 3 && (
              <span className="text-xs text-red-500">
                (Auto-retrying... {retryCount}/3)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendStatusCheck;

