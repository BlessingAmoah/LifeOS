import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { exportTransactionsToCSV, exportToPDF } from '../utils/exportUtils';
import './Financial.css';

interface TransactionForm {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  payment_method: string;
  tags: string;
  is_recurring: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | '';
  account: 'checking' | 'savings' | 'credit_card' | 'cash' | 'other' | '';
}

interface BudgetForm {
  category: string;
  budget_amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  description: string;
}

interface SavingsGoalForm {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  is_emergency_fund: boolean;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  tags: string[];
  is_recurring: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  account: 'checking' | 'savings' | 'credit_card' | 'cash' | 'other' | null;
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: string;
  category: string;
  budget_amount: string;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date: string | null;
  description: string | null;
  status: 'active' | 'completed' | 'paused';
  is_emergency_fund: boolean;
  created_at: string;
  updated_at: string;
}

interface InvestmentForm {
  name: string;
  type: 'stock' | 'bond' | 'mutual_fund' | 'etf' | 'crypto' | 'real_estate' | 'other';
  symbol: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  notes: string;
}

interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'bond' | 'mutual_fund' | 'etf' | 'crypto' | 'real_estate' | 'other';
  symbol: string | null;
  quantity: string;
  purchase_price: string;
  current_price: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface NetWorthForm {
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  notes: string;
}

interface NetWorthSnapshot {
  id: string;
  snapshot_date: string;
  total_assets: string;
  total_liabilities: string;
  net_worth: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Financial = () => {
  const [viewMode, setViewMode] = useState<'transactions' | 'budgets' | 'goals' | 'summary' | 'investments' | 'networth' | 'dashboard' | 'cashflow' | 'planning'>('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showNetWorthForm, setShowNetWorthForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [selectedNetWorth, setSelectedNetWorth] = useState<NetWorthSnapshot | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterInvestmentType, setFilterInvestmentType] = useState<'all' | 'stock' | 'bond' | 'mutual_fund' | 'etf' | 'crypto' | 'real_estate' | 'other'>('all');
  const queryClient = useQueryClient();

  const invalidateTransactionReports = () => {
    for (const key of ['transactions', 'transaction-summary', 'financial-dashboard', 'cash-flow', 'budget-summary']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  // Transactions query
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType, filterCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory) params.append('category', filterCategory);
      return api.get(`/transactions?${params.toString()}`).then(res => res.data);
    },
  });

