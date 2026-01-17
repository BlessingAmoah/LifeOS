import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Tabs from '../components/Tabs';
import './Career.css';

interface CareerGoalForm {
  title: string;
  description: string;
  target_date: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface SkillForm {
  name: string;
  category: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | '';
  notes: string;
  resources: string;
}

interface RoleForm {
  title: string;
  company: string;
  role_type: 'current' | 'next' | 'dream';
  description: string;
  requirements: string;
  salary_range: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface FeedbackNoteForm {
  source: string;
  feedback_type: 'general' | 'performance' | 'strength' | 'improvement' | 'career';
  content: string;
  received_date: string;
  action_items: string;
  tags: string;
}

interface ResumeVersionForm {
  version_name: string;
  description: string;
  target_role: string;
  last_updated: string;
  is_current: boolean;
  notes: string;
}

interface InterviewPrepForm {
  company: string;
  role: string;
  interview_date: string;
  interview_type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral' | 'panel' | 'final' | '';
  stage: string;
  preparation_notes: string;
  questions_prepared: string;
  answers_prepared: string;
  feedback: string;
  outcome: 'pending' | 'passed' | 'failed' | 'withdrawn' | 'offer';
  follow_up_actions: string;
}

interface MilestoneForm {
  title: string;
  milestone_type: 'promotion' | 'role_change' | 'skill_achievement' | 'certification' | 'project_completion' | 'recognition' | 'other';
  achieved_date: string;
  description: string;
  impact: string;
  skills_gained: string;
  recognition: string;
}

interface CareerGoal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface Skill {
  id: string;
  name: string;
  category: string | null;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  notes: string | null;
  resources: string[];
  created_at: string;
  updated_at: string;
}

interface Role {
  id: string;
  title: string;
  company: string | null;
  role_type: 'current' | 'next' | 'dream';
  description: string | null;
  requirements: string[];
  salary_range: string | null;
  location: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FeedbackNote {
  id: string;
  source: string;
  feedback_type: 'general' | 'performance' | 'strength' | 'improvement' | 'career';
  content: string;
  received_date: string;
  action_items: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ResumeVersion {
  id: string;
  version_name: string;
  description: string | null;
  file_url: string | null;
  target_role: string | null;
  last_updated: string;
  is_current: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InterviewPrep {
  id: string;
  company: string;
  role: string;
  interview_date: string | null;
  interview_type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral' | 'panel' | 'final' | null;
  stage: string | null;
  preparation_notes: string | null;
  questions_prepared: string[];
  answers_prepared: string[];
  feedback: string | null;
  outcome: 'pending' | 'passed' | 'failed' | 'withdrawn' | 'offer';
  follow_up_actions: string[];
  created_at: string;
  updated_at: string;
}

interface CareerMilestone {
  id: string;
  title: string;
  milestone_type: 'promotion' | 'role_change' | 'skill_achievement' | 'certification' | 'project_completion' | 'recognition' | 'other';
  achieved_date: string;
  description: string | null;
  impact: string | null;
  skills_gained: string[];
  recognition: string | null;
  created_at: string;
  updated_at: string;
}

interface CareerProfile {
  id: string;
  user_id: string;
  current_theme: string | null;
  current_focus: string | null;
  updated_at: string;
}

interface ImpactNoteForm {
  title: string;
  description: string;
  impact_type: 'project' | 'metric' | 'problem_solved' | 'achievement' | 'recognition' | 'other';
  metrics: string;
  date_achieved: string;
  skills_demonstrated: string;
  tags: string;
}

interface ImpactNote {
  id: string;
  title: string;
  description: string;
  impact_type: 'project' | 'metric' | 'problem_solved' | 'achievement' | 'recognition' | 'other';
  metrics: string | null;
  date_achieved: string;
  skills_demonstrated: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ApplicationForm {
  company: string;
  role: string;
  stage: 'applied' | 'screening' | 'interview' | 'final' | 'offer' | 'rejected' | 'withdrawn';
  application_date: string;
  job_url: string;
  notes: string;
  salary_range: string;
  location: string;
}

interface Application {
  id: string;
  company: string;
  role: string;
  stage: 'applied' | 'screening' | 'interview' | 'final' | 'offer' | 'rejected' | 'withdrawn';
  application_date: string;
  job_url: string | null;
  notes: string | null;
  salary_range: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

const Career = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'goals' | 'skills' | 'roles' | 'feedback' | 'resumes' | 'interviews' | 'milestones' | 'impact' | 'applications'>('dashboard');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showImpactForm, setShowImpactForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showQuickRoleForm, setShowQuickRoleForm] = useState(false);
  const [quickRoleTitle, setQuickRoleTitle] = useState('');
  const [quickRoleCompany, setQuickRoleCompany] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<CareerGoal | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackNote | null>(null);
  const [selectedResume, setSelectedResume] = useState<ResumeVersion | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewPrep | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<CareerMilestone | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<ImpactNote | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: goals, isLoading: goalsLoading, error: goalsError } = useQuery<CareerGoal[]>({
    queryKey: ['career-goals'],
    queryFn: () => api.get('/career-goals').then(res => res.data),
    enabled: viewMode === 'goals',
  });

  const { data: skills, isLoading: skillsLoading, error: skillsError } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then(res => res.data),
    enabled: viewMode === 'skills',
  });

  const { data: roles, isLoading: rolesLoading, error: rolesError } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(res => res.data),
    enabled: viewMode === 'roles',
  });

  const { data: feedbackNotes, isLoading: feedbackLoading, error: feedbackError } = useQuery<FeedbackNote[]>({
    queryKey: ['feedback-notes'],
    queryFn: () => api.get('/feedback-notes').then(res => res.data),
    enabled: viewMode === 'feedback',
  });

  const { data: resumeVersions, isLoading: resumesLoading, error: resumesError } = useQuery<ResumeVersion[]>({
    queryKey: ['resume-versions'],
    queryFn: () => api.get('/resume-versions').then(res => res.data),
    enabled: viewMode === 'resumes',
  });

  const { data: interviews, isLoading: interviewsLoading, error: interviewsError } = useQuery<InterviewPrep[]>({
    queryKey: ['interview-prep'],
    queryFn: () => api.get('/interview-prep').then(res => res.data),
    enabled: viewMode === 'interviews',
  });

  const { data: milestones, isLoading: milestonesLoading, error: milestonesError } = useQuery<CareerMilestone[]>({
    queryKey: ['career-milestones'],
    queryFn: () => api.get('/career-milestones').then(res => res.data),
    enabled: viewMode === 'milestones' || viewMode === 'dashboard',
  });

  const { data: profile, isLoading: profileLoading } = useQuery<CareerProfile>({
    queryKey: ['career-profile'],
    queryFn: () => api.get('/career-profile').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  const { data: impactNotes, isLoading: impactLoading, error: impactError } = useQuery<ImpactNote[]>({
    queryKey: ['impact-notes'],
    queryFn: () => api.get('/impact-notes').then(res => res.data),
    enabled: viewMode === 'impact' || viewMode === 'dashboard',
  });

  const { data: applications, isLoading: applicationsLoading, error: applicationsError } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications').then(res => res.data),
    enabled: viewMode === 'applications' || viewMode === 'dashboard',
  });

  // Dashboard queries - need all data
  const { data: dashboardRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  const { data: dashboardSkills } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  // Forms
  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal, setValue: setGoalValue } = useForm<CareerGoalForm>({
    defaultValues: {
      title: '',
      description: '',
      target_date: '',
      status: 'active',
      priority: 'medium',
      category: '',
    },
  });

  const { register: registerSkill, handleSubmit: handleSkillSubmit, reset: resetSkill, setValue: setSkillValue } = useForm<SkillForm>({
    defaultValues: {
      name: '',
      category: '',
      proficiency_level: 'beginner',
      target_level: '',
      notes: '',
      resources: '',
    },
  });

