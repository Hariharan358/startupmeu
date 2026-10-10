import { supabase } from './supabase';
import type { Task, TaskInput, TaskStatus, DashboardStats } from '@/types';

export async function fetchTasks(params?: {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: string | 'all';
  sortBy?: 'created_at' | 'due_date';
  sortOrder?: 'asc' | 'desc';
}): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .order(params?.sortBy ?? 'created_at', {
      ascending: (params?.sortOrder ?? 'desc') === 'asc',
    });

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params?.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function fetchTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Task | null;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.from('tasks').select('status');
  if (error) throw error;

  const tasks = data ?? [];
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, pending, inProgress, completed, completionRate };
}

export async function fetchRecentTasks(limit = 5): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Task[];
}
