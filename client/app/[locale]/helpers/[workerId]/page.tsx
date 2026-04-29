'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Phone,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Loader,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WorkerProfile {
  _id: string;
  name: string;
  profession: string;
  location: string;
  phone: string;
  profilePictureUrl?: string;
  averageRating: number;
  totalRatings: number;
  availability: boolean;
  latitude?: number;
  longitude?: number;
  skills?: string[];
  description?: string;
}

interface Rating {
  _id: string;
  score: number;
  review?: string;
  givenAt: string;
  givenBy?: {
    name: string;
    profilePictureUrl?: string;
  };
}

export default function WorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('helpers');
  const workerId = params?.workerId as string;

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkerProfile = async () => {
      try {
        setLoading(true);
        setError(null);

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

        // Fetch worker profile
        const workerRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${workerId}`,
          { headers, credentials: 'include' }
        );

        if (!workerRes.ok) {
          throw new Error('Failed to fetch worker profile');
        }

        const workerData = await workerRes.json();
        setWorker(workerData.user);

        // Fetch worker ratings
        const ratingsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/ratings/${workerId}`,
          { headers, credentials: 'include' }
        );

        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setRatings(ratingsData.ratings || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchWorkerProfile();
    }
  }, [workerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-muted-foreground">{t('findingTalent')}</p>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 py-12 px-4 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="font-semibold text-rose-900">{error || t('noWorkers')}</p>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              {t('back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-4 pt-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/20 overflow-hidden shadow-lg">
              <img
                src={worker.profilePictureUrl || '/logo.png'}
                alt={worker.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold">{worker.name}</h1>
              <p className="text-white/75 text-lg">{worker.profession}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  <span className="font-semibold">{worker.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-white/75">({worker.totalRatings} ratings)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Contact & Actions */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-foreground">{worker.location}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Status</p>
              <Badge
                variant={worker.availability ? 'default' : 'secondary'}
                className="w-fit"
              >
                {worker.availability ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </>
                ) : (
                  'Unavailable'
                )}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              asChild
            >
              <a href={`tel:${worker.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                const phoneNum = worker.phone.replace(/\D/g, '');
                window.open(`https://wa.me/${phoneNum}`, '_blank', 'noopener,noreferrer');
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>
        </div>

        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill, i) => (
                <Badge key={i} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {worker.description && (
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-muted-foreground leading-relaxed">{worker.description}</p>
          </div>
        )}

        {/* Ratings & Reviews */}
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            Ratings ({ratings.length})
          </h2>

          {ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating._id}
                  className="pb-4 border-b border-border/30 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {rating.givenBy?.name || 'Anonymous'}
                        </p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rating.score
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(rating.givenAt).toLocaleDateString()}
                    </p>
                  </div>
                  {rating.review && (
                    <p className="text-sm text-foreground leading-relaxed">
                      {rating.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No ratings yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
