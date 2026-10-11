import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded p-0.5 text-red-600 transition-colors hover:bg-red-100"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
