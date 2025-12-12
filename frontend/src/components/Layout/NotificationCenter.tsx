import React from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { useStore } from '@/store/useStore';
import { formatRelativeTime } from '@/utils/formatters';

export const NotificationCenter: React.FC = () => {
  const ui = useStore((state) => state.ui);
  const removeNotification = useStore((state) => state.removeNotification);
  const markNotificationAsRead = useStore((state) => state.markNotificationAsRead);
  const clearNotifications = useStore((state) => state.clearNotifications);

  const unreadCount = ui.notifications.filter(n => !n.read).length;

  if (ui.notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="space-y-2">
        {ui.notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              relative p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out
              ${notification.type === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-900/20' : ''}
              ${notification.type === 'error' ? 'bg-red-50 border-red-400 dark:bg-red-900/20' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' : ''}
              ${notification.type === 'info' ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20' : ''}
              ${!notification.read ? 'animate-slide-in' : 'opacity-75'}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <BellIcon className={`
                  w-5 h-5
                  ${notification.type === 'success' ? 'text-green-400' : ''}
                  ${notification.type === 'error' ? 'text-red-400' : ''}
                  ${notification.type === 'warning' ? 'text-yellow-400' : ''}
                  ${notification.type === 'info' ? 'text-blue-400' : ''}
                `} />
              </div>

              <div className="ml-3 flex-1">
                <h4 className={`
                  text-sm font-medium
                  ${notification.type === 'success' ? 'text-green-800 dark:text-green-200' : ''}
                  ${notification.type === 'error' ? 'text-red-800 dark:text-red-200' : ''}
                  ${notification.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' : ''}
                  ${notification.type === 'info' ? 'text-blue-800 dark:text-blue-200' : ''}
                `}>
                  {notification.title}
                </h4>

                <p className={`
                  mt-1 text-sm
                  ${notification.type === 'success' ? 'text-green-700 dark:text-green-300' : ''}
                  ${notification.type === 'error' ? 'text-red-700 dark:text-red-300' : ''}
                  ${notification.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : ''}
                  ${notification.type === 'info' ? 'text-blue-700 dark:text-blue-300' : ''}
                `}>
                  {notification.message}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(notification.timestamp)}
                  </span>

                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className={`
                        text-xs font-medium underline hover:no-underline
                        ${notification.type === 'success' ? 'text-green-600 hover:text-green-500' : ''}
                        ${notification.type === 'error' ? 'text-red-600 hover:text-red-500' : ''}
                        ${notification.type === 'warning' ? 'text-yellow-600 hover:text-yellow-500' : ''}
                        ${notification.type === 'info' ? 'text-blue-600 hover:text-blue-500' : ''}
                      `}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
              </div>

              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {unreadCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={clearNotifications}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
