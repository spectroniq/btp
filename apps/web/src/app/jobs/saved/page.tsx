'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import {
  Bookmark,
  MapPin,
  Building2,
  ExternalLink,
  BookmarkX,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function SavedJobsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => jobsApi.getSaved().then((r) => r.data),
  });

  const unsaveMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.unsave(jobId),
    onSuccess: () => refetch(),
  });

  const savedJobs = data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/jobs"
          className="flex items-center gap-1.5 text-white/30 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft size={15} />
          Back
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Saved Jobs</h1>
          <p className="text-white/40 text-sm mt-1">{savedJobs.length} saved</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-[#1B6CF2] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && savedJobs.length === 0 && (
        <div className="bg-[#141418] border border-white/5 rounded-xl p-12 text-center">
          <Bookmark size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No saved jobs yet.</p>
          <p className="text-white/20 text-xs mt-1">
            Browse jobs and save the ones you want to apply to.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-[#1B6CF2]/10 border border-[#1B6CF2]/20 text-[#1B6CF2] text-sm hover:bg-[#1B6CF2]/20 transition-all"
          >
            Browse Jobs
          </Link>
        </div>
      )}

      {/* Jobs */}
      <div className="grid gap-3">
        {savedJobs.map((item: any) => {
          const job = item.job;
          return (
            <div
              key={item.id}
              className="bg-[#141418] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[#F0A500]/10 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-[#F0A500]" />
                    </div>
                    <span className="text-white/40 text-sm">{job.company}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <MapPin size={11} />
                      {job.location}
                    </span>
                  </div>
                  <h3 className="text-white font-medium text-sm">
                    {job.title}
                  </h3>
                  {job.tags?.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {job.tags.slice(0, 4).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => unsaveMutation.mutate(job.id)}
                    className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]/60 hover:text-[#EF4444] transition-all"
                    title="Remove from saved"
                  >
                    <BookmarkX size={15} />
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
