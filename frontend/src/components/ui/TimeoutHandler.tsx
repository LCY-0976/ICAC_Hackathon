import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface TimeoutHandlerProps {
  isVisible: boolean;
  error: string;
  onRetry: () => void;
  onDismiss?: () => void;
}

export function TimeoutHandler({ isVisible, error, onRetry, onDismiss }: TimeoutHandlerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible) return null;

  const isTimeoutError = error.toLowerCase().includes('timeout');
  const isNetworkError = error.toLowerCase().includes('network');

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {!isOnline ? (
              <WifiOff className="text-red-500" size={20} />
            ) : isTimeoutError ? (
              <AlertTriangle className="text-yellow-500" size={20} />
            ) : (
              <Wifi className="text-yellow-500" size={20} />
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">
              {!isOnline
                ? 'Connection Lost'
                : isTimeoutError
                ? 'Request Timed Out'
                : 'Connection Issue'
              }
            </h4>
            
            <p className="text-sm text-gray-600 mb-3">
              {!isOnline
                ? 'Your internet connection seems to be offline. Please check your connection and try again.'
                : isTimeoutError
                ? 'The request is taking longer than expected. This might be due to a slow connection or server issues.'
                : error
              }
            </p>
            
            {!isOnline && (
              <div className="text-xs text-gray-500 mb-3">
                💡 Try refreshing the page when your connection is restored
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={!isOnline}
              >
                <RefreshCw size={14} className="mr-2" />
                {isTimeoutError ? 'Retry Request' : 'Try Again'}
              </Button>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for handling timeouts across the app
export function useTimeoutHandler() {
  const [timeoutError, setTimeoutError] = useState<string>('');
  const [showTimeoutHandler, setShowTimeoutHandler] = useState(false);

  const handleTimeout = (error: string) => {
    if (error.toLowerCase().includes('timeout') || 
        error.toLowerCase().includes('network') ||
        !navigator.onLine) {
      setTimeoutError(error);
      setShowTimeoutHandler(true);
    }
  };

  const clearTimeout = () => {
    setTimeoutError('');
    setShowTimeoutHandler(false);
  };

  return {
    timeoutError,
    showTimeoutHandler,
    handleTimeout,
    clearTimeout
  };
}
