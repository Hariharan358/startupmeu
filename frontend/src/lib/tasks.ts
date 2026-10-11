import api from './api';
import type { Task, TaskInput, TaskStatus, DashboardStats } from '@/types';

export async function fetchTasks(params?: {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: string | 'all';
  sortBy?: 'created_at' | 'due_date';
  sortOrder?: 'asc' | 'desc';
}): Promise<Task[]> {
  const { data } = await api.get('/tasks', { params });
  return data;
}

export async function fetchTask(id: string): Promise<Task | null> {
  const { data } = await api.get(`/tasks/${id}`);
  return data;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post('/tasks', input);
  return data;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.put(`/tasks/${id}`, input);
  return data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data } = await api.put(`/tasks/${id}`, { status });
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/tasks/stats');
  return data;
}

export async function fetchRecentTasks(limit = 5): Promise<Task[]> {
  const { data } = await api.get('/tasks/recent', { params: { limit } });
  return data;
}
