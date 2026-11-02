export type Role = "admin" | "manager" | "employee";
export interface User {
  id: string;
  company_id: string;
  employee_id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Company {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
}
export interface Employee {
  id: string;
  name: string;
  email: string;
  job_title: string;
  department: string;
  unit: string;
  status: string;
  admission_date: string;
  avatar_color: string;
  work_start: string;
  work_end: string;
  break_minutes: number;
}
export interface Punch {
  id: string;
  employee_id: string;
  employee_name?: string;
  kind: string;
  occurred_at: string;
  day: string;
  receipt_number: number;
  integrity_hash: string;
}
export interface RequestItem {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  kind: string;
  title: string;
  description: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  decision_note: string | null;
  created_at: string;
}
export interface DocumentItem {
  id: string;
  employee_id: string;
  employee_name: string;
  title: string;
  category: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  expires_at: string | null;
  competence: string | null;
  status: string;
  created_at: string;
}
export interface Message {
  id: string;
  sender_id: string;
  employee_id: string | null;
  sender_name: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
export interface Admission {
  id: string;
  name: string;
  email: string;
  job_title: string;
  department: string;
  start_date: string;
  stage: string;
}
export interface AuditEvent {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  detail: string;
  created_at: string;
}
export interface Health {
  storage: string;
  demo: boolean;
  ai: boolean;
  officialTimekeeping: boolean;
}
export interface Data {
  employees: Employee[];
  punches: Punch[];
  requests: RequestItem[];
  documents: DocumentItem[];
  messages: Message[];
  admissions: Admission[];
  audit: AuditEvent[];
}
