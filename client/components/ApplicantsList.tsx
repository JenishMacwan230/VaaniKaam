'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';
import { maskPhoneNumber } from '@/lib/phoneMasking';
import { updateApplicationStatus } from '@/lib/jobApplicationApi';

interface Applicant {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  proficiency?: string;
  location?: string;
  status?: 'applied' | 'accepted' | 'rejected';
  createdAt?: string;
}

interface ApplicantsListProps {
  applicants: Applicant[];
  jobTitle?: string;
  applicationIds?: Record<string, string>; // Map of applicant ID to application ID
  onStatusUpdate?: () => void;
}

interface RevealedPhone {
  [key: string]: boolean;
}

export default function ApplicantsList({
  applicants,
  jobTitle = 'Job',
  applicationIds = {},
  onStatusUpdate,
}: ApplicantsListProps) {
  const [revealedPhones, setRevealedPhones] = useState<RevealedPhone>({});
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, string>>({});

  const togglePhoneReveal = (applicantId: string) => {
    setRevealedPhones((prev) => ({
      ...prev,
      [applicantId]: !prev[applicantId],
    }));
  };

  const handleStatusUpdate = async (
    applicantId: string,
    action: 'accept' | 'reject'
  ) => {
    const applicationId = applicationIds[applicantId];

    if (!applicationId) {
      setError('Application ID not found');
      return;
    }

    setLoadingActions((prev) => {
      const newSet = new Set(prev);
      newSet.add(applicantId);
      return newSet;
    });

    try {
      await updateApplicationStatus(applicationId, action);

      setActionResults((prev) => ({
        ...prev,
        [applicantId]: action === 'accept' ? 'accepted' : 'rejected',
      }));

      if (onStatusUpdate) {
        onStatusUpdate();
      }

      // Clear result after 3 seconds
      setTimeout(() => {
        setActionResults((prev) => {
          const newResults = { ...prev };
          delete newResults[applicantId];
          return newResults;
        });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicantId);
        return newSet;
      });
    }
  };

  if (!applicants || applicants.length === 0) {
    return (
      <Card className="border-dashed border-slate-300">
        <CardContent className="p-6 text-center text-sm text-slate-600">
          No applicants yet for this job
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {applicants.map((applicant) => {
        const isRevealed = revealedPhones[applicant._id];
        const isLoading = loadingActions.has(applicant._id);
        const actionResult = actionResults[applicant._id];
        const statusColor =
          actionResult === 'accepted'
            ? 'bg-green-100 text-green-700'
            : actionResult === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700';

        return (
          <Card key={applicant._id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Applicant Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {applicant.name}
                    </h3>

                    {applicant.proficiency && (
                      <p className="text-xs text-slate-600 mt-1">
                        {applicant.proficiency}
                      </p>
                    )}

                    {applicant.location && (
                      <p className="text-xs text-slate-500 mt-1">
                        📍 {applicant.location}
                      </p>
                    )}
                  </div>

                  {applicant.status && (
                    <Badge
                      variant="outline"
                      className={`flex-shrink-0 ${
                        applicant.status === 'accepted'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : applicant.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {applicant.status.charAt(0).toUpperCase() +
                        applicant.status.slice(1)}
                    </Badge>
                  )}
                </div>

                {/* Phone Number Section */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-1">Phone</p>
                      <p className="text-sm font-mono">
                        {isRevealed ? applicant.phone : maskPhoneNumber(applicant.phone)}
                      </p>
                    </div>

                    <Button
                      onClick={() => togglePhoneReveal(applicant._id)}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {isRevealed ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {actionResult ? (
                    <div
                      className={`flex-1 flex items-center justify-center gap-2 rounded py-2 text-sm font-medium ${statusColor}`}
                    >
                      {actionResult === 'accepted' ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Accepted
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Rejected
                        </>
                      )}
                    </div>
                  ) : applicant.status === 'applied' ? (
                    <>
                      <Button
                        onClick={() =>
                          handleStatusUpdate(applicant._id, 'accept')
                        }
                        disabled={isLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() =>
                          handleStatusUpdate(applicant._id, 'reject')
                        }
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {applicant.status === 'accepted'
                        ? 'Accepted'
                        : 'Rejected'}
                    </Button>
                  )}
                </div>

                {applicant.createdAt && (
                  <p className="text-xs text-slate-500 text-right">
                    Applied on{' '}
                    {new Date(applicant.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
