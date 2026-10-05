'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Boxes,
  FileClock,
  LayoutDashboard,
  Leaf,
  LogOut,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from 'lucide-react';

const nav = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', href: '/users', label: 'Users', icon: Users },
  { id: 'products', href: '/products', label: 'Products', icon: Boxes },
  { id: 'scans', href: '/scans', label: 'Scans', icon: Activity },
  { id: 'allergens', href: '/allergens', label: 'Allergens', icon: ShieldAlert },
  { id: 'reports', href: '/reports', label: 'Reports', icon: BarChart3 },
  { id: 'logs', href: '/logs', label: 'System Logs', icon: FileClock },
  { id: 'settings', href: '/settings', label: 'Settings', icon: Settings },
  { id: 'profile', href: '/profile', label: 'Admin Profile', icon: UserRound },
];

export default function Sidebar({ onLogout, open, onCloseMobile }) {
  const pathname = usePathname();

  return (
    <aside
      className={`${
        open ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-[#073f82] text-white transition-transform lg:static lg:translate-x-0`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-[#a9e7ff]">
          <Leaf size={19} />
        </div>
        <span className="font-heading text-sm font-bold">SafeLabel AI</span>
        <button className="ml-auto lg:hidden" onClick={onCloseMobile}>
          <X size={17} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {nav.map(({ id, href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={id}
              href={href}
              onClick={onCloseMobile}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs font-medium transition ${
                isActive
                  ? 'bg-[#1269d3] text-white shadow-lg shadow-blue-950/20'
                  : 'text-blue-100/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="m-3 flex items-center gap-3 border-t border-white/10 px-3 py-4 text-xs font-medium text-blue-100/80 hover:text-white"
      >
        <LogOut size={16} />
        Logout
      </button>
    </aside>
  );
}
