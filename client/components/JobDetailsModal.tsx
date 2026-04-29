'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, IndianRupee, User, Calendar, AlertCircle, CheckCircle, Clock, MessageCircle, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface JobDetailsModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title: string;
    location?: string;
    pricingAmount?: number | string;
    pricingType?: string;
    status: string;
    postedBy?: { name: string; phone?: string; averageRating?: number };
    createdAt?: string;
  };
}

interface FullJobDetails {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  category?: string;
  pricingAmount?: number | string;
  pricingType?: string;
  status?: string;
  postedBy?: {
    _id: string;
    name: string;
    phone?: string;
    averageRating?: number;
    totalRatings?: number;
    profilePicture?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  estimatedDuration?: string;
  skills?: string[];
}

export default function JobDetailsModal({
  jobId,
  isOpen,
  onClose,
  initialData,
}: JobDetailsModalProps) {
  const t = useTranslations('workerDashboard');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<FullJobDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('firebaseToken') || localStorage.getItem('token')
            : null;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`,
          { headers, credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }

        const data = await response.json();
        setDetails(data.job || data.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, jobId]);

  const display = details || initialData;
  const toNum = (v: number | string | undefined): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const p = parseFloat(v);
      return isFinite(p) ? p : 0;
    }
    return 0;
  };

  const fmt = (amount: number | string | undefined, type?: string) => {
    const n = toNum(amount);
    return n > 0 ? `₹${n.toLocaleString()}/${type || 'job'}` : 'POA';
  };

  const getPhone = () => {
    return display?.postedBy?.phone || (display as any)?.contractorPhone || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end md:items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="relative w-full max-w-md rounded-2xl bg-background shadow-xl md:shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{t('jobDetails') || 'Job Details'}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-accent"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loading && !display ? (
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="space-y-2 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : display ? (
              <div className="space-y-3 text-sm">
                {/* Location */}
                {display.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{display.location}</span>
                  </div>
                )}

                {/* Category & Pay Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {display.category && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Category</p>
                      <p className="font-medium">{display.category}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Pay</p>
                    <p className="font-medium">{fmt(display.pricingAmount, display.pricingType)}</p>
                  </div>
                </div>

                {/* Distance & Urgency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Distance</p>
                    <p>N/A</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Urgency</p>
                    <p>Flexible</p>
                  </div>
                </div>

                {/* Timing & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Timing</p>
                    <p>{display.createdAt ? 'Today' : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Duration</p>
                    <p>{display.estimatedDuration || '1 Days'}</p>
                  </div>
                </div>

                {/* Posted By & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Posted by</p>
                    <p className="font-medium">{display.postedBy?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                    <p>{display.postedBy?.phone ? 'Available' : 'N/A'}</p>
                  </div>
                </div>

                {/* Phone Number */}
                {getPhone() && (
                  <div className="bg-accent/50 rounded-lg p-3 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Contact</p>
                      <p className="font-medium text-foreground">{getPhone()}</p>
                    </div>
                  </div>
                )}

                {/* About this job */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">About this job</p>
                  <p className="text-xs text-foreground">{display.description || 'No description was provided for this job.'}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex gap-2">
            {getPhone() && (
              <Button 
                onClick={() => {
                  const phone = getPhone();
                  if (phone) {
                    window.location.href = `https://wa.me/${phone.replace(/\D/g, '')}`;
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            )}
            <Button onClick={onClose} className="flex-1" variant="outline">
              {t('close') || 'Close'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
