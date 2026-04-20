'use client';

import { useUIStore } from '@/store/ui.store';
import Navbar from './Navbar';

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();
  return (
    <main
      className={`flex-1 min-w-0 overflow-hidden transition-all duration-300  ${
        sidebarOpen ? 'ml-64' : 'ml-16'
      }`}
    >
      <Navbar />
      <div className="flex-1 px-8 pt-8">{children}</div>
    </main>
  );
}
