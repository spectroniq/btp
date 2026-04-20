import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Sidebar from '@/components/layout/Sidebar';
import QueryProvider from '@/components/layout/QueryProvider';

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
        <QueryProvider>
          <div className="flex min-h-screen bg-[#0D0D0F]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
