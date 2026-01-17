-- Immigration Module Migration
-- Personal operations dashboard for immigration tracking: status timeline, documents, deadlines, case notes, milestones

-- Status Timeline table
CREATE TABLE IF NOT EXISTS status_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_type VARCHAR(255) NOT NULL, -- e.g., "F-1", "OPT", "H-1B", "Green Card"
    current_status VARCHAR(255) NOT NULL, -- e.g., "Active", "Pending", "Approved"
    start_date DATE NOT NULL,
    end_date DATE, -- Expiration date
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document Checklist table
CREATE TABLE IF NOT EXISTS document_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    required_for_stage VARCHAR(255), -- Which stage/status requires this document
    status VARCHAR(50) NOT NULL CHECK (status IN ('missing', 'uploaded', 'submitted')) DEFAULT 'missing',
    expiry_date DATE, -- If document has expiry
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deadlines & Reminders table
CREATE TABLE IF NOT EXISTS deadlines_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deadline_type VARCHAR(255) NOT NULL, -- e.g., "Filing Deadline", "Biometrics", "Renewal", "Travel Restriction"
    deadline_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case Notes table
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note_type VARCHAR(100), -- e.g., "Lawyer Advice", "Phone Call", "USCIS Update", "Personal Observation"
    title VARCHAR(255),
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Documents table (linked to Azure Blob Storage)
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(255) NOT NULL, -- e.g., "Passport", "I-20", "I-94", "Receipt", "Approval Notice"
    file_name VARCHAR(255) NOT NULL,
    blob_url TEXT NOT NULL, -- Azure Blob Storage URL
    linked_stage VARCHAR(255), -- Which stage/case this document is for
    uploaded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE, -- If document has expiry
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visa / Application Milestones table
CREATE TABLE IF NOT EXISTS visa_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_type VARCHAR(255) NOT NULL, -- e.g., "Filed", "Received", "Biometrics Completed", "Approved", "Denied"
    milestone_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    next_steps TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_timeline_user_id ON status_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_status_timeline_case_type ON status_timeline(case_type);
CREATE INDEX IF NOT EXISTS idx_status_timeline_current_status ON status_timeline(current_status);

CREATE INDEX IF NOT EXISTS idx_document_checklist_user_id ON document_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_document_checklist_status ON document_checklist(status);
CREATE INDEX IF NOT EXISTS idx_document_checklist_stage ON document_checklist(required_for_stage);

CREATE INDEX IF NOT EXISTS idx_deadlines_reminders_user_id ON deadlines_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_reminders_date ON deadlines_reminders(deadline_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_reminders_critical ON deadlines_reminders(is_critical);
CREATE INDEX IF NOT EXISTS idx_deadlines_reminders_completed ON deadlines_reminders(completed);

CREATE INDEX IF NOT EXISTS idx_case_notes_user_id ON case_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_date ON case_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_case_notes_type ON case_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_type ON uploaded_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_stage ON uploaded_documents(linked_stage);

CREATE INDEX IF NOT EXISTS idx_visa_milestones_user_id ON visa_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_visa_milestones_date ON visa_milestones(milestone_date);
CREATE INDEX IF NOT EXISTS idx_visa_milestones_type ON visa_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_visa_milestones_status ON visa_milestones(status);

-- Triggers for updated_at
CREATE TRIGGER update_status_timeline_updated_at BEFORE UPDATE ON status_timeline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_checklist_updated_at BEFORE UPDATE ON document_checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deadlines_reminders_updated_at BEFORE UPDATE ON deadlines_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON case_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploaded_documents_updated_at BEFORE UPDATE ON uploaded_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visa_milestones_updated_at BEFORE UPDATE ON visa_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE status_timeline IS 'Immigration status timeline tracking (case type, current status, dates)';
COMMENT ON TABLE document_checklist IS 'Document checklist for immigration requirements';
COMMENT ON TABLE deadlines_reminders IS 'Deadlines and reminders for immigration processes';
COMMENT ON TABLE case_notes IS 'Case notes (lawyer advice, phone calls, USCIS updates, personal observations)';
COMMENT ON TABLE uploaded_documents IS 'Uploaded documents linked to Azure Blob Storage';
COMMENT ON TABLE visa_milestones IS 'Visa/application milestones tracking (filed, received, approved, etc.)';
