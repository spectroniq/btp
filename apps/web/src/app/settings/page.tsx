'use client';

import { useState } from 'react';
import { Bell, Volume2, Moon, Shield, Trash2, ChevronRight } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-[#1B6CF2]' : 'bg-white/10'}`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">{title}</h3>
      <div className="bg-[#141418] border border-white/5 rounded-xl divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, iconColor, label, description, control }: {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon size={15} className={iconColor ?? 'text-white/40'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">{label}</p>
        {description && <p className="text-white/30 text-xs mt-0.5">{description}</p>}
      </div>
      {control}
    </div>
  );
}

export default function SettingsPage() {
  const [notifInterviews, setNotifInterviews] = useState(true);
  const [notifJobs, setNotifJobs] = useState(true);
  const [notifReminders, setNotifReminders] = useState(false);
  const [voiceDefault, setVoiceDefault] = useState(false);
  const [darkMode] = useState(true);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your preferences</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-8">
        <div className="space-y-8">
          <Section title="Notifications">
            <SettingRow
              icon={Bell}
              label="Interview reminders"
              description="Get reminded to practice your interviews"
              control={<Toggle checked={notifInterviews} onChange={setNotifInterviews} />}
            />
            <SettingRow
              icon={Bell}
              label="New job alerts"
              description="Be notified when new matching jobs are found"
              control={<Toggle checked={notifJobs} onChange={setNotifJobs} />}
            />
            <SettingRow
              icon={Bell}
              label="Daily streak reminders"
              description="Reminder to keep your DSA streak alive"
              control={<Toggle checked={notifReminders} onChange={setNotifReminders} />}
            />
          </Section>

          <Section title="Preferences">
            <SettingRow
              icon={Volume2}
              label="Voice mode by default"
              description="Start interviews in voice mode automatically"
              control={<Toggle checked={voiceDefault} onChange={setVoiceDefault} />}
            />
            <SettingRow
              icon={Moon}
              label="Dark mode"
              description="Always on — BTP only supports dark mode"
              control={<Toggle checked={darkMode} onChange={() => {}} />}
            />
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Privacy & Security">
            <SettingRow
              icon={Shield}
              label="Data & privacy"
              description="How we store and use your data"
              control={
                <a
                  href="https://spectroniqlimited.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/20 hover:text-white/50 transition-colors"
                >
                  <ChevronRight size={16} />
                </a>
              }
            />
          </Section>

          <Section title="Danger Zone">
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={15} className="text-red-400/60" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">Delete account</p>
                <p className="text-white/30 text-xs mt-0.5">Permanently remove your data. This cannot be undone.</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">
                Delete
              </button>
            </div>
          </Section>
        </div>
      </div>

      <p className="text-white/20 text-xs">BTP v1 · Built by Spectroniq Limited</p>
    </div>
  );
}
