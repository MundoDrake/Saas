// =============================================================================
// Database Types — Studio Manager
// =============================================================================

// -----------------------------------------------------------------------------
// Enums (matching database enums)
// -----------------------------------------------------------------------------
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DeadlineStatus = 'pending' | 'completed' | 'overdue';
export type FinancialType = 'income' | 'expense';
export type FinancialStatus = 'pending' | 'paid' | 'cancelled';
export type ExpenseCategory = 'operational' | 'personnel' | 'software' | 'marketing' | 'other';
export type AssetCategory = 'logo' | 'font' | 'palette' | 'icon' | 'photo' | 'other';
export type NarrativeType = 'briefing' | 'manifesto' | 'golden_circle' | 'other';

// Bio-Tracking Types
export type BioCategoria = string; // Dynamic categories from database
export type EnergyLevel = 1 | 2 | 3; // 1=Baixa, 2=Média, 3=Alta
export type SatisfactionLevel = 1 | 2 | 3; // 1=Negativo, 2=Neutro, 3=Positivo

// Time Category (from database)
export interface TimeCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    user_id: string | null;
    is_default: boolean;
    created_at: string;
}

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------
export interface Role {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    created_at: string;
}

export interface Profile {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    role_id: string | null;
    role?: Role;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    name: string;
    trading_name: string | null;
    document_number: string | null;
    email: string | null;
    phone: string | null;
    address: Record<string, any>;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClientContact {
    id: string;
    client_id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    is_primary: boolean;
    created_at: string;
}

export interface Project {
    id: string;
    client_id: string;
    client?: Client;
    name: string;
    description: string | null;
    status: ProjectStatus;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    cover_image: string | null;
    nicho_mercado: string | null;
    briefing_inicial: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// Input type for quick project creation
export interface CreateProjectInput {
    name: string;
    client_id: string;
    nicho_mercado?: string;
    briefing_inicial?: string;
    template_id?: string;
}

export interface Task {
    id: string;
    project_id: string;
    project?: Project;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id: string | null;
    assignee?: Profile;
    due_date: string | null;
    estimated_hours: number | null;
    sort_order: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface TimeEntry {
    id: string;
    task_id: string | null;
    task?: Task;
    project_id: string;
    project?: Project;
    user_id: string;
    user?: Profile;
    date: string;
    hours: number;
    description: string | null;
    // Bio-tracking fields
    categoria: BioCategoria;
    energia: EnergyLevel | null;
    satisfacao: SatisfactionLevel | null;
    start_time: string;
    end_time: string | null;
    duration_minutes: number | null;
    created_at: string;
}

export interface ClientDeadline {
    id: string;
    client_id: string;
    client?: Client;
    project_id: string | null;
    project?: Project;
    title: string;
    description: string | null;
    due_date: string;
    status: DeadlineStatus;
    created_by: string | null;
    created_at: string;
}

export interface FinancialEntry {
    id: string;
    type: FinancialType;
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency: string;
    date: string;
    client_id: string | null;
    client?: Client;
    project_id: string | null;
    project?: Project;
    invoice_number: string | null;
    status: FinancialStatus;
    created_by: string | null;
    created_at: string;
}

export interface ClientDocument {
    id: string;
    client_id: string;
    name: string;
    description: string | null;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
    uploaded_by: string | null;
    created_at: string;
}

export interface BrandAsset {
    id: string;
    client_id: string;
    category: AssetCategory;
    name: string;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
    thumbnail_path: string | null;
    tags: string[];
    uploaded_by: string | null;
    created_at: string;
}

export interface BrandNarrative {
    id: string;
    client_id: string;
    type: NarrativeType;
    title: string;
    content: string | null;
    version: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// -----------------------------------------------------------------------------
// Form/Input Types (for creating/updating)
// -----------------------------------------------------------------------------
export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
export type ProjectInput = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'client'>;
export type TaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'project' | 'assignee'>;
export type TimeEntryInput = Omit<TimeEntry, 'id' | 'created_at' | 'task' | 'project' | 'user'>;
