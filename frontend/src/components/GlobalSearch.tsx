import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './GlobalSearch.css';

interface SearchResult {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  description?: string;
  type: string;
  created_at: string;
}

interface SearchResults {
  journals: SearchResult[];
  tasks: SearchResult[];
  habits: SearchResult[];
  reviews: SearchResult[];
  documents: SearchResult[];
  projects: SearchResult[];
  financial: SearchResult[];
  career: SearchResult[];
  technical: SearchResult[];
  books: SearchResult[];
}

const GlobalSearch = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const { data: searchResults, isLoading } = useQuery<{ query: string; total_results: number; results: SearchResults }>({
    queryKey: ['global-search', searchQuery, selectedModules],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (selectedModules.length > 0) {
        params.append('modules', selectedModules.join(','));
      }
      return api.get(`/search?${params.toString()}`).then(res => res.data);
    },
    enabled: searchQuery.trim().length >= 2,
  });

  const modules = [
    { id: 'journals', label: 'Journals', icon: '📝' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'habits', label: 'Habits', icon: '✅' },
    { id: 'reviews', label: 'Reviews', icon: '🔍' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'career', label: 'Career', icon: '💼' },
    { id: 'technical', label: 'Technical', icon: '🧠' },
    { id: 'books', label: 'Books', icon: '📚' },
  ];

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      journal: 'Journal',
      task: 'Task',
      habit: 'Habit',
      review: 'Review',
      document: 'Document',
      project: 'Project',
      transaction: 'Transaction',
      career_goal: 'Career Goal',
      skill: 'Skill',
      practice: 'Practice',
      book: 'Book',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      journal: '📝',
      task: '📋',
      habit: '✅',
      review: '🔍',
      document: '📁',
      project: '🚀',
      transaction: '💰',
      career_goal: '🎯',
      skill: '🛠️',
      practice: '🧠',
      book: '📚',
    };
    return icons[type] || '📄';
  };

  const handleResultClick = (module: string) => {
    // Map module to dashboard routes
    const routeMap: { [key: string]: string } = {
      journals: '/dashboard/journals',
      tasks: '/dashboard/tasks',
      habits: '/dashboard/habits',
      reviews: '/dashboard/reviews',
      documents: '/dashboard/documents',
      projects: '/dashboard/projects',
      financial: '/dashboard/financial',
      career: '/dashboard/career',
      technical: '/dashboard/technical-growth',
      books: '/dashboard/books',
    };

    const route = routeMap[module];
    if (route) {
      onClose(); // Close the search modal
      navigate(route);
    }
  };

  const modalContent = (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <h2>🔍 Global Search</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="global-search-input-container">
          <input
            type="text"
            className="global-search-input"
            placeholder="Search across all modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="global-search-filters">
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Filter by module:</p>
          <div className="module-filters">
            {modules.map(module => (
              <button
                key={module.id}
                type="button"
                className={`module-filter-btn ${selectedModules.includes(module.id) ? 'active' : ''}`}
                onClick={() => toggleModule(module.id)}
              >
                {module.icon} {module.label}
              </button>
            ))}
          </div>
        </div>

        {searchQuery.trim().length >= 2 && (
          <div className="global-search-results">
            {isLoading ? (
              <LoadingSpinner message="Searching..." size="small" />
            ) : searchResults && searchResults.total_results > 0 ? (
              <>
                <p className="results-count">
                  Found {searchResults.total_results} result{searchResults.total_results !== 1 ? 's' : ''}
                </p>
                <div className="search-results-list">
                  {Object.entries(searchResults.results).map(([module, results]) => {
                    if (results.length === 0) return null;
                    return (
                      <div key={module} className="search-results-group">
                        <h3>{modules.find(m => m.id === module)?.icon} {modules.find(m => m.id === module)?.label}</h3>
                        {results.map((result: SearchResult) => (
                          <div 
                            key={result.id} 
                            className="search-result-item"
                            onClick={() => handleResultClick(module)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="result-icon">{getTypeIcon(result.type)}</span>
                            <div className="result-content">
                              <strong>{result.title || result.name || 'Untitled'}</strong>
                              {(result.content || result.description) && (
                                <p className="result-snippet">
                                  {(result.content || result.description || '').substring(0, 100)}...
                                </p>
                              )}
                              <span className="result-meta">
                                {getTypeLabel(result.type)} • {new Date(result.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : searchQuery.trim().length >= 2 ? (
              <p className="no-results">No results found</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GlobalSearch;
