import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './Immigration.css';

interface StatusTimelineForm {
  case_type: string;
  current_status: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface DocumentChecklistForm {
  document_name: string;
  required_for_stage: string;
  status: 'missing' | 'uploaded' | 'submitted';
  expiry_date: string;
  notes: string;
}

interface DeadlineForm {
  deadline_type: string;
  deadline_date: string;
  title: string;
  description: string;
  is_critical: boolean;
  notes: string;
}

interface CaseNoteForm {
  note_date: string;
  note_type: string;
  title: string;
  content: string;
  tags: string;
}

interface VisaMilestoneForm {
  milestone_type: string;
  milestone_date: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  next_steps: string;
  notes: string;
}

interface StatusTimeline {
  id: string;
  case_type: string;
  current_status: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentChecklist {
  id: string;
  document_name: string;
  required_for_stage: string | null;
  status: 'missing' | 'uploaded' | 'submitted';
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Deadline {
  id: string;
  deadline_type: string;
  deadline_date: string;
  title: string;
  description: string | null;
  is_critical: boolean;
  completed: boolean;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CaseNote {
  id: string;
  note_date: string;
  note_type: string | null;
  title: string | null;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  blob_url: string;
  access_url?: string;
  linked_stage: string | null;
  uploaded_date: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface VisaMilestone {
  id: string;
  milestone_type: string;
  milestone_date: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  next_steps: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Immigration = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'status' | 'documents' | 'deadlines' | 'notes' | 'uploads' | 'milestones'>('dashboard');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusTimeline | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentChecklist | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [selectedNote, setSelectedNote] = useState<CaseNote | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<VisaMilestone | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const uploadFormRef = useRef<HTMLFormElement>(null);

  // Queries
  const { data: statusTimeline, isLoading: statusLoading } = useQuery<StatusTimeline[]>({
    queryKey: ['status-timeline'],
    queryFn: () => api.get('/status-timeline').then(res => res.data),
    enabled: viewMode === 'status' || viewMode === 'dashboard',
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<DocumentChecklist[]>({
    queryKey: ['document-checklist'],
    queryFn: () => api.get('/document-checklist').then(res => res.data),
    enabled: viewMode === 'documents' || viewMode === 'dashboard',
  });

  const { data: deadlines, isLoading: deadlinesLoading } = useQuery<Deadline[]>({
    queryKey: ['deadlines-reminders', 'upcoming'],
    queryFn: () => api.get('/deadlines-reminders?upcoming=true').then(res => res.data),
    enabled: viewMode === 'deadlines' || viewMode === 'dashboard',
  });

  const { data: allDeadlines } = useQuery<Deadline[]>({
    queryKey: ['deadlines-reminders'],
    queryFn: () => api.get('/deadlines-reminders').then(res => res.data),
    enabled: viewMode === 'deadlines',
  });

  const { data: caseNotes, isLoading: notesLoading } = useQuery<CaseNote[]>({
    queryKey: ['case-notes'],
    queryFn: () => api.get('/case-notes').then(res => res.data),
    enabled: viewMode === 'notes' || viewMode === 'dashboard',
  });

  const { data: uploadedDocs, isLoading: uploadsLoading } = useQuery<UploadedDocument[]>({
    queryKey: ['uploaded-documents'],
    queryFn: () => api.get('/uploaded-documents').then(res => res.data),
    enabled: viewMode === 'uploads' || viewMode === 'dashboard',
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<VisaMilestone[]>({
    queryKey: ['visa-milestones'],
    queryFn: () => api.get('/visa-milestones').then(res => res.data),
    enabled: viewMode === 'milestones' || viewMode === 'dashboard',
  });

  // Forms
  const { register: registerStatus, handleSubmit: handleStatusSubmit, reset: resetStatus, setValue: setStatusValue } = useForm<StatusTimelineForm>({
    defaultValues: {
      case_type: '',
      current_status: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
    },
  });

  const { register: registerDocument, handleSubmit: handleDocumentSubmit, reset: resetDocument, setValue: setDocumentValue } = useForm<DocumentChecklistForm>({
    defaultValues: {
      document_name: '',
      required_for_stage: '',
      status: 'missing',
      expiry_date: '',
      notes: '',
    },
  });

  const { register: registerDeadline, handleSubmit: handleDeadlineSubmit, reset: resetDeadline, setValue: setDeadlineValue } = useForm<DeadlineForm>({
    defaultValues: {
      deadline_type: '',
      deadline_date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      is_critical: false,
      notes: '',
    },
  });

  const { register: registerNote, handleSubmit: handleNoteSubmit, reset: resetNote, setValue: setNoteValue } = useForm<CaseNoteForm>({
    defaultValues: {
      note_date: new Date().toISOString().split('T')[0],
      note_type: '',
      title: '',
      content: '',
      tags: '',
    },
  });

  // Upload form uses native FormData, not react-hook-form
  const resetUpload = () => {
    if (uploadFormRef.current) {
      uploadFormRef.current.reset();
    }
  };

  const { register: registerMilestone, handleSubmit: handleMilestoneSubmit, reset: resetMilestone, setValue: setMilestoneValue } = useForm<VisaMilestoneForm>({
    defaultValues: {
      milestone_type: '',
      milestone_date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      status: 'pending',
      next_steps: '',
      notes: '',
    },
  });

  // Mutations
  const createStatusMutation = useMutation({
    mutationFn: (data: StatusTimelineForm) => api.post('/status-timeline', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-timeline'] });
      resetStatus();
      setShowStatusForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create status timeline entry'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StatusTimelineForm> }) => api.put(`/status-timeline/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-timeline'] });
      resetStatus();
      setShowStatusForm(false);
      setIsEditing(false);
      setSelectedStatus(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update status timeline entry'),
  });

  const deleteStatusMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/status-timeline/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-timeline'] });
      alert('Status timeline entry deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete status timeline entry'),
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data: DocumentChecklistForm) => api.post('/document-checklist', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-checklist'] });
      resetDocument();
      setShowDocumentForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create document checklist item'),
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DocumentChecklistForm> }) => api.put(`/document-checklist/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-checklist'] });
      resetDocument();
      setShowDocumentForm(false);
      setIsEditing(false);
      setSelectedDocument(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update document checklist item'),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/document-checklist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-checklist'] });
      alert('Document checklist item deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete document checklist item'),
  });

  const createDeadlineMutation = useMutation({
    mutationFn: (data: DeadlineForm) => api.post('/deadlines-reminders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines-reminders'] });
      resetDeadline();
      setShowDeadlineForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create deadline'),
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeadlineForm & { completed?: boolean; completed_date?: string }> }) => api.put(`/deadlines-reminders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines-reminders'] });
      resetDeadline();
      setShowDeadlineForm(false);
      setIsEditing(false);
      setSelectedDeadline(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update deadline'),
  });

  const deleteDeadlineMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/deadlines-reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines-reminders'] });
      alert('Deadline deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete deadline'),
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: CaseNoteForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/case-notes', {
        ...data,
        note_type: data.note_type || null,
        title: data.title || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] });
      resetNote();
      setShowNoteForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create case note'),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CaseNoteForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      return api.put(`/case-notes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] });
      resetNote();
      setShowNoteForm(false);
      setIsEditing(false);
      setSelectedNote(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update case note'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/case-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes'] });
      alert('Case note deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete case note'),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/uploaded-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
      resetUpload();
      setShowUploadForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to upload document'),
  });

  const deleteUploadMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/uploaded-documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-documents'] });
      alert('Document deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete document'),
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data: VisaMilestoneForm) => api.post('/visa-milestones', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-milestones'] });
      resetMilestone();
      setShowMilestoneForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create milestone'),
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VisaMilestoneForm> }) => api.put(`/visa-milestones/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-milestones'] });
      resetMilestone();
      setShowMilestoneForm(false);
      setIsEditing(false);
      setSelectedMilestone(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update milestone'),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/visa-milestones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-milestones'] });
      alert('Milestone deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete milestone'),
  });

  // Handlers
  const handleEditStatus = (status: StatusTimeline) => {
    setSelectedStatus(status);
    setIsEditing(true);
    setShowStatusForm(true);
    setStatusValue('case_type', status.case_type);
    setStatusValue('current_status', status.current_status);
    setStatusValue('start_date', status.start_date);
    setStatusValue('end_date', status.end_date || '');
    setStatusValue('notes', status.notes || '');
  };

  const handleEditDocument = (doc: DocumentChecklist) => {
    setSelectedDocument(doc);
    setIsEditing(true);
    setShowDocumentForm(true);
    setDocumentValue('document_name', doc.document_name);
    setDocumentValue('required_for_stage', doc.required_for_stage || '');
    setDocumentValue('status', doc.status);
    setDocumentValue('expiry_date', doc.expiry_date || '');
    setDocumentValue('notes', doc.notes || '');
  };

  const handleEditDeadline = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
    setIsEditing(true);
    setShowDeadlineForm(true);
    setDeadlineValue('deadline_type', deadline.deadline_type);
    setDeadlineValue('deadline_date', deadline.deadline_date);
    setDeadlineValue('title', deadline.title);
    setDeadlineValue('description', deadline.description || '');
    setDeadlineValue('is_critical', deadline.is_critical);
    setDeadlineValue('notes', deadline.notes || '');
  };

  const handleEditNote = (note: CaseNote) => {
    setSelectedNote(note);
    setIsEditing(true);
    setShowNoteForm(true);
    setNoteValue('note_date', note.note_date);
    setNoteValue('note_type', note.note_type || '');
    setNoteValue('title', note.title || '');
    setNoteValue('content', note.content);
    setNoteValue('tags', note.tags?.join(', ') || '');
  };

  const handleEditMilestone = (milestone: VisaMilestone) => {
    setSelectedMilestone(milestone);
    setIsEditing(true);
    setShowMilestoneForm(true);
    setMilestoneValue('milestone_type', milestone.milestone_type);
    setMilestoneValue('milestone_date', milestone.milestone_date);
    setMilestoneValue('title', milestone.title);
    setMilestoneValue('description', milestone.description || '');
    setMilestoneValue('status', milestone.status);
    setMilestoneValue('next_steps', milestone.next_steps || '');
    setMilestoneValue('notes', milestone.notes || '');
  };

  const onStatusSubmit = (data: StatusTimelineForm) => {
    if (isEditing && selectedStatus) {
      updateStatusMutation.mutate({ id: selectedStatus.id, data });
    } else {
      createStatusMutation.mutate(data);
    }
  };

  const onDocumentSubmit = (data: DocumentChecklistForm) => {
    if (isEditing && selectedDocument) {
      updateDocumentMutation.mutate({ id: selectedDocument.id, data });
    } else {
      createDocumentMutation.mutate(data);
    }
  };

  const onDeadlineSubmit = (data: DeadlineForm) => {
    if (isEditing && selectedDeadline) {
      updateDeadlineMutation.mutate({ id: selectedDeadline.id, data });
    } else {
      createDeadlineMutation.mutate(data);
    }
  };

  const onNoteSubmit = (data: CaseNoteForm) => {
    if (isEditing && selectedNote) {
      updateNoteMutation.mutate({ id: selectedNote.id, data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const onUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput?.files?.[0]) {
      alert('Please select a file to upload');
      return;
    }

    const form = e.currentTarget;
    const uploadData: any = {
      document_type: (form.querySelector('[name="document_type"]') as HTMLInputElement)?.value || '',
      linked_stage: (form.querySelector('[name="linked_stage"]') as HTMLInputElement)?.value || '',
      uploaded_date: (form.querySelector('[name="uploaded_date"]') as HTMLInputElement)?.value || new Date().toISOString().split('T')[0],
      expiry_date: (form.querySelector('[name="expiry_date"]') as HTMLInputElement)?.value || '',
      notes: (form.querySelector('[name="notes"]') as HTMLTextAreaElement)?.value || '',
    };

    const data = new FormData();
    data.append('file', fileInput.files[0]);
    Object.keys(uploadData).forEach(key => {
      if (uploadData[key]) {
        data.append(key, uploadData[key]);
      }
    });

    uploadDocumentMutation.mutate(data);
  };

  const onMilestoneSubmit = (data: VisaMilestoneForm) => {
    if (isEditing && selectedMilestone) {
      updateMilestoneMutation.mutate({ id: selectedMilestone.id, data });
    } else {
      createMilestoneMutation.mutate(data);
    }
  };

  // Dashboard calculations
  const currentStatus = useMemo(() => {
    if (!statusTimeline || statusTimeline.length === 0) return null;
    return statusTimeline.find(s => s.current_status !== 'Expired') || statusTimeline[0];
  }, [statusTimeline]);

  const nextCriticalDeadline = useMemo(() => {
    if (!deadlines) return null;
    const upcoming = deadlines.filter(d => !d.completed && d.is_critical);
    return upcoming.sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime())[0];
  }, [deadlines]);

  const missingDocuments = useMemo(() => {
    return documents?.filter(d => d.status === 'missing').length || 0;
  }, [documents]);

  const recentNotes = useMemo(() => {
    if (!caseNotes) return [];
    return caseNotes.slice(0, 3);
  }, [caseNotes]);

  return (
    <div className="immigration">
      <div className="page-header">
        <h1>🌍 Immigration</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setViewMode('dashboard')} className={`view-mode-btn ${viewMode === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
            <button onClick={() => setViewMode('status')} className={`view-mode-btn ${viewMode === 'status' ? 'active' : ''}`}>Status Timeline</button>
            <button onClick={() => setViewMode('documents')} className={`view-mode-btn ${viewMode === 'documents' ? 'active' : ''}`}>Documents</button>
            <button onClick={() => setViewMode('deadlines')} className={`view-mode-btn ${viewMode === 'deadlines' ? 'active' : ''}`}>Deadlines</button>
            <button onClick={() => setViewMode('notes')} className={`view-mode-btn ${viewMode === 'notes' ? 'active' : ''}`}>Case Notes</button>
            <button onClick={() => setViewMode('uploads')} className={`view-mode-btn ${viewMode === 'uploads' ? 'active' : ''}`}>Uploaded Docs</button>
            <button onClick={() => setViewMode('milestones')} className={`view-mode-btn ${viewMode === 'milestones' ? 'active' : ''}`}>Milestones</button>
          </div>
          {viewMode === 'status' && <button onClick={() => { setShowStatusForm(true); setIsEditing(false); setSelectedStatus(null); resetStatus(); }} className="btn-primary">+ Add Status</button>}
          {viewMode === 'documents' && <button onClick={() => { setShowDocumentForm(true); setIsEditing(false); setSelectedDocument(null); resetDocument(); }} className="btn-primary">+ Add Document</button>}
          {viewMode === 'deadlines' && <button onClick={() => { setShowDeadlineForm(true); setIsEditing(false); setSelectedDeadline(null); resetDeadline(); }} className="btn-primary">+ Add Deadline</button>}
          {viewMode === 'notes' && <button onClick={() => { setShowNoteForm(true); setIsEditing(false); setSelectedNote(null); resetNote(); }} className="btn-primary">+ Add Note</button>}
          {viewMode === 'uploads' && <button onClick={() => { setShowUploadForm(true); setIsEditing(false); resetUpload(); }} className="btn-primary">+ Upload Document</button>}
          {viewMode === 'milestones' && <button onClick={() => { setShowMilestoneForm(true); setIsEditing(false); setSelectedMilestone(null); resetMilestone(); }} className="btn-primary">+ Add Milestone</button>}
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="immigration-dashboard">
          {/* Current Status */}
          <div className="dashboard-section">
            <h2>Current Status</h2>
            {statusLoading ? (
              <LoadingSpinner size="small" />
            ) : currentStatus ? (
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: '#1f2937' }}>
                  {currentStatus.current_status} → {currentStatus.case_type}
                </p>
                {currentStatus.end_date && (
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    Valid until: {new Date(currentStatus.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No status timeline entries yet</p>
            )}
          </div>

          {/* Next Critical Deadline */}
          <div className="dashboard-section">
            <h2>Next Critical Deadline</h2>
            {deadlinesLoading ? (
              <LoadingSpinner size="small" />
            ) : nextCriticalDeadline ? (
              <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '4px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#92400e' }}>
                  ⚠ {nextCriticalDeadline.title}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.25rem' }}>
                  {new Date(nextCriticalDeadline.deadline_date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No critical deadlines upcoming</p>
            )}
          </div>

          {/* Document Checklist */}
          <div className="dashboard-section">
            <h2>Document Checklist</h2>
            {documentsLoading ? (
              <LoadingSpinner size="small" />
            ) : documents && documents.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {doc.status === 'submitted' ? '✔' : doc.status === 'uploaded' ? '📄' : '☐'} {doc.document_name}
                  </div>
                ))}
                {missingDocuments > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>
                    {missingDocuments} missing document{missingDocuments !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No documents in checklist yet</p>
            )}
          </div>

          {/* Recent Case Notes */}
          <div className="dashboard-section">
            <h2>Recent Case Notes</h2>
            {notesLoading ? (
              <LoadingSpinner size="small" />
            ) : recentNotes.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {recentNotes.map((note) => (
                  <div key={note.id} style={{ fontSize: '0.875rem', color: '#666' }}>
                    • {note.title || note.content.substring(0, 50)}...
                    <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>
                      ({new Date(note.note_date).toLocaleDateString()})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No case notes yet</p>
            )}
          </div>
        </div>
      )}

      {/* Status Timeline View */}
      {viewMode === 'status' && (
        <>
          {showStatusForm && (
            <form onSubmit={handleStatusSubmit(onStatusSubmit)} className="immigration-form">
              <h3>{isEditing ? 'Edit Status Timeline' : 'Add Status Timeline Entry'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Case Type *</label>
                  <input type="text" {...registerStatus('case_type', { required: true })} placeholder="e.g., F-1, OPT, H-1B" />
                </div>
                <div className="form-group">
                  <label>Current Status *</label>
                  <input type="text" {...registerStatus('current_status', { required: true })} placeholder="e.g., Active, Pending, Approved" />
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" {...registerStatus('start_date', { required: true })} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" {...registerStatus('end_date')} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} {...registerStatus('notes')} placeholder="Additional notes per stage" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createStatusMutation.isPending || updateStatusMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Entry
                </button>
                <button type="button" onClick={() => { setShowStatusForm(false); setIsEditing(false); setSelectedStatus(null); resetStatus(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {statusLoading ? (
            <LoadingSpinner message="Loading status timeline..." size="large" />
          ) : statusTimeline && statusTimeline.length > 0 ? (
            <div className="status-timeline-list">
              {statusTimeline.map((status) => (
                <div key={status.id} className="status-card">
                  <div className="status-header">
                    <div>
                      <h3>{status.case_type}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#666' }}>Status: {status.current_status}</p>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>
                        {new Date(status.start_date).toLocaleDateString()}
                        {status.end_date && ` - ${new Date(status.end_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  {status.notes && <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{status.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditStatus(status)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteStatusMutation.mutate(status.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🌍" title="No status timeline entries yet" message="Track your immigration status over time." actionLabel="Add Status" onAction={() => { setShowStatusForm(true); setIsEditing(false); setSelectedStatus(null); resetStatus(); }} />
          )}
        </>
      )}

      {/* Document Checklist View */}
      {viewMode === 'documents' && (
        <>
          {showDocumentForm && (
            <form onSubmit={handleDocumentSubmit(onDocumentSubmit)} className="immigration-form">
              <h3>{isEditing ? 'Edit Document' : 'Add Document to Checklist'}</h3>
              <div className="form-group">
                <label>Document Name *</label>
                <input type="text" {...registerDocument('document_name', { required: true })} placeholder="e.g., Passport, I-20, I-94" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Required For Stage</label>
                  <input type="text" {...registerDocument('required_for_stage')} placeholder="e.g., H-1B application" />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select {...registerDocument('status', { required: true })}>
                    <option value="missing">Missing</option>
                    <option value="uploaded">Uploaded</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" {...registerDocument('expiry_date')} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} {...registerDocument('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Document
                </button>
                <button type="button" onClick={() => { setShowDocumentForm(false); setIsEditing(false); setSelectedDocument(null); resetDocument(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {documentsLoading ? (
            <LoadingSpinner message="Loading document checklist..." size="large" />
          ) : documents && documents.length > 0 ? (
            <div className="documents-list">
              {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-header">
                    <div>
                      <h3>{doc.document_name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#999', padding: '0.25rem 0.5rem', background: doc.status === 'submitted' ? '#d1fae5' : doc.status === 'uploaded' ? '#dbeafe' : '#fee2e2', borderRadius: '4px' }}>
                        {doc.status}
                      </span>
                      {doc.required_for_stage && <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>• {doc.required_for_stage}</span>}
                    </div>
                  </div>
                  {doc.expiry_date && (
                    <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>
                      Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                  {doc.notes && <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{doc.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditDocument(doc)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteDocumentMutation.mutate(doc.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📋" title="No documents in checklist yet" message="Add documents you need for your immigration process." actionLabel="Add Document" onAction={() => { setShowDocumentForm(true); setIsEditing(false); setSelectedDocument(null); resetDocument(); }} />
          )}
        </>
      )}

      {/* Deadlines View */}
      {viewMode === 'deadlines' && (
        <>
          {showDeadlineForm && (
            <form onSubmit={handleDeadlineSubmit(onDeadlineSubmit)} className="immigration-form">
              <h3>{isEditing ? 'Edit Deadline' : 'Add Deadline'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Deadline Type *</label>
                  <input type="text" {...registerDeadline('deadline_type', { required: true })} placeholder="e.g., Filing Deadline, Biometrics, Renewal" />
                </div>
                <div className="form-group">
                  <label>Deadline Date *</label>
                  <input type="date" {...registerDeadline('deadline_date', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" {...registerDeadline('title', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Is Critical</label>
                  <input type="checkbox" {...registerDeadline('is_critical')} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} {...registerDeadline('description')} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} {...registerDeadline('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createDeadlineMutation.isPending || updateDeadlineMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Deadline
                </button>
                <button type="button" onClick={() => { setShowDeadlineForm(false); setIsEditing(false); setSelectedDeadline(null); resetDeadline(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {deadlinesLoading ? (
            <LoadingSpinner message="Loading deadlines..." size="large" />
          ) : allDeadlines && allDeadlines.length > 0 ? (
            <div className="deadlines-list">
              {allDeadlines.map((deadline) => (
                <div key={deadline.id} className={`deadline-card ${deadline.is_critical ? 'critical' : ''} ${deadline.completed ? 'completed' : ''}`}>
                  <div className="deadline-header">
                    <div>
                      <h3>{deadline.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#666' }}>{deadline.deadline_type}</p>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>
                        {new Date(deadline.deadline_date).toLocaleDateString()}
                        {deadline.is_critical && <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>⚠ Critical</span>}
                      </span>
                    </div>
                    {deadline.completed && <span style={{ fontSize: '0.75rem', color: '#059669', padding: '0.25rem 0.5rem', background: '#d1fae5', borderRadius: '4px' }}>Completed</span>}
                  </div>
                  {deadline.description && <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{deadline.description}</p>}
                  {deadline.notes && <p style={{ marginTop: '0.5rem', color: '#999', fontSize: '0.75rem' }}>{deadline.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {!deadline.completed && (
                      <button onClick={() => updateDeadlineMutation.mutate({ id: deadline.id, data: { completed: true, completed_date: new Date().toISOString().split('T')[0] } })} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Mark Complete</button>
                    )}
                    <button onClick={() => handleEditDeadline(deadline)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteDeadlineMutation.mutate(deadline.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📅" title="No deadlines yet" message="Add important deadlines and reminders." actionLabel="Add Deadline" onAction={() => { setShowDeadlineForm(true); setIsEditing(false); setSelectedDeadline(null); resetDeadline(); }} />
          )}
        </>
      )}

      {/* Case Notes View */}
      {viewMode === 'notes' && (
        <>
          {showNoteForm && (
            <form onSubmit={handleNoteSubmit(onNoteSubmit)} className="immigration-form">
              <h3>{isEditing ? 'Edit Case Note' : 'Add Case Note'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Note Date</label>
                  <input type="date" {...registerNote('note_date')} />
                </div>
                <div className="form-group">
                  <label>Note Type</label>
                  <input type="text" {...registerNote('note_type')} placeholder="e.g., Lawyer Advice, Phone Call, USCIS Update" />
                </div>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input type="text" {...registerNote('title')} />
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea rows={6} {...registerNote('content', { required: true })} placeholder="Case note content" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerNote('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createNoteMutation.isPending || updateNoteMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Note
                </button>
                <button type="button" onClick={() => { setShowNoteForm(false); setIsEditing(false); setSelectedNote(null); resetNote(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {notesLoading ? (
            <LoadingSpinner message="Loading case notes..." size="large" />
          ) : caseNotes && caseNotes.length > 0 ? (
            <div className="notes-list">
              {caseNotes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <div>
                      {note.title && <h3>{note.title}</h3>}
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>
                        {new Date(note.note_date).toLocaleDateString()}
                        {note.note_type && ` • ${note.note_type}`}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{note.content}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                      <strong>Tags:</strong> {note.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditNote(note)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteNoteMutation.mutate(note.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📝" title="No case notes yet" message="Record lawyer advice, phone calls, USCIS updates, and personal observations." actionLabel="Add Note" onAction={() => { setShowNoteForm(true); setIsEditing(false); setSelectedNote(null); resetNote(); }} />
          )}
        </>
      )}

      {/* Uploaded Documents View */}
      {viewMode === 'uploads' && (
        <>
          {showUploadForm && (
            <form ref={uploadFormRef} onSubmit={onUploadSubmit} className="immigration-form">
              <h3>Upload Document</h3>
              <div className="form-group">
                <label>File *</label>
                <input type="file" name="file" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Document Type *</label>
                  <input type="text" name="document_type" required placeholder="e.g., Passport, I-20, I-94, Receipt, Approval Notice" />
                </div>
                <div className="form-group">
                  <label>Linked Stage</label>
                  <input type="text" name="linked_stage" placeholder="Which stage/case this document is for" />
                </div>
                <div className="form-group">
                  <label>Uploaded Date</label>
                  <input type="date" name="uploaded_date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" name="expiry_date" />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} name="notes" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={uploadDocumentMutation.isPending}>
                  Upload Document
                </button>
                <button type="button" onClick={() => { setShowUploadForm(false); resetUpload(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {uploadsLoading ? (
            <LoadingSpinner message="Loading uploaded documents..." size="large" />
          ) : uploadedDocs && uploadedDocs.length > 0 ? (
            <div className="uploads-list">
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="upload-card">
                  <div className="upload-header">
                    <div>
                      <h3>{doc.document_type}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#666' }}>{doc.file_name}</p>
                      {doc.linked_stage && <span style={{ fontSize: '0.75rem', color: '#999' }}>• {doc.linked_stage}</span>}
                      {doc.expiry_date && (
                        <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                          Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {doc.notes && <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{doc.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {doc.access_url && (
                      <a href={doc.access_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', textDecoration: 'none' }}>View</a>
                    )}
                    <button onClick={() => { if (confirm('Are you sure?')) deleteUploadMutation.mutate(doc.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📎" title="No uploaded documents yet" message="Upload passports, I-20, I-94, receipts, and approval notices." actionLabel="Upload Document" onAction={() => { setShowUploadForm(true); resetUpload(); }} />
          )}
        </>
      )}

      {/* Milestones View */}
      {viewMode === 'milestones' && (
        <>
          {showMilestoneForm && (
            <form onSubmit={handleMilestoneSubmit(onMilestoneSubmit)} className="immigration-form">
              <h3>{isEditing ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Milestone Type *</label>
                  <input type="text" {...registerMilestone('milestone_type', { required: true })} placeholder="e.g., Filed, Received, Biometrics Completed, Approved" />
                </div>
                <div className="form-group">
                  <label>Milestone Date *</label>
                  <input type="date" {...registerMilestone('milestone_date', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" {...registerMilestone('title', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select {...registerMilestone('status')}>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} {...registerMilestone('description')} />
              </div>
              <div className="form-group">
                <label>Next Steps</label>
                <textarea rows={2} {...registerMilestone('next_steps')} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} {...registerMilestone('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Milestone
                </button>
                <button type="button" onClick={() => { setShowMilestoneForm(false); setIsEditing(false); setSelectedMilestone(null); resetMilestone(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {milestonesLoading ? (
            <LoadingSpinner message="Loading milestones..." size="large" />
          ) : milestones && milestones.length > 0 ? (
            <div className="milestones-list">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="milestone-card">
                  <div className="milestone-header">
                    <div>
                      <h3>{milestone.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#666' }}>{milestone.milestone_type}</p>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>
                        {new Date(milestone.milestone_date).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: milestone.status === 'completed' ? '#d1fae5' : milestone.status === 'cancelled' ? '#fee2e2' : '#dbeafe', borderRadius: '4px' }}>
                        {milestone.status}
                      </span>
                    </div>
                  </div>
                  {milestone.description && <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{milestone.description}</p>}
                  {milestone.next_steps && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
                      <strong>Next Steps:</strong> {milestone.next_steps}
                    </div>
                  )}
                  {milestone.notes && <p style={{ marginTop: '0.5rem', color: '#999', fontSize: '0.75rem' }}>{milestone.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditMilestone(milestone)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteMilestoneMutation.mutate(milestone.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🎯" title="No milestones yet" message="Track visa/application milestones (filed, received, approved, etc.)." actionLabel="Add Milestone" onAction={() => { setShowMilestoneForm(true); setIsEditing(false); setSelectedMilestone(null); resetMilestone(); }} />
          )}
        </>
      )}
    </div>
  );
};

export default Immigration;
