import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'deadline' | 'career_task' | 'reminder' | 'system';
  title: string;
  message: string | null;
  related_module: string | null;
  related_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  scheduled_for: string | null;
  created_at: string;
  read_at: string | null;
}

const Notifications = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () => api.get(`/notifications?unread_only=${showUnreadOnly}`).then(res => res.data),
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then(res => res.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      deadline: '⏰',
      career_task: '💼',
      reminder: '🔔',
      system: 'ℹ️',
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    return colors[priority] || '#6b7280';
  };

  const modalContent = (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h2>
            🔔 Notifications
            {unreadCount && unreadCount.count > 0 && (
              <span className="unread-badge">{unreadCount.count}</span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {unreadCount && unreadCount.count > 0 && (
              <button onClick={() => markAllReadMutation.mutate()} className="btn-secondary" style={{ fontSize: '0.875rem' }}>
                Mark All Read
              </button>
            )}
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>

        <div className="notifications-filters">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={showUnreadOnly ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.875rem' }}
          >
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </button>
        </div>

        <div className="notifications-list">
          {isLoading ? (
            <LoadingSpinner message="Loading notifications..." size="small" />
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                style={{ borderLeft: `4px solid ${getPriorityColor(notification.priority)}` }}
              >
                <div className="notification-content">
                  <div className="notification-header-row">
                    <span className="notification-icon">{getTypeIcon(notification.type)}</span>
                    <strong className="notification-title">{notification.title}</strong>
                    {!notification.is_read && (
                      <span className="unread-dot"></span>
                    )}
                  </div>
                  {notification.message && (
                    <p className="notification-message">{notification.message}</p>
                  )}
                  <div className="notification-meta">
                    <span className="notification-type">{notification.type.replace('_', ' ')}</span>
                    <span className="notification-date">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(notification.id)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Delete this notification?')) deleteMutation.mutate(notification.id); }}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🔔"
              title="No notifications"
              message={showUnreadOnly ? "You're all caught up!" : "No notifications yet."}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Notifications;
