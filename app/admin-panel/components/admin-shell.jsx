'use client';

import { useState } from 'react';
import { Bell, ChevronDown, Menu, Search, X } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import DashboardView from '@/components/views/dashboard-view';
import ManagementViews from '@/components/views/management-views';

export default function AdminShell({ onLogout, user }) {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const titles = {
    dashboard: ['Dashboard', 'Overview of your platform'],
    users: ['User Management', 'View and manage all users'],
    products: ['Product Management', 'Add, edit or remove products'],
    scans: ['Scan Logs', 'View all product scans'],
    allergens: ['Allergen Detection', 'Track and manage detected allergens'],
    reports: ['Reports', 'View platform reports and analytics'],
    logs: ['System Logs', 'Review system activity and events'],
    settings: ['Settings', 'Manage your admin panel settings'],
    profile: ['Admin Profile', 'Manage your account information'],
  };

  const [title, subtitle] = titles[active] || titles.dashboard;

  return (
    <div className="flex min-h-screen bg-[#f5f9fd]">
      <Sidebar
        active={active}
        onNavigate={(id) => {
          setActive(id);
          setSidebarOpen(false);
        }}
        onLogout={onLogout}
        open={sidebarOpen}
      />
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[#e4edf5] bg-white px-5 md:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-3 text-slate-500 lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="relative hidden w-full max-w-xs md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
            <input
              className="h-9 w-full rounded-md bg-[#f4f8fc] pl-9 text-xs outline-none placeholder:text-slate-400"
              placeholder="Search users, products, scans..."
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Bell size={17} className="text-slate-400" />
            <button
              onClick={() => setActive('profile')}
              className="flex items-center gap-2 border-l border-slate-100 pl-4 text-left transition hover:opacity-80"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-[#1269d3] text-[10px] font-bold text-white">
                {user?.display_name ? user.display_name[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block">
                <span className="block text-xs font-semibold text-slate-700">
                  {user?.display_name || 'Admin'}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {user?.role || 'Administrator'}
                </span>
              </div>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
          </div>
        </header>

        <main className="p-5 md:p-8">
          <div className="mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#1269d3]">
              SafeLabel AI
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-[#183b62]">{title}</h1>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          </div>

          {active === 'dashboard' ? (
            <DashboardView />
          ) : (
            <ManagementViews active={active} />
          )}
        </main>
      </div>
    </div>
  );
}
