import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">BTP</h1>
          <p className="text-white/40 text-sm mt-1">
            Big Tech Prep by Spectroniq
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
