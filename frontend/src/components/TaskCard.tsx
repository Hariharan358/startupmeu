import { Link } from 'react-router-dom';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import type { Task } from '@/types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_STYLES,
  PRIORITY_STYLES,
  formatDate,
  isOverdue,
} from '@/lib/format';

interface TaskCardProps {
  task: Task;
  onDelete: (task: Task) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {task.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(task)}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.due_date && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              overdue ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(task.due_date)}
            {overdue && <span className="ml-1 text-red-600">(overdue)</span>}
          </span>
        )}
      </div>
    </div>
  );
}
