import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { exportTasksToCSV, exportToPDF } from '../utils/exportUtils';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './Tasks.css';

// Helper function to format date in local timezone (avoid UTC conversion issues)
// Parses YYYY-MM-DD as a local date, not UTC
const formatDateLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Invalid Date';
  // Parse date string as local date (YYYY-MM-DD format)
  // Split and validate the date string
  const parts = dateString.split('-');
  if (parts.length !== 3) return 'Invalid Date';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Validate the date values
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Invalid Date';
  if (month < 1 || month > 12) return 'Invalid Date';
  if (day < 1 || day > 31) return 'Invalid Date';
  
  // Create date in local timezone (not UTC)
  const date = new Date(year, month - 1, day);
  
  // Verify the date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString();
};

// Droppable Column Component
const DroppableColumn = ({ id, children, status }: {
  id: string;
  children: React.ReactNode;
  status: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'column',
      status: status,
    },
  });

  return (
    <div 
      ref={setNodeRef} 
      style={{ 
        minHeight: '200px',
        width: '100%',
        backgroundColor: isOver ? '#e8f0fe' : undefined,
        transition: 'background-color 0.2s',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

// Sortable Task Card Component
const SortableTaskCard = ({ task, onSelect, onDelete, onStatusChange }: {
  task: any;
  onSelect: (task: any) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'backlog' | 'in_progress' | 'done') => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task: task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, cursor: 'grab', marginBottom: '0.75rem' }}
      {...attributes}
      {...listeners}
      className="task-card"
      onClick={() => {
        // Don't open detail view while dragging
        if (!isDragging) {
          onSelect(task);
        }
      }}
    >
      <div className="task-card-header">
        <h3>{task.title}</h3>
        <button
          className="task-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
        >
          🗑️
        </button>
      </div>
      {task.description && <p>{task.description}</p>}
      {task.sprint_name && (
        <span style={{ fontSize: '0.875rem', color: '#667eea', display: 'block', marginBottom: '0.5rem' }}>
          Sprint: {task.sprint_name}
        </span>
      )}
      {(task.due_date || task.task_time) && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          {task.due_date && (
            <span>Due: {formatDateLocal(task.due_date)}</span>
          )}
          {task.task_time && (
            <span style={{ marginLeft: '0.5rem' }}>at {task.task_time.length > 5 ? task.task_time.substring(0, 5) : task.task_time}</span>
          )}
        </div>
      )}
      {task.retrospective_notes && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px', fontSize: '0.875rem' }}>
          <strong>Retro:</strong> {task.retrospective_notes}
        </div>
      )}
      <select
        value={task.status}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, e.target.value as 'backlog' | 'in_progress' | 'done');
        }}
        className="task-status-select"
        style={{ marginTop: '0.5rem', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="backlog">Backlog</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
};

interface TaskForm {
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'done';
  priority: number;
  due_date: string;
  task_time?: string;
  sprint_id?: string;
  sprint_name?: string;
  retrospective_notes?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'backlog' | 'in_progress' | 'done';
  priority: number | null;
  due_date: string | null;
  task_time: string | null;
  sprint_id: string | null;
  sprint_name: string | null;
  retrospective_notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_month: string | null;
}

const Tasks = () => {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'sprint' | 'standup' | 'archived'>('board');
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [selectedArchiveMonth, setSelectedArchiveMonth] = useState<string | null>(null);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [newSprintId, setNewSprintId] = useState('');
  const [newSprintName, setNewSprintName] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for board view
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !tasks) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;

    // Find the task being dragged
    const activeTask = tasks.find((t: any) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropped on a column (droppable area)
    if (overData?.type === 'column') {
      const newStatus = overData.status as 'backlog' | 'in_progress' | 'done';
      // Update task status if dropped on a different column
      if (activeTask.status !== newStatus) {
        updateMutation.mutate({
          id: activeId,
          data: { status: newStatus },
        });
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t: any) => t.id === overId);
    if (overTask) {
      // If dropped on a task in a different column, move to that column
      if (activeTask.status !== overTask.status) {
        updateMutation.mutate({
          id: activeId,
          data: { status: overTask.status },
        });
      }
    }
  };

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', viewMode, selectedSprint, selectedArchiveMonth],
    queryFn: () => {
      if (viewMode === 'archived') {
        const params = new URLSearchParams();
        if (selectedArchiveMonth) params.append('month', selectedArchiveMonth);
        return api.get(`/tasks/archived?${params.toString()}`).then(res => res.data);
      }
      const params = new URLSearchParams();
      if (viewMode === 'standup') params.append('view', 'standup');
      // Filter by sprint in both board and sprint views
      if (selectedSprint) params.append('sprint_id', selectedSprint);
      return api.get(`/tasks?${params.toString()}`).then(res => res.data);
    },
  });

  const { data: archivedMonths } = useQuery({
    queryKey: ['archived-months'],
    queryFn: () => api.get('/tasks/archived/months').then(res => res.data),
    enabled: viewMode === 'archived',
  });

  const archiveMutation = useMutation({
    mutationFn: (data: { month?: string; archive_all_done?: boolean }) =>
      api.post('/tasks/archive', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archived-months'] });
      alert('Tasks archived successfully!');
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archived-months'] });
      alert('Task unarchived successfully!');
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm<TaskForm>({
    defaultValues: { status: 'backlog', priority: 0, due_date: '', task_time: '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskForm) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset({ status: 'backlog', priority: 0, due_date: '', task_time: '' });
      setShowForm(false);
      setIsEditing(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskForm> }) =>
      api.put(`/tasks/${id}`, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks', viewMode, selectedSprint]);
      
      // Optimistically update - ensure we update with the actual data being sent
      queryClient.setQueryData(['tasks', viewMode, selectedSprint], (old: any) => {
        if (!old) return old;
        return old.map((task: any) => {
          if (task.id === id) {
            // Merge the update data, ensuring date and time are properly formatted
            const updatedTask = { ...task, ...data };
            // If updating selectedTask, update it too
            if (selectedTask && selectedTask.id === id) {
              setSelectedTask(updatedTask);
            }
            return updatedTask;
          }
          return task;
        });
      });
      
      return { previousTasks };
    },
    onSuccess: (response, variables) => {
      // Extract the task data from the Axios response
      const taskData = response.data;
      
      // Update selectedTask with the server response data if it's the one being edited
      if (selectedTask && selectedTask.id === variables.id && taskData) {
        setSelectedTask({ ...selectedTask, ...taskData });
      }
      
      // Invalidate and refetch tasks to get the latest data from server
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', viewMode, selectedSprint] });
      
      reset({ status: 'backlog', priority: 0, due_date: '', task_time: '' });
      setShowForm(false);
      setIsEditing(false);
      // Don't clear selectedTask here - keep it so the detail view shows updated data
      // If task was marked as done, optionally auto-archive after a delay
      if (variables.data.status === 'done') {
        // You can add auto-archive logic here if desired
        // For now, we'll let users manually archive
      }
    },
    onError: (err: any, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', viewMode, selectedSprint], context.previousTasks);
      }
      console.error('Update task error:', err);
      const errorMessage = err?.response?.data?.errors 
        ? `Validation error: ${JSON.stringify(err.response.data.errors)}`
        : err?.response?.data?.error || 'Failed to update task. Please try again.';
      alert(errorMessage);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      alert('Task deleted successfully!');
    },
  });

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowForm(false);
  };

  const handleCloseTaskView = () => {
    setSelectedTask(null);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditing(true);
    setShowForm(true);
    // Reset form first, then set values
    // IMPORTANT: Use due_date string directly - do NOT convert with Date/toISOString
    // This avoids timezone shifts. The date picker expects YYYY-MM-DD format.
    reset({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 0,
      due_date: task.due_date || '', // Use date string directly, no Date conversion
      task_time: task.task_time || '',
      sprint_id: task.sprint_id || '',
      sprint_name: task.sprint_name || '',
      retrospective_notes: task.retrospective_notes || '',
    });
  };

  const tasksByStatus = useMemo(() => {
    if (!tasks) {
      return {
        backlog: [],
        in_progress: [],
        done: [],
      };
    }
    // Sort tasks by due_date and task_time (morning to evening)
    const sortedTasks = [...tasks].sort((a: any, b: any) => {
      // First sort by due_date (compare as strings YYYY-MM-DD, no Date conversion to avoid timezone issues)
      if (a.due_date && b.due_date) {
        // String comparison works for YYYY-MM-DD format
        const dateCompare = a.due_date.localeCompare(b.due_date);
        if (dateCompare !== 0) return dateCompare;
      } else if (a.due_date) return -1;
      else if (b.due_date) return 1;
      
      // Then sort by task_time (morning to evening)
      if (a.task_time && b.task_time) {
        return a.task_time.localeCompare(b.task_time);
      } else if (a.task_time) return -1;
      else if (b.task_time) return 1;
      
      // Finally by priority
      return (b.priority || 0) - (a.priority || 0);
    });
    
    return {
      backlog: sortedTasks.filter((t: any) => t.status === 'backlog'),
      in_progress: sortedTasks.filter((t: any) => t.status === 'in_progress'),
      done: sortedTasks.filter((t: any) => t.status === 'done'),
    };
  }, [tasks]);

  const tasksBySprint = useMemo(() => {
    if (!tasks) return {};
    return tasks.reduce((acc: any, task: any) => {
      const sprint = task.sprint_name || task.sprint_id || 'No Sprint';
      if (!acc[sprint]) acc[sprint] = [];
      acc[sprint].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const availableSprints = useMemo(() => {
    if (!tasks) return [];
    const sprints = new Set<string>();
    tasks.forEach((task: any) => {
      if (task.sprint_id) sprints.add(task.sprint_id);
      if (task.sprint_name) sprints.add(task.sprint_name);
    });
    return Array.from(sprints).sort();
  }, [tasks]);

  if (isLoading) {
    return <LoadingSpinner message="Loading tasks..." size="large" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load tasks'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    );
  }

  return (
    <div className="tasks">
      <div className="page-header">
        <h1>Tasks</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('board')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'board' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'board' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('sprint')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'sprint' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'sprint' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sprint
            </button>
            <button
              onClick={() => setViewMode('standup')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'standup' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'standup' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Standup
            </button>
            <button
              onClick={() => setViewMode('archived')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'archived' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'archived' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Archived
            </button>
          </div>
          {viewMode !== 'archived' && (
            <>
              <button
                onClick={() => {
                  if (confirm('Archive all completed tasks for this month?')) {
                    archiveMutation.mutate({});
                  }
                }}
                className="btn-secondary"
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending ? 'Archiving...' : 'Archive Done Tasks'}
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  {showForm ? 'Cancel' : 'New Task'}
                </button>
                {tasks && tasks.length > 0 && (
                  <>
                    <button 
                      onClick={() => exportTasksToCSV(tasks)} 
                      className="btn-secondary"
                      title="Export to CSV"
                    >
                      📥 CSV
                    </button>
                    <button 
                      onClick={() => exportToPDF(
                        'Tasks',
                        tasks,
                        [
                          { key: 'title', label: 'Title' },
                          { key: 'status', label: 'Status' },
                          { key: 'priority', label: 'Priority' },
                          { key: 'due_date', label: 'Due Date' },
                        ],
                        'tasks-export'
                      )} 
                      className="btn-secondary"
                      title="Export to PDF"
                    >
                      📄 PDF
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit((data) => {
          if (isEditing && selectedTask) {
            // Always include required fields
            const updateData: Partial<TaskForm> = {
              title: data.title,
              status: data.status,
              priority: data.priority || 0,
            };
            
            // Include optional fields - send empty strings to clear, or values if provided
            if (data.description !== undefined) {
              updateData.description = data.description || '';
            }
            if (data.due_date !== undefined) {
              updateData.due_date = data.due_date || '';
            }
            if (data.task_time !== undefined) {
              // Convert HH:MM:SS to HH:MM format (HTML time input returns HH:MM:SS)
              const timeValue = data.task_time || '';
              updateData.task_time = timeValue ? timeValue.substring(0, 5) : '';
            }
            if (data.sprint_id !== undefined) {
              updateData.sprint_id = data.sprint_id || '';
            }
            if (data.sprint_name !== undefined) {
              updateData.sprint_name = data.sprint_name || '';
            }
            if (data.retrospective_notes !== undefined) {
              updateData.retrospective_notes = data.retrospective_notes || '';
            }
            
            updateMutation.mutate({ id: selectedTask.id, data: updateData });
          } else {
            createMutation.mutate(data);
          }
        })} className="task-form">
          <div className="form-header">
            <h2>{isEditing ? 'Edit Task' : 'New Task'}</h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setSelectedTask(null);
                reset({ status: 'backlog', priority: 0, due_date: '', task_time: '' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Task title"
              {...register('title', { required: true })}
            />
          </div>
          <div className="form-group">
            <textarea
              rows={3}
              placeholder="Description (optional)"
              {...register('description')}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <select {...register('status')}>
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Priority"
                {...register('priority', { valueAsNumber: true })}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={watch('due_date') || ''}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setValue('due_date', newDate, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>
            <div className="form-group">
              <label>Time (HH:MM)</label>
              <input
                type="time"
                {...register('task_time')}
                placeholder="09:00"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sprint ID (e.g., 2026-W03)</label>
              <input
                type="text"
                placeholder="Optional: Sprint identifier"
                {...register('sprint_id')}
              />
            </div>
            <div className="form-group">
              <label>Sprint Name</label>
              <input
                type="text"
                placeholder="Optional: Sprint name"
                {...register('sprint_name')}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Retrospective Notes (optional)</label>
            <textarea
              rows={3}
              placeholder="Notes for sprint retrospective..."
              {...register('retrospective_notes')}
            />
          </div>
          <button type="submit" className="btn-primary">Create Task</button>
        </form>
      )}

      {viewMode === 'standup' && (
        <div className="standup-view" style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', color: 'white', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Daily Standup</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Tasks due today or currently in progress</p>
          </div>

          {tasks && tasks.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>✅ What I Did Yesterday</h3>
                <div style={{ marginTop: '1rem' }}>
                  {tasks.filter((t: any) => t.status === 'done').length > 0 ? (
                    tasks.filter((t: any) => t.status === 'done').map((task: any) => (
                      <div key={task.id} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: '#f0f9ff', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: '0.875rem', color: '#666' }}>{task.description}</div>}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No completed tasks</p>
                  )}
                </div>
              </div>

              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>🚀 What I'm Doing Today</h3>
                <div style={{ marginTop: '1rem' }}>
                  {tasks.filter((t: any) => t.status === 'in_progress').length > 0 ? (
                    tasks.filter((t: any) => t.status === 'in_progress').map((task: any) => (
                      <div key={task.id} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: '#fff7ed', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: '0.875rem', color: '#666' }}>{task.description}</div>}
                        {task.sprint_name && <div style={{ fontSize: '0.75rem', color: '#667eea', marginTop: '0.25rem' }}>Sprint: {task.sprint_name}</div>}
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateMutation.mutate({
                              id: task.id,
                              data: { status: e.target.value as any },
                            })
                          }
                          style={{ marginTop: '0.5rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                        >
                          <option value="backlog">Backlog</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No tasks in progress</p>
                  )}
                </div>
              </div>

              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>🚧 Blockers</h3>
                <div style={{ marginTop: '1rem' }}>
                  {tasks.filter((t: any) => t.status === 'backlog' && t.priority && t.priority >= 3).length > 0 ? (
                    tasks.filter((t: any) => t.status === 'backlog' && t.priority && t.priority >= 3).map((task: any) => (
                      <div key={task.id} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: '#fef2f2', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: '0.875rem', color: '#666' }}>{task.description}</div>}
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>High Priority</div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No blockers identified</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#666' }}>No tasks for standup today. Create some tasks to get started!</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'sprint' && (
        <div className="sprint-view" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
            >
              <option value="">All Sprints</option>
              {availableSprints.map(sprint => (
                <option key={sprint} value={sprint}>{sprint}</option>
              ))}
            </select>
            <button
              onClick={() => setShowSprintForm(!showSprintForm)}
              style={{ padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {showSprintForm ? 'Cancel' : '+ New Sprint'}
            </button>
            {selectedSprint && (
              <button
                onClick={() => setSelectedSprint('')}
                style={{ padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Clear Filter
              </button>
            )}
          </div>

          {showSprintForm && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Create New Sprint Task</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newSprintId || newSprintName) {
                  createMutation.mutate({
                    title: `Sprint: ${newSprintName || newSprintId}`,
                    description: '',
                    status: 'backlog',
                    priority: 0,
                    due_date: '',
                    sprint_id: newSprintId,
                    sprint_name: newSprintName,
                  });
                  setNewSprintId('');
                  setNewSprintName('');
                  setShowSprintForm(false);
                }
              }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Sprint ID (e.g., 2026-W03)"
                    value={newSprintId}
                    onChange={(e) => setNewSprintId(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Sprint Name (e.g., Q1 Planning)"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', flex: 1 }}
                  />
                </div>
                <button type="submit" className="btn-primary">Create Sprint</button>
              </form>
            </div>
          )}

          {tasks && tasks.length > 0 ? (
            <div>
              {Object.entries(tasksBySprint)
                .filter(([sprint]) => !selectedSprint || sprint === selectedSprint || sprint.includes(selectedSprint))
                .map(([sprint, sprintTasks]: [string, any]) => {
                  const sprintStats = {
                    total: sprintTasks.length,
                    done: sprintTasks.filter((t: any) => t.status === 'done').length,
                    inProgress: sprintTasks.filter((t: any) => t.status === 'in_progress').length,
                    backlog: sprintTasks.filter((t: any) => t.status === 'backlog').length,
                  };
                  const completionRate = sprintStats.total > 0 ? Math.round((sprintStats.done / sprintStats.total) * 100) : 0;

                  return (
                    <div key={sprint} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{sprint}</h2>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                            <span>Total: {sprintStats.total}</span>
                            <span>Done: {sprintStats.done}</span>
                            <span>In Progress: {sprintStats.inProgress}</span>
                            <span>Backlog: {sprintStats.backlog}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{completionRate}%</div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>Complete</div>
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${completionRate}%`, background: '#667eea', transition: 'width 0.3s' }} />
                      </div>
                      <div className="tasks-board">
                        {Object.entries(
                          (sprintTasks as any[]).reduce((acc: any, task: any) => {
                            if (!acc[task.status]) acc[task.status] = [];
                            acc[task.status].push(task);
                            return acc;
                          }, {})
                        ).map(([status, statusTasks]: [string, any]) => (
                          <div key={status} className="task-column">
                            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{status.replace('_', ' ').toUpperCase()}</span>
                              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>({statusTasks.length})</span>
                            </h3>
                            {statusTasks.map((task: any) => (
                              <div 
                                key={task.id} 
                                className="task-card"
                                onClick={() => handleSelectTask(task)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="task-card-header">
                                  <h4>{task.title}</h4>
                                  <button
                                    className="task-delete-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Are you sure you want to delete this task?')) {
                                        deleteMutation.mutate(task.id);
                                      }
                                    }}
                                    title="Delete task"
                                  >
                                    🗑️
                                  </button>
                                </div>
                                {task.description && <p>{task.description}</p>}
                                {(task.due_date || task.task_time) && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                                    {task.due_date && (
                                      <span>Due: {formatDateLocal(task.due_date)}</span>
                                    )}
                                    {task.task_time && (
                                      <span style={{ marginLeft: '0.5rem' }}>at {task.task_time.length > 5 ? task.task_time.substring(0, 5) : task.task_time}</span>
                                    )}
                                  </div>
                                )}
                                {task.retrospective_notes && (
                                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px', fontSize: '0.875rem' }}>
                                    <strong>Retro:</strong> {task.retrospective_notes}
                                  </div>
                                )}
                                {task.priority !== undefined && task.priority > 0 && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                                    Priority: {task.priority}
                                  </div>
                                )}
                                <select
                                  value={task.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateMutation.mutate({
                                      id: task.id,
                                      data: { status: e.target.value as any },
                                    });
                                  }}
                                  className="task-status-select"
                                  style={{ marginTop: '0.5rem', width: '100%' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="backlog">Backlog</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="done">Done</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState
              icon="📋"
              title="No tasks found"
              message="Create a new sprint or task to get started!"
              actionLabel="Create Task"
              onAction={() => setShowForm(true)}
            />
          )}
        </div>
      )}

      {viewMode === 'board' && (
        <div>
          {/* Sprint Selector for Board View */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <label style={{ fontWeight: 600, color: '#333' }}>Sprint Select:</label>
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                border: '1px solid #ddd', 
                minWidth: '200px',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="">All Sprints</option>
              {availableSprints.map(sprint => (
                <option key={sprint} value={sprint}>{sprint}</option>
              ))}
            </select>
            <button
              onClick={() => setShowSprintForm(!showSprintForm)}
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#667eea', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {showSprintForm ? 'Cancel' : '+ New Sprint'}
            </button>
            {selectedSprint && (
              <button
                onClick={() => setSelectedSprint('')}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: '#e74c3c', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Clear Filter
              </button>
            )}
          </div>

          {showSprintForm && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Create New Sprint</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newSprintId || newSprintName) {
                  createMutation.mutate({
                    title: `Sprint: ${newSprintName || newSprintId}`,
                    description: '',
                    status: 'backlog',
                    priority: 0,
                    due_date: '',
                    sprint_id: newSprintId,
                    sprint_name: newSprintName,
                  });
                  setNewSprintId('');
                  setNewSprintName('');
                  setShowSprintForm(false);
                }
              }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Sprint ID (e.g., 2026-W03)"
                    value={newSprintId}
                    onChange={(e) => setNewSprintId(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Sprint Name (e.g., Q1 Planning)"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', flex: 1 }}
                  />
                </div>
                <button type="submit" className="btn-primary">Create Sprint</button>
              </form>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleDragEnd}
          >
            <div className="tasks-board">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <DroppableColumn key={status} id={status} status={status}>
                  <div className="task-column" style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px', height: '100%', minHeight: '200px' }}>
                    <h2 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 600, 
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #ddd',
                      color: status === 'in_progress' ? '#667eea' : status === 'done' ? '#27ae60' : '#666'
                    }}>
                      {status.replace('_', ' ').toUpperCase()}
                      <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                        ({statusTasks.length})
                      </span>
                    </h2>
                    <SortableContext items={statusTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                      {statusTasks.length > 0 ? (
                        statusTasks.map((task: any) => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            onSelect={handleSelectTask}
                            onDelete={(id) => {
                              if (confirm('Are you sure you want to delete this task?')) {
                                deleteMutation.mutate(id);
                              }
                            }}
                            onStatusChange={(id, newStatus) => {
                              updateMutation.mutate({
                                id,
                                data: { status: newStatus },
                              });
                            }}
                          />
                        ))
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                          No tasks
                        </div>
                      )}
                    </SortableContext>
                  </div>
                </DroppableColumn>
              ))}
            </div>
          </DndContext>
        </div>
      )}

      {viewMode === 'archived' && (
        <div className="archived-view">
          <div className="archive-header">
            <h2>Archived Tasks</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                value={selectedArchiveMonth || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedArchiveMonth(value || null);
                }}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Months</option>
                {archivedMonths?.map((month: any) => {
                  // Ensure archived_month is in YYYY-MM format
                  const monthValue = month.archived_month || '';
                  // Parse and format for display
                  let displayText = '';
                  if (monthValue && monthValue.match(/^\d{4}-\d{2}$/)) {
                    const [year, monthNum] = monthValue.split('-');
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                    displayText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                  } else {
                    displayText = monthValue; // Fallback if format is unexpected
                  }
                  return (
                    <option key={monthValue} value={monthValue}>
                      {displayText} ({month.task_count} tasks)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {archivedMonths && archivedMonths.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No archived tasks"
              message="Complete some tasks and archive them to see them here!"
            />
          ) : (
            <div className="archived-months">
              {archivedMonths && !selectedArchiveMonth ? (
                // Show all months as folders
                archivedMonths.map((month: any) => (
                  <div key={month.archived_month} className="archive-month-folder">
                    <div
                      className="folder-header"
                      onClick={() => setSelectedArchiveMonth(month.archived_month)}
                    >
                      <span className="folder-icon">📁</span>
                      <div className="folder-info">
                        <h3>
                          {(() => {
                            const monthValue = month.archived_month || '';
                            if (monthValue && monthValue.match(/^\d{4}-\d{2}$/)) {
                              const [year, monthNum] = monthValue.split('-');
                              const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                              return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                            }
                            return monthValue;
                          })()}
                        </h3>
                        <span className="folder-count">{month.task_count} task{month.task_count !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="folder-arrow">→</span>
                    </div>
                  </div>
                ))
              ) : (
                // Show tasks for selected month
                <div className="archived-tasks-list">
                  <div className="archive-breadcrumb">
                    <button onClick={() => setSelectedArchiveMonth(null)} className="breadcrumb-btn">
                      ← Back to Months
                    </button>
                    {selectedArchiveMonth && (
                      <h3>
                        {(() => {
                          if (selectedArchiveMonth.match(/^\d{4}-\d{2}$/)) {
                            const [year, monthNum] = selectedArchiveMonth.split('-');
                            const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                          }
                          return selectedArchiveMonth;
                        })()}
                      </h3>
                    )}
                  </div>
                  {tasks && tasks.length > 0 ? (
                    <div className="tasks-list">
                      {tasks.map((task: any) => (
                        <div 
                          key={task.id} 
                          className="archived-task-card"
                          onClick={(e) => {
                            // Only open detail view if clicking on the card content, not buttons
                            const target = e.target as HTMLElement;
                            if (!target.closest('.task-actions') && !target.closest('button')) {
                              handleSelectTask(task);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="task-info">
                            <h4>{task.title}</h4>
                            {task.description && <p>{task.description}</p>}
                            <div className="task-meta">
                              <span>Completed: {new Date(task.updated_at || task.created_at).toLocaleDateString()}</span>
                              {task.sprint_name && <span>Sprint: {task.sprint_name}</span>}
                              {task.retrospective_notes && (
                                <div className="retro-notes">
                                  <strong>Retro:</strong> {task.retrospective_notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Unarchive this task? It will be moved back to active tasks.')) {
                                  unarchiveMutation.mutate(task.id);
                                }
                              }}
                              className="btn-secondary"
                              disabled={unarchiveMutation.isPending}
                            >
                              Unarchive
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this archived task permanently?')) {
                                  deleteMutation.mutate(task.id);
                                }
                              }}
                              className="btn-danger"
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="📅"
                      title="No tasks for this month"
                      message="No tasks were archived for the selected month."
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task Detail View */}
      {selectedTask && !showForm && (
        <div className="task-detail-overlay" onClick={handleCloseTaskView}>
          <div className="task-detail-container" onClick={(e) => e.stopPropagation()}>
            <div className="task-detail-header">
              <h2>{selectedTask.title}</h2>
              <button onClick={handleCloseTaskView} className="btn-secondary">
                Close
              </button>
            </div>
            <div className="task-detail-content">
              <div className="task-detail-meta">
                <span className={`task-status-badge task-status-${selectedTask.status}`}>
                  {selectedTask.status.replace('_', ' ').toUpperCase()}
                </span>
                {selectedTask.priority !== null && selectedTask.priority > 0 && (
                  <span className="task-priority">Priority: {selectedTask.priority}</span>
                )}
                <span className="task-date">
                  Created: {new Date(selectedTask.created_at).toLocaleDateString()}
                </span>
                {selectedTask.updated_at !== selectedTask.created_at && (
                  <span className="task-date">
                    Updated: {new Date(selectedTask.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {selectedTask.description && (
                <div className="task-detail-section">
                  <h3>Description</h3>
                  <p>{selectedTask.description}</p>
                </div>
              )}

              <div className="task-detail-section">
                <h3>Details</h3>
                <div className="task-detail-grid">
                  {selectedTask.due_date && (
                    <div className="task-detail-item">
                      <strong>Due Date:</strong>
                      <span>{formatDateLocal(selectedTask.due_date)}</span>
                    </div>
                  )}
                  {selectedTask.task_time && (
                    <div className="task-detail-item">
                      <strong>Time:</strong>
                      <span>{selectedTask.task_time.length > 5 ? selectedTask.task_time.substring(0, 5) : selectedTask.task_time}</span>
                    </div>
                  )}
                  {selectedTask.sprint_id && (
                    <div className="task-detail-item">
                      <strong>Sprint ID:</strong>
                      <span>{selectedTask.sprint_id}</span>
                    </div>
                  )}
                  {selectedTask.sprint_name && (
                    <div className="task-detail-item">
                      <strong>Sprint Name:</strong>
                      <span>{selectedTask.sprint_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTask.retrospective_notes && (
                <div className="task-detail-section">
                  <h3>Retrospective Notes</h3>
                  <div className="task-retro-notes">
                    {selectedTask.retrospective_notes}
                  </div>
                </div>
              )}

              <div className="task-detail-actions">
                <button onClick={() => handleEditTask(selectedTask)} className="btn-primary">
                  Edit Task
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteMutation.mutate(selectedTask.id);
                      setSelectedTask(null);
                    }
                  }}
                  className="btn-danger"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
