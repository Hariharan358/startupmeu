import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, X, ArrowUpDown } from 'lucide-react';
import { fetchTasks, deleteTask } from '@/lib/tasks';
import type { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/TaskCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ConfirmDialog from '@/components/ConfirmDialog';

type StatusFilter = TaskStatus | 'all';
type PriorityFilter = 'low' | 'medium' | 'high' | 'all';
type SortBy = 'created_at' | 'due_date';
type SortOrder = 'asc' | 'desc';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTasks({
        search: debouncedSearch || undefined,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const hasActiveFilters =
    search !== '' || statusFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <Link
          to="/tasks/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Link>
      </div>

      {/* Filters bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size={32} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Filter className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-900">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters
              ? 'Try adjusting or clearing your filters'
              : 'Create your first task to get started'}
          </p>
          {!hasActiveFilters && (
            <Link
              to="/tasks/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={setTaskToDelete} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setTaskToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