  const { register: registerRole, handleSubmit: handleRoleSubmit, reset: resetRole, setValue: setRoleValue } = useForm<RoleForm>({
    defaultValues: {
      title: '',
      company: '',
      role_type: 'next',
      description: '',
      requirements: '',
      salary_range: '',
      location: '',
      status: '',
      start_date: '',
      end_date: '',
      notes: '',
    },
  });

  const { register: registerFeedback, handleSubmit: handleFeedbackSubmit, reset: resetFeedback, setValue: setFeedbackValue } = useForm<FeedbackNoteForm>({
    defaultValues: {
      source: '',
      feedback_type: 'general',
      content: '',
      received_date: new Date().toISOString().split('T')[0],
      action_items: '',
      tags: '',
    },
  });

  const { register: registerResume, handleSubmit: handleResumeSubmit, reset: resetResume, setValue: setResumeValue } = useForm<ResumeVersionForm>({
    defaultValues: {
      version_name: '',
      description: '',
      target_role: '',
      last_updated: new Date().toISOString().split('T')[0],
      is_current: false,
      notes: '',
    },
  });

  const { register: registerInterview, handleSubmit: handleInterviewSubmit, reset: resetInterview, setValue: setInterviewValue } = useForm<InterviewPrepForm>({
    defaultValues: {
      company: '',
      role: '',
      interview_date: '',
      interview_type: '',
      stage: '',
      preparation_notes: '',
      questions_prepared: '',
      answers_prepared: '',
      feedback: '',
      outcome: 'pending',
      follow_up_actions: '',
    },
  });

  const { register: registerMilestone, handleSubmit: handleMilestoneSubmit, reset: resetMilestone, setValue: setMilestoneValue } = useForm<MilestoneForm>({
    defaultValues: {
      title: '',
      milestone_type: 'other',
      achieved_date: new Date().toISOString().split('T')[0],
      description: '',
      impact: '',
      skills_gained: '',
      recognition: '',
    },
  });

  const { register: registerImpact, handleSubmit: handleImpactSubmit, reset: resetImpact, setValue: setImpactValue } = useForm<ImpactNoteForm>({
    defaultValues: {
      title: '',
      description: '',
      impact_type: 'project',
      metrics: '',
      date_achieved: new Date().toISOString().split('T')[0],
      skills_demonstrated: '',
      tags: '',
    },
  });

