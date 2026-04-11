'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader } from 'lucide-react';
import { applyToJob } from '@/lib/jobApplicationApi';

interface ApplyJobButtonProps {
  jobId: string;
  onApplySuccess?: () => void;
  onApplyError?: (error: string) => void;
  isAlreadyApplied?: boolean;
}

export default function ApplyJobButton({
  jobId,
  onApplySuccess,
  onApplyError,
  isAlreadyApplied = false,
}: ApplyJobButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(isAlreadyApplied);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (hasApplied) return;

    setIsLoading(true);
    setError(null);

    try {
      await applyToJob(jobId);
      setHasApplied(true);

      if (onApplySuccess) {
        onApplySuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply to job';
      setError(errorMessage);

      if (onApplyError) {
        onApplyError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (hasApplied) {
    return (
      <Button
        disabled
        className="w-full bg-green-600 hover:bg-green-600 text-white"
        size="sm"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Applied
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Applying...
          </>
        ) : (
          'Apply Now'
        )}
      </Button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
