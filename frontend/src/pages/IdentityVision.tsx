import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import './Profile.css'; // Reuse Profile styles

interface ProfileData {
  fullName?: string | null;
  full_name?: string | null;
  preferredName?: string | null;
  preferred_name?: string | null;
  identityStatement?: string | null;
  identity_statement?: string | null;
  lifePillars?: string[];
  life_pillars?: string[];
  personalRules?: string[];
  personal_rules?: string[];
  strengths?: string[];
  growthAreas?: string[];
  growth_areas?: string[];
  visionShortTerm?: string | null;
  vision_short_term?: string | null;
  visionCurrentFocusTheme?: string | null;
  vision_current_focus_theme?: string | null;
  visionTopPriorities?: string[];
  vision_top_priorities?: string[];
  visionSeasonOfLife?: string | null;
  vision_season_of_life?: string | null;
  visionLongTerm?: string | null;
  vision_long_term?: string | null;
  visionCareer?: string | null;
  vision_career?: string | null;
  visionLifestyle?: string | null;
  vision_lifestyle?: string | null;
  visionFinancial?: string | null;
  vision_financial?: string | null;
  visionSpiritual?: string | null;
  vision_spiritual?: string | null;
  coreValues?: string[];
  core_values?: string[];
}

const IdentityVision = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'identity' | 'vision'>('identity');

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles').then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProfileData>) => {
      // Convert camelCase to snake_case for backend
      const backendData: any = {};
      if (data.identityStatement !== undefined) backendData.identity_statement = data.identityStatement;
      if (data.lifePillars !== undefined) backendData.life_pillars = data.lifePillars;
      if (data.personalRules !== undefined) backendData.personal_rules = data.personalRules;
      if (data.strengths !== undefined) backendData.strengths = data.strengths;
      if (data.growthAreas !== undefined) backendData.growth_areas = data.growthAreas;
      if (data.visionShortTerm !== undefined) backendData.vision_short_term = data.visionShortTerm;
      if (data.visionCurrentFocusTheme !== undefined) backendData.vision_current_focus_theme = data.visionCurrentFocusTheme;
      if (data.visionTopPriorities !== undefined) backendData.vision_top_priorities = data.visionTopPriorities;
      if (data.visionSeasonOfLife !== undefined) backendData.vision_season_of_life = data.visionSeasonOfLife;
      if (data.visionLongTerm !== undefined) backendData.vision_long_term = data.visionLongTerm;
      if (data.visionCareer !== undefined) backendData.vision_career = data.visionCareer;
      if (data.visionLifestyle !== undefined) backendData.vision_lifestyle = data.visionLifestyle;
      if (data.visionFinancial !== undefined) backendData.vision_financial = data.visionFinancial;
      if (data.visionSpiritual !== undefined) backendData.vision_spiritual = data.visionSpiritual;
      if (data.coreValues !== undefined) backendData.core_values = data.coreValues;
      return api.put('/profiles', backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Identity & Vision updated successfully!');
    },
  });

  if (isLoading) return <div className="profile-loading">Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          Core Identity
        </button>
        <button
          className={`tab ${activeTab === 'vision' ? 'active' : ''}`}
          onClick={() => setActiveTab('vision')}
        >
          Vision & Direction
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'identity' && (
          <IdentitySection profile={profile} updateMutation={updateMutation} />
        )}

        {activeTab === 'vision' && (
          <VisionSection profile={profile} updateMutation={updateMutation} />
        )}
      </div>
    </div>
  );
};

