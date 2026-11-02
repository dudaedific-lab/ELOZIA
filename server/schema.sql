CREATE TABLE IF NOT EXISTS companies (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_name TEXT NOT NULL, tax_id TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS employees (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), name TEXT NOT NULL, email TEXT NOT NULL,
 job_title TEXT NOT NULL, department TEXT NOT NULL, unit TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','onboarding','away','inactive')),
 admission_date TEXT NOT NULL, work_start TEXT NOT NULL DEFAULT '08:00', work_end TEXT NOT NULL DEFAULT '17:00', break_minutes INTEGER NOT NULL DEFAULT 60,
 avatar_color TEXT NOT NULL DEFAULT '#dcebe1', created_at TEXT NOT NULL, UNIQUE(company_id,email)
);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), employee_id TEXT REFERENCES employees(id), name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','manager','employee')), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS punches (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), employee_id TEXT NOT NULL REFERENCES employees(id),
 kind TEXT NOT NULL CHECK(kind IN ('entry','break_start','break_end','exit')), occurred_at TEXT NOT NULL, day TEXT NOT NULL,
 receipt_number INTEGER NOT NULL, idempotency_key TEXT NOT NULL, origin TEXT NOT NULL DEFAULT 'web',
 previous_hash TEXT NOT NULL, integrity_hash TEXT NOT NULL, UNIQUE(employee_id,idempotency_key), UNIQUE(company_id,receipt_number)
);
CREATE TABLE IF NOT EXISTS requests (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), employee_id TEXT NOT NULL REFERENCES employees(id),
 kind TEXT NOT NULL CHECK(kind IN ('vacation','adjustment','document','registration','other')), title TEXT NOT NULL, description TEXT NOT NULL,
 start_date TEXT, end_date TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 decision_note TEXT, decided_by TEXT REFERENCES users(id), decided_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), employee_id TEXT REFERENCES employees(id),
 title TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('contract','identity','certificate','payslip','other')),
 file_name TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, content_hash TEXT NOT NULL,
 storage_key TEXT NOT NULL, expires_at TEXT, competence TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 uploaded_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), sender_id TEXT NOT NULL REFERENCES users(id),
 employee_id TEXT REFERENCES employees(id), title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS message_reads (
 message_id TEXT NOT NULL REFERENCES messages(id), user_id TEXT NOT NULL REFERENCES users(id), read_at TEXT NOT NULL, PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS document_reads (
 document_id TEXT NOT NULL REFERENCES documents(id), user_id TEXT NOT NULL REFERENCES users(id), read_at TEXT NOT NULL, PRIMARY KEY(document_id,user_id)
);
CREATE TABLE IF NOT EXISTS admissions (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), name TEXT NOT NULL, email TEXT NOT NULL,
 job_title TEXT NOT NULL, department TEXT NOT NULL, start_date TEXT NOT NULL,
 stage TEXT NOT NULL CHECK(stage IN ('invited','collecting','review','completed')), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), user_id TEXT REFERENCES users(id), actor_name TEXT NOT NULL,
 action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS employees_company ON employees(company_id,status);
CREATE INDEX IF NOT EXISTS punches_employee ON punches(company_id,employee_id,day);
CREATE INDEX IF NOT EXISTS requests_company ON requests(company_id,status);
CREATE INDEX IF NOT EXISTS documents_company ON documents(company_id,employee_id,category);
CREATE INDEX IF NOT EXISTS messages_company ON messages(company_id,employee_id,created_at);
CREATE INDEX IF NOT EXISTS audit_company ON audit_events(company_id,created_at);
CREATE TABLE IF NOT EXISTS time_adjustments (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id), employee_id TEXT NOT NULL REFERENCES employees(id),
 request_id TEXT NOT NULL UNIQUE REFERENCES requests(id), kind TEXT NOT NULL, occurred_at TEXT NOT NULL, day TEXT NOT NULL,
 approved_by TEXT NOT NULL REFERENCES users(id), reason TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admission_invitations (
 token_hash TEXT PRIMARY KEY, admission_id TEXT NOT NULL REFERENCES admissions(id), company_id TEXT NOT NULL REFERENCES companies(id),
 created_by TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, consumed_at TEXT, revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS admission_submissions (
 id TEXT PRIMARY KEY, admission_id TEXT NOT NULL UNIQUE REFERENCES admissions(id), company_id TEXT NOT NULL REFERENCES companies(id),
 phone TEXT NOT NULL, note TEXT NOT NULL, password_hash TEXT NOT NULL, submitted_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admission_documents (
 admission_id TEXT NOT NULL REFERENCES admissions(id), document_id TEXT NOT NULL REFERENCES documents(id), PRIMARY KEY(admission_id,document_id)
);
