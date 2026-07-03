'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-sm">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-[#1B6CF2] flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </div>
        </div>

        {/* 404 */}
        <div>
          <p className="text-[#1B6CF2] text-sm font-medium mb-2">404</p>
          <h1 className="text-white text-2xl font-semibold">Page not found</h1>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            Looks like this page doesn't exist. Maybe it's still being built, or the URL is off.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B6CF2] text-white text-sm font-medium hover:bg-[#1B6CF2]/80 transition-colors"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
