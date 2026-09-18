-- ==============================================================================
-- NEXUS AI SDR - Database Schema (PostgreSQL)
-- ==============================================================================

-- Drop tables if they exist (for clean recreation)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS email_outputs CASCADE;
DROP TABLE IF EXISTS qualification_results CASCADE;
DROP TABLE IF EXISTS research_results CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Leads Table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    role VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    location VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_leads_contact_email ON leads(contact_email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_industry ON leads(industry);

-- 3. Research Results Table (Research Agent Output)
CREATE TABLE research_results (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    summary TEXT,
    company_overview TEXT,
    target_pain_points JSONB,
    key_decision_makers JSONB,
    technology_stack JSONB,
    growth_signals JSONB,
    sources JSONB,
    confidence_score FLOAT DEFAULT 0.85,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_results_lead_id ON research_results(lead_id);

-- 4. Qualification Results Table (Qualification Agent Output)
CREATE TABLE qualification_results (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    fit_category VARCHAR(50) NOT NULL,
    reasoning TEXT NOT NULL,
    positive_signals JSONB,
    negative_signals JSONB,
    icp_fit_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qualification_results_lead_id ON qualification_results(lead_id);
CREATE INDEX idx_qualification_results_score ON qualification_results(score);

-- 5. Email Outputs Table (Email Agent Output)
CREATE TABLE email_outputs (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    follow_up_subject VARCHAR(255),
    follow_up_body TEXT,
    personalization_rationale TEXT,
    tone VARCHAR(50) DEFAULT 'professional_concise',
    metadata_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_outputs_lead_id ON email_outputs(lead_id);

-- 6. Activities Table (Audit & Pipeline Event Trail)
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    agent_name VARCHAR(50),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
