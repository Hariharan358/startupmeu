import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Flag,
  CircleDot,
} from 'lucide-react';
import { fetchTask, deleteTask, updateTaskStatus } from '@/lib/tasks';
import type { Task, TaskStatus } from '@/types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_STYLES,
  PRIORITY_STYLES,
  formatDate,
  formatRelative,
  isOverdue,
} from '@/lib/format';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchTask(id as string);
        if (cancelled) return;
        if (!data) {
          setError('Task not found.');
          setTask(null);
        } else {
          setTask(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load task');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      navigate('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || task.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateTaskStatus(task.id, newStatus);
      setTask(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorMessage message={error} />
        <Link
          to="/tasks"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                >
                  {STATUS_LABELS[task.status]}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                >
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/tasks/${task.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description ? (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-600">{task.description}</p>
            </div>
          ) : (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-400 italic">No description provided</p>
            </div>
          )}

          {/* Meta */}
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Calendar className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Due Date</p>
                <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {task.due_date ? formatDate(task.due_date) : 'Not set'}
                  {overdue && ' (overdue)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatRelative(task.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Flag className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Priority</p>
                <p className="text-sm font-medium text-gray-900">{PRIORITY_LABELS[task.priority]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <CircleDot className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">{formatRelative(task.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Status changer */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Change Status</h2>
            <div className="flex flex-wrap gap-2">
              {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={updatingStatus || task.status === s}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    task.status === s
                      ? `${STATUS_STYLES[s]} cursor-default`
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </div>
  );
}