// Identity Section Component
const IdentitySection = ({
  profile,
  updateMutation,
}: {
  profile: ProfileData | undefined;
  updateMutation: any;
}) => {
  const { register, handleSubmit, reset: resetIdentityForm } = useForm({
    defaultValues: {
      identityStatement: profile?.identityStatement || profile?.identity_statement || '',
    },
  });

  const [coreValues, setCoreValues] = useState<string[]>(
    profile?.coreValues || profile?.core_values || []
  );
  const [lifePillars, setLifePillars] = useState<string[]>(
    profile?.lifePillars || profile?.life_pillars || []
  );
  const [personalRules, setPersonalRules] = useState<string[]>(
    profile?.personalRules || profile?.personal_rules || []
  );
  const [strengths, setStrengths] = useState<string[]>(
    profile?.strengths || []
  );
  const [growthAreas, setGrowthAreas] = useState<string[]>(
    profile?.growthAreas || profile?.growth_areas || []
  );

  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      resetIdentityForm({
        identityStatement: profile.identityStatement || profile.identity_statement || '',
      });
      setCoreValues(profile.coreValues || profile.core_values || []);
      setLifePillars(profile.lifePillars || profile.life_pillars || []);
      setPersonalRules(profile.personalRules || profile.personal_rules || []);
      setStrengths(profile.strengths || []);
      setGrowthAreas(profile.growthAreas || profile.growth_areas || []);
    }
  }, [profile, resetIdentityForm]);
  
  const [newValue, setNewValue] = useState('');
  const [newPillar, setNewPillar] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newGrowthArea, setNewGrowthArea] = useState('');

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      identityStatement: data.identityStatement,
      lifePillars,
      personalRules,
      strengths,
      growthAreas,
      coreValues,
    });
  };

  const addCoreValue = () => {
    if (newValue.trim()) {
      setCoreValues([...coreValues, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeCoreValue = (index: number) => {
    setCoreValues(coreValues.filter((_, i) => i !== index));
  };

  const addLifePillar = () => {
    if (newPillar.trim()) {
      setLifePillars([...lifePillars, newPillar.trim()]);
      setNewPillar('');
    }
  };

  const removeLifePillar = (index: number) => {
    setLifePillars(lifePillars.filter((_, i) => i !== index));
  };

  const addPersonalRule = () => {
    if (newRule.trim()) {
      setPersonalRules([...personalRules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removePersonalRule = (index: number) => {
    setPersonalRules(personalRules.filter((_, i) => i !== index));
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength('');
    }
  };

  const removeStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };

  const addGrowthArea = () => {
    if (newGrowthArea.trim()) {
      setGrowthAreas([...growthAreas, newGrowthArea.trim()]);
      setNewGrowthArea('');
    }
  };

  const removeGrowthArea = (index: number) => {
    setGrowthAreas(growthAreas.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
      <div className="form-group">
        <label>Identity Statement</label>
        <textarea
          rows={4}
          {...register('identityStatement')}
          placeholder="I am the kind of person who..."
        />
      </div>

      <div className="form-group">
        <label>Life Pillars</label>
        <div className="core-values-list">
          {lifePillars.map((pillar, index) => (
            <div key={index} className="core-value-tag">
              <span>{pillar}</span>
              <button
                type="button"
                onClick={() => removeLifePillar(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-value-input">
          <input
            type="text"
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLifePillar())}
            placeholder="Add a life pillar (e.g., Faith, Health, Career)"
          />
          <button type="button" onClick={addLifePillar} className="add-button">
            Add
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Personal Rules / Principles</label>
        <div className="core-values-list">
          {personalRules.map((rule, index) => (
            <div key={index} className="core-value-tag">
              <span>{rule}</span>
              <button
                type="button"
                onClick={() => removePersonalRule(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-value-input">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPersonalRule())}
            placeholder="Add a personal rule or principle"
          />
          <button type="button" onClick={addPersonalRule} className="add-button">
            Add
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Strengths</label>
        <div className="core-values-list">
          {strengths.map((strength, index) => (
            <div key={index} className="core-value-tag">
              <span>{strength}</span>
              <button
                type="button"
                onClick={() => removeStrength(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-value-input">
          <input
            type="text"
            value={newStrength}
            onChange={(e) => setNewStrength(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
            placeholder="Add a strength"
          />
          <button type="button" onClick={addStrength} className="add-button">
            Add
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Growth Areas</label>
        <div className="core-values-list">
          {growthAreas.map((area, index) => (
            <div key={index} className="core-value-tag">
              <span>{area}</span>
              <button
                type="button"
                onClick={() => removeGrowthArea(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-value-input">
          <input
            type="text"
            value={newGrowthArea}
            onChange={(e) => setNewGrowthArea(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGrowthArea())}
            placeholder="Add a growth area"
          />
          <button type="button" onClick={addGrowthArea} className="add-button">
            Add
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Core Values (3-7)</label>
        <div className="core-values-list">
          {coreValues.map((value, index) => (
            <div key={index} className="core-value-tag">
              <span>{value}</span>
              <button
                type="button"
                onClick={() => removeCoreValue(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-value-input">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCoreValue())}
            placeholder="Add a core value"
          />
          <button type="button" onClick={addCoreValue} className="add-button">
            Add
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Save Changes
      </button>
    </form>
  );
};

// Vision Section Component
const VisionSection = ({
  profile,
  updateMutation,
}: {
  profile: ProfileData | undefined;
  updateMutation: any;
}) => {
  const { register, handleSubmit, reset: resetVisionForm } = useForm({
    defaultValues: {
      visionShortTerm: profile?.visionShortTerm || profile?.vision_short_term || '',
      visionCurrentFocusTheme: profile?.visionCurrentFocusTheme || profile?.vision_current_focus_theme || '',
      visionSeasonOfLife: profile?.visionSeasonOfLife || profile?.vision_season_of_life || '',
      visionLongTerm: profile?.visionLongTerm || profile?.vision_long_term || '',
      visionCareer: profile?.visionCareer || profile?.vision_career || '',
      visionLifestyle: profile?.visionLifestyle || profile?.vision_lifestyle || '',
      visionFinancial: profile?.visionFinancial || profile?.vision_financial || '',
      visionSpiritual: profile?.visionSpiritual || profile?.vision_spiritual || '',
    },
  });

  const [visionTopPriorities, setVisionTopPriorities] = useState<string[]>(
    profile?.visionTopPriorities || profile?.vision_top_priorities || []
  );

  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      resetVisionForm({
        visionShortTerm: profile.visionShortTerm || profile.vision_short_term || '',
        visionCurrentFocusTheme: profile.visionCurrentFocusTheme || profile.vision_current_focus_theme || '',
        visionSeasonOfLife: profile.visionSeasonOfLife || profile.vision_season_of_life || '',
        visionLongTerm: profile.visionLongTerm || profile.vision_long_term || '',
        visionCareer: profile.visionCareer || profile.vision_career || '',
        visionLifestyle: profile.visionLifestyle || profile.vision_lifestyle || '',
        visionFinancial: profile.visionFinancial || profile.vision_financial || '',
        visionSpiritual: profile.visionSpiritual || profile.vision_spiritual || '',
      });
      setVisionTopPriorities(profile.visionTopPriorities || profile.vision_top_priorities || []);
    }
  }, [profile, resetVisionForm]);
  
  const [newPriority, setNewPriority] = useState('');

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      visionShortTerm: data.visionShortTerm,
      visionCurrentFocusTheme: data.visionCurrentFocusTheme,
      visionTopPriorities,
      visionSeasonOfLife: data.visionSeasonOfLife,
      visionLongTerm: data.visionLongTerm,
      visionCareer: data.visionCareer,
      visionLifestyle: data.visionLifestyle,
      visionFinancial: data.visionFinancial,
      visionSpiritual: data.visionSpiritual,
    });
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
      <h3 style={{ marginBottom: '1.5rem', color: '#667eea' }}>Short-Term Vision (30-90 days)</h3>

      <div className="form-group">
        <label>Current Focus Theme</label>
        <textarea
          rows={2}
          {...register('visionCurrentFocusTheme')}
          placeholder="What is your current focus theme?"
        />
      </div>

      <div className="form-group">
        <label>Top 3 Priorities</label>
        <div className="core-values-list">
          {visionTopPriorities.map((priority, index) => (
            <div key={index} className="core-value-tag">
              <span>{priority}</span>
              <button
                type="button"
                onClick={() => removePriority(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {visionTopPriorities.length < 3 && (
          <div className="add-value-input">
            <input
              type="text"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPriority())}
              placeholder="Add a priority"
            />
            <button type="button" onClick={addPriority} className="add-button">
              Add
            </button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Season of Life</label>
        <textarea
          rows={2}
          {...register('visionSeasonOfLife')}
          placeholder="Describe your current season of life"
        />
      </div>

      <div className="form-group">
        <label>Short-Term Vision Summary</label>
        <textarea
          rows={3}
          {...register('visionShortTerm')}
          placeholder="What do you want to achieve in the next 3-6 months?"
        />
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1.5rem', color: '#667eea' }}>Long-Term Vision (1-5 years)</h3>

      <div className="form-group">
        <label>Life Vision Statement</label>
        <textarea
          rows={3}
          {...register('visionLongTerm')}
          placeholder="What is your vision for the next 1-5 years?"
        />
      </div>

      <div className="form-group">
        <label>Career Vision</label>
        <textarea
          rows={2}
          {...register('visionCareer')}
          placeholder="Where do you want to be in your career?"
        />
      </div>

      <div className="form-group">
        <label>Lifestyle Vision</label>
        <textarea
          rows={2}
          {...register('visionLifestyle')}
          placeholder="What lifestyle do you want to create?"
        />
      </div>

      <div className="form-group">
        <label>Financial Vision</label>
        <textarea
          rows={2}
          {...register('visionFinancial')}
          placeholder="What are your financial goals?"
        />
      </div>

      <div className="form-group">
        <label>Spiritual Vision</label>
        <textarea
          rows={2}
          {...register('visionSpiritual')}
          placeholder="What is your spiritual growth vision?"
        />
      </div>

      <button type="submit" className="btn-primary">
        Save Changes
      </button>
    </form>
  );
};

export default IdentityVision;
