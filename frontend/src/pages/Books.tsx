import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './Books.css';

interface BookForm {
  title: string;
  author: string;
  category: string;
  status: 'reading_list' | 'currently_reading' | 'completed';
  priority: 'low' | 'medium' | 'high';
  why_i_want_to_read: string;
  start_date: string;
  finish_date: string;
  progress: number;
  reading_cadence: 'daily' | 'weekly';
  rating: number;
  would_reread: boolean;
}

interface BookNoteForm {
  note_text: string;
  page_location: string;
  tags: string;
}

interface BookQuoteForm {
  quote_text: string;
  page: string;
  tags: string;
}

interface BookTakeawayForm {
  takeaway_text: string;
}

interface ReadingGoalForm {
  goal_type: 'books_per_year' | 'books_per_month' | 'category_goal' | 'streak';
  target_value: number;
  category: string;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'paused';
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  status: 'reading_list' | 'currently_reading' | 'completed';
  priority: 'low' | 'medium' | 'high' | null;
  why_i_want_to_read: string | null;
  start_date: string | null;
  finish_date: string | null;
  progress: number | null;
  reading_cadence: 'daily' | 'weekly' | null;
  rating: number | null;
  would_reread: boolean | null;
  created_at: string;
  updated_at: string;
}

interface BookNote {
  id: string;
  book_id: string;
  note_text: string;
  page_location: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface BookQuote {
  id: string;
  book_id: string;
  quote_text: string;
  page: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface BookTakeaway {
  id: string;
  book_id: string;
  takeaway_text: string;
  created_at: string;
  updated_at: string;
}

interface ReadingGoal {
  id: string;
  goal_type: 'books_per_year' | 'books_per_month' | 'category_goal' | 'streak';
  target_value: number;
  current_value: number;
  category: string | null;
  period_start: string | null;
  period_end: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

const Books = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'reading_list' | 'currently_reading' | 'completed' | 'notes' | 'quotes' | 'takeaways' | 'goals'>('dashboard');
  const [showBookForm, setShowBookForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showTakeawayForm, setShowTakeawayForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedNote, setSelectedNote] = useState<BookNote | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<BookQuote | null>(null);
  const [selectedTakeaway, setSelectedTakeaway] = useState<BookTakeaway | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<ReadingGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: readingList, isLoading: readingListLoading } = useQuery<Book[]>({
    queryKey: ['books', 'reading_list'],
    queryFn: () => api.get('/books?status=reading_list').then(res => res.data),
    enabled: viewMode === 'reading_list' || viewMode === 'dashboard',
  });

  const { data: currentlyReading, isLoading: currentlyReadingLoading } = useQuery<Book[]>({
    queryKey: ['books', 'currently_reading'],
    queryFn: () => api.get('/books?status=currently_reading').then(res => res.data),
    enabled: viewMode === 'currently_reading' || viewMode === 'dashboard',
  });

  const { data: completedBooks, isLoading: completedBooksLoading } = useQuery<Book[]>({
    queryKey: ['books', 'completed'],
    queryFn: () => api.get('/books?status=completed').then(res => res.data),
    enabled: viewMode === 'completed' || viewMode === 'dashboard',
  });

  const { data: notes, isLoading: notesLoading } = useQuery<BookNote[]>({
    queryKey: ['book-notes', selectedBook?.id],
    queryFn: () => api.get(`/book-notes?book_id=${selectedBook?.id}`).then(res => res.data),
    enabled: (viewMode === 'notes' || viewMode === 'dashboard') && !!selectedBook,
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery<BookQuote[]>({
    queryKey: ['book-quotes', selectedBook?.id],
    queryFn: () => api.get(`/book-quotes?book_id=${selectedBook?.id}`).then(res => res.data),
    enabled: (viewMode === 'quotes' || viewMode === 'dashboard') && !!selectedBook,
  });

  const { data: takeaways, isLoading: takeawaysLoading } = useQuery<BookTakeaway[]>({
    queryKey: ['book-takeaways', selectedBook?.id],
    queryFn: () => api.get(`/book-takeaways?book_id=${selectedBook?.id}`).then(res => res.data),
    enabled: (viewMode === 'takeaways' || viewMode === 'dashboard') && !!selectedBook,
  });

  const { data: goals, isLoading: goalsLoading } = useQuery<ReadingGoal[]>({
    queryKey: ['reading-goals'],
    queryFn: () => api.get('/reading-goals').then(res => res.data),
    enabled: viewMode === 'goals' || viewMode === 'dashboard',
  });

  // Forms
  const { register: registerBook, handleSubmit: handleBookSubmit, reset: resetBook, setValue: setBookValue } = useForm<BookForm>({
    defaultValues: {
      title: '',
      author: '',
      category: '',
      status: 'reading_list',
      priority: 'medium',
      why_i_want_to_read: '',
      start_date: '',
      finish_date: '',
      progress: 0,
      reading_cadence: 'daily',
      rating: 0,
      would_reread: false,
    },
  });

  const { register: registerNote, handleSubmit: handleNoteSubmit, reset: resetNote, setValue: setNoteValue } = useForm<BookNoteForm>({
    defaultValues: {
      note_text: '',
      page_location: '',
      tags: '',
    },
  });

  const { register: registerQuote, handleSubmit: handleQuoteSubmit, reset: resetQuote, setValue: setQuoteValue } = useForm<BookQuoteForm>({
    defaultValues: {
      quote_text: '',
      page: '',
      tags: '',
    },
  });

  const { register: registerTakeaway, handleSubmit: handleTakeawaySubmit, reset: resetTakeaway, setValue: setTakeawayValue } = useForm<BookTakeawayForm>({
    defaultValues: {
      takeaway_text: '',
    },
  });

  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal, setValue: setGoalValue } = useForm<ReadingGoalForm>({
    defaultValues: {
      goal_type: 'books_per_year',
      target_value: 12,
      category: '',
      period_start: '',
      period_end: '',
      status: 'active',
    },
  });

  // Mutations
  const createBookMutation = useMutation({
    mutationFn: (data: BookForm) => api.post('/books', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      resetBook();
      setShowBookForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create book'),
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookForm> }) => api.put(`/books/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      resetBook();
      setShowBookForm(false);
      setIsEditing(false);
      setSelectedBook(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update book'),
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      alert('Book deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete book'),
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: BookNoteForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/book-notes', {
        book_id: selectedBook?.id,
        note_text: data.note_text,
        page_location: data.page_location || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-notes'] });
      resetNote();
      setShowNoteForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create note'),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookNoteForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      return api.put(`/book-notes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-notes'] });
      resetNote();
      setShowNoteForm(false);
      setIsEditing(false);
      setSelectedNote(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update note'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/book-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-notes'] });
      alert('Note deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete note'),
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: BookQuoteForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/book-quotes', {
        book_id: selectedBook?.id,
        quote_text: data.quote_text,
        page: data.page || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-quotes'] });
      resetQuote();
      setShowQuoteForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create quote'),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookQuoteForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      return api.put(`/book-quotes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-quotes'] });
      resetQuote();
      setShowQuoteForm(false);
      setIsEditing(false);
      setSelectedQuote(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update quote'),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/book-quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-quotes'] });
      alert('Quote deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete quote'),
  });

  const createTakeawayMutation = useMutation({
    mutationFn: (data: BookTakeawayForm) => api.post('/book-takeaways', {
      book_id: selectedBook?.id,
      takeaway_text: data.takeaway_text,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-takeaways'] });
      resetTakeaway();
      setShowTakeawayForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create takeaway'),
  });

  const updateTakeawayMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookTakeawayForm> }) => api.put(`/book-takeaways/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-takeaways'] });
      resetTakeaway();
      setShowTakeawayForm(false);
      setIsEditing(false);
      setSelectedTakeaway(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update takeaway'),
  });

  const deleteTakeawayMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/book-takeaways/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-takeaways'] });
      alert('Takeaway deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete takeaway'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: ReadingGoalForm) => api.post('/reading-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-goals'] });
      resetGoal();
      setShowGoalForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create goal'),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReadingGoalForm> }) => api.put(`/reading-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-goals'] });
      resetGoal();
      setShowGoalForm(false);
      setIsEditing(false);
      setSelectedGoal(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update goal'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reading-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-goals'] });
      alert('Goal deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete goal'),
  });

  // Handlers
  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(true);
    setShowBookForm(true);
    setBookValue('title', book.title);
    setBookValue('author', book.author || '');
    setBookValue('category', book.category || '');
    setBookValue('status', book.status);
    setBookValue('priority', book.priority || 'medium');
    setBookValue('why_i_want_to_read', book.why_i_want_to_read || '');
    setBookValue('start_date', book.start_date || '');
    setBookValue('finish_date', book.finish_date || '');
    setBookValue('progress', book.progress || 0);
    setBookValue('reading_cadence', book.reading_cadence || 'daily');
    setBookValue('rating', book.rating || 0);
    setBookValue('would_reread', book.would_reread || false);
  };

  const handleEditNote = (note: BookNote) => {
    setSelectedNote(note);
    setIsEditing(true);
    setShowNoteForm(true);
    setNoteValue('note_text', note.note_text);
    setNoteValue('page_location', note.page_location || '');
    setNoteValue('tags', note.tags?.join(', ') || '');
  };

  const handleEditQuote = (quote: BookQuote) => {
    setSelectedQuote(quote);
    setIsEditing(true);
    setShowQuoteForm(true);
    setQuoteValue('quote_text', quote.quote_text);
    setQuoteValue('page', quote.page || '');
    setQuoteValue('tags', quote.tags?.join(', ') || '');
  };

  const handleEditTakeaway = (takeaway: BookTakeaway) => {
    setSelectedTakeaway(takeaway);
    setIsEditing(true);
    setShowTakeawayForm(true);
    setTakeawayValue('takeaway_text', takeaway.takeaway_text);
  };

  const handleEditGoal = (goal: ReadingGoal) => {
    setSelectedGoal(goal);
    setIsEditing(true);
    setShowGoalForm(true);
    setGoalValue('goal_type', goal.goal_type);
    setGoalValue('target_value', goal.target_value);
    setGoalValue('category', goal.category || '');
    setGoalValue('period_start', goal.period_start || '');
    setGoalValue('period_end', goal.period_end || '');
    setGoalValue('status', goal.status);
  };

  const onBookSubmit = (data: BookForm) => {
    // Clean up the data - only send non-empty values for optional fields
    const cleanedData: any = {
      title: data.title.trim(),
      status: data.status,
    };
    
    // Only include optional fields if they have values
    if (data.author && data.author.trim()) cleanedData.author = data.author.trim();
    if (data.category && data.category.trim()) cleanedData.category = data.category.trim();
    if (data.priority) cleanedData.priority = data.priority;
    if (data.why_i_want_to_read && data.why_i_want_to_read.trim()) cleanedData.why_i_want_to_read = data.why_i_want_to_read.trim();
    if (data.start_date) cleanedData.start_date = data.start_date;
    if (data.finish_date) cleanedData.finish_date = data.finish_date;
    if (data.progress !== undefined && data.progress > 0) cleanedData.progress = data.progress;
    if (data.reading_cadence) cleanedData.reading_cadence = data.reading_cadence;
    if (data.rating !== undefined && data.rating > 0) cleanedData.rating = data.rating;
    if (data.would_reread !== undefined) cleanedData.would_reread = data.would_reread;
    
    if (isEditing && selectedBook) {
      updateBookMutation.mutate({ id: selectedBook.id, data: cleanedData });
    } else {
      createBookMutation.mutate(cleanedData);
    }
  };

  const onNoteSubmit = (data: BookNoteForm) => {
    if (!selectedBook) {
      alert('Please select a book first');
      return;
    }
    if (isEditing && selectedNote) {
      updateNoteMutation.mutate({ id: selectedNote.id, data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const onQuoteSubmit = (data: BookQuoteForm) => {
    if (!selectedBook) {
      alert('Please select a book first');
      return;
    }
    if (isEditing && selectedQuote) {
      updateQuoteMutation.mutate({ id: selectedQuote.id, data });
    } else {
      createQuoteMutation.mutate(data);
    }
  };

  const onTakeawaySubmit = (data: BookTakeawayForm) => {
    if (!selectedBook) {
      alert('Please select a book first');
      return;
    }
    if (isEditing && selectedTakeaway) {
      updateTakeawayMutation.mutate({ id: selectedTakeaway.id, data });
    } else {
      createTakeawayMutation.mutate(data);
    }
  };

  const onGoalSubmit = (data: ReadingGoalForm) => {
    if (isEditing && selectedGoal) {
      updateGoalMutation.mutate({ id: selectedGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  // Dashboard calculations
  const activeGoal = useMemo(() => {
    if (!goals) return null;
    return goals.find((g: ReadingGoal) => g.status === 'active' && g.goal_type === 'books_per_year');
  }, [goals]);

  const favoriteQuotes = useMemo(() => {
    if (!quotes) return [];
    return quotes.slice(0, 3);
  }, [quotes]);

  return (
    <div className="books">
      <div className="page-header">
        <h1>📚 Books</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setViewMode('dashboard')} className={`view-mode-btn ${viewMode === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
            <button onClick={() => setViewMode('reading_list')} className={`view-mode-btn ${viewMode === 'reading_list' ? 'active' : ''}`}>Reading List</button>
            <button onClick={() => setViewMode('currently_reading')} className={`view-mode-btn ${viewMode === 'currently_reading' ? 'active' : ''}`}>Currently Reading</button>
            <button onClick={() => setViewMode('completed')} className={`view-mode-btn ${viewMode === 'completed' ? 'active' : ''}`}>Completed</button>
            <button onClick={() => setViewMode('notes')} className={`view-mode-btn ${viewMode === 'notes' ? 'active' : ''}`}>Notes</button>
            <button onClick={() => setViewMode('quotes')} className={`view-mode-btn ${viewMode === 'quotes' ? 'active' : ''}`}>Quotes</button>
            <button onClick={() => setViewMode('takeaways')} className={`view-mode-btn ${viewMode === 'takeaways' ? 'active' : ''}`}>Takeaways</button>
            <button onClick={() => setViewMode('goals')} className={`view-mode-btn ${viewMode === 'goals' ? 'active' : ''}`}>Goals</button>
          </div>
          {viewMode === 'reading_list' && <button onClick={() => { setShowBookForm(true); setIsEditing(false); setSelectedBook(null); resetBook(); setBookValue('status', 'reading_list'); }} className="btn-primary">+ Add Book</button>}
          {viewMode === 'currently_reading' && <button onClick={() => { setShowBookForm(true); setIsEditing(false); setSelectedBook(null); resetBook(); setBookValue('status', 'currently_reading'); }} className="btn-primary">+ Start Reading</button>}
          {viewMode === 'completed' && <button onClick={() => { setShowBookForm(true); setIsEditing(false); setSelectedBook(null); resetBook(); setBookValue('status', 'completed'); }} className="btn-primary">+ Mark Complete</button>}
          {viewMode === 'notes' && selectedBook && <button onClick={() => { setShowNoteForm(true); setIsEditing(false); setSelectedNote(null); resetNote(); }} className="btn-primary">+ Add Note</button>}
          {viewMode === 'quotes' && selectedBook && <button onClick={() => { setShowQuoteForm(true); setIsEditing(false); setSelectedQuote(null); resetQuote(); }} className="btn-primary">+ Add Quote</button>}
          {viewMode === 'takeaways' && selectedBook && <button onClick={() => { setShowTakeawayForm(true); setIsEditing(false); setSelectedTakeaway(null); resetTakeaway(); }} className="btn-primary">+ Add Takeaway</button>}
          {viewMode === 'goals' && <button onClick={() => { setShowGoalForm(true); setIsEditing(false); setSelectedGoal(null); resetGoal(); }} className="btn-primary">+ New Goal</button>}
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="books-dashboard">
          {/* Currently Reading */}
          <div className="dashboard-section">
            <h2>Currently Reading</h2>
            {currentlyReadingLoading ? (
              <LoadingSpinner size="small" />
            ) : currentlyReading && currentlyReading.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {currentlyReading.slice(0, 3).map((book) => (
                  <div key={book.id} style={{ fontSize: '0.875rem', color: '#666' }}>
                    • {book.title} {book.author && `by ${book.author}`}
                    {book.progress !== null && ` (${book.progress}%)`}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No books currently being read</p>
            )}
          </div>

          {/* Reading Goal */}
          <div className="dashboard-section">
            <h2>Reading Goal</h2>
            {goalsLoading ? (
              <LoadingSpinner size="small" />
            ) : activeGoal ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  {activeGoal.target_value} books this year
                </p>
                <div style={{ marginTop: '0.5rem', background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: '#3b82f6',
                      height: '100%',
                      width: `${Math.min((activeGoal.current_value / activeGoal.target_value) * 100, 100)}%`,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Progress: {activeGoal.current_value} / {activeGoal.target_value}
                </p>
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No active reading goal</p>
            )}
          </div>

          {/* Recently Completed */}
          <div className="dashboard-section">
            <h2>Recently Completed</h2>
            {completedBooksLoading ? (
              <LoadingSpinner size="small" />
            ) : completedBooks && completedBooks.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {completedBooks.slice(0, 3).map((book) => (
                  <div key={book.id} style={{ fontSize: '0.875rem', color: '#666' }}>
                    • {book.title} {book.author && `by ${book.author}`}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No completed books yet</p>
            )}
          </div>

          {/* Favorite Quotes */}
          <div className="dashboard-section">
            <h2>Favorite Quotes</h2>
            {quotesLoading ? (
              <LoadingSpinner size="small" />
            ) : favoriteQuotes.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {favoriteQuotes.map((quote) => (
                  <div key={quote.id} style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px', fontStyle: 'italic', color: '#666', fontSize: '0.875rem' }}>
                    "{quote.quote_text.substring(0, 100)}..."
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No quotes yet</p>
            )}
          </div>
        </div>
      )}

      {/* Reading List View */}
      {viewMode === 'reading_list' && (
        <>
          {showBookForm && (
            <form onSubmit={handleBookSubmit(onBookSubmit)} className="books-form">
              <h3>{isEditing ? 'Edit Book' : 'Add to Reading List'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerBook('title', { required: true })} placeholder="Book title" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Author</label>
                  <input type="text" {...registerBook('author')} placeholder="Author name" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" {...registerBook('category')} placeholder="e.g., career, spiritual, finance, fiction" />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select {...registerBook('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Why I Want to Read This</label>
                <textarea rows={3} {...registerBook('why_i_want_to_read')} placeholder="Optional reason for wanting to read" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createBookMutation.isPending || updateBookMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Book
                </button>
                <button type="button" onClick={() => { setShowBookForm(false); setIsEditing(false); setSelectedBook(null); resetBook(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {readingListLoading ? (
            <LoadingSpinner message="Loading reading list..." size="large" />
          ) : readingList && readingList.length > 0 ? (
            <div className="books-list">
              {readingList.map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-header">
                    <div>
                      <h3>{book.title}</h3>
                      {book.author && <p style={{ fontSize: '0.875rem', color: '#666' }}>by {book.author}</p>}
                      {book.category && <span style={{ fontSize: '0.75rem', color: '#999' }}>{book.category}</span>}
                      {book.priority && <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>• {book.priority}</span>}
                    </div>
                  </div>
                  {book.why_i_want_to_read && (
                    <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>{book.why_i_want_to_read}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditBook(book)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteBookMutation.mutate(book.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📚" title="No books in reading list" message="Add books you want to read." actionLabel="Add Book" onAction={() => { setShowBookForm(true); setIsEditing(false); setSelectedBook(null); resetBook(); setBookValue('status', 'reading_list'); }} />
          )}
        </>
      )}

      {/* Currently Reading View */}
      {viewMode === 'currently_reading' && (
        <>
          {showBookForm && (
            <form onSubmit={handleBookSubmit(onBookSubmit)} className="books-form">
              <h3>{isEditing ? 'Edit Book' : 'Start Reading'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerBook('title', { required: true })} placeholder="Book title" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Author</label>
                  <input type="text" {...registerBook('author')} placeholder="Author name" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" {...registerBook('category')} placeholder="e.g., career, spiritual, finance" />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" {...registerBook('start_date')} />
                </div>
                <div className="form-group">
                  <label>Progress (%)</label>
                  <input type="number" min="0" max="100" {...registerBook('progress')} />
                </div>
                <div className="form-group">
                  <label>Reading Cadence</label>
                  <select {...registerBook('reading_cadence')}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createBookMutation.isPending || updateBookMutation.isPending}>
                  {isEditing ? 'Update' : 'Start'} Reading
                </button>
                <button type="button" onClick={() => { setShowBookForm(false); setIsEditing(false); setSelectedBook(null); resetBook(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {currentlyReadingLoading ? (
            <LoadingSpinner message="Loading currently reading..." size="large" />
          ) : currentlyReading && currentlyReading.length > 0 ? (
            <div className="books-list">
              {currentlyReading.map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-header">
                    <div>
                      <h3>{book.title}</h3>
                      {book.author && <p style={{ fontSize: '0.875rem', color: '#666' }}>by {book.author}</p>}
                    </div>
                  </div>
                  {book.progress !== null && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#3b82f6', height: '100%', width: `${book.progress}%`, transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>{book.progress}% complete</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditBook(book)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteBookMutation.mutate(book.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📖" title="No books currently being read" message="Start reading a book to track your progress." actionLabel="Start Reading" onAction={() => { setShowBookForm(true); setIsEditing(false); setSelectedBook(null); resetBook(); setBookValue('status', 'currently_reading'); }} />
          )}
        </>
      )}

      {/* Completed Books View */}
      {viewMode === 'completed' && (
        <>
          {showBookForm && (
            <form onSubmit={handleBookSubmit(onBookSubmit)} className="books-form">
              <h3>{isEditing ? 'Edit Book' : 'Mark as Complete'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerBook('title', { required: true })} placeholder="Book title" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Author</label>
                  <input type="text" {...registerBook('author')} placeholder="Author name" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" {...registerBook('category')} placeholder="e.g., career, spiritual, finance" />
                </div>
                <div className="form-group">
                  <label>Finish Date</label>
                  <input type="date" {...registerBook('finish_date')} />
                </div>
                <div className="form-group">
                  <label>Rating (1-5)</label>
                  <input type="number" min="1" max="5" {...registerBook('rating')} />
                </div>
                <div className="form-group">
                  <label>Would Reread?</label>
                  <select {...registerBook('would_reread')}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createBookMutation.isPending || updateBookMutation.isPending}>
                  {isEditing ? 'Update' : 'Mark'} Complete
                </button>
                <button type="button" onClick={() => { setShowBookForm(false); setIsEditing(false); setSelectedBook(null); resetBook(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {completedBooksLoading ? (
            <LoadingSpinner message="Loading completed books..." size="large" />
          ) : completedBooks && completedBooks.length > 0 ? (
            <div className="books-list">
              {completedBooks.map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-header">
                    <div>
                      <h3>{book.title}</h3>
                      {book.author && <p style={{ fontSize: '0.875rem', color: '#666' }}>by {book.author}</p>}
                      {book.finish_date && <span style={{ fontSize: '0.75rem', color: '#999' }}>Finished: {new Date(book.finish_date).toLocaleDateString()}</span>}
                      {book.rating && <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>• ⭐ {book.rating}/5</span>}
                      {book.would_reread && <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>• Would reread</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => { setSelectedBook(book); setViewMode('notes'); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>View Notes</button>
                    <button onClick={() => { setSelectedBook(book); setViewMode('quotes'); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>View Quotes</button>
                    <button onClick={() => { setSelectedBook(book); setViewMode('takeaways'); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>View Takeaways</button>
                    <button onClick={() => handleEditBook(book)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteBookMutation.mutate(book.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="✅" title="No completed books yet" message="Mark books as complete when you finish reading them." actionLabel="Mark Complete" onAction={() => { setShowBookForm(true); setIsEditing(false); setSelectedBook(null); resetBook(); setBookValue('status', 'completed'); }} />
          )}
        </>
      )}

      {/* Notes View */}
      {viewMode === 'notes' && (
        <>
          {!selectedBook && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Please select a book from the Completed section to view notes.</p>
            </div>
          )}
          {selectedBook && (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Notes for: {selectedBook.title}</h3>
                <button onClick={() => setSelectedBook(null)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>Change Book</button>
              </div>
              {showNoteForm && (
                <form onSubmit={handleNoteSubmit(onNoteSubmit)} className="books-form">
                  <h3>{isEditing ? 'Edit Note' : 'Add Note'}</h3>
                  <div className="form-group">
                    <label>Note Text *</label>
                    <textarea rows={6} {...registerNote('note_text', { required: true })} placeholder="Your note or highlight" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Page/Location</label>
                      <input type="text" {...registerNote('page_location')} placeholder="e.g., page 42, chapter 3" />
                    </div>
                    <div className="form-group">
                      <label>Tags (comma-separated)</label>
                      <input type="text" {...registerNote('tags')} placeholder="career, mindset, faith" />
                    </div>
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
                <LoadingSpinner message="Loading notes..." size="large" />
              ) : notes && notes.length > 0 ? (
                <div className="notes-list">
                  {notes.map((note) => (
                    <div key={note.id} className="note-card">
                      <p style={{ color: '#666' }}>{note.note_text}</p>
                      {note.page_location && <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>📍 {note.page_location}</p>}
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
                <EmptyState icon="📝" title="No notes yet" message="Add notes and highlights for this book." actionLabel="Add Note" onAction={() => { setShowNoteForm(true); setIsEditing(false); setSelectedNote(null); resetNote(); }} />
              )}
            </>
          )}
        </>
      )}

      {/* Quotes View */}
      {viewMode === 'quotes' && (
        <>
          {!selectedBook && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Please select a book from the Completed section to view quotes.</p>
            </div>
          )}
          {selectedBook && (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Quotes from: {selectedBook.title}</h3>
                <button onClick={() => setSelectedBook(null)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>Change Book</button>
              </div>
              {showQuoteForm && (
                <form onSubmit={handleQuoteSubmit(onQuoteSubmit)} className="books-form">
                  <h3>{isEditing ? 'Edit Quote' : 'Add Quote'}</h3>
                  <div className="form-group">
                    <label>Quote Text *</label>
                    <textarea rows={4} {...registerQuote('quote_text', { required: true })} placeholder="Quote text" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Page</label>
                      <input type="text" {...registerQuote('page')} placeholder="Page number" />
                    </div>
                    <div className="form-group">
                      <label>Tags (comma-separated)</label>
                      <input type="text" {...registerQuote('tags')} placeholder="career, mindset, faith" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary" disabled={createQuoteMutation.isPending || updateQuoteMutation.isPending}>
                      {isEditing ? 'Update' : 'Add'} Quote
                    </button>
                    <button type="button" onClick={() => { setShowQuoteForm(false); setIsEditing(false); setSelectedQuote(null); resetQuote(); }} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              )}

              {quotesLoading ? (
                <LoadingSpinner message="Loading quotes..." size="large" />
              ) : quotes && quotes.length > 0 ? (
                <div className="quotes-list">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="quote-card">
                      <p style={{ fontStyle: 'italic', color: '#666', fontSize: '1rem' }}>"{quote.quote_text}"</p>
                      {quote.page && <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>📍 Page {quote.page}</p>}
                      {quote.tags && quote.tags.length > 0 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                          <strong>Tags:</strong> {quote.tags.join(', ')}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button onClick={() => handleEditQuote(quote)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                        <button onClick={() => { if (confirm('Are you sure?')) deleteQuoteMutation.mutate(quote.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="💬" title="No quotes yet" message="Save quotes that resonate with you." actionLabel="Add Quote" onAction={() => { setShowQuoteForm(true); setIsEditing(false); setSelectedQuote(null); resetQuote(); }} />
              )}
            </>
          )}
        </>
      )}

      {/* Takeaways View */}
      {viewMode === 'takeaways' && (
        <>
          {!selectedBook && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Please select a book from the Completed section to view takeaways.</p>
            </div>
          )}
          {selectedBook && (
            <>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Takeaways from: {selectedBook.title}</h3>
                <button onClick={() => setSelectedBook(null)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>Change Book</button>
              </div>
              {showTakeawayForm && (
                <form onSubmit={handleTakeawaySubmit(onTakeawaySubmit)} className="books-form">
                  <h3>{isEditing ? 'Edit Takeaway' : 'Add Takeaway'}</h3>
                  <div className="form-group">
                    <label>Takeaway *</label>
                    <textarea rows={3} {...registerTakeaway('takeaway_text', { required: true })} placeholder="Short, reflective insight" />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary" disabled={createTakeawayMutation.isPending || updateTakeawayMutation.isPending}>
                      {isEditing ? 'Update' : 'Add'} Takeaway
                    </button>
                    <button type="button" onClick={() => { setShowTakeawayForm(false); setIsEditing(false); setSelectedTakeaway(null); resetTakeaway(); }} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              )}

              {takeawaysLoading ? (
                <LoadingSpinner message="Loading takeaways..." size="large" />
              ) : takeaways && takeaways.length > 0 ? (
                <div className="takeaways-list">
                  {takeaways.map((takeaway) => (
                    <div key={takeaway.id} className="takeaway-card">
                      <p style={{ color: '#666' }}>• {takeaway.takeaway_text}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button onClick={() => handleEditTakeaway(takeaway)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                        <button onClick={() => { if (confirm('Are you sure?')) deleteTakeawayMutation.mutate(takeaway.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="💡" title="No takeaways yet" message="Capture key insights from this book." actionLabel="Add Takeaway" onAction={() => { setShowTakeawayForm(true); setIsEditing(false); setSelectedTakeaway(null); resetTakeaway(); }} />
              )}
            </>
          )}
        </>
      )}

      {/* Goals View */}
      {viewMode === 'goals' && (
        <>
          {showGoalForm && (
            <form onSubmit={handleGoalSubmit(onGoalSubmit)} className="books-form">
              <h3>{isEditing ? 'Edit Goal' : 'New Reading Goal'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Goal Type *</label>
                  <select {...registerGoal('goal_type', { required: true })}>
                    <option value="books_per_year">Books Per Year</option>
                    <option value="books_per_month">Books Per Month</option>
                    <option value="category_goal">Category Goal</option>
                    <option value="streak">Streak</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Value *</label>
                  <input type="number" min="1" {...registerGoal('target_value', { required: true })} />
                </div>
                <div className="form-group">
                  <label>Category (for category goals)</label>
                  <input type="text" {...registerGoal('category')} placeholder="e.g., career, spiritual" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select {...registerGoal('status')}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Period Start</label>
                  <input type="date" {...registerGoal('period_start')} />
                </div>
                <div className="form-group">
                  <label>Period End</label>
                  <input type="date" {...registerGoal('period_end')} />
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
            <LoadingSpinner message="Loading goals..." size="large" />
          ) : goals && goals.length > 0 ? (
            <div className="goals-list">
              {goals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  <div className="goal-header">
                    <div>
                      <h3>{goal.goal_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
                      {goal.category && <p style={{ fontSize: '0.875rem', color: '#666' }}>Category: {goal.category}</p>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#999', padding: '0.25rem 0.5rem', background: goal.status === 'active' ? '#d1fae5' : goal.status === 'completed' ? '#dbeafe' : '#fee2e2', borderRadius: '4px' }}>
                      {goal.status}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                      Target: {goal.target_value} • Current: {goal.current_value}
                    </p>
                    <div style={{ marginTop: '0.5rem', background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: '#3b82f6',
                          height: '100%',
                          width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%`,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditGoal(goal)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteGoalMutation.mutate(goal.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🎯" title="No reading goals yet" message="Set reading goals to stay intentional." actionLabel="New Goal" onAction={() => { setShowGoalForm(true); setIsEditing(false); setSelectedGoal(null); resetGoal(); }} />
          )}
        </>
      )}
    </div>
  );
};

export default Books;
