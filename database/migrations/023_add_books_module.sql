-- Books Module Migration
-- Personal knowledge system for reading: reading list, currently reading, completed books, notes, quotes, takeaways, goals

-- Books table (reading list, currently reading, completed)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    category VARCHAR(100), -- career, spiritual, finance, fiction, etc.
    status VARCHAR(50) NOT NULL CHECK (status IN ('reading_list', 'currently_reading', 'completed')) DEFAULT 'reading_list',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    why_i_want_to_read TEXT, -- Optional reason for wanting to read
    start_date DATE, -- When started reading
    finish_date DATE, -- When finished reading
    progress INTEGER CHECK (progress >= 0 AND progress <= 100), -- Progress percentage
    reading_cadence VARCHAR(20) CHECK (reading_cadence IN ('daily', 'weekly')), -- Reading frequency
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Optional rating (1-5 stars)
    would_reread BOOLEAN, -- Would I reread this book?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Book Notes & Highlights table
CREATE TABLE IF NOT EXISTS book_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    page_location VARCHAR(50), -- Optional page/location reference
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Book Quotes table
CREATE TABLE IF NOT EXISTS book_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quote_text TEXT NOT NULL,
    page VARCHAR(50), -- Optional page reference
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Book Takeaways table (3-5 bullet insights per book)
CREATE TABLE IF NOT EXISTS book_takeaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    takeaway_text TEXT NOT NULL, -- Short, reflective insight
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reading Goals table
CREATE TABLE IF NOT EXISTS reading_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('books_per_year', 'books_per_month', 'category_goal', 'streak')),
    target_value INTEGER, -- Number of books or days
    current_value INTEGER DEFAULT 0,
    category VARCHAR(100), -- For category goals (e.g., "career", "spiritual")
    period_start DATE, -- Start date for the goal period
    period_end DATE, -- End date for the goal period
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_priority ON books(priority);

CREATE INDEX IF NOT EXISTS idx_book_notes_book_id ON book_notes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_notes_user_id ON book_notes(user_id);

CREATE INDEX IF NOT EXISTS idx_book_quotes_book_id ON book_quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_quotes_user_id ON book_quotes(user_id);

CREATE INDEX IF NOT EXISTS idx_book_takeaways_book_id ON book_takeaways(book_id);
CREATE INDEX IF NOT EXISTS idx_book_takeaways_user_id ON book_takeaways(user_id);

CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_status ON reading_goals(status);
CREATE INDEX IF NOT EXISTS idx_reading_goals_type ON reading_goals(goal_type);

-- Triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_notes_updated_at BEFORE UPDATE ON book_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_quotes_updated_at BEFORE UPDATE ON book_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_takeaways_updated_at BEFORE UPDATE ON book_takeaways
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_goals_updated_at BEFORE UPDATE ON reading_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE books IS 'Books: reading list, currently reading, and completed books';
COMMENT ON TABLE book_notes IS 'Notes and highlights from books';
COMMENT ON TABLE book_quotes IS 'Quotes from books';
COMMENT ON TABLE book_takeaways IS 'Key takeaways and insights from books';
COMMENT ON TABLE reading_goals IS 'Reading goals: books per year/month, category goals, streaks';
