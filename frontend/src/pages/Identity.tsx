import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Tabs from '../components/Tabs';
import './Profile.css';
import './Identity.css';

interface IdentityItem {
  value: string;
  title?: string;
  description?: string;
}

interface ProfileData {
  identityStatement?: string | null;
  identity_statement?: string | null;
  lifePillars?: IdentityItem[] | string[];
  life_pillars?: IdentityItem[] | string[];
  personalRules?: IdentityItem[] | string[];
  personal_rules?: IdentityItem[] | string[];
  strengths?: IdentityItem[] | string[];
  growthAreas?: IdentityItem[] | string[];
  growth_areas?: IdentityItem[] | string[];
  coreValues?: IdentityItem[] | string[];
  core_values?: IdentityItem[] | string[];
  updated_at?: string;
  updatedAt?: string;
}

// Helper to normalize data (handle both old string[] and new IdentityItem[] formats)
const normalizeItems = (items: IdentityItem[] | string[] | undefined): IdentityItem[] => {
  if (!items) return [];
  if (items.length === 0) return [];
  if (typeof items[0] === 'string') {
    return (items as string[]).map(item => ({ value: item }));
  }
  return items as IdentityItem[];
};

const Identity = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'values' | 'pillars' | 'rules' | 'strengths' | 'growth'>('values');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: string; index: number; item: IdentityItem } | null>(null);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles').then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProfileData>) => {
      const backendData: any = {};
      if (data.identityStatement !== undefined) backendData.identity_statement = data.identityStatement;
      if (data.lifePillars !== undefined) backendData.life_pillars = data.lifePillars;
      if (data.personalRules !== undefined) backendData.personal_rules = data.personalRules;
      if (data.strengths !== undefined) backendData.strengths = data.strengths;
      if (data.growthAreas !== undefined) backendData.growth_areas = data.growthAreas;
      if (data.coreValues !== undefined) backendData.core_values = data.coreValues;
      return api.put('/profiles', backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Identity updated successfully!');
      setIsEditMode(false);
      setEditingItem(null);
    },
  });

  const [coreValues, setCoreValues] = useState<IdentityItem[]>([]);
  const [lifePillars, setLifePillars] = useState<IdentityItem[]>([]);
  const [personalRules, setPersonalRules] = useState<IdentityItem[]>([]);
  const [strengths, setStrengths] = useState<IdentityItem[]>([]);
  const [growthAreas, setGrowthAreas] = useState<IdentityItem[]>([]);
  const [identityStatement, setIdentityStatement] = useState('');
  const identityStatementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (profile) {
      setIdentityStatement(profile.identityStatement || profile.identity_statement || '');
      setCoreValues(normalizeItems(profile.coreValues || profile.core_values));
      setLifePillars(normalizeItems(profile.lifePillars || profile.life_pillars));
      setPersonalRules(normalizeItems(profile.personalRules || profile.personal_rules));
      setStrengths(normalizeItems(profile.strengths));
      setGrowthAreas(normalizeItems(profile.growthAreas || profile.growth_areas));
    }
  }, [profile]);

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm<IdentityItem>({
    defaultValues: { value: '', title: '', description: '' },
  });

  useEffect(() => {
    if (editingItem) {
      setEditValue('value', editingItem.item.value);
      setEditValue('title', editingItem.item.title || '');
      setEditValue('description', editingItem.item.description || '');
    }
  }, [editingItem, setEditValue]);


  const handleEditItem = (type: string, index: number, item: IdentityItem) => {
    setEditingItem({ type, index, item });
  };

  const handleSaveEdit = (data: IdentityItem) => {
    if (!editingItem) return;

    const { type, index } = editingItem;
    const updatedItem = { value: data.value.trim(), title: data.title?.trim() || undefined, description: data.description?.trim() || undefined };

    let updatedCoreValues = coreValues;
    let updatedLifePillars = lifePillars;
    let updatedPersonalRules = personalRules;
    let updatedStrengths = strengths;
    let updatedGrowthAreas = growthAreas;

    switch (type) {
      case 'coreValues':
        updatedCoreValues = [...coreValues];
        updatedCoreValues[index] = updatedItem;
        setCoreValues(updatedCoreValues);
        break;
      case 'lifePillars':
        updatedLifePillars = [...lifePillars];
        updatedLifePillars[index] = updatedItem;
        setLifePillars(updatedLifePillars);
        break;
      case 'personalRules':
        updatedPersonalRules = [...personalRules];
        updatedPersonalRules[index] = updatedItem;
        setPersonalRules(updatedPersonalRules);
        break;
      case 'strengths':
        updatedStrengths = [...strengths];
        updatedStrengths[index] = updatedItem;
        setStrengths(updatedStrengths);
        break;
      case 'growthAreas':
        updatedGrowthAreas = [...growthAreas];
        updatedGrowthAreas[index] = updatedItem;
        setGrowthAreas(updatedGrowthAreas);
        break;
    }

    setEditingItem(null);
    resetEdit();

    // Auto-save to backend immediately
    updateMutation.mutate({
      identityStatement,
      coreValues: updatedCoreValues,
      lifePillars: updatedLifePillars,
      personalRules: updatedPersonalRules,
      strengths: updatedStrengths,
      growthAreas: updatedGrowthAreas,
    });
  };

  const handleDeleteItem = async (type: string, index: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    let updatedCoreValues = coreValues;
    let updatedLifePillars = lifePillars;
    let updatedPersonalRules = personalRules;
    let updatedStrengths = strengths;
    let updatedGrowthAreas = growthAreas;

    switch (type) {
      case 'coreValues':
        updatedCoreValues = coreValues.filter((_, i) => i !== index);
        setCoreValues(updatedCoreValues);
        break;
      case 'lifePillars':
        updatedLifePillars = lifePillars.filter((_, i) => i !== index);
        setLifePillars(updatedLifePillars);
        break;
      case 'personalRules':
        updatedPersonalRules = personalRules.filter((_, i) => i !== index);
        setPersonalRules(updatedPersonalRules);
        break;
      case 'strengths':
        updatedStrengths = strengths.filter((_, i) => i !== index);
        setStrengths(updatedStrengths);
        break;
      case 'growthAreas':
        updatedGrowthAreas = growthAreas.filter((_, i) => i !== index);
        setGrowthAreas(updatedGrowthAreas);
        break;
    }

    // Auto-save to backend immediately
    updateMutation.mutate({
      identityStatement,
      coreValues: updatedCoreValues,
      lifePillars: updatedLifePillars,
      personalRules: updatedPersonalRules,
      strengths: updatedStrengths,
      growthAreas: updatedGrowthAreas,
    });
  };

  const handleAddNew = (type: string) => {
    setEditingItem({ type, index: -1, item: { value: '', title: '', description: '' } });
  };

  const handleSaveNew = (data: IdentityItem) => {
    if (!editingItem) return;

    const { type } = editingItem;
    const newItem = { value: data.value.trim(), title: data.title?.trim() || undefined, description: data.description?.trim() || undefined };

    let updatedCoreValues = coreValues;
    let updatedLifePillars = lifePillars;
    let updatedPersonalRules = personalRules;
    let updatedStrengths = strengths;
    let updatedGrowthAreas = growthAreas;

    switch (type) {
      case 'coreValues':
        updatedCoreValues = [...coreValues, newItem];
        setCoreValues(updatedCoreValues);
        break;
      case 'lifePillars':
        updatedLifePillars = [...lifePillars, newItem];
        setLifePillars(updatedLifePillars);
        break;
      case 'personalRules':
        updatedPersonalRules = [...personalRules, newItem];
        setPersonalRules(updatedPersonalRules);
        break;
      case 'strengths':
        updatedStrengths = [...strengths, newItem];
        setStrengths(updatedStrengths);
        break;
      case 'growthAreas':
        updatedGrowthAreas = [...growthAreas, newItem];
        setGrowthAreas(updatedGrowthAreas);
        break;
    }

    setEditingItem(null);
    resetEdit();

    // Auto-save to backend immediately
    updateMutation.mutate({
      identityStatement,
      coreValues: updatedCoreValues,
      lifePillars: updatedLifePillars,
      personalRules: updatedPersonalRules,
      strengths: updatedStrengths,
      growthAreas: updatedGrowthAreas,
    });
  };

  const IdentityCard = ({ item, type, index }: { item: IdentityItem; type: string; index: number }) => {
    return (
      <div
        className="identity-card"
        onClick={() => !isEditMode && setEditingItem({ type, index, item })}
      >
        <div className="identity-card-content">
          <h3>{item.title || item.value}</h3>
          {item.title && item.title !== item.value && <p className="identity-card-value">{item.value}</p>}
          {item.description && <p className="identity-card-description">{item.description}</p>}
        </div>
        {isEditMode && (
          <div className="identity-card-actions">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditItem(type, index, item);
              }}
              className="identity-card-btn identity-card-btn-edit"
              title="Edit"
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(type, index);
              }}
              className="identity-card-btn identity-card-btn-delete"
              title="Delete"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="profile-loading">Loading identity...</div>;

  const lastUpdated = profile?.updatedAt || profile?.updated_at
    ? new Date(profile.updatedAt || profile.updated_at || '').toLocaleString()
    : 'Never';

  const tabs = [
    { id: 'values', label: 'Core Values', icon: '💎' },
    { id: 'pillars', label: 'Life Pillars', icon: '🏛️' },
    { id: 'rules', label: 'Rules / Principles', icon: '📜' },
    { id: 'strengths', label: 'Strengths', icon: '💪' },
    { id: 'growth', label: 'Growth Areas', icon: '🌱' },
  ];

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'values': return coreValues;
      case 'pillars': return lifePillars;
      case 'rules': return personalRules;
      case 'strengths': return strengths;
      case 'growth': return growthAreas;
      default: return [];
    }
  };

  const getCurrentType = () => {
    switch (activeTab) {
      case 'values': return 'coreValues';
      case 'pillars': return 'lifePillars';
      case 'rules': return 'personalRules';
      case 'strengths': return 'strengths';
      case 'growth': return 'growthAreas';
      default: return '';
    }
  };

  return (
    <div className="profile-container">
      <div className="page-header-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Core Identity</h1>
            <p className="last-updated">Last updated: {lastUpdated}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn-secondary ${isEditMode ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isEditMode ? '✓' : '✏️'} {isEditMode ? 'Edit Mode' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Identity Statement Card */}
      <div className="identity-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Identity Statement</h2>
          {isEditMode && identityStatement && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to clear the identity statement?')) {
                  setIdentityStatement('');
                  updateMutation.mutate({
                    identityStatement: '',
                    coreValues,
                    lifePillars,
                    personalRules,
                    strengths,
                    growthAreas,
                  });
                }
              }}
              className="btn-secondary"
              style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#dc2626' }}
            >
              🗑️ Clear
            </button>
          )}
        </div>
        {isEditMode ? (
          <div className="identity-statement-edit">
            <textarea
              value={identityStatement}
              onChange={(e) => {
                setIdentityStatement(e.target.value);
                // Auto-save on change with debounce
                if (identityStatementTimeoutRef.current) {
                  clearTimeout(identityStatementTimeoutRef.current);
                }
                identityStatementTimeoutRef.current = setTimeout(() => {
                  updateMutation.mutate({
                    identityStatement: e.target.value,
                    coreValues,
                    lifePillars,
                    personalRules,
                    strengths,
                    growthAreas,
                  });
                }, 1000); // Save 1 second after user stops typing
              }}
              rows={4}
              placeholder="I am the kind of person who..."
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }}
            />
          </div>
        ) : (
          <div className="identity-card identity-statement-card">
            <p>{identityStatement || 'No identity statement yet. Click Edit to add one.'}</p>
          </div>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as typeof activeTab)} />

      <div className="identity-tab-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!isEditMode) {
                setIsEditMode(true);
              }
              handleAddNew(getCurrentType());
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ➕ Create New
          </button>
        </div>

        <div className="identity-cards-grid">
          {getCurrentItems().map((item, index) => (
            <IdentityCard key={index} item={item} type={getCurrentType()} index={index} />
          ))}
          {getCurrentItems().length === 0 && (
            <div className="identity-empty-state">
              <p>No items yet. Click "Create New" to add your first item.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {editingItem && (
        <div className="identity-modal-overlay" onClick={() => { setEditingItem(null); resetEdit(); }}>
          <div className="identity-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem.index === -1 ? 'Add New' : 'Edit'} {tabs.find(t => t.id === activeTab)?.label}</h3>
            <form onSubmit={handleEditSubmit(editingItem.index === -1 ? handleSaveNew : handleSaveEdit)}>
              <div className="form-group">
                <label>Value/Name *</label>
                <input type="text" {...registerEdit('value', { required: true })} placeholder="e.g., Integrity" />
              </div>
              <div className="form-group">
                <label>Title (optional)</label>
                <input type="text" {...registerEdit('title')} placeholder="Short title or heading" />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea {...registerEdit('description')} rows={4} placeholder="Add details or description..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" onClick={() => { setEditingItem(null); resetEdit(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditMode && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              💡 Changes are saved automatically when you add, edit, or delete items.
            </p>
            {updateMutation.isPending && (
              <span style={{ color: '#667eea', fontSize: '0.9rem' }}>Saving...</span>
            )}
            {updateMutation.isSuccess && !updateMutation.isPending && (
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>✓ Saved</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Identity;
