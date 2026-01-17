import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './Documents.css';

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: 'file' | 'text';
  content?: string;
  content_format?: 'plain' | 'rich';
  blob_url?: string;
  folder_id: string | null;
  created_at: string;
}

const Documents = () => {
  const [uploading, setUploading] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const queryClient = useQueryClient();

  const { data: folders, isLoading: foldersLoading, error: foldersError } = useQuery<Folder[]>({
    queryKey: ['folders', selectedFolder],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedFolder) {
        params.append('parent_folder_id', selectedFolder);
      } else {
        params.append('parent_folder_id', 'null');
      }
      return api.get(`/documents/folders?${params.toString()}`).then(res => res.data);
    },
  });

  const { data: documents, isLoading: documentsLoading, error: documentsError } = useQuery<Document[]>({
    queryKey: ['documents', selectedFolder],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedFolder) {
        params.append('folder_id', selectedFolder);
      } else {
        params.append('folder_id', 'null');
      }
      return api.get(`/documents?${params.toString()}`).then(res => res.data);
    },
  });

  const { register: registerFolder, handleSubmit: handleFolderSubmit, reset: resetFolder } = useForm<{ name: string }>();
  const { register: registerDoc, handleSubmit: handleDocSubmit, reset: resetDoc, setValue: setDocValue } = useForm<{
    file_name: string;
    content: string;
  }>({
    defaultValues: { file_name: '', content: '' },
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; parent_folder_id?: string | null }) =>
      api.post('/documents/folders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      resetFolder();
      setShowFolderForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create folder';
      alert(errorMessage);
    },
  });

  const createTextDocMutation = useMutation({
    mutationFn: (data: { file_name: string; content: string; folder_id?: string | null }) =>
      api.post('/documents/text', { ...data, content_format: 'rich' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      resetDoc();
      setShowTextEditor(false);
      setEditingDocument(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create document';
      alert(errorMessage);
    },
  });

  const updateTextDocMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { file_name: string; content: string } }) =>
      api.put(`/documents/text/${id}`, { ...data, content_format: 'rich' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDocument(null);
      setSelectedDocument(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to update document';
      alert(errorMessage);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/folders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete folder';
      alert(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocument(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete document';
      alert(errorMessage);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'immigration');
    if (selectedFolder) {
      formData.append('folder_id', selectedFolder);
    }

    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      e.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = (data: { name: string }) => {
    createFolderMutation.mutate({ name: data.name, parent_folder_id: selectedFolder });
  };

  const handleCreateTextDoc = (data: { file_name: string; content: string }) => {
    createTextDocMutation.mutate({ ...data, folder_id: selectedFolder });
  };

  const handleUpdateTextDoc = (data: { file_name: string; content: string }) => {
    if (editingDocument) {
      updateTextDocMutation.mutate({ id: editingDocument.id, data });
    }
  };

  const handleEditDocument = (doc: Document) => {
    if (doc.document_type === 'text') {
      setEditingDocument(doc);
      setDocValue('file_name', doc.file_name);
      setDocValue('content', doc.content || '');
      setShowTextEditor(true);
      setSelectedDocument(null);
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowTextEditor(false);
    setEditingDocument(null);
  };

  const navigateToFolder = (folderId: string | null) => {
    setSelectedFolder(folderId);
    setSelectedDocument(null);
  };

  if (foldersLoading || documentsLoading) return <div>Loading...</div>;

  return (
    <div className="documents">
      <div className="page-header">
        <h1>Documents</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setShowFolderForm(!showFolderForm)} className="btn-secondary">
            {showFolderForm ? 'Cancel' : 'New Folder'}
          </button>
          <button onClick={() => { setShowTextEditor(!showTextEditor); setEditingDocument(null); resetDoc(); }} className="btn-secondary">
            {showTextEditor ? 'Cancel' : 'New Document'}
          </button>
          <label className="btn-primary" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="documents-breadcrumb">
        <button onClick={() => navigateToFolder(null)} className="breadcrumb-item">
          📁 Root
        </button>
        {selectedFolder && <span className="breadcrumb-separator">/</span>}
      </div>

      {/* Folder Form */}
      {showFolderForm && (
        <form onSubmit={handleFolderSubmit(handleCreateFolder)} className="folder-form">
          <input
            type="text"
            placeholder="Folder name"
            {...registerFolder('name', { required: true })}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary">Create Folder</button>
            <button type="button" onClick={() => { setShowFolderForm(false); resetFolder(); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Text Document Editor */}
      {showTextEditor && (
        <form
          onSubmit={editingDocument ? handleDocSubmit(handleUpdateTextDoc) : handleDocSubmit(handleCreateTextDoc)}
          className="text-doc-form"
        >
          <h3>{editingDocument ? 'Edit Document' : 'Create New Document'}</h3>
          <input
            type="text"
            placeholder="Document title"
            {...registerDoc('file_name', { required: true })}
            className="doc-title-input"
          />
          <RichTextEditor
            value={editingDocument?.content || ''}
            onChange={(html) => setDocValue('content', html)}
            placeholder="Start typing your document..."
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={createTextDocMutation.isPending || updateTextDocMutation.isPending}>
              {editingDocument ? 'Update' : 'Create'} Document
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTextEditor(false);
                setEditingDocument(null);
                resetDoc();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Document Viewer */}
      {selectedDocument && selectedDocument.document_type === 'text' && (
        <div className="document-viewer">
          <div className="viewer-header">
            <h2>{selectedDocument.file_name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleEditDocument(selectedDocument)} className="btn-secondary">
                ✏️ Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this document?')) {
                    deleteMutation.mutate(selectedDocument.id);
                  }
                }}
                className="btn-danger"
              >
                🗑️ Delete
              </button>
              <button onClick={() => setSelectedDocument(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
          <div
            className="document-content"
            dangerouslySetInnerHTML={{ __html: selectedDocument.content || '' }}
          />
        </div>
      )}

      {/* Folders and Documents Grid */}
      <div className="documents-grid">
        {/* Folders */}
        {folders && folders.length > 0 && (
          <>
            {folders.map((folder) => (
              <div key={folder.id} className="folder-card" onClick={() => navigateToFolder(folder.id)}>
                <div className="folder-icon">📁</div>
                <div className="folder-name">{folder.name}</div>
                <button
                  className="folder-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete folder "${folder.name}"? This will also delete all documents inside.`)) {
                      deleteFolderMutation.mutate(folder.id);
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </>
        )}

        {/* Documents */}
        {documents && documents.length > 0 && (
          <>
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-icon">
                  {doc.document_type === 'text' ? '📄' : '📎'}
                </div>
                <div className="document-name" onClick={() => handleViewDocument(doc)}>
                  {doc.file_name}
                </div>
                <div className="document-actions">
                  {doc.document_type === 'text' && (
                    <button onClick={() => handleEditDocument(doc)} className="action-btn" title="Edit">
                      ✏️
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this document?')) {
                        deleteMutation.mutate(doc.id);
                      }
                    }}
                    className="action-btn"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {foldersLoading || documentsLoading ? (
          <LoadingSpinner message="Loading documents..." size="medium" />
        ) : (foldersError || documentsError) ? (
          <ErrorMessage
            message={(foldersError || documentsError) instanceof Error 
              ? (foldersError || documentsError)?.message || 'Failed to load documents'
              : 'Failed to load documents'}
            onRetry={() => {
              queryClient.invalidateQueries({ queryKey: ['folders'] });
              queryClient.invalidateQueries({ queryKey: ['documents'] });
            }}
          />
        ) : (!folders || folders.length === 0) && (!documents || documents.length === 0) && !showFolderForm && !showTextEditor && (
          <EmptyState
            icon="📁"
            title="No folders or documents"
            message="Create a folder or document to get started organizing your files."
            actionLabel="Create Folder"
            onAction={() => setShowFolderForm(true)}
          />
        )}
      </div>
    </div>
  );
};

export default Documents;
