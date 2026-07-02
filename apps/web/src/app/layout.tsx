import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Sidebar from '@/components/layout/Sidebar';
import QueryProvider from '@/components/layout/QueryProvider';
import MainContent from '@/components/layout/MainLayoutContent';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import AuthTokenProvider from '@/components/layout/AuthTokenProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BTP — Big Tech Prep',
  description: 'AI-powered interview preparation by Spectroniq',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <QueryProvider>
            <AuthTokenProvider>
              <div className="flex min-h-screen bg-[#0D0D0F]">
                <Sidebar />
                <MainContent>{children}</MainContent>
              </div>
            </AuthTokenProvider>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
