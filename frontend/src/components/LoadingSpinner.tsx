import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <Loader2 className="animate-spin text-indigo-600" style={{ width: size, height: size }} />
    </div>
  );
}
