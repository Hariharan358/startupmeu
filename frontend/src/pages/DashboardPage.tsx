import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  Clock,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { fetchDashboardStats, fetchRecentTasks } from '@/lib/tasks';
import type { DashboardStats, Task } from '@/types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_STYLES,
  PRIORITY_STYLES,
  formatRelative,
} from '@/lib/format';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [s, recent] = await Promise.all([fetchDashboardStats(), fetchRecentTasks(5)]);
        if (!cancelled) {
          setStats(s);
          setRecentTasks(recent);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Tasks',
      value: stats?.total ?? 0,
      icon: ListTodo,
      color: 'indigo',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    {
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'In Progress',
      value: stats?.inProgress ?? 0,
      icon: Loader2,
      color: 'blue',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Overview of your task activity</p>
        </div>
        <Link
          to="/tasks/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, bg, text }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-6 w-6 ${text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion rate */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Completion Rate</h2>
            <p className="text-sm text-gray-600">
              {stats?.completed ?? 0} of {stats?.total ?? 0} tasks completed
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{stats?.completionRate ?? 0}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${stats?.completionRate ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          <Link
            to="/tasks"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">No tasks yet. Create your first task to get started.</p>
            <Link
              to="/tasks/new"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:bg-gray-50 -mx-2 px-2 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{formatRelative(task.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span
                    className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
