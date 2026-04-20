'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import {
  Briefcase,
  MapPin,
  Building2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const FILTERS = [
  'All',
  'Software Engineer',
  'ML Engineer',
  'DevOps',
  'Backend',
  'Frontend',
];

export default function JobsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.getAll().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.save(jobId),
    onSuccess: (_, jobId) => {
      setSavedIds((prev) => new Set([...prev, jobId]));
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.unsave(jobId),
    onSuccess: (_, jobId) => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    },
  });
  const [scraping, setScraping] = useState(false);

  const handleTriggerScrape = async () => {
    setScraping(true);
    try {
      await jobsApi.triggerScrape();
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        3000
      );
    } catch {
      console.error('Failed to trigger scrape');
    } finally {
      setScraping(false);
    }
  };
  const jobs = data?.jobs ?? [];

  const filtered =
    activeFilter === 'All'
      ? jobs
      : jobs.filter((j: any) =>
          j.title.toLowerCase().includes(activeFilter.toLowerCase())
        );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Job Hunt</h1>
          <p className="text-white/40 text-sm mt-1">
            Updated daily · {jobs.length} jobs found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScrape}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B6CF2]/10 border border-[#1B6CF2]/20 text-[#1B6CF2] text-sm hover:bg-[#1B6CF2]/20 transition-all disabled:opacity-40"
          >
            {scraping ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {scraping ? 'Fetching...' : 'Fetch Jobs'}
          </button>
          <Link
            href="/jobs/saved"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition-all"
          >
            <Bookmark size={15} />
            Saved Jobs
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition-all ${
              activeFilter === f
                ? 'bg-[#1B6CF2] text-white'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-[#1B6CF2] animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">
            Could not load jobs. Make sure the gateway is running.
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="bg-[#141418] border border-white/5 rounded-xl p-12 text-center">
          <Briefcase size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No jobs found yet.</p>
          <p className="text-white/20 text-xs mt-1">
            The scraper runs daily — check back tomorrow or trigger it manually.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map((job: any) => {
          const isSaved = savedIds.has(job.id);
          return (
            <div
              key={job.id}
              className="bg-[#141418] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[#1B6CF2]/10 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-[#1B6CF2]" />
                    </div>
                    <span className="text-white/40 text-sm">{job.company}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <MapPin size={11} />
                      {job.location}
                    </span>
                  </div>
                  <h3 className="text-white font-medium text-sm leading-snug">
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

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      isSaved
                        ? unsaveMutation.mutate(job.id)
                        : saveMutation.mutate(job.id)
                    }
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isSaved
                        ? 'bg-[#F0A500]/10 text-[#F0A500]'
                        : 'bg-white/5 text-white/30 hover:text-white/60'
                    }`}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} />
                    ) : (
                      <Bookmark size={15} />
                    )}
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
