import React, { useState } from 'react';
import { useNotificationStore, InAppNotification } from '../modules/notification-center/notification-store';
import { Bell, X } from 'lucide-react';

export const NotificationCenter: React.FC<{ userId: string }> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'inquiry' | 'quotation' | 'order' | 'alert' | 'message'>('all');

  const { getUnreadNotifications, getUserNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  const unreadNotifications = getUnreadNotifications(userId);
  const allNotifications = getUserNotifications(userId);

  const filteredNotifications = filterType === 'all'
    ? allNotifications
    : allNotifications.filter((n: InAppNotification) => n.type === filterType);

  const getIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return '❓';
      case 'quotation':
        return '💬';
      case 'order':
        return '📦';
      case 'alert':
        return '⚠️';
      case 'message':
        return '💌';
      default:
        return '📢';
    }
  };

  const getColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition"
      >
        <Bell size={24} />
        {unreadNotifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-lg">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 p-3 border-b border-gray-200 overflow-x-auto">
            {['all', 'inquiry', 'quotation', 'order', 'alert', 'message'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No notifications found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notif: InAppNotification) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-l-4 ${getColor(notif.priority)} ${
                      notif.status === 'unread' ? 'bg-opacity-100' : 'bg-opacity-50'
                    } cursor-pointer hover:bg-opacity-100 transition`}
                    onClick={() => notif.status === 'unread' && markAsRead(notif.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{getIcon(notif.type)}</span>
                        <div>
                          <p className={`font-semibold ${notif.status === 'unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 ml-7">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
