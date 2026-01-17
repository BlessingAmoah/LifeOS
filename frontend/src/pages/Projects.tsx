import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './Projects.css';

interface ProjectForm {
  title: string;
  description: string;
  github_url: string;
  deployment_url: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'stalled';
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  deployment_url: string | null;
  image_url: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'stalled';
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm<ProjectForm>({
    defaultValues: {
      title: '',
      description: '',
      github_url: '',
      deployment_url: '',
      status: 'not_started',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectForm) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      setShowForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create project';
      alert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectForm> }) =>
      api.put(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      setShowForm(false);
      setIsEditing(false);
      setSelectedProject(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      alert('Project deleted successfully!');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}/image`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      alert('Image deleted successfully!');
    },
    onError: () => {
      alert('Failed to delete image.');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await api.post(`/projects/${projectId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const projectsByStatus = useMemo(() => {
    if (!projects) {
      return {
        not_started: [],
        in_progress: [],
        completed: [],
        stalled: [],
      };
    }
    return {
      not_started: projects.filter(p => p.status === 'not_started'),
      in_progress: projects.filter(p => p.status === 'in_progress'),
      completed: projects.filter(p => p.status === 'completed'),
      stalled: projects.filter(p => p.status === 'stalled'),
    };
  }, [projects]);

  const handleCreateNew = () => {
    setShowForm(true);
    setIsEditing(false);
    setSelectedProject(null);
    reset({
      title: '',
      description: '',
      github_url: '',
      deployment_url: '',
      status: 'not_started',
    });
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsEditing(true);
    setShowForm(true);
    setValue('title', project.title);
    setValue('description', project.description || '');
    setValue('github_url', project.github_url || '');
    setValue('deployment_url', project.deployment_url || '');
    setValue('status', project.status);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setShowForm(false);
    setIsEditing(false);
  };

  const handleCloseView = () => {
    setSelectedProject(null);
  };

  const onSubmit = (data: ProjectForm) => {
    if (isEditing && selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return '#94a3b8';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'stalled':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'stalled':
        return 'Stalled';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading projects..." size="large" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load projects'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
      />
    );
  }

  return (
    <div className="projects">
      <div className="projects-header">
        <h1>Projects</h1>
        <button onClick={handleCreateNew} className="btn-primary">
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="project-form">
          <div className="form-group">
            <label>Project Title *</label>
            <input
              type="text"
              placeholder="My Awesome Project"
              {...register('title', { required: true })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={4}
              placeholder="Describe your project..."
              {...register('description')}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="url"
                placeholder="https://github.com/username/repo"
                {...register('github_url')}
              />
            </div>
            <div className="form-group">
              <label>Deployment URL</label>
              <input
                type="url"
                placeholder="https://myproject.com"
                {...register('deployment_url')}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select {...register('status', { required: true })}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="stalled">Stalled</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Update Project' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setSelectedProject(null);
                reset();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Projects grouped by status */}
      {projects && projects.length === 0 ? (
        <EmptyState
          icon="🚀"
          title="No projects yet"
          message="Start tracking your projects by creating your first one."
          actionLabel="Create Project"
          onAction={handleCreateNew}
        />
      ) : (
      <div className="projects-by-status">
        {(['not_started', 'in_progress', 'completed', 'stalled'] as const).map((status) => (
          <div key={status} className="status-group">
            <div className="status-header" style={{ borderLeftColor: getStatusColor(status) }}>
              <h2>{getStatusLabel(status)}</h2>
              <span className="status-count">({projectsByStatus[status].length})</span>
            </div>
            <div className="projects-grid">
              {projectsByStatus[status].length > 0 ? (
                projectsByStatus[status].map((project) => (
                  <div
                    key={project.id}
                    className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="project-card-header">
                      <h3>{project.title}</h3>
                      <span
                        className="project-status-badge"
                        style={{ background: getStatusColor(project.status) }}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}
                    {project.image_url && (
                      <div className="project-image-preview">
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="project-links">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="project-link"
                        >
                          🔗 GitHub
                        </a>
                      )}
                      {project.deployment_url && (
                        <a
                          href={project.deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="project-link"
                        >
                          🌐 Live Site
                        </a>
                      )}
                    </div>
                    <div className="project-card-footer">
                      <span className="project-date">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <div className="project-actions">
                        <button
                          className="project-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="project-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this project?')) {
                              deleteMutation.mutate(project.id);
                            }
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="📁"
                  title={`No ${getStatusLabel(status).toLowerCase()} projects`}
                  message={`You don't have any ${getStatusLabel(status).toLowerCase()} projects yet.`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Project Detail View */}
      {selectedProject && !showForm && (
        <div className="project-detail-overlay" onClick={handleCloseView}>
          <div className="project-detail-container" onClick={(e) => e.stopPropagation()}>
            <div className="project-detail-header">
              <h2>{selectedProject.title}</h2>
              <button onClick={handleCloseView} className="btn-secondary">
                Close
              </button>
            </div>
            <div className="project-detail-content">
              <div className="project-detail-meta">
                <span
                  className="project-status-badge"
                  style={{ background: getStatusColor(selectedProject.status) }}
                >
                  {getStatusLabel(selectedProject.status)}
                </span>
                <span className="project-date">
                  Created: {new Date(selectedProject.created_at).toLocaleDateString()}
                </span>
                {selectedProject.updated_at !== selectedProject.created_at && (
                  <span className="project-date">
                    Updated: {new Date(selectedProject.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {selectedProject.description && (
                <div className="project-detail-description">
                  <h3>Description</h3>
                  <p>{selectedProject.description}</p>
                </div>
              )}
              <div className="project-detail-image-section">
                <h3>Project Image/Diagram</h3>
                {selectedProject.image_url ? (
                  <div className="project-detail-image">
                    <img 
                      src={selectedProject.image_url} 
                      alt={selectedProject.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <label className="upload-image-label" style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleImageUpload(e, selectedProject.id)}
                          disabled={uploadingImage}
                          style={{ display: 'none' }}
                        />
                        {uploadingImage ? 'Uploading...' : '🔄 Replace Image'}
                      </label>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this image?')) {
                            deleteImageMutation.mutate(selectedProject.id);
                          }
                        }}
                        className="btn-danger"
                        disabled={deleteImageMutation.isPending}
                      >
                        Delete Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="project-upload-image">
                    <label className="upload-image-label">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleImageUpload(e, selectedProject.id)}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                      {uploadingImage ? 'Uploading...' : '+ Upload Image/Diagram'}
                    </label>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Upload a diagram, screenshot, or image (max 10MB)
                    </p>
                  </div>
                )}
              </div>
              <div className="project-detail-links">
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-btn"
                  >
                    🔗 View on GitHub
                  </a>
                )}
                {selectedProject.deployment_url && (
                  <a
                    href={selectedProject.deployment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-btn"
                  >
                    🌐 Visit Live Site
                  </a>
                )}
              </div>
              <div className="project-detail-actions">
                <button onClick={() => handleEdit(selectedProject)} className="btn-primary">
                  Edit Project
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this project?')) {
                      deleteMutation.mutate(selectedProject.id);
                    }
                  }}
                  className="btn-danger"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
