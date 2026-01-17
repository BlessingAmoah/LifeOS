import './EmptyState.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ 
  icon = '📭', 
  title, 
  message, 
  actionLabel, 
  onAction 
}: EmptyStateProps) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-empty-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