  const { register: registerApplication, handleSubmit: handleApplicationSubmit, reset: resetApplication, setValue: setApplicationValue } = useForm<ApplicationForm>({
    defaultValues: {
      company: '',
      role: '',
      stage: 'applied',
      application_date: new Date().toISOString().split('T')[0],
      job_url: '',
      notes: '',
      salary_range: '',
      location: '',
    },
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue: setProfileValue } = useForm<{ current_theme: string; current_focus: string }>({
    defaultValues: {
      current_theme: '',
      current_focus: '',
    },
  });

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: (data: CareerGoalForm) => api.post('/career-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-goals'] });
      resetGoal();
      setShowGoalForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create career goal'),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CareerGoalForm> }) => api.put(`/career-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-goals'] });
      resetGoal();
      setShowGoalForm(false);
      setIsEditing(false);
      setSelectedGoal(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update career goal'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/career-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-goals'] });
      alert('Career goal deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete career goal'),
  });

  const createSkillMutation = useMutation({
    mutationFn: (data: SkillForm) => {
      const resourcesArray = data.resources ? data.resources.split(',').map(r => r.trim()).filter(Boolean) : [];
      return api.post('/skills', { ...data, resources: resourcesArray, target_level: data.target_level || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      resetSkill();
      setShowSkillForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create skill'),
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SkillForm> }) => {
      const payload: any = { ...data };
      if (data.resources) {
        payload.resources = data.resources.split(',').map(r => r.trim()).filter(Boolean);
      }
      if (data.target_level === '') payload.target_level = null;
      return api.put(`/skills/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      resetSkill();
      setShowSkillForm(false);
      setIsEditing(false);
      setSelectedSkill(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update skill'),
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      alert('Skill deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete skill'),
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: RoleForm | any) => {
      // Handle requirements - if it's a string, convert to array; if array, use as is; if empty/undefined, use empty array
      let requirementsArray: string[] = [];
      if (data.requirements) {
        if (typeof data.requirements === 'string') {
          requirementsArray = data.requirements.split(',').map((r: string) => r.trim()).filter(Boolean);
        } else if (Array.isArray(data.requirements)) {
          requirementsArray = data.requirements;
        }
      }
      
      // Clean up the data - remove undefined values and convert empty strings to undefined
      const cleanData: any = {
        title: data.title,
        role_type: data.role_type,
        requirements: requirementsArray,
      };
      
      // Only include optional fields if they have values
      if (data.company) cleanData.company = data.company;
      if (data.description) cleanData.description = data.description;
      if (data.salary_range) cleanData.salary_range = data.salary_range;
      if (data.location) cleanData.location = data.location;
      if (data.status) cleanData.status = data.status;
      if (data.start_date) cleanData.start_date = data.start_date;
      if (data.end_date) cleanData.end_date = data.end_date;
      if (data.notes) cleanData.notes = data.notes;
      
      return api.post('/roles', cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetRole();
      setShowRoleForm(false);
      setShowQuickRoleForm(false);
      setQuickRoleTitle('');
      setQuickRoleCompany('');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create role'),
  });

  const quickCreateCurrentRole = () => {
    if (!quickRoleTitle.trim()) {
      alert('Please enter a role title');
      return;
    }
    // Check if there's already a current role - if so, update it; otherwise create new
    const existingCurrentRole = dashboardRoles?.find(r => r.role_type === 'current');
    const roleData: any = {
      title: quickRoleTitle.trim(),
      role_type: 'current',
      requirements: [],
    };
    
    // Only include company if it has a value
    if (quickRoleCompany.trim()) {
      roleData.company = quickRoleCompany.trim();
    }
    
    if (existingCurrentRole) {
      updateRoleMutation.mutate({
        id: existingCurrentRole.id,
        data: roleData,
      });
    } else {
      createRoleMutation.mutate(roleData);
    }
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoleForm> | any }) => {
      const payload: any = {};
      
      // Handle requirements
      if (data.requirements !== undefined) {
        if (typeof data.requirements === 'string') {
          payload.requirements = data.requirements.split(',').map((r: string) => r.trim()).filter(Boolean);
        } else if (Array.isArray(data.requirements)) {
          payload.requirements = data.requirements;
        }
      }
      
      // Only include fields that are defined and not empty strings
      if (data.title !== undefined) payload.title = data.title;
      if (data.role_type !== undefined) payload.role_type = data.role_type;
      if (data.company !== undefined && data.company !== '') payload.company = data.company;
      if (data.description !== undefined && data.description !== '') payload.description = data.description;
      if (data.salary_range !== undefined && data.salary_range !== '') payload.salary_range = data.salary_range;
      if (data.location !== undefined && data.location !== '') payload.location = data.location;
      if (data.status !== undefined && data.status !== '') payload.status = data.status;
      if (data.start_date !== undefined && data.start_date !== '') payload.start_date = data.start_date;
      if (data.end_date !== undefined && data.end_date !== '') payload.end_date = data.end_date;
      if (data.notes !== undefined && data.notes !== '') payload.notes = data.notes;
      
      return api.put(`/roles/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowQuickRoleForm(false);
      setQuickRoleTitle('');
      setQuickRoleCompany('');
      resetRole();
      setShowRoleForm(false);
      setIsEditing(false);
      setSelectedRole(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update role'),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      alert('Role deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete role'),
  });

  const createFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackNoteForm) => {
      const actionItemsArray = data.action_items ? data.action_items.split(',').map(a => a.trim()).filter(Boolean) : [];
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/feedback-notes', { ...data, action_items: actionItemsArray, tags: tagsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-notes'] });
      resetFeedback();
      setShowFeedbackForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create feedback note'),
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeedbackNoteForm> }) => {
      const payload: any = { ...data };
      if (data.action_items) {
        payload.action_items = data.action_items.split(',').map(a => a.trim()).filter(Boolean);
      }
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      return api.put(`/feedback-notes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-notes'] });
      resetFeedback();
      setShowFeedbackForm(false);
      setIsEditing(false);
      setSelectedFeedback(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update feedback note'),
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/feedback-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-notes'] });
      alert('Feedback note deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete feedback note'),
  });

  const createResumeMutation = useMutation({
    mutationFn: (data: ResumeVersionForm) => api.post('/resume-versions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      resetResume();
      setShowResumeForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create resume version'),
  });

  const updateResumeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResumeVersionForm> }) => api.put(`/resume-versions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      resetResume();
      setShowResumeForm(false);
      setIsEditing(false);
      setSelectedResume(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update resume version'),
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resume-versions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      alert('Resume version deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete resume version'),
  });

  const createInterviewMutation = useMutation({
    mutationFn: (data: InterviewPrepForm) => {
      const questionsArray = data.questions_prepared ? data.questions_prepared.split('\n').map(q => q.trim()).filter(Boolean) : [];
      const answersArray = data.answers_prepared ? data.answers_prepared.split('\n').map(a => a.trim()).filter(Boolean) : [];
      const actionsArray = data.follow_up_actions ? data.follow_up_actions.split(',').map(a => a.trim()).filter(Boolean) : [];
      return api.post('/interview-prep', {
        ...data,
        questions_prepared: questionsArray,
        answers_prepared: answersArray,
        follow_up_actions: actionsArray,
        interview_type: data.interview_type || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      resetInterview();
      setShowInterviewForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create interview prep'),
  });

  const updateInterviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewPrepForm> }) => {
      const payload: any = { ...data };
      if (data.questions_prepared) {
        payload.questions_prepared = data.questions_prepared.split('\n').map(q => q.trim()).filter(Boolean);
      }
      if (data.answers_prepared) {
        payload.answers_prepared = data.answers_prepared.split('\n').map(a => a.trim()).filter(Boolean);
      }
      if (data.follow_up_actions) {
        payload.follow_up_actions = data.follow_up_actions.split(',').map(a => a.trim()).filter(Boolean);
      }
      if (data.interview_type === '') payload.interview_type = null;
      return api.put(`/interview-prep/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      resetInterview();
      setShowInterviewForm(false);
      setIsEditing(false);
      setSelectedInterview(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update interview prep'),
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/interview-prep/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      alert('Interview prep deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete interview prep'),
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data: MilestoneForm) => {
      const skillsArray = data.skills_gained ? data.skills_gained.split(',').map(s => s.trim()).filter(Boolean) : [];
      return api.post('/career-milestones', { ...data, skills_gained: skillsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-milestones'] });
      resetMilestone();
      setShowMilestoneForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create milestone'),
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MilestoneForm> }) => {
      const payload: any = { ...data };
      if (data.skills_gained) {
        payload.skills_gained = data.skills_gained.split(',').map(s => s.trim()).filter(Boolean);
      }
      return api.put(`/career-milestones/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-milestones'] });
      resetMilestone();
      setShowMilestoneForm(false);
      setIsEditing(false);
      setSelectedMilestone(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update milestone'),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/career-milestones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-milestones'] });
      alert('Milestone deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete milestone'),
  });

  const createImpactMutation = useMutation({
    mutationFn: (data: ImpactNoteForm) => {
      const skillsArray = data.skills_demonstrated ? data.skills_demonstrated.split(',').map(s => s.trim()).filter(Boolean) : [];
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/impact-notes', { ...data, skills_demonstrated: skillsArray, tags: tagsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impact-notes'] });
      resetImpact();
      setShowImpactForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create impact note'),
  });

  const updateImpactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ImpactNoteForm> }) => {
      const payload: any = { ...data };
      if (data.skills_demonstrated) {
        payload.skills_demonstrated = data.skills_demonstrated.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      return api.put(`/impact-notes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impact-notes'] });
      resetImpact();
      setShowImpactForm(false);
      setIsEditing(false);
      setSelectedImpact(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update impact note'),
  });

  const deleteImpactMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/impact-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impact-notes'] });
      alert('Impact note deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete impact note'),
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data: ApplicationForm) => api.post('/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      resetApplication();
      setShowApplicationForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create application'),
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApplicationForm> }) => api.put(`/applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      resetApplication();
      setShowApplicationForm(false);
      setIsEditing(false);
      setSelectedApplication(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update application'),
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      alert('Application deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete application'),
  });

  // Handlers
  const handleCreateGoal = () => {
    setShowGoalForm(true);
    setIsEditing(false);
    setSelectedGoal(null);
    resetGoal({ title: '', description: '', target_date: '', status: 'active', priority: 'medium', category: '' });
  };

  const handleEditGoal = (goal: CareerGoal) => {
    setSelectedGoal(goal);
    setIsEditing(true);
    setShowGoalForm(true);
    setGoalValue('title', goal.title);
    setGoalValue('description', goal.description || '');
    setGoalValue('target_date', goal.target_date || '');
    setGoalValue('status', goal.status);
    setGoalValue('priority', goal.priority);
    setGoalValue('category', goal.category || '');
  };

  const handleCreateSkill = () => {
    setShowSkillForm(true);
    setIsEditing(false);
    setSelectedSkill(null);
    resetSkill({ name: '', category: '', proficiency_level: 'beginner', target_level: '', notes: '', resources: '' });
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsEditing(true);
    setShowSkillForm(true);
    setSkillValue('name', skill.name);
    setSkillValue('category', skill.category || '');
    setSkillValue('proficiency_level', skill.proficiency_level);
    setSkillValue('target_level', skill.target_level || '');
    setSkillValue('notes', skill.notes || '');
    setSkillValue('resources', skill.resources?.join(', ') || '');
  };

  const handleCreateRole = () => {
    setShowRoleForm(true);
    setIsEditing(false);
    setSelectedRole(null);
    resetRole({ title: '', company: '', role_type: 'next', description: '', requirements: '', salary_range: '', location: '', status: '', start_date: '', end_date: '', notes: '' });
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditing(true);
    setShowRoleForm(true);
    setRoleValue('title', role.title);
    setRoleValue('company', role.company || '');
    setRoleValue('role_type', role.role_type);
    setRoleValue('description', role.description || '');
    setRoleValue('requirements', role.requirements?.join(', ') || '');
    setRoleValue('salary_range', role.salary_range || '');
    setRoleValue('location', role.location || '');
    setRoleValue('status', role.status || '');
    setRoleValue('start_date', role.start_date || '');
    setRoleValue('end_date', role.end_date || '');
    setRoleValue('notes', role.notes || '');
  };

  const handleCreateFeedback = () => {
    setShowFeedbackForm(true);
    setIsEditing(false);
    setSelectedFeedback(null);
    resetFeedback({ source: '', feedback_type: 'general', content: '', received_date: new Date().toISOString().split('T')[0], action_items: '', tags: '' });
  };

  const handleEditFeedback = (feedback: FeedbackNote) => {
    setSelectedFeedback(feedback);
    setIsEditing(true);
    setShowFeedbackForm(true);
    setFeedbackValue('source', feedback.source);
    setFeedbackValue('feedback_type', feedback.feedback_type);
    setFeedbackValue('content', feedback.content);
    setFeedbackValue('received_date', feedback.received_date);
    setFeedbackValue('action_items', feedback.action_items?.join(', ') || '');
    setFeedbackValue('tags', feedback.tags?.join(', ') || '');
  };

  const handleCreateResume = () => {
    setShowResumeForm(true);
    setIsEditing(false);
    setSelectedResume(null);
    resetResume({ version_name: '', description: '', target_role: '', last_updated: new Date().toISOString().split('T')[0], is_current: false, notes: '' });
  };

  const handleEditResume = (resume: ResumeVersion) => {
    setSelectedResume(resume);
    setIsEditing(true);
    setShowResumeForm(true);
    setResumeValue('version_name', resume.version_name);
    setResumeValue('description', resume.description || '');
    setResumeValue('target_role', resume.target_role || '');
    setResumeValue('last_updated', resume.last_updated);
    setResumeValue('is_current', resume.is_current);
    setResumeValue('notes', resume.notes || '');
  };

  const handleCreateInterview = () => {
    setShowInterviewForm(true);
    setIsEditing(false);
    setSelectedInterview(null);
    resetInterview({ company: '', role: '', interview_date: '', interview_type: '', stage: '', preparation_notes: '', questions_prepared: '', answers_prepared: '', feedback: '', outcome: 'pending', follow_up_actions: '' });
  };

  const handleEditInterview = (interview: InterviewPrep) => {
    setSelectedInterview(interview);
    setIsEditing(true);
    setShowInterviewForm(true);
    setInterviewValue('company', interview.company);
    setInterviewValue('role', interview.role);
    setInterviewValue('interview_date', interview.interview_date || '');
    setInterviewValue('interview_type', interview.interview_type || '');
    setInterviewValue('stage', interview.stage || '');
    setInterviewValue('preparation_notes', interview.preparation_notes || '');
    setInterviewValue('questions_prepared', interview.questions_prepared?.join('\n') || '');
    setInterviewValue('answers_prepared', interview.answers_prepared?.join('\n') || '');
    setInterviewValue('feedback', interview.feedback || '');
    setInterviewValue('outcome', interview.outcome);
    setInterviewValue('follow_up_actions', interview.follow_up_actions?.join(', ') || '');
  };

  const handleCreateMilestone = () => {
    setShowMilestoneForm(true);
    setIsEditing(false);
    setSelectedMilestone(null);
    resetMilestone({ title: '', milestone_type: 'other', achieved_date: new Date().toISOString().split('T')[0], description: '', impact: '', skills_gained: '', recognition: '' });
  };

  const handleEditMilestone = (milestone: CareerMilestone) => {
    setSelectedMilestone(milestone);
    setIsEditing(true);
    setShowMilestoneForm(true);
    setMilestoneValue('title', milestone.title);
    setMilestoneValue('milestone_type', milestone.milestone_type);
    setMilestoneValue('achieved_date', milestone.achieved_date);
    setMilestoneValue('description', milestone.description || '');
    setMilestoneValue('impact', milestone.impact || '');
    setMilestoneValue('skills_gained', milestone.skills_gained?.join(', ') || '');
    setMilestoneValue('recognition', milestone.recognition || '');
  };

  const handleEditImpact = (impact: ImpactNote) => {
    setSelectedImpact(impact);
    setIsEditing(true);
    setShowImpactForm(true);
    setImpactValue('title', impact.title);
    setImpactValue('description', impact.description);
    setImpactValue('impact_type', impact.impact_type);
    setImpactValue('metrics', impact.metrics || '');
    setImpactValue('date_achieved', impact.date_achieved);
    setImpactValue('skills_demonstrated', impact.skills_demonstrated?.join(', ') || '');
    setImpactValue('tags', impact.tags?.join(', ') || '');
  };

  const handleEditApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsEditing(true);
    setShowApplicationForm(true);
    setApplicationValue('company', application.company);
    setApplicationValue('role', application.role);
    setApplicationValue('stage', application.stage);
    setApplicationValue('application_date', application.application_date);
    setApplicationValue('job_url', application.job_url || '');
    setApplicationValue('notes', application.notes || '');
    setApplicationValue('salary_range', application.salary_range || '');
    setApplicationValue('location', application.location || '');
  };

  const onGoalSubmit = (data: CareerGoalForm) => {
    if (isEditing && selectedGoal) {
      updateGoalMutation.mutate({ id: selectedGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const onSkillSubmit = (data: SkillForm) => {
    if (isEditing && selectedSkill) {
      updateSkillMutation.mutate({ id: selectedSkill.id, data });
    } else {
      createSkillMutation.mutate(data);
    }
  };

  const onRoleSubmit = (data: RoleForm) => {
    if (isEditing && selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const onFeedbackSubmit = (data: FeedbackNoteForm) => {
    if (isEditing && selectedFeedback) {
      updateFeedbackMutation.mutate({ id: selectedFeedback.id, data });
    } else {
      createFeedbackMutation.mutate(data);
    }
  };

  const onResumeSubmit = (data: ResumeVersionForm) => {
    if (isEditing && selectedResume) {
      updateResumeMutation.mutate({ id: selectedResume.id, data });
    } else {
      createResumeMutation.mutate(data);
    }
  };

  const onInterviewSubmit = (data: InterviewPrepForm) => {
    if (isEditing && selectedInterview) {
      updateInterviewMutation.mutate({ id: selectedInterview.id, data });
    } else {
      createInterviewMutation.mutate(data);
    }
  };

  const onMilestoneSubmit = (data: MilestoneForm) => {
    if (isEditing && selectedMilestone) {
      updateMilestoneMutation.mutate({ id: selectedMilestone.id, data });
    } else {
      createMilestoneMutation.mutate(data);
    }
  };

  const onImpactSubmit = (data: ImpactNoteForm) => {
    if (isEditing && selectedImpact) {
      updateImpactMutation.mutate({ id: selectedImpact.id, data });
    } else {
      createImpactMutation.mutate(data);
    }
  };

  const onApplicationSubmit = (data: ApplicationForm) => {
    if (isEditing && selectedApplication) {
      updateApplicationMutation.mutate({ id: selectedApplication.id, data });
    } else {
      createApplicationMutation.mutate(data);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'skills', label: 'Skills Roadmap', icon: '🛠️' },
    { id: 'roles', label: 'Role Tracking', icon: '💼' },
    { id: 'feedback', label: 'Feedback', icon: '💬' },
    { id: 'impact', label: 'Impact Notes', icon: '🏆' },
    { id: 'resumes', label: 'Resume Versions', icon: '📄' },
    { id: 'interviews', label: 'Interview Prep', icon: '🎤' },
    { id: 'milestones', label: 'Milestones', icon: '🚀' },
    { id: 'applications', label: 'Applications', icon: '📝' },
  ];

  return (
    <div className="career">
      <div className="page-header">
        <h1>Career</h1>
      </div>

      <Tabs tabs={tabs} activeTab={viewMode} onTabChange={(tab) => setViewMode(tab as typeof viewMode)} />

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        {viewMode === 'goals' && <button onClick={handleCreateGoal} className="btn-primary">+ New Goal</button>}
        {viewMode === 'skills' && <button onClick={handleCreateSkill} className="btn-primary">+ Add Skill</button>}
        {viewMode === 'roles' && <button onClick={handleCreateRole} className="btn-primary">+ Add Role</button>}
        {viewMode === 'feedback' && <button onClick={handleCreateFeedback} className="btn-primary">+ Add Feedback</button>}
        {viewMode === 'resumes' && <button onClick={handleCreateResume} className="btn-primary">+ New Resume</button>}
        {viewMode === 'interviews' && <button onClick={handleCreateInterview} className="btn-primary">+ New Interview</button>}
        {viewMode === 'milestones' && <button onClick={handleCreateMilestone} className="btn-primary">+ Add Milestone</button>}
        {viewMode === 'impact' && <button onClick={() => { setShowImpactForm(true); setIsEditing(false); setSelectedImpact(null); resetImpact(); }} className="btn-primary">+ Add Impact</button>}
        {viewMode === 'applications' && <button onClick={() => { setShowApplicationForm(true); setIsEditing(false); setSelectedApplication(null); resetApplication(); }} className="btn-primary">+ Add Application</button>}
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <>
          {showProfileForm && (
            <form onSubmit={handleProfileSubmit((data) => {
              api.put('/career-profile', data).then(() => {
                queryClient.invalidateQueries({ queryKey: ['career-profile'] });
                setShowProfileForm(false);
              }).catch((err: any) => alert(err?.response?.data?.error || 'Failed to update profile'));
            })} className="career-form">
              <h3>Career Focus</h3>
              <div className="form-group">
                <label>Current Theme</label>
                <input type="text" {...registerProfile('current_theme')} placeholder="e.g., Interview readiness" />
              </div>
              <div className="form-group">
                <label>Current Focus</label>
                <textarea rows={3} {...registerProfile('current_focus')} placeholder="Description of your current career focus/season" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" onClick={() => setShowProfileForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {profileLoading || goalsLoading || rolesLoading || skillsLoading || impactLoading || milestonesLoading ? (
            <LoadingSpinner message="Loading dashboard..." size="large" />
          ) : (
            <div className="career-dashboard">
              {/* Career Focus */}
              <div className="dashboard-section">
                <h2>🎯 Career Focus {profile && (profile.current_theme || profile.current_focus) && <button onClick={() => { setShowProfileForm(true); setProfileValue('current_theme', profile.current_theme || ''); setProfileValue('current_focus', profile.current_focus || ''); }} style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', marginLeft: '1rem' }} className="btn-secondary">Edit</button>}</h2>
                {profile && (profile.current_theme || profile.current_focus) ? (
                  <div>
                    {profile.current_theme && <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{profile.current_theme}</p>}
                    {profile.current_focus && <p style={{ color: '#666' }}>{profile.current_focus}</p>}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>Set your career focus to guide your progress</p>
                )}
              </div>

              {/* Role Trajectory */}
              <div className="dashboard-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>🧭 Role Trajectory</h2>
                  <button 
                    onClick={() => { 
                      setShowQuickRoleForm(!showQuickRoleForm);
                      const currentRole = dashboardRoles?.find(r => r.role_type === 'current');
                      if (currentRole) {
                        setQuickRoleTitle(currentRole.title);
                        setQuickRoleCompany(currentRole.company || '');
                      } else {
                        setQuickRoleTitle('');
                        setQuickRoleCompany('');
                      }
                    }} 
                    className="btn-primary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    {dashboardRoles?.some(r => r.role_type === 'current') ? 'Update Current Role' : 'Set Current Role'}
                  </button>
                </div>

                {/* Quick Role Form */}
                {showQuickRoleForm && (
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                          Role Title *
                        </label>
                        <input
                          type="text"
                          value={quickRoleTitle}
                          onChange={(e) => setQuickRoleTitle(e.target.value)}
                          placeholder="e.g., Software Engineer"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                          Company (optional)
                        </label>
                        <input
                          type="text"
                          value={quickRoleCompany}
                          onChange={(e) => setQuickRoleCompany(e.target.value)}
                          placeholder="e.g., Tech Corp"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={quickCreateCurrentRole}
                        className="btn-primary"
                        disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        {createRoleMutation.isPending || updateRoleMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setShowQuickRoleForm(false);
                          setQuickRoleTitle('');
                          setQuickRoleCompany('');
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('roles');
                          handleCreateRole();
                          setRoleValue('role_type', 'current');
                          if (quickRoleTitle) setRoleValue('title', quickRoleTitle);
                          if (quickRoleCompany) setRoleValue('company', quickRoleCompany);
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        More Options
                      </button>
                    </div>
                  </div>
                )}

                {dashboardRoles && dashboardRoles.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {dashboardRoles.filter(r => r.role_type === 'current').length > 0 ? (
                      dashboardRoles.filter(r => r.role_type === 'current').map(role => (
                        <div key={role.id} style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #667eea' }}>
                          <strong>Current:</strong> {role.title} {role.company && `at ${role.company}`}
                          {role.location && <span style={{ color: '#666', marginLeft: '0.5rem' }}>• {role.location}</span>}
                          <button 
                            onClick={() => { 
                              setShowQuickRoleForm(true);
                              setQuickRoleTitle(role.title);
                              setQuickRoleCompany(role.company || '');
                            }} 
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: '1rem' }}
                          >
                            Quick Edit
                          </button>
                          <button 
                            onClick={() => { 
                              setViewMode('roles'); 
                              handleEditRole(role);
                            }} 
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                          >
                            Full Edit
                          </button>
                        </div>
                      ))
                    ) : (
                      !showQuickRoleForm && (
                        <p style={{ color: '#999', fontStyle: 'italic', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                          No current role set. Click "Set Current Role" to add one.
                        </p>
                      )
                    )}
                    {dashboardRoles.filter(r => r.role_type === 'next').map(role => (
                      <div key={role.id}><strong>Next:</strong> {role.title} {role.company && `at ${role.company}`}</div>
                    ))}
                    {dashboardRoles.filter(r => r.role_type === 'dream').map(role => (
                      <div key={role.id}><strong>Dream:</strong> {role.title} {role.company && `at ${role.company}`}</div>
                    ))}
                  </div>
                ) : (
                  !showQuickRoleForm && (
                    <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <p style={{ color: '#999', fontStyle: 'italic', marginBottom: '0.5rem' }}>No roles tracked yet</p>
                    </div>
                  )
                )}
              </div>

              {/* Skills Roadmap */}
              <div className="dashboard-section">
                <h2>🛠 Skills Roadmap</h2>
                {dashboardSkills && dashboardSkills.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {dashboardSkills.slice(0, 5).map(skill => {
                      const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
                      const currentLevel = levels.indexOf(skill.proficiency_level);
                      const targetLevel = skill.target_level ? levels.indexOf(skill.target_level) : currentLevel;
                      const progress = targetLevel > currentLevel ? ((currentLevel + 1) / (targetLevel + 1)) * 100 : 100;
                      return (
                        <div key={skill.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span>{skill.name}</span>
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>{Math.round(progress)}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: '#667eea', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No skills tracked yet</p>
                )}
              </div>

              {/* Recent Career Wins */}
              <div className="dashboard-section">
                <h2>🏆 Recent Career Wins</h2>
                {impactNotes && impactNotes.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {impactNotes.slice(0, 3).map(impact => (
                      <div key={impact.id} style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
                        <strong>✔ {impact.title}</strong>
                        {impact.metrics && <span style={{ marginLeft: '0.5rem', color: '#666' }}>({impact.metrics})</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No impact notes yet</p>
                )}
              </div>

              {/* Interview & Prep Notes */}
              <div className="dashboard-section">
                <h2>📝 Interview & Prep Notes</h2>
                {interviews && interviews.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {interviews.slice(0, 2).map(interview => (
                      <div key={interview.id} style={{ fontSize: '0.875rem', color: '#666' }}>
                        • {interview.company} - {interview.role} ({interview.outcome})
                        {interview.feedback && <div style={{ marginTop: '0.25rem', paddingLeft: '1rem', fontStyle: 'italic' }}>{interview.feedback.substring(0, 100)}...</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No interview prep yet</p>
                )}
              </div>

              {/* Milestones */}
              <div className="dashboard-section">
                <h2>🚀 Milestones</h2>
                {milestones && milestones.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {milestones.slice(0, 3).map(milestone => (
                      <div key={milestone.id} style={{ fontSize: '0.875rem' }}>
                        ☐ {milestone.title} ({new Date(milestone.achieved_date).toLocaleDateString()})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No milestones yet</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Career Goals View */}
      {viewMode === 'goals' && (
        <>
          {showGoalForm && (
            <form onSubmit={handleGoalSubmit(onGoalSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Career Goal' : 'New Career Goal'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerGoal('title', { required: true })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} {...registerGoal('description')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Target Date</label>
                  <input type="date" {...registerGoal('target_date')} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select {...registerGoal('status')}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select {...registerGoal('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" {...registerGoal('category')} placeholder="e.g., Promotion, Skill Development" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Goal
                </button>
                <button type="button" onClick={() => { setShowGoalForm(false); setIsEditing(false); setSelectedGoal(null); resetGoal(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {goalsLoading ? (
            <LoadingSpinner message="Loading career goals..." size="large" />
          ) : goalsError ? (
            <ErrorMessage message={goalsError instanceof Error ? goalsError.message : 'Failed to load career goals'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['career-goals'] })} />
          ) : goals && goals.length > 0 ? (
            <div className="goals-list">
              {goals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  <div className="goal-header">
                    <div>
                      <h3>{goal.title}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {goal.category && `${goal.category} • `}
                        Priority: {goal.priority} • Status: {goal.status}
                        {goal.target_date && ` • Target: ${new Date(goal.target_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  {goal.description && <p style={{ marginTop: '0.5rem', color: '#666' }}>{goal.description}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditGoal(goal)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteGoalMutation.mutate(goal.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🎯" title="No career goals yet" message="Set your first career goal to start tracking your progress." actionLabel="Create Goal" onAction={handleCreateGoal} />
          )}
        </>
      )}

      {/* Skills View */}
      {viewMode === 'skills' && (
        <>
          {showSkillForm && (
            <form onSubmit={handleSkillSubmit(onSkillSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Skill' : 'Add Skill'}</h3>
              <div className="form-group">
                <label>Skill Name *</label>
                <input type="text" {...registerSkill('name', { required: true })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" {...registerSkill('category')} placeholder="e.g., Technical, Soft Skills" />
                </div>
                <div className="form-group">
                  <label>Current Proficiency</label>
                  <select {...registerSkill('proficiency_level')}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Level</label>
                  <select {...registerSkill('target_level')}>
                    <option value="">None</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} {...registerSkill('notes')} />
              </div>
              <div className="form-group">
                <label>Resources (comma-separated)</label>
                <input type="text" {...registerSkill('resources')} placeholder="Links to courses, books, etc." />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createSkillMutation.isPending || updateSkillMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Skill
                </button>
                <button type="button" onClick={() => { setShowSkillForm(false); setIsEditing(false); setSelectedSkill(null); resetSkill(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {/* Skill Gap Analysis & Progress Charts */}
          {skills && skills.length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e0e0e0' }}>
              <h3>Competency Tracking</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {skills.map((skill) => {
                  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
                  const currentIndex = levels.indexOf(skill.proficiency_level);
                  const targetIndex = skill.target_level ? levels.indexOf(skill.target_level) : currentIndex;
                  const gap = targetIndex > currentIndex ? targetIndex - currentIndex : 0;
                  const progress = skill.target_level ? ((currentIndex + 1) / (targetIndex + 1)) * 100 : 100;
                  
                  return (
                    <div key={skill.id} style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{skill.name}</h4>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          <span>Current: <strong>{skill.proficiency_level}</strong></span>
                          {skill.target_level && <span>Target: <strong>{skill.target_level}</strong></span>}
                        </div>
                        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '8px', marginBottom: '0.5rem' }}>
                          <div style={{ background: gap > 0 ? '#f59e0b' : '#10b981', height: '100%', borderRadius: '4px', width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        {gap > 0 && (
                          <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: 0 }}>
                            Gap: {gap} level{gap > 1 ? 's' : ''} to target
                          </p>
                        )}
                        {gap === 0 && skill.target_level && (
                          <p style={{ fontSize: '0.75rem', color: '#10b981', margin: 0 }}>
                            ✓ Target achieved
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {skillsLoading ? (
            <LoadingSpinner message="Loading skills..." size="large" />
          ) : skillsError ? (
            <ErrorMessage message={skillsError instanceof Error ? skillsError.message : 'Failed to load skills'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['skills'] })} />
          ) : skills && skills.length > 0 ? (
            <div className="skills-list">
              {skills.map((skill) => {
                const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
                const currentIndex = levels.indexOf(skill.proficiency_level);
                const targetIndex = skill.target_level ? levels.indexOf(skill.target_level) : currentIndex;
                const gap = targetIndex > currentIndex ? targetIndex - currentIndex : 0;
                const progress = skill.target_level ? ((currentIndex + 1) / (targetIndex + 1)) * 100 : 100;
                
                return (
                  <div key={skill.id} className="skill-card">
                    <div className="skill-header">
                      <div>
                        <h3>{skill.name}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          {skill.category && `${skill.category} • `}
                          Current: {skill.proficiency_level}
                          {skill.target_level && ` → Target: ${skill.target_level}`}
                        </span>
                      </div>
                    </div>
                    {skill.target_level && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          <span>Progress to target</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '6px' }}>
                          <div style={{ background: gap > 0 ? '#f59e0b' : '#10b981', height: '100%', borderRadius: '4px', width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        {gap > 0 && (
                          <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: '0.25rem 0 0 0' }}>
                            {gap} level{gap > 1 ? 's' : ''} to reach target
                          </p>
                        )}
                      </div>
                    )}
                    {skill.notes && <p style={{ marginTop: '0.5rem', color: '#666' }}>{skill.notes}</p>}
                    {skill.resources && skill.resources.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        <strong>Resources:</strong> {skill.resources.join(', ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handleEditSkill(skill)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                      <button onClick={() => { if (confirm('Are you sure?')) deleteSkillMutation.mutate(skill.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="💡" title="No skills yet" message="Start building your skills roadmap." actionLabel="Add Skill" onAction={handleCreateSkill} />
          )}
        </>
      )}

      {/* Roles View */}
      {viewMode === 'roles' && (
        <>
          {showRoleForm && (
            <form onSubmit={handleRoleSubmit(onRoleSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Role' : 'Add Role'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerRole('title', { required: true })} />
              </div>
              <div className="form-group">
                <label>Role Type *</label>
                <select {...registerRole('role_type', { required: true })}>
                  <option value="current">Current</option>
                  <option value="next">Next</option>
                  <option value="dream">Dream</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Company</label>
                  <input type="text" {...registerRole('company')} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" {...registerRole('location')} />
                </div>
                <div className="form-group">
                  <label>Salary Range</label>
                  <input type="text" {...registerRole('salary_range')} placeholder="e.g., $100k - $150k" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <input type="text" {...registerRole('status')} placeholder="e.g., applying, interviewing" />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" {...registerRole('start_date')} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" {...registerRole('end_date')} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} {...registerRole('description')} />
              </div>
              <div className="form-group">
                <label>Requirements (comma-separated)</label>
                <input type="text" {...registerRole('requirements')} placeholder="Skill 1, Skill 2, ..." />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} {...registerRole('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Role
                </button>
                <button type="button" onClick={() => { setShowRoleForm(false); setIsEditing(false); setSelectedRole(null); resetRole(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {rolesLoading ? (
            <LoadingSpinner message="Loading roles..." size="large" />
          ) : rolesError ? (
            <ErrorMessage message={rolesError instanceof Error ? rolesError.message : 'Failed to load roles'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['roles'] })} />
          ) : roles && roles.length > 0 ? (
            <div className="roles-list">
              {roles.map((role) => (
                <div key={role.id} className="role-card">
                  <div className="role-header">
                    <div>
                      <h3>{role.title}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {role.role_type} Role
                        {role.company && ` • ${role.company}`}
                        {role.location && ` • ${role.location}`}
                        {role.status && ` • ${role.status}`}
                      </span>
                    </div>
                  </div>
                  {role.description && <p style={{ marginTop: '0.5rem', color: '#666' }}>{role.description}</p>}
                  {role.requirements && role.requirements.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Requirements:</strong> {role.requirements.join(', ')}
                    </div>
                  )}
                  {role.salary_range && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Salary:</strong> {role.salary_range}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditRole(role)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteRoleMutation.mutate(role.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💼" title="No roles yet" message="Track your current, next, and dream roles." actionLabel="Add Role" onAction={handleCreateRole} />
          )}
        </>
      )}

      {/* Feedback Notes View */}
      {viewMode === 'feedback' && (
        <>
          {showFeedbackForm && (
            <form onSubmit={handleFeedbackSubmit(onFeedbackSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Feedback Note' : 'Add Feedback Note'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Source *</label>
                  <input type="text" {...registerFeedback('source', { required: true })} placeholder="e.g., Manager, Peer" />
                </div>
                <div className="form-group">
                  <label>Feedback Type</label>
                  <select {...registerFeedback('feedback_type')}>
                    <option value="general">General</option>
                    <option value="performance">Performance</option>
                    <option value="strength">Strength</option>
                    <option value="improvement">Improvement</option>
                    <option value="career">Career</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea rows={5} {...registerFeedback('content', { required: true })} />
              </div>
              <div className="form-group">
                <label>Received Date</label>
                <input type="date" {...registerFeedback('received_date')} />
              </div>
              <div className="form-group">
                <label>Action Items (comma-separated)</label>
                <input type="text" {...registerFeedback('action_items')} placeholder="Action 1, Action 2, ..." />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerFeedback('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createFeedbackMutation.isPending || updateFeedbackMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Feedback
                </button>
                <button type="button" onClick={() => { setShowFeedbackForm(false); setIsEditing(false); setSelectedFeedback(null); resetFeedback(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {feedbackLoading ? (
            <LoadingSpinner message="Loading feedback notes..." size="large" />
          ) : feedbackError ? (
            <ErrorMessage message={feedbackError instanceof Error ? feedbackError.message : 'Failed to load feedback notes'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['feedback-notes'] })} />
          ) : feedbackNotes && feedbackNotes.length > 0 ? (
            <div className="feedback-list">
              {feedbackNotes.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div>
                      <h3>{feedback.source}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {feedback.feedback_type} • {new Date(feedback.received_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{feedback.content}</p>
                  {feedback.action_items && feedback.action_items.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Action Items:</strong> {feedback.action_items.join(', ')}
                    </div>
                  )}
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {feedback.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditFeedback(feedback)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteFeedbackMutation.mutate(feedback.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💬" title="No feedback notes yet" message="Start tracking feedback to improve your career." actionLabel="Add Feedback" onAction={handleCreateFeedback} />
          )}
        </>
      )}

      {/* Resume Versions View */}
      {viewMode === 'resumes' && (
        <>
          {showResumeForm && (
            <form onSubmit={handleResumeSubmit(onResumeSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Resume Version' : 'New Resume Version'}</h3>
              <div className="form-group">
                <label>Version Name *</label>
                <input type="text" {...registerResume('version_name', { required: true })} placeholder="e.g., Software Engineer v2" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Target Role</label>
                  <input type="text" {...registerResume('target_role')} placeholder="Role this resume is tailored for" />
                </div>
                <div className="form-group">
                  <label>Last Updated</label>
                  <input type="date" {...registerResume('last_updated')} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} {...registerResume('description')} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" {...registerResume('is_current')} />
                  Set as current resume
                </label>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} {...registerResume('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createResumeMutation.isPending || updateResumeMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Resume
                </button>
                <button type="button" onClick={() => { setShowResumeForm(false); setIsEditing(false); setSelectedResume(null); resetResume(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {resumesLoading ? (
            <LoadingSpinner message="Loading resume versions..." size="large" />
          ) : resumesError ? (
            <ErrorMessage message={resumesError instanceof Error ? resumesError.message : 'Failed to load resume versions'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['resume-versions'] })} />
          ) : resumeVersions && resumeVersions.length > 0 ? (
            <div className="resumes-list">
              {resumeVersions.map((resume) => (
                <div key={resume.id} className="resume-card">
                  <div className="resume-header">
                    <div>
                      <h3>
                        {resume.version_name}
                        {resume.is_current && <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>✓ Current</span>}
                      </h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {resume.target_role && `${resume.target_role} • `}
                        Updated: {new Date(resume.last_updated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {resume.description && <p style={{ marginTop: '0.5rem', color: '#666' }}>{resume.description}</p>}
                  {resume.file_url && (
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem', display: 'inline-block', color: '#667eea' }}>
                      View Resume →
                    </a>
                  )}
                  {resume.notes && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>{resume.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditResume(resume)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteResumeMutation.mutate(resume.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📄" title="No resume versions yet" message="Track different versions of your resume." actionLabel="Create Resume" onAction={handleCreateResume} />
          )}
        </>
      )}

      {/* Interview Prep View */}
      {viewMode === 'interviews' && (
        <>
          {showInterviewForm && (
            <form onSubmit={handleInterviewSubmit(onInterviewSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Interview Prep' : 'New Interview Prep'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Company *</label>
                  <input type="text" {...registerInterview('company', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <input type="text" {...registerInterview('role', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Interview Date</label>
                  <input type="date" {...registerInterview('interview_date')} />
                </div>
                <div className="form-group">
                  <label>Interview Type</label>
                  <select {...registerInterview('interview_type')}>
                    <option value="">Select type</option>
                    <option value="phone">Phone</option>
                    <option value="video">Video</option>
                    <option value="onsite">Onsite</option>
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="panel">Panel</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Stage</label>
                  <input type="text" {...registerInterview('stage')} placeholder="e.g., initial, technical, final" />
                </div>
                <div className="form-group">
                  <label>Outcome</label>
                  <select {...registerInterview('outcome')}>
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Preparation Notes</label>
                <textarea rows={4} {...registerInterview('preparation_notes')} />
              </div>
              <div className="form-group">
                <label>Questions Prepared (one per line)</label>
                <textarea rows={5} {...registerInterview('questions_prepared')} placeholder="Question 1&#10;Question 2&#10;..." />
              </div>
              <div className="form-group">
                <label>Answers Prepared (one per line)</label>
                <textarea rows={5} {...registerInterview('answers_prepared')} placeholder="Answer 1&#10;Answer 2&#10;..." />
              </div>
              <div className="form-group">
                <label>Feedback</label>
                <textarea rows={3} {...registerInterview('feedback')} placeholder="Post-interview feedback" />
              </div>
              <div className="form-group">
                <label>Follow-up Actions (comma-separated)</label>
                <input type="text" {...registerInterview('follow_up_actions')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createInterviewMutation.isPending || updateInterviewMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Interview Prep
                </button>
                <button type="button" onClick={() => { setShowInterviewForm(false); setIsEditing(false); setSelectedInterview(null); resetInterview(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {interviewsLoading ? (
            <LoadingSpinner message="Loading interview prep..." size="large" />
          ) : interviewsError ? (
            <ErrorMessage message={interviewsError instanceof Error ? interviewsError.message : 'Failed to load interview prep'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['interview-prep'] })} />
          ) : interviews && interviews.length > 0 ? (
            <div className="interviews-list">
              {interviews.map((interview) => (
                <div key={interview.id} className="interview-card">
                  <div className="interview-header">
                    <div>
                      <h3>{interview.company} - {interview.role}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {interview.interview_type && `${interview.interview_type} • `}
                        {interview.stage && `${interview.stage} • `}
                        {interview.interview_date && `${new Date(interview.interview_date).toLocaleDateString()} • `}
                        Outcome: {interview.outcome}
                      </span>
                    </div>
                  </div>
                  {interview.preparation_notes && <p style={{ marginTop: '0.5rem', color: '#666' }}>{interview.preparation_notes}</p>}
                  {interview.feedback && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
                      <strong>Feedback:</strong> {interview.feedback}
                    </div>
                  )}
                  {interview.questions_prepared && interview.questions_prepared.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Questions:</strong> {interview.questions_prepared.length} prepared
                    </div>
                  )}
                  {interview.follow_up_actions && interview.follow_up_actions.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Follow-up:</strong> {interview.follow_up_actions.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditInterview(interview)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteInterviewMutation.mutate(interview.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🎤" title="No interview prep yet" message="Prepare for your next interview." actionLabel="Create Interview Prep" onAction={handleCreateInterview} />
          )}
        </>
      )}

      {/* Career Milestones View */}
      {viewMode === 'milestones' && (
        <>
          {showMilestoneForm && (
            <form onSubmit={handleMilestoneSubmit(onMilestoneSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerMilestone('title', { required: true })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Milestone Type *</label>
                  <select {...registerMilestone('milestone_type', { required: true })}>
                    <option value="promotion">Promotion</option>
                    <option value="role_change">Role Change</option>
                    <option value="skill_achievement">Skill Achievement</option>
                    <option value="certification">Certification</option>
                    <option value="project_completion">Project Completion</option>
                    <option value="recognition">Recognition</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Achieved Date *</label>
                  <input type="date" {...registerMilestone('achieved_date', { required: true })} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} {...registerMilestone('description')} />
              </div>
              <div className="form-group">
                <label>Impact</label>
                <textarea rows={3} {...registerMilestone('impact')} placeholder="Description of impact/achievement" />
              </div>
              <div className="form-group">
                <label>Skills Gained (comma-separated)</label>
                <input type="text" {...registerMilestone('skills_gained')} />
              </div>
              <div className="form-group">
                <label>Recognition</label>
                <input type="text" {...registerMilestone('recognition')} placeholder="Awards, acknowledgments, etc." />
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
          ) : milestonesError ? (
            <ErrorMessage message={milestonesError instanceof Error ? milestonesError.message : 'Failed to load milestones'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['career-milestones'] })} />
          ) : milestones && milestones.length > 0 ? (
            <div className="milestones-list">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="milestone-card">
                  <div className="milestone-header">
                    <div>
                      <h3>{milestone.title}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {milestone.milestone_type.replace('_', ' ')} • {new Date(milestone.achieved_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {milestone.description && <p style={{ marginTop: '0.5rem', color: '#666' }}>{milestone.description}</p>}
                  {milestone.impact && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#d1fae5', borderRadius: '4px' }}>
                      <strong>Impact:</strong> {milestone.impact}
                    </div>
                  )}
                  {milestone.skills_gained && milestone.skills_gained.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Skills Gained:</strong> {milestone.skills_gained.join(', ')}
                    </div>
                  )}
                  {milestone.recognition && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Recognition:</strong> {milestone.recognition}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditMilestone(milestone)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteMilestoneMutation.mutate(milestone.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🏆" title="No milestones yet" message="Track your career achievements and growth." actionLabel="Add Milestone" onAction={handleCreateMilestone} />
          )}
        </>
      )}

      {/* Impact Notes View */}
      {viewMode === 'impact' && (
        <>
          {showImpactForm && (
            <form onSubmit={handleImpactSubmit(onImpactSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Impact Note' : 'Add Impact Note'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerImpact('title', { required: true })} placeholder="e.g., Refactored auth flow" />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={4} {...registerImpact('description', { required: true })} placeholder="Describe the project, achievement, or problem solved" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Impact Type</label>
                  <select {...registerImpact('impact_type')}>
                    <option value="project">Project</option>
                    <option value="metric">Metric</option>
                    <option value="problem_solved">Problem Solved</option>
                    <option value="achievement">Achievement</option>
                    <option value="recognition">Recognition</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Achieved</label>
                  <input type="date" {...registerImpact('date_achieved')} />
                </div>
              </div>
              <div className="form-group">
                <label>Metrics</label>
                <input type="text" {...registerImpact('metrics')} placeholder="e.g., -30% bugs, 5 interviews completed" />
              </div>
              <div className="form-group">
                <label>Skills Demonstrated (comma-separated)</label>
                <input type="text" {...registerImpact('skills_demonstrated')} />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerImpact('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createImpactMutation.isPending || updateImpactMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Impact
                </button>
                <button type="button" onClick={() => { setShowImpactForm(false); setIsEditing(false); setSelectedImpact(null); resetImpact(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {impactLoading ? (
            <LoadingSpinner message="Loading impact notes..." size="large" />
          ) : impactError ? (
            <ErrorMessage message={impactError instanceof Error ? impactError.message : 'Failed to load impact notes'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['impact-notes'] })} />
          ) : impactNotes && impactNotes.length > 0 ? (
            <div className="impact-list">
              {impactNotes.map((impact) => (
                <div key={impact.id} className="impact-card">
                  <div className="impact-header">
                    <div>
                      <h3>{impact.title}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {impact.impact_type.replace('_', ' ')} • {new Date(impact.date_achieved).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{impact.description}</p>
                  {impact.metrics && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#d1fae5', borderRadius: '4px' }}>
                      <strong>Metrics:</strong> {impact.metrics}
                    </div>
                  )}
                  {impact.skills_demonstrated && impact.skills_demonstrated.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Skills:</strong> {impact.skills_demonstrated.join(', ')}
                    </div>
                  )}
                  {impact.tags && impact.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {impact.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditImpact(impact)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteImpactMutation.mutate(impact.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💪" title="No impact notes yet" message="Document your achievements and projects for resume and interviews." actionLabel="Add Impact" onAction={() => { setShowImpactForm(true); setIsEditing(false); setSelectedImpact(null); resetImpact(); }} />
          )}
        </>
      )}

      {/* Applications View */}
      {viewMode === 'applications' && (
        <>
          {showApplicationForm && (
            <form onSubmit={handleApplicationSubmit(onApplicationSubmit)} className="career-form">
              <h3>{isEditing ? 'Edit Application' : 'Add Application'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Company *</label>
                  <input type="text" {...registerApplication('company', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <input type="text" {...registerApplication('role', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Stage</label>
                  <select {...registerApplication('stage')}>
                    <option value="applied">Applied</option>
                    <option value="screening">Screening</option>
                    <option value="interview">Interview</option>
                    <option value="final">Final</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Application Date</label>
                  <input type="date" {...registerApplication('application_date')} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" {...registerApplication('location')} />
                </div>
                <div className="form-group">
                  <label>Salary Range</label>
                  <input type="text" {...registerApplication('salary_range')} placeholder="e.g., $100k - $150k" />
                </div>
              </div>
              <div className="form-group">
                <label>Job URL</label>
                <input type="url" {...registerApplication('job_url')} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} {...registerApplication('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createApplicationMutation.isPending || updateApplicationMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Application
                </button>
                <button type="button" onClick={() => { setShowApplicationForm(false); setIsEditing(false); setSelectedApplication(null); resetApplication(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {applicationsLoading ? (
            <LoadingSpinner message="Loading applications..." size="large" />
          ) : applicationsError ? (
            <ErrorMessage message={applicationsError instanceof Error ? applicationsError.message : 'Failed to load applications'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['applications'] })} />
          ) : applications && applications.length > 0 ? (
            <div className="applications-list">
              {applications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <div>
                      <h3>{application.company} - {application.role}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {application.stage} • {new Date(application.application_date).toLocaleDateString()}
                        {application.location && ` • ${application.location}`}
                      </span>
                    </div>
                  </div>
                  {application.salary_range && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Salary:</strong> {application.salary_range}
                    </p>
                  )}
                  {application.notes && <p style={{ marginTop: '0.5rem', color: '#666' }}>{application.notes}</p>}
                  {application.job_url && (
                    <a href={application.job_url} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem', display: 'inline-block', color: '#667eea' }}>
                      View Job Posting →
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditApplication(application)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteApplicationMutation.mutate(application.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📋" title="No applications yet" message="Track your job applications and their progress." actionLabel="Add Application" onAction={() => { setShowApplicationForm(true); setIsEditing(false); setSelectedApplication(null); resetApplication(); }} />
          )}
        </>
      )}
    </div>
  );
};

export default Career;
