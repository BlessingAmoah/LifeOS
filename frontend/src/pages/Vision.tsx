import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Tabs from '../components/Tabs';
import './Vision.css';

interface VisionBoard {
  id: string;
  title: string;
  vision_type: 'short' | 'long';
  vision_short_term?: string | null;
  vision_current_focus_theme?: string | null;
  vision_top_priorities?: string[];
  vision_season_of_life?: string | null;
  vision_long_term?: string | null;
  vision_career?: string | null;
  vision_lifestyle?: string | null;
  vision_financial?: string | null;
  vision_spiritual?: string | null;
  created_at: string;
  updated_at: string;
}

interface VisionForm {
  title: string;
  vision_type: 'short' | 'long';
  vision_short_term: string;
  vision_current_focus_theme: string;
  vision_season_of_life: string;
  vision_long_term: string;
  vision_career: string;
  vision_lifestyle: string;
  vision_financial: string;
  vision_spiritual: string;
}

const Vision = () => {
  const queryClient = useQueryClient();
  const [selectedBoard, setSelectedBoard] = useState<VisionBoard | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeSection, setActiveSection] = useState<'short' | 'long'>('short');
  const [mainTab, setMainTab] = useState<'short-term' | 'long-term' | 'boards'>('boards');

  const { data: boards, isLoading } = useQuery<VisionBoard[]>({
    queryKey: ['vision-boards'],
    queryFn: () => api.get('/vision-boards').then(res => res.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm<VisionForm>({
    defaultValues: {
      title: '',
      vision_type: 'short',
      vision_short_term: '',
      vision_current_focus_theme: '',
      vision_season_of_life: '',
      vision_long_term: '',
      vision_career: '',
      vision_lifestyle: '',
      vision_financial: '',
      vision_spiritual: '',
    },
  });

  const [visionTopPriorities, setVisionTopPriorities] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: VisionForm & { vision_top_priorities: string[] }) =>
      api.post('/vision-boards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-boards'] });
      setIsCreatingNew(false);
      reset();
      setVisionTopPriorities([]);
      alert('Vision board created successfully!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VisionForm & { vision_top_priorities: string[] }> }) =>
      api.put(`/vision-boards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-boards'] });
      alert('Vision board updated successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vision-boards/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['vision-boards'] });
      if (selectedBoard?.id === id) {
        setSelectedBoard(null);
      }
      alert('Vision board deleted successfully!');
    },
  });

  const handleSelectBoard = (board: VisionBoard) => {
    setSelectedBoard(board);
    setIsCreatingNew(false);
    reset({
      title: board.title,
      vision_type: board.vision_type,
      vision_short_term: board.vision_short_term || '',
      vision_current_focus_theme: board.vision_current_focus_theme || '',
      vision_season_of_life: board.vision_season_of_life || '',
      vision_long_term: board.vision_long_term || '',
      vision_career: board.vision_career || '',
      vision_lifestyle: board.vision_lifestyle || '',
      vision_financial: board.vision_financial || '',
      vision_spiritual: board.vision_spiritual || '',
    });
    setVisionTopPriorities(board.vision_top_priorities || []);
    setActiveSection(board.vision_type);
  };

  const handleCancel = () => {
    setIsCreatingNew(false);
    setSelectedBoard(null);
    reset();
    setVisionTopPriorities([]);
  };

  const onSubmit = (data: VisionForm) => {
    const submitData = {
      ...data,
      vision_top_priorities: visionTopPriorities,
    };

    if (isCreatingNew) {
      createMutation.mutate(submitData);
    } else if (selectedBoard) {
      updateMutation.mutate({ id: selectedBoard.id, data: submitData });
    }
  };

  const addPriority = () => {
    if (newPriority.trim() && visionTopPriorities.length < 3) {
      setVisionTopPriorities([...visionTopPriorities, newPriority.trim()]);
      setNewPriority('');
    }
  };

  const removePriority = (index: number) => {
    setVisionTopPriorities(visionTopPriorities.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="vision-loading">Loading vision boards...</div>;

  const mainTabs = [
    { id: 'short-term', label: 'Short-Term Vision', icon: '🎯' },
    { id: 'long-term', label: 'Long-Term Vision', icon: '🌟' },
    { id: 'boards', label: 'Vision Boards', icon: '📋' },
  ];

  const filteredBoards = boards?.filter(board => {
    if (mainTab === 'short-term') return board.vision_type === 'short';
    if (mainTab === 'long-term') return board.vision_type === 'long';
    return true; // 'boards' shows all
  }) || [];

  const handleCreateForTab = () => {
    if (mainTab === 'short-term') {
      setActiveSection('short');
      setValue('vision_type', 'short');
    } else if (mainTab === 'long-term') {
      setActiveSection('long');
      setValue('vision_type', 'long');
    }
    setIsCreatingNew(true);
    setSelectedBoard(null);
  };

  return (
    <div className="vision-container">
      <div className="vision-header">
        <h1>Vision & Direction</h1>
        <button onClick={handleCreateForTab} className="btn-primary">
          + Create New Vision
        </button>
      </div>

      <Tabs tabs={mainTabs} activeTab={mainTab} onTabChange={(tab) => setMainTab(tab as typeof mainTab)} />

      <div className="vision-content">
        {/* Vision Boards Grid */}
        <div className="vision-boards-grid">
          {filteredBoards.length > 0 ? (
            filteredBoards.map((board) => (
              <div
                key={board.id}
                className={`vision-board-card ${selectedBoard?.id === board.id ? 'selected' : ''}`}
                onClick={() => handleSelectBoard(board)}
                onMouseEnter={(e) => e.currentTarget.classList.add('hovered')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('hovered')}
              >
                <div className="vision-card-header">
                  <h3>{board.title}</h3>
                  <span className="vision-card-type">{board.vision_type}</span>
                </div>
                <div className="vision-card-preview">
                  {board.vision_type === 'short' ? (
                    <>
                      {board.vision_current_focus_theme && (
                        <p className="preview-text">
                          <strong>Focus:</strong> {board.vision_current_focus_theme}
                        </p>
                      )}
                      {board.vision_top_priorities && board.vision_top_priorities.length > 0 && (
                        <ul className="preview-priorities">
                          {board.vision_top_priorities.map((priority: string, idx: number) => (
                            <li key={idx}>{priority}</li>
                          ))}
                        </ul>
                      )}
                      {board.vision_short_term && (
                        <p className="preview-text">{board.vision_short_term.substring(0, 100)}...</p>
                      )}
                    </>
                  ) : (
                    <>
                      {board.vision_long_term && (
                        <p className="preview-text">{board.vision_long_term.substring(0, 100)}...</p>
                      )}
                    </>
                  )}
                </div>
                <div className="vision-card-footer">
                  <span className="vision-card-date">
                    {new Date(board.updated_at || board.created_at).toLocaleDateString()}
                  </span>
                  <button
                    className="vision-card-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this vision board?')) {
                        deleteMutation.mutate(board.id);
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="vision-empty-state">
              <p>No vision boards yet. Create your first one!</p>
            </div>
          )}
        </div>

        {/* Vision Form (shown when creating or editing) */}
        {(isCreatingNew || selectedBoard) && (
          <div className="vision-form-container">
            <div className="vision-form-header">
              <h2>{isCreatingNew ? 'Create New Vision Board' : `Edit: ${selectedBoard?.title}`}</h2>
              <button onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="vision-form">
              <div className="form-group">
                <label>Title</label>
                <input type="text" {...register('title', { required: true })} placeholder="e.g., Q1 2024 Vision" />
              </div>

              <div className="form-group">
                <label>Vision Type</label>
                <select {...register('vision_type')} onChange={(e) => setActiveSection(e.target.value as 'short' | 'long')}>
                  <option value="short">Short-Term Vision</option>
                  <option value="long">Long-Term Vision</option>
                </select>
              </div>

              {activeSection === 'short' && (
                <div className="vision-section">
                  <div className="form-group">
                    <label>Current Focus Theme</label>
                    <input
                      type="text"
                      {...register('vision_current_focus_theme')}
                      placeholder="e.g., 'Deep Work & Skill Acquisition'"
                    />
                  </div>

                  <div className="form-group">
                    <label>Top 3 Priorities</label>
                    {visionTopPriorities.length > 0 && (
                      <ul className="priorities-list">
                        {visionTopPriorities.map((priority, index) => (
                          <li key={index} className="priority-item">
                            <span>{priority}</span>
                            <button type="button" onClick={() => removePriority(index)} className="priority-remove">×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {visionTopPriorities.length < 3 && (
                      <div className="priority-input-group">
                        <input
                          type="text"
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPriority())}
                          placeholder="Enter a priority (max 3)"
                          className="priority-input"
                        />
                        <button type="button" onClick={addPriority} className="btn-add-priority" disabled={!newPriority.trim()}>
                          Add
                        </button>
                      </div>
                    )}
                    {visionTopPriorities.length >= 3 && (
                      <p className="priority-limit-reached">Maximum of 3 priorities reached</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Season of Life</label>
                    <input
                      type="text"
                      {...register('vision_season_of_life')}
                      placeholder="e.g., 'Building Foundations', 'Exploration'"
                    />
                  </div>

                  <div className="form-group">
                    <label>Short-Term Vision Summary</label>
                    <textarea
                      rows={4}
                      {...register('vision_short_term')}
                      placeholder="What do you want to achieve in the short term?"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'long' && (
                <div className="vision-section">
                  <div className="form-group">
                    <label>Life Vision Statement</label>
                    <textarea
                      rows={4}
                      {...register('vision_long_term')}
                      placeholder="What is your overarching vision for the next 1-5 years?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Career Vision</label>
                    <textarea
                      rows={3}
                      {...register('vision_career')}
                      placeholder="Where do you see your career in 1-5 years?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Lifestyle Vision</label>
                    <textarea
                      rows={3}
                      {...register('vision_lifestyle')}
                      placeholder="Describe your ideal lifestyle in 1-5 years."
                    />
                  </div>

                  <div className="form-group">
                    <label>Financial Vision</label>
                    <textarea
                      rows={3}
                      {...register('vision_financial')}
                      placeholder="What are your financial goals and vision?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Spiritual Vision</label>
                    <textarea
                      rows={3}
                      {...register('vision_spiritual')}
                      placeholder="What is your spiritual vision and aspirations?"
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {isCreatingNew ? 'Create Vision Board' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vision;