  // Transaction summary query
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['transaction-summary'],
    queryFn: () => api.get('/transactions/summary').then(res => res.data),
  });

  // Financial dashboard query
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: () => api.get('/financial-dashboard').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  // Cash flow query
  const { data: cashFlow, isLoading: cashFlowLoading, error: cashFlowError } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => api.get('/financial-dashboard/cash-flow').then(res => res.data),
    enabled: viewMode === 'cashflow',
  });

  // Budgets query
  const { data: budgets, isLoading: budgetsLoading, error: budgetsError } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets').then(res => res.data),
  });

  // Budget summary query (with spending)
  const { data: budgetSummary, isLoading: budgetSummaryLoading, error: budgetSummaryError } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: () => api.get('/budgets/summary').then(res => res.data),
    enabled: viewMode === 'budgets',
  });

  // Savings goals query
  const { data: savingsGoals, isLoading: goalsLoading, error: goalsError } = useQuery<SavingsGoal[]>({
    queryKey: ['savings-goals'],
    queryFn: () => api.get('/savings-goals').then(res => res.data),
  });

  // Financial plans query
  const { data: financialPlans, isLoading: plansLoading, error: plansError } = useQuery<any[]>({
    queryKey: ['financial-plans'],
    queryFn: () => api.get('/financial-plans').then(res => res.data),
    enabled: viewMode === 'planning',
  });

  // Investments query
  const { data: investments, isLoading: investmentsLoading, error: investmentsError } = useQuery<Investment[]>({
    queryKey: ['investments', filterInvestmentType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterInvestmentType !== 'all') params.append('type', filterInvestmentType);
      return api.get(`/investments?${params.toString()}`).then(res => res.data);
    },
    enabled: viewMode === 'investments',
  });

  // Investment summary query
  const { data: investmentSummary, isLoading: investmentSummaryLoading, error: investmentSummaryError } = useQuery({
    queryKey: ['investment-summary'],
    queryFn: () => api.get('/investments/summary').then(res => res.data),
    enabled: viewMode === 'investments',
  });

  // Net worth snapshots query
  const { data: netWorthSnapshots, isLoading: netWorthLoading, error: netWorthError } = useQuery<NetWorthSnapshot[]>({
    queryKey: ['net-worth'],
    queryFn: () => api.get('/net-worth').then(res => res.data),
    enabled: viewMode === 'networth',
  });

  // Latest net worth query
  const { data: latestNetWorth, isLoading: latestNetWorthLoading, error: latestNetWorthError } = useQuery<NetWorthSnapshot | null>({
    queryKey: ['latest-net-worth'],
    queryFn: () => api.get('/net-worth/latest').then(res => res.data),
    enabled: viewMode === 'networth',
  });

  // Transaction form
  const { register: registerTransaction, handleSubmit: handleTransactionSubmit, reset: resetTransaction, setValue: setTransactionValue, watch: watchTransaction } = useForm<TransactionForm>({
    defaultValues: {
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      tags: '',
      is_recurring: false,
      frequency: '',
      account: '',
    },
  });

  // Budget form
  const { register: registerBudget, handleSubmit: handleBudgetSubmit, reset: resetBudget, setValue: setBudgetValue } = useForm<BudgetForm>({
    defaultValues: {
      category: '',
      budget_amount: 0,
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      description: '',
    },
  });

  // Savings goal form
  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal, setValue: setGoalValue } = useForm<SavingsGoalForm>({
    defaultValues: {
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      description: '',
      status: 'active',
      is_emergency_fund: false,
    },
  });

  const watchTransactionIsRecurring = watchTransaction('is_recurring');

  // Investment form
  const { register: registerInvestment, handleSubmit: handleInvestmentSubmit, reset: resetInvestment, setValue: setInvestmentValue } = useForm<InvestmentForm>({
    defaultValues: {
      name: '',
      type: 'stock',
      symbol: '',
      quantity: 0,
      purchase_price: 0,
      current_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Net worth form
  const { register: registerNetWorth, handleSubmit: handleNetWorthSubmit, reset: resetNetWorth, setValue: setNetWorthValue } = useForm<NetWorthForm>({
    defaultValues: {
      snapshot_date: new Date().toISOString().split('T')[0],
      total_assets: 0,
      total_liabilities: 0,
      notes: '',
    },
  });

  // Transaction mutations
  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const payload: any = { ...data, tags: tagsArray };
      if (!data.is_recurring) {
        payload.frequency = null;
      }
      if (!data.account) {
        payload.account = null;
      }
      if (!data.frequency) {
        payload.frequency = null;
      }
      return api.post('/transactions', payload);
    },
    onSuccess: () => {
      invalidateTransactionReports();
      resetTransaction();
      setShowTransactionForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create transaction';
      alert(errorMessage);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionForm> }) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const payload: any = { ...data, tags: tagsArray };
      if (payload.is_recurring === false || !payload.is_recurring) {
        payload.frequency = null;
      }
      if (!payload.account) {
        payload.account = null;
      }
      if (!payload.frequency) {
        payload.frequency = null;
      }
      return api.put(`/transactions/${id}`, payload);
    },
    onSuccess: () => {
      invalidateTransactionReports();
      resetTransaction();
      setShowTransactionForm(false);
      setIsEditing(false);
      setSelectedTransaction(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to update transaction';
      alert(errorMessage);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: (_, id) => {
      invalidateTransactionReports();
      if (selectedTransaction?.id === id) {
        setSelectedTransaction(null);
      }
      alert('Transaction deleted successfully!');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete transaction';
      alert(errorMessage);
    },
  });

  // Budget mutations
  const createBudgetMutation = useMutation({
    mutationFn: (data: BudgetForm) => api.post('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      resetBudget();
      setShowBudgetForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create budget';
      alert(errorMessage);
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetForm> }) =>
      api.put(`/budgets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      resetBudget();
      setShowBudgetForm(false);
      setIsEditing(false);
      setSelectedBudget(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to update budget';
      alert(errorMessage);
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      if (selectedBudget?.id === id) {
        setSelectedBudget(null);
      }
      alert('Budget deleted successfully!');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete budget';
      alert(errorMessage);
    },
  });

  // Savings goal mutations
  const createGoalMutation = useMutation({
    mutationFn: (data: SavingsGoalForm) => api.post('/savings-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      resetGoal();
      setShowGoalForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create savings goal';
      alert(errorMessage);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavingsGoalForm> }) =>
      api.put(`/savings-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      resetGoal();
      setShowGoalForm(false);
      setIsEditing(false);
      setSelectedGoal(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to update savings goal';
      alert(errorMessage);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/savings-goals/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      if (selectedGoal?.id === id) {
        setSelectedGoal(null);
      }
      alert('Savings goal deleted successfully!');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete savings goal';
      alert(errorMessage);
    },
  });

  // Financial plans mutations
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => api.post('/financial-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      setShowPlanForm(false);
      setIsEditing(false);
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create financial plan';
      alert(errorMessage);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/financial-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      setShowPlanForm(false);
      setIsEditing(false);
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to update financial plan';
      alert(errorMessage);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financial-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      alert('Financial plan deleted successfully!');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete financial plan';
      alert(errorMessage);
    },
  });

  // Investment mutations
  const createInvestmentMutation = useMutation({
    mutationFn: (data: InvestmentForm) => api.post('/investments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-summary'] });
      resetInvestment();
      setShowInvestmentForm(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create investment');
    },
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentForm> }) =>
      api.put(`/investments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-summary'] });
      resetInvestment();
      setShowInvestmentForm(false);
      setIsEditing(false);
      setSelectedInvestment(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update investment');
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/investments/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-summary'] });
      if (selectedInvestment?.id === id) {
        setSelectedInvestment(null);
      }
      alert('Investment deleted successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete investment');
    },
  });

  // Net worth mutations
  const createNetWorthMutation = useMutation({
    mutationFn: (data: NetWorthForm) => api.post('/net-worth', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth'] });
      queryClient.invalidateQueries({ queryKey: ['latest-net-worth'] });
      resetNetWorth();
      setShowNetWorthForm(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create net worth snapshot');
    },
  });

  const updateNetWorthMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NetWorthForm> }) =>
      api.put(`/net-worth/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth'] });
      queryClient.invalidateQueries({ queryKey: ['latest-net-worth'] });
      resetNetWorth();
      setShowNetWorthForm(false);
      setIsEditing(false);
      setSelectedNetWorth(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update net worth snapshot');
    },
  });

  const deleteNetWorthMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/net-worth/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['net-worth'] });
      queryClient.invalidateQueries({ queryKey: ['latest-net-worth'] });
      if (selectedNetWorth?.id === id) {
        setSelectedNetWorth(null);
      }
      alert('Net worth snapshot deleted successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete net worth snapshot');
    },
  });

  const handleCreateTransaction = () => {
    setShowTransactionForm(true);
    setIsEditing(false);
    setSelectedTransaction(null);
    resetTransaction({
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      tags: '',
      is_recurring: false,
      frequency: '',
      account: '',
    });
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditing(true);
    setShowTransactionForm(true);
    setTransactionValue('type', transaction.type);
    setTransactionValue('amount', parseFloat(transaction.amount));
    setTransactionValue('category', transaction.category);
    setTransactionValue('description', transaction.description || '');
    setTransactionValue('transaction_date', transaction.transaction_date);
    setTransactionValue('payment_method', transaction.payment_method || '');
    setTransactionValue('tags', transaction.tags?.join(', ') || '');
    setTransactionValue('is_recurring', transaction.is_recurring || false);
    setTransactionValue('frequency', transaction.frequency || '');
    setTransactionValue('account', transaction.account || '');
  };

  const handleCreateBudget = () => {
    setShowBudgetForm(true);
    setIsEditing(false);
    setSelectedBudget(null);
    resetBudget({
      category: '',
      budget_amount: 0,
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      description: '',
    });
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditing(true);
    setShowBudgetForm(true);
    setBudgetValue('category', budget.category);
    setBudgetValue('budget_amount', parseFloat(budget.budget_amount));
    setBudgetValue('period', budget.period);
    setBudgetValue('start_date', budget.start_date);
    setBudgetValue('end_date', budget.end_date || '');
    setBudgetValue('description', budget.description || '');
  };

  const handleCreateGoal = () => {
    setShowGoalForm(true);
    setIsEditing(false);
    setSelectedGoal(null);
    resetGoal({
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      description: '',
      status: 'active',
      is_emergency_fund: false,
    });
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsEditing(true);
    setShowGoalForm(true);
    setGoalValue('name', goal.name);
    setGoalValue('target_amount', parseFloat(goal.target_amount));
    setGoalValue('current_amount', parseFloat(goal.current_amount));
    setGoalValue('target_date', goal.target_date || '');
    setGoalValue('description', goal.description || '');
    setGoalValue('status', goal.status);
    setGoalValue('is_emergency_fund', goal.is_emergency_fund || false);
  };

  const onTransactionSubmit = (data: TransactionForm) => {
    if (isEditing && selectedTransaction) {
      updateTransactionMutation.mutate({ id: selectedTransaction.id, data });
    } else {
      createTransactionMutation.mutate(data);
    }
  };

  const onBudgetSubmit = (data: BudgetForm) => {
    if (isEditing && selectedBudget) {
      updateBudgetMutation.mutate({ id: selectedBudget.id, data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const onGoalSubmit = (data: SavingsGoalForm) => {
    if (isEditing && selectedGoal) {
      updateGoalMutation.mutate({ id: selectedGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const handleCreateInvestment = () => {
    setShowInvestmentForm(true);
    setIsEditing(false);
    setSelectedInvestment(null);
    resetInvestment({
      name: '',
      type: 'stock',
      symbol: '',
      quantity: 0,
      purchase_price: 0,
      current_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsEditing(true);
    setShowInvestmentForm(true);
    setInvestmentValue('name', investment.name);
    setInvestmentValue('type', investment.type);
    setInvestmentValue('symbol', investment.symbol || '');
    setInvestmentValue('quantity', parseFloat(investment.quantity));
    setInvestmentValue('purchase_price', parseFloat(investment.purchase_price));
    setInvestmentValue('current_price', investment.current_price ? parseFloat(investment.current_price) : 0);
    setInvestmentValue('purchase_date', investment.purchase_date);
    setInvestmentValue('notes', investment.notes || '');
  };

  const handleCreateNetWorth = () => {
    setShowNetWorthForm(true);
    setIsEditing(false);
    setSelectedNetWorth(null);
    resetNetWorth({
      snapshot_date: new Date().toISOString().split('T')[0],
      total_assets: 0,
      total_liabilities: 0,
      notes: '',
    });
  };

  const handleEditNetWorth = (snapshot: NetWorthSnapshot) => {
    setSelectedNetWorth(snapshot);
    setIsEditing(true);
    setShowNetWorthForm(true);
    setNetWorthValue('snapshot_date', snapshot.snapshot_date);
    setNetWorthValue('total_assets', parseFloat(snapshot.total_assets));
    setNetWorthValue('total_liabilities', parseFloat(snapshot.total_liabilities));
    setNetWorthValue('notes', snapshot.notes || '');
  };

  const onInvestmentSubmit = (data: InvestmentForm) => {
    if (isEditing && selectedInvestment) {
      updateInvestmentMutation.mutate({ id: selectedInvestment.id, data });
    } else {
      createInvestmentMutation.mutate(data);
    }
  };

  const onNetWorthSubmit = (data: NetWorthForm) => {
    if (isEditing && selectedNetWorth) {
      updateNetWorthMutation.mutate({ id: selectedNetWorth.id, data });
    } else {
      createNetWorthMutation.mutate(data);
    }
  };

  // Get unique categories from transactions
  const categories = useMemo(() => {
    if (!transactions) return [];
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  return (
    <div className="financial">
      <div className="page-header">
        <h1>Financial</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('transactions')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'transactions' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'transactions' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Transactions
            </button>
            <button
              onClick={() => setViewMode('budgets')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'budgets' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'budgets' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Budgets
            </button>
            <button
              onClick={() => setViewMode('goals')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'goals' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'goals' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Savings Goals
            </button>
            <button
              onClick={() => setViewMode('summary')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'summary' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'summary' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode('investments')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'investments' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'investments' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Investments
            </button>
            <button
              onClick={() => setViewMode('networth')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'networth' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'networth' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Net Worth
            </button>
            <button
              onClick={() => setViewMode('planning')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'planning' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'planning' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Financial Planning
            </button>
          </div>
          {viewMode === 'transactions' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleCreateTransaction} className="btn-primary">
                + New Transaction
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                  📥 Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                      // Preview first
                      const previewRes = await api.post('/transactions-import/preview', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });

                      if (previewRes.data.total === 0) {
                        alert('No valid transactions found in CSV');
                        return;
                      }

                      const confirmImport = confirm(
                        `Found ${previewRes.data.total} transactions. Preview shows first ${previewRes.data.preview.length}. Import all?`
                      );

                      if (confirmImport) {
                        const importRes = await api.post('/transactions-import/import', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                          params: { skip_duplicates: true },
                        });

                        alert(`Imported ${importRes.data.imported} transactions. ${importRes.data.skipped} skipped.`);
                        invalidateTransactionReports();
                      }
                    } catch (err: any) {
                      alert(err?.response?.data?.error || 'Failed to import CSV');
                    }

                    // Reset file input
                    e.target.value = '';
                  }}
                />
                </label>
                {transactions && transactions.length > 0 && (
                  <>
                    <button 
                      onClick={() => exportTransactionsToCSV(transactions)} 
                      className="btn-secondary"
                      title="Export to CSV"
                    >
                      📤 Export CSV
                    </button>
                    <button 
                      onClick={() => exportToPDF(
                        'Transactions',
                        transactions,
                        [
                          { key: 'transaction_date', label: 'Date' },
                          { key: 'type', label: 'Type' },
                          { key: 'amount', label: 'Amount' },
                          { key: 'category', label: 'Category' },
                        ],
                        'transactions-export'
                      )} 
                      className="btn-secondary"
                      title="Export to PDF"
                    >
                      📄 Export PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {viewMode === 'budgets' && (
            <button onClick={handleCreateBudget} className="btn-primary">
              + New Budget
            </button>
          )}
          {viewMode === 'goals' && (
            <button onClick={handleCreateGoal} className="btn-primary">
              + New Goal
            </button>
          )}
          {viewMode === 'investments' && (
            <button onClick={handleCreateInvestment} className="btn-primary">
              + Add Investment
            </button>
          )}
          {viewMode === 'networth' && (
            <button onClick={handleCreateNetWorth} className="btn-primary">
              + New Snapshot
            </button>
          )}
        </div>
      </div>

      {/* Financial Dashboard View */}
      {viewMode === 'dashboard' && (
        <>
          {dashboardLoading ? (
            <LoadingSpinner message="Loading financial dashboard..." size="large" />
          ) : dashboardError ? (
            <ErrorMessage
              message={dashboardError instanceof Error ? dashboardError.message : 'Failed to load financial dashboard'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] })}
            />
          ) : dashboardData ? (
            <div className="financial-dashboard">
              {/* Overview Section */}
              <div className="dashboard-section">
                <h2>💰 Financial Overview</h2>
                <p>
                  Reporting period: <time dateTime={dashboardData.period.start_date}>{dashboardData.period.start_date}</time>
                  {' through '}<time dateTime={dashboardData.period.end_date}>{dashboardData.period.end_date}</time>.
                  {' Based on recorded transactions, not connected bank balances.'}
                </p>
                {dashboardData.overview.income_count + dashboardData.overview.expense_count === 0 && (
                  <p role="status">No income or expense transactions recorded for this period. Zero totals reflect no recorded activity.</p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#e0f2fe', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Income</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${dashboardData.overview.income.toFixed(2)}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>{dashboardData.overview.income_count} transactions</p>
                  </div>
                  <div style={{ background: '#fee2e2', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Expenses</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                      ${dashboardData.overview.expenses.toFixed(2)}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>{dashboardData.overview.expense_count} transactions</p>
                  </div>
                  <div style={{ background: '#d1fae5', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Cash-flow Surplus</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${dashboardData.overview.savings.toFixed(2)}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>Positive income minus expenses; not a savings account balance.</p>
                  </div>
                  <div style={{ background: dashboardData.overview.net_cash_flow >= 0 ? '#d1fae5' : '#fee2e2', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Net Cash Flow</h3>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: dashboardData.overview.net_cash_flow >= 0 ? '#10b981' : '#ef4444' }}>
                      {dashboardData.overview.net_cash_flow >= 0 ? '+' : ''}${dashboardData.overview.net_cash_flow.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Health Indicators */}
              {dashboardData.health_indicators && (
                <div className="dashboard-section">
                  <h2>📊 Financial Health</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Cash-flow Surplus Rate</h3>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                        {dashboardData.overview.income > 0 ? `${dashboardData.health_indicators.savings_rate.toFixed(1)}%` : 'Not applicable (no income)'}
                      </p>
                    </div>
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Expense-to-Income</h3>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                        {dashboardData.overview.income > 0 ? `${dashboardData.health_indicators.expense_to_income_ratio.toFixed(1)}%` : 'Not applicable (no income)'}
                      </p>
                    </div>
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>Budget Adherence</h3>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                        {dashboardData.budgets.length > 0 ? `${dashboardData.health_indicators.budget_adherence.toFixed(1)}%` : 'No active budgets'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Overview */}
              {dashboardData.budgets && dashboardData.budgets.length > 0 && (
                <div className="dashboard-section">
                  <h2>📊 Budget Overview</h2>
                  <div className="budgets-list">
                    {dashboardData.budgets.map((budget: any) => {
                      const percentage = budget.percentage_used || 0;
                      const isOverBudget = percentage > 100;
                      return (
                        <div key={budget.id} className="budget-card">
                          <div className="budget-header">
                            <div>
                              <h3>{budget.category}</h3>
                              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                {budget.period} • {new Date(budget.start_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                ${budget.spent.toFixed(2)} / ${parseFloat(budget.budget_amount).toFixed(2)}
                              </p>
                              <span style={{ fontSize: '0.875rem', color: isOverBudget ? '#ef4444' : '#666' }}>
                                {percentage.toFixed(1)}% used
                              </span>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.5rem', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(percentage, 100)}%`,
                                background: isOverBudget ? '#ef4444' : percentage > 80 ? '#f59e0b' : '#10b981',
                                transition: 'width 0.3s'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Savings Goals */}
              {dashboardData.savings_goals && dashboardData.savings_goals.length > 0 && (
                <div className="dashboard-section">
                  <h2>🎯 Savings Goals</h2>
                  <div className="goals-list">
                    {dashboardData.savings_goals.map((goal: any) => {
                      const progress = goal.progress || 0;
                      return (
                        <div key={goal.id} className="goal-card">
                          <div className="goal-header">
                            <div>
                              <h3>
                                {goal.name}
                                {goal.is_emergency_fund && <span style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>🛡️</span>}
                              </h3>
                            </div>
                          </div>
                          <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span>Progress:</span>
                              <span><strong>${parseFloat(goal.current_amount).toFixed(2)} / ${parseFloat(goal.target_amount).toFixed(2)}</strong></span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  height: '100%',
                                  background: progress >= 100 ? '#10b981' : '#667eea',
                                  transition: 'width 0.3s'
                                }}
                              />
                            </div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                              {progress.toFixed(1)}% complete
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {dashboardData.recent_transactions && dashboardData.recent_transactions.length > 0 && (
                <div className="dashboard-section">
                  <h2>🧾 Recent Transactions</h2>
                  <div className="transactions-list">
                    {dashboardData.recent_transactions.slice(0, 10).map((transaction: Transaction) => (
                      <div
                        key={transaction.id}
                        className="transaction-card"
                        style={{
                          borderLeft: `4px solid ${transaction.type === 'income' ? '#10b981' : '#ef4444'}`,
                        }}
                      >
                        <div className="transaction-header">
                          <div>
                            <h3>{transaction.category}</h3>
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                              {transaction.is_recurring && <span style={{ marginLeft: '0.5rem', color: '#667eea' }}>🔄</span>}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p
                              style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                              }}
                            >
                              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {transaction.description && (
                          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{transaction.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon="💰"
              title="No financial data yet"
              message="Start tracking your finances to see your dashboard."
              actionLabel="Add Transaction"
              onAction={() => setViewMode('transactions')}
            />
          )}
        </>
      )}

      {/* Cash Flow View */}
      {viewMode === 'cashflow' && (
        <>
          {cashFlowLoading ? (
            <LoadingSpinner message="Loading cash flow..." size="large" />
          ) : cashFlowError ? (
            <ErrorMessage
              message={cashFlowError instanceof Error ? cashFlowError.message : 'Failed to load cash flow'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['cash-flow'] })}
            />
          ) : cashFlow && cashFlow.length > 0 ? (
            <div className="cashflow-view">
              <h2>Cash Flow Overview</h2>
              <p>Reporting period: All recorded transaction dates, grouped by calendar month.</p>
              <div className="cashflow-list">
                {cashFlow.map((month: any, index: number) => (
                  <div key={index} className="cashflow-card">
                    <div className="cashflow-header">
                      <h3>{new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                      <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#666' }}>Income</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                          ${month.income.toFixed(2)}
                        </p>
                      </div>
                      <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#666' }}>Expenses</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                          ${month.expenses.toFixed(2)}
                        </p>
                      </div>
                      <div style={{ background: month.net >= 0 ? '#d1fae5' : '#fee2e2', padding: '1rem', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#666' }}>Net Cash Flow</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: month.net >= 0 ? '#10b981' : '#ef4444' }}>
                          {month.net >= 0 ? '+' : ''}${month.net.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="📊"
              title="No cash flow data yet"
              message="Add transactions to see your cash flow over time."
              actionLabel="Add Transaction"
              onAction={() => setViewMode('transactions')}
            />
          )}
        </>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="financial-summary">
          <h2>Financial Summary</h2>
          <p>Reporting period: All recorded transaction dates and categories.</p>
          {summaryLoading ? (
            <LoadingSpinner message="Loading financial summary..." size="large" />
          ) : summaryError ? (
            <ErrorMessage
              message={summaryError instanceof Error ? summaryError.message : 'Failed to load financial summary'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })}
            />
          ) : summary ? (
            <>
              {summary.income_count + summary.expense_count === 0 && (
                <p role="status">No income or expense transactions recorded. Zero totals reflect no recorded activity.</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#e0f2fe', padding: '1.5rem', borderRadius: '8px' }}>
                  <h3>Total Income</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    ${summary.income.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>{summary.income_count} transactions</p>
                </div>
                <div style={{ background: '#fee2e2', padding: '1.5rem', borderRadius: '8px' }}>
                  <h3>Total Expenses</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                    ${summary.expense.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>{summary.expense_count} transactions</p>
                </div>
                <div style={{ background: summary.net >= 0 ? '#d1fae5' : '#fee2e2', padding: '1.5rem', borderRadius: '8px' }}>
                  <h3>Net</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: summary.net >= 0 ? '#10b981' : '#ef4444' }}>
                    ${summary.net.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>
                    {summary.net >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p>No financial data available</p>
          )}
        </div>
      )}

      {/* Transactions View */}
      {viewMode === 'transactions' && (
        <>
          {showTransactionForm && (
            <form onSubmit={handleTransactionSubmit(onTransactionSubmit)} className="financial-form">
              <h3>{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
              <div className="form-group">
                <label>Type *</label>
                <select {...registerTransaction('type', { required: true })}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...registerTransaction('amount', { required: true, min: 0.01 })}
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  placeholder="e.g., Food, Salary, Rent"
                  {...registerTransaction('category', { required: true })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Transaction description..."
                  {...registerTransaction('description')}
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  {...registerTransaction('transaction_date', { required: true })}
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <input
                  type="text"
                  placeholder="e.g., Credit Card, Cash, Bank Transfer"
                  {...registerTransaction('payment_method')}
                />
              </div>
              <div className="form-group">
                <label>Account</label>
                <select {...registerTransaction('account')}>
                  <option value="">Select account</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" {...registerTransaction('is_recurring')} />
                  Recurring Transaction
                </label>
              </div>
              {watchTransactionIsRecurring && (
                <div className="form-group">
                  <label>Frequency</label>
                  <select {...registerTransaction('frequency')}>
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., groceries, work, personal"
                  {...registerTransaction('tags')}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Transaction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionForm(false);
                    setIsEditing(false);
                    setSelectedTransaction(null);
                    resetTransaction();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Categories</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {(filterType !== 'all' || filterCategory) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterCategory('');
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>

          {transactionsLoading ? (
            <LoadingSpinner message="Loading transactions..." size="large" />
          ) : transactionsError ? (
            <ErrorMessage
              message={transactionsError instanceof Error ? transactionsError.message : 'Failed to load transactions'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
            />
          ) : transactions && transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="transaction-card"
                  style={{
                    borderLeft: `4px solid ${transaction.type === 'income' ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  <div className="transaction-header">
                    <div>
                      <h3>{transaction.category}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                  {transaction.description && (
                    <p style={{ marginTop: '0.5rem', color: '#666' }}>{transaction.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    {transaction.payment_method && (
                      <span>💳 {transaction.payment_method}</span>
                    )}
                    {transaction.account && (
                      <span>🏦 {transaction.account.replace('_', ' ')}</span>
                    )}
                    {transaction.is_recurring && transaction.frequency && (
                      <span>🔄 {transaction.frequency}</span>
                    )}
                    {transaction.tags && transaction.tags.length > 0 && (
                      <span>🏷️ {transaction.tags.join(', ')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this transaction?')) {
                          deleteTransactionMutation.mutate(transaction.id);
                        }
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="💰"
              title="No transactions yet"
              message="Start tracking your finances by creating your first transaction."
              actionLabel="Create Transaction"
              onAction={handleCreateTransaction}
            />
          )}
        </>
      )}

      {/* Budgets View */}
      {viewMode === 'budgets' && (
        <>
          {showBudgetForm && (
            <form onSubmit={handleBudgetSubmit(onBudgetSubmit)} className="financial-form">
              <h3>{isEditing ? 'Edit Budget' : 'New Budget'}</h3>
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  placeholder="e.g., Food, Transportation, Entertainment"
                  {...registerBudget('category', { required: true })}
                />
              </div>
              <div className="form-group">
                <label>Budget Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...registerBudget('budget_amount', { required: true, min: 0.01 })}
                />
              </div>
              <div className="form-group">
                <label>Period *</label>
                <select {...registerBudget('period', { required: true })}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  {...registerBudget('start_date', { required: true })}
                />
              </div>
              <div className="form-group">
                <label>End Date (optional)</label>
                <input
                  type="date"
                  {...registerBudget('end_date')}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Budget description..."
                  {...registerBudget('description')}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Budget
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetForm(false);
                    setIsEditing(false);
                    setSelectedBudget(null);
                    resetBudget();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {budgetsLoading || budgetSummaryLoading ? (
            <LoadingSpinner message="Loading budgets..." size="large" />
          ) : budgetsError ? (
            <ErrorMessage
              message={budgetsError instanceof Error ? budgetsError.message : 'Failed to load budgets'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['budgets'] })}
            />
          ) : budgetSummaryError ? (
            <ErrorMessage
              message={budgetSummaryError instanceof Error ? budgetSummaryError.message : 'Failed to load budget summary'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['budget-summary'] })}
            />
          ) : budgetSummary && budgetSummary.length > 0 ? (
            <div className="budgets-list">
              {budgetSummary.map((budget: any) => {
                const percentage = budget.percentage_used || 0;
                const isOverBudget = percentage > 100;
                return (
                  <div key={budget.id} className="budget-card">
                    <div className="budget-header">
                      <div>
                        <h3>{budget.category}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          {budget.period} • {new Date(budget.start_date).toLocaleDateString()}
                          {budget.end_date && ` - ${new Date(budget.end_date).toLocaleDateString()}`}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          ${budget.spent.toFixed(2)} / ${parseFloat(budget.budget_amount).toFixed(2)}
                        </p>
                        <span style={{ fontSize: '0.875rem', color: isOverBudget ? '#ef4444' : '#666' }}>
                          {percentage.toFixed(1)}% used
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(percentage, 100)}%`,
                          background: isOverBudget ? '#ef4444' : percentage > 80 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                    {budget.description && (
                      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{budget.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this budget?')) {
                            deleteBudgetMutation.mutate(budget.id);
                          }
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : budgets && budgets.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No budgets yet"
              message="Create a budget to track your spending by category."
              actionLabel="Create Budget"
              onAction={handleCreateBudget}
            />
          ) : (
            <EmptyState
              icon="📊"
              title="No budget summary data"
              message="No spending summary was returned for your budgets."
            />
          )}
        </>
      )}

      {/* Savings Goals View */}
      {viewMode === 'goals' && (
        <>
          {showGoalForm && (
            <form onSubmit={handleGoalSubmit(onGoalSubmit)} className="financial-form">
              <h3>{isEditing ? 'Edit Savings Goal' : 'New Savings Goal'}</h3>
              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Emergency Fund, Vacation, House Down Payment"
                  {...registerGoal('name', { required: true })}
                />
              </div>
              <div className="form-group">
                <label>Target Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...registerGoal('target_amount', { required: true, min: 0.01 })}
                />
              </div>
              <div className="form-group">
                <label>Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...registerGoal('current_amount', { min: 0 })}
                />
              </div>
              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  {...registerGoal('target_date')}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Goal description..."
                  {...registerGoal('description')}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select {...registerGoal('status')}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Goal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalForm(false);
                    setIsEditing(false);
                    setSelectedGoal(null);
                    resetGoal();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {goalsLoading ? (
            <LoadingSpinner message="Loading savings goals..." size="large" />
          ) : goalsError ? (
            <ErrorMessage
              message={goalsError instanceof Error ? goalsError.message : 'Failed to load savings goals'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['savings-goals'] })}
            />
          ) : savingsGoals && savingsGoals.length > 0 ? (
            <div className="goals-list">
              {savingsGoals.map((goal) => {
                const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
                const isCompleted = goal.status === 'completed' || progress >= 100;
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <div>
                        <h3>{goal.name}</h3>
                        {goal.target_date && (
                          <span style={{ fontSize: '0.875rem', color: '#666' }}>
                            Target: {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: goal.status === 'completed' ? '#10b981' : goal.status === 'paused' ? '#f59e0b' : '#667eea',
                          color: 'white',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        {goal.status}
                      </span>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Progress:</span>
                        <span><strong>${parseFloat(goal.current_amount).toFixed(2)} / ${parseFloat(goal.target_amount).toFixed(2)}</strong></span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            height: '100%',
                            background: isCompleted ? '#10b981' : '#667eea',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        {progress.toFixed(1)}% complete
                      </p>
                    </div>
                    {goal.description && (
                      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{goal.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this savings goal?')) {
                            deleteGoalMutation.mutate(goal.id);
                          }
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="🎯"
              title="No savings goals yet"
              message="Set your first savings goal to start tracking your progress."
              actionLabel="Create Goal"
              onAction={handleCreateGoal}
            />
          )}
        </>
      )}

      {/* Investments View */}
      {viewMode === 'investments' && (
        <>
          {showInvestmentForm && (
            <form onSubmit={handleInvestmentSubmit(onInvestmentSubmit)} className="financial-form">
              <h3>{isEditing ? 'Edit Investment' : 'Add Investment'}</h3>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" {...registerInvestment('name', { required: true })} placeholder="e.g., Apple Inc., Bitcoin" />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select {...registerInvestment('type', { required: true })}>
                  <option value="stock">Stock</option>
                  <option value="bond">Bond</option>
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="etf">ETF</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Symbol/Ticker</label>
                <input type="text" {...registerInvestment('symbol')} placeholder="e.g., AAPL, BTC" />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" step="0.0001" min="0.0001" {...registerInvestment('quantity', { required: true, valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Purchase Price *</label>
                <input type="number" step="0.01" min="0.01" {...registerInvestment('purchase_price', { required: true, valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Current Price</label>
                <input type="number" step="0.01" min="0" {...registerInvestment('current_price', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Purchase Date *</label>
                <input type="date" {...registerInvestment('purchase_date', { required: true })} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} {...registerInvestment('notes')} placeholder="Additional notes..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createInvestmentMutation.isPending || updateInvestmentMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Investment
                </button>
                <button type="button" onClick={() => { setShowInvestmentForm(false); setIsEditing(false); setSelectedInvestment(null); resetInvestment(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Investment Summary */}
          {investmentSummaryLoading ? (
            <LoadingSpinner message="Loading investment summary..." size="medium" />
          ) : investmentSummaryError ? (
            <ErrorMessage
              message={investmentSummaryError instanceof Error ? investmentSummaryError.message : 'Failed to load investment summary'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['investment-summary'] })}
            />
          ) : investmentSummary && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>Investment Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Total Cost</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>${investmentSummary.total_cost.toFixed(2)}</p>
                </div>
                <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Total Value</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>${investmentSummary.total_value.toFixed(2)}</p>
                </div>
                <div style={{ background: investmentSummary.total_gain_loss >= 0 ? '#d1fae5' : '#fee2e2', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Gain/Loss</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: investmentSummary.total_gain_loss >= 0 ? '#10b981' : '#ef4444' }}>
                    {investmentSummary.total_gain_loss >= 0 ? '+' : ''}${investmentSummary.total_gain_loss.toFixed(2)}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                    {investmentSummary.return_percentage >= 0 ? '+' : ''}{investmentSummary.return_percentage.toFixed(2)}%
                  </p>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Total Investments</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{investmentSummary.total_investments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select value={filterInvestmentType} onChange={(e) => setFilterInvestmentType(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="all">All Types</option>
              <option value="stock">Stock</option>
              <option value="bond">Bond</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="etf">ETF</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="real_estate">Real Estate</option>
              <option value="other">Other</option>
            </select>
            {filterInvestmentType !== 'all' && (
              <button onClick={() => setFilterInvestmentType('all')} className="btn-secondary">
                Clear Filter
              </button>
            )}
          </div>

          {investmentsLoading ? (
            <LoadingSpinner message="Loading investments..." size="large" />
          ) : investmentsError ? (
            <ErrorMessage
              message={investmentsError instanceof Error ? investmentsError.message : 'Failed to load investments'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['investments'] })}
            />
          ) : investments && investments.length > 0 ? (
            <div className="investments-list">
              {investments.map((investment) => {
                const cost = parseFloat(investment.quantity) * parseFloat(investment.purchase_price);
                const currentPrice = investment.current_price ? parseFloat(investment.current_price) : parseFloat(investment.purchase_price);
                const value = parseFloat(investment.quantity) * currentPrice;
                const gainLoss = value - cost;
                const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
                return (
                  <div key={investment.id} className="investment-card">
                    <div className="investment-header">
                      <div>
                        <h3>{investment.name}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                          {investment.type.replace('_', ' ')} {investment.symbol && `• ${investment.symbol}`}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          ${value.toFixed(2)}
                        </p>
                        <span style={{ fontSize: '0.875rem', color: gainLoss >= 0 ? '#10b981' : '#ef4444' }}>
                          {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                      <div>
                        <strong>Quantity:</strong> {parseFloat(investment.quantity).toFixed(4)}
                      </div>
                      <div>
                        <strong>Purchase Price:</strong> ${parseFloat(investment.purchase_price).toFixed(2)}
                      </div>
                      <div>
                        <strong>Current Price:</strong> ${currentPrice.toFixed(2)}
                      </div>
                      <div>
                        <strong>Purchase Date:</strong> {new Date(investment.purchase_date).toLocaleDateString()}
                      </div>
                    </div>
                    {investment.notes && (
                      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{investment.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handleEditInvestment(investment)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                        Edit
                      </button>
                      <button onClick={() => { if (confirm('Are you sure?')) deleteInvestmentMutation.mutate(investment.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="📈"
              title="No investments yet"
              message="Start tracking your investment portfolio."
              actionLabel="Add Investment"
              onAction={handleCreateInvestment}
            />
          )}
        </>
      )}

      {/* Net Worth View */}
      {viewMode === 'networth' && (
        <>
          {showNetWorthForm && (
            <form onSubmit={handleNetWorthSubmit(onNetWorthSubmit)} className="financial-form">
              <h3>{isEditing ? 'Edit Net Worth Snapshot' : 'New Net Worth Snapshot'}</h3>
              <div className="form-group">
                <label>Snapshot Date *</label>
                <input type="date" {...registerNetWorth('snapshot_date', { required: true })} />
              </div>
              <div className="form-group">
                <label>Total Assets *</label>
                <input type="number" step="0.01" min="0" {...registerNetWorth('total_assets', { required: true, valueAsNumber: true })} placeholder="Total value of all assets" />
              </div>
              <div className="form-group">
                <label>Total Liabilities *</label>
                <input type="number" step="0.01" min="0" {...registerNetWorth('total_liabilities', { required: true, valueAsNumber: true })} placeholder="Total value of all debts/liabilities" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} {...registerNetWorth('notes')} placeholder="Additional notes about this snapshot..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createNetWorthMutation.isPending || updateNetWorthMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Snapshot
                </button>
                <button type="button" onClick={() => { setShowNetWorthForm(false); setIsEditing(false); setSelectedNetWorth(null); resetNetWorth(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Latest Net Worth Display */}
          {latestNetWorthLoading ? (
            <LoadingSpinner message="Loading latest net worth..." size="medium" />
          ) : latestNetWorthError ? (
            <ErrorMessage
              message={`Latest net worth unavailable: ${latestNetWorthError instanceof Error ? latestNetWorthError.message : 'Failed to load snapshot'}`}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['latest-net-worth'] })}
            />
          ) : latestNetWorth ? (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>Latest Net Worth</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Total Assets</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    ${parseFloat(latestNetWorth.total_assets).toFixed(2)}
                  </p>
                </div>
                <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Total Liabilities</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                    ${parseFloat(latestNetWorth.total_liabilities).toFixed(2)}
                  </p>
                </div>
                <div style={{ background: parseFloat(latestNetWorth.net_worth) >= 0 ? '#d1fae5' : '#fee2e2', padding: '1rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Net Worth</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: parseFloat(latestNetWorth.net_worth) >= 0 ? '#10b981' : '#ef4444' }}>
                    ${parseFloat(latestNetWorth.net_worth).toFixed(2)}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                    As of {new Date(latestNetWorth.snapshot_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p role="status">No latest net worth snapshot recorded.</p>
          )}

          {netWorthLoading ? (
            <LoadingSpinner message="Loading net worth snapshots..." size="large" />
          ) : netWorthError ? (
            <ErrorMessage
              message={netWorthError instanceof Error ? netWorthError.message : 'Failed to load net worth snapshots'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['net-worth'] })}
            />
          ) : netWorthSnapshots && netWorthSnapshots.length > 0 ? (
            <div className="networth-list">
              {netWorthSnapshots.map((snapshot) => {
                const netWorth = parseFloat(snapshot.net_worth);
                return (
                  <div key={snapshot.id} className="networth-card">
                    <div className="networth-header">
                      <div>
                        <h3>Net Worth Snapshot</h3>
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          {new Date(snapshot.snapshot_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: netWorth >= 0 ? '#10b981' : '#ef4444' }}>
                          ${netWorth.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                      <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#666' }}>Assets</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                          ${parseFloat(snapshot.total_assets).toFixed(2)}
                        </p>
                      </div>
                      <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#666' }}>Liabilities</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                          ${parseFloat(snapshot.total_liabilities).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {snapshot.notes && (
                      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{snapshot.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handleEditNetWorth(snapshot)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                        Edit
                      </button>
                      <button onClick={() => { if (confirm('Are you sure?')) deleteNetWorthMutation.mutate(snapshot.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="💰"
              title="No net worth snapshots yet"
              message="Create your first net worth snapshot to start tracking your financial position."
              actionLabel="Create Snapshot"
              onAction={handleCreateNetWorth}
            />
          )}
        </>
      )}

      {/* Financial Planning View */}
      {viewMode === 'planning' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Financial Planning</h2>
            <button onClick={() => { setShowPlanForm(true); setIsEditing(false); setSelectedPlan(null); }} className="btn-primary">
              + New Plan
            </button>
          </div>

          {showPlanForm && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e0e0e0' }}>
              <h3>{isEditing ? 'Edit Financial Plan' : 'Create Financial Plan'}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  plan_type: formData.get('plan_type'),
                  title: formData.get('title'),
                  description: formData.get('description'),
                  target_amount: parseFloat(formData.get('target_amount') as string),
                  current_amount: parseFloat(formData.get('current_amount') as string) || 0,
                  target_date: formData.get('target_date') || null,
                  monthly_contribution: formData.get('monthly_contribution') ? parseFloat(formData.get('monthly_contribution') as string) : null,
                  interest_rate: formData.get('interest_rate') ? parseFloat(formData.get('interest_rate') as string) : 0,
                  status: formData.get('status') || 'active',
                  priority: formData.get('priority') || 'medium',
                  notes: formData.get('notes') || null,
                };
                if (isEditing && selectedPlan) {
                  updatePlanMutation.mutate({ id: selectedPlan.id, data });
                } else {
                  createPlanMutation.mutate(data);
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label>Plan Type *</label>
                    <select name="plan_type" required defaultValue={selectedPlan?.plan_type || ''}>
                      <option value="">Select type</option>
                      <option value="retirement">Retirement</option>
                      <option value="education">Education</option>
                      <option value="major_purchase">Major Purchase</option>
                      <option value="emergency_fund">Emergency Fund</option>
                      <option value="debt_payoff">Debt Payoff</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Title *</label>
                    <input type="text" name="title" required defaultValue={selectedPlan?.title || ''} />
                  </div>
                  <div>
                    <label>Target Amount *</label>
                    <input type="number" name="target_amount" step="0.01" min="0" required defaultValue={selectedPlan?.target_amount || ''} />
                  </div>
                  <div>
                    <label>Current Amount</label>
                    <input type="number" name="current_amount" step="0.01" min="0" defaultValue={selectedPlan?.current_amount || 0} />
                  </div>
                  <div>
                    <label>Target Date</label>
                    <input type="date" name="target_date" defaultValue={selectedPlan?.target_date || ''} />
                  </div>
                  <div>
                    <label>Monthly Contribution</label>
                    <input type="number" name="monthly_contribution" step="0.01" min="0" defaultValue={selectedPlan?.monthly_contribution || ''} />
                  </div>
                  <div>
                    <label>Interest Rate (%)</label>
                    <input type="number" name="interest_rate" step="0.01" min="0" max="100" defaultValue={selectedPlan?.interest_rate || 0} />
                  </div>
                  <div>
                    <label>Status</label>
                    <select name="status" defaultValue={selectedPlan?.status || 'active'}>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label>Priority</label>
                    <select name="priority" defaultValue={selectedPlan?.priority || 'medium'}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Description</label>
                  <textarea name="description" rows={3} defaultValue={selectedPlan?.description || ''} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Notes</label>
                  <textarea name="notes" rows={2} defaultValue={selectedPlan?.notes || ''} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn-primary" disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                    {isEditing ? 'Update' : 'Create'} Plan
                  </button>
                  <button type="button" onClick={() => { setShowPlanForm(false); setIsEditing(false); setSelectedPlan(null); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {plansLoading ? (
            <LoadingSpinner message="Loading financial plans..." size="large" />
          ) : plansError ? (
            <ErrorMessage
              message={plansError instanceof Error ? plansError.message : 'Failed to load financial plans'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['financial-plans'] })}
            />
          ) : financialPlans && financialPlans.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {financialPlans.map((plan: any) => {
                const progress = plan.target_amount > 0 ? (plan.current_amount / plan.target_amount) * 100 : 0;
                return (
                  <div key={plan.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3>{plan.title}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#666', background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {plan.plan_type.replace('_', ' ')}
                        </span>
                        {plan.priority && (
                          <span style={{ fontSize: '0.875rem', color: '#666', marginLeft: '0.5rem', background: plan.priority === 'high' ? '#fee2e2' : plan.priority === 'medium' ? '#fef3c7' : '#d1fae5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {plan.priority}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                          ${parseFloat(plan.current_amount).toFixed(2)} / ${parseFloat(plan.target_amount).toFixed(2)}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#666' }}>
                          {progress.toFixed(1)}% complete
                        </p>
                      </div>
                    </div>
                    <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', marginBottom: '1rem' }}>
                      <div style={{ background: '#667eea', height: '100%', borderRadius: '4px', width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    {plan.description && <p style={{ marginBottom: '0.5rem', color: '#666' }}>{plan.description}</p>}
                    {plan.target_date && (
                      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                        Target Date: {new Date(plan.target_date).toLocaleDateString()}
                      </p>
                    )}
                    {plan.monthly_contribution && (
                      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                        Monthly Contribution: ${parseFloat(plan.monthly_contribution).toFixed(2)}
                      </p>
                    )}
                    {plan.interest_rate > 0 && (
                      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                        Interest Rate: {parseFloat(plan.interest_rate).toFixed(2)}%
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button onClick={() => { setSelectedPlan(plan); setIsEditing(true); setShowPlanForm(true); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                        Edit
                      </button>
                      <button onClick={() => { if (confirm('Are you sure?')) deletePlanMutation.mutate(plan.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="📊"
              title="No financial plans yet"
              message="Create a financial plan for retirement, education, major purchases, or other long-term goals."
              actionLabel="Create Plan"
              onAction={() => { setShowPlanForm(true); setIsEditing(false); setSelectedPlan(null); }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Financial;
