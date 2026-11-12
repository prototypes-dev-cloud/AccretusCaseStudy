'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string, exchangeId?: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { state, dispatch, currentPartner, visibleExchanges } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isAdmin = state.currentUser.role === 'QI Admin';

  const atRiskCount = visibleExchanges.filter(
    (e) => e.atRisk && e.stage !== 'Completed'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'exchanges',
      label: 'Exchanges',
      icon: ArrowLeftRight,
      badge: atRiskCount > 0 ? atRiskCount : undefined,
    },
    {
      id: 'artifacts',
      label: 'Report Generator',
      icon: FileText,
    },
    ...(isAdmin
      ? [
          {
            id: 'partners',
            label: 'Partners',
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 h-screen bg-navy-900 flex flex-col shrink-0">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-500 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">
              ADE Partner Hub
            </div>
            <div className="text-navy-300 text-xs">Atlanta Deferred Exchange</div>
          </div>
        </div>
      </div>

      {/* Role toggle */}
      <div className="px-4 py-3 border-b border-navy-700">
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-navy-300 shrink-0" />
              <span className="text-xs text-navy-200 font-medium">
                {state.currentUser.role}
              </span>
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-navy-400 transition-transform', roleMenuOpen && 'rotate-180')} />
          </button>
          {roleMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-navy-800 border border-navy-600 rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => {
                  dispatch({
                    type: 'SET_ROLE',
                    role: 'Partner User',
                    partnerId: 'partner-1',
                    name: 'Sarah Mitchell, CPA',
                  });
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-navy-700 transition-colors',
                  state.currentUser.role === 'Partner User' ? 'text-gold-400' : 'text-navy-200'
                )}
              >
                Partner User (Apex CPA)
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: 'SET_ROLE',
                    role: 'QI Admin',
                    partnerId: null,
                    name: 'Admin — ADE',
                  });
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-navy-700 transition-colors border-t border-navy-700',
                  state.currentUser.role === 'QI Admin' ? 'text-gold-400' : 'text-navy-200'
                )}
              >
                QI Admin (All Partners)
              </button>
            </div>
          )}
        </div>

        {/* Partner switcher (admin only) */}
        {isAdmin && (
          <div className="mt-2">
            <select
              className="w-full text-xs bg-navy-800 text-navy-200 border border-navy-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
              onChange={(e) => {
                if (e.target.value !== 'all') {
                  dispatch({ type: 'SWITCH_PARTNER', partnerId: e.target.value, partners: state.partners });
                }
              }}
            >
              <option value="all">All Partners (Admin View)</option>
              {state.partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.organizationName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-navy-600 text-white'
                  : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </div>
              {item.badge && (
                <span className="bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Partner profile */}
      {currentPartner && (
        <div className="px-3 py-3 border-t border-navy-700">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <PartnerLogo
              initials={currentPartner.logoInitials}
              color={currentPartner.primaryColor}
              logoPath={currentPartner.logoPath}
              size="sm"
            />
            <div className="flex-1 text-left min-w-0">
              <div className="text-white text-xs font-medium truncate">
                {currentPartner.organizationName}
              </div>
              <div className="text-navy-400 text-xs truncate">
                {state.currentUser.name}
              </div>
            </div>
            {profileOpen ? (
              <ChevronDown className="w-4 h-4 text-navy-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400 shrink-0" />
            )}
          </button>

          {profileOpen && (
            <div className="mt-2 mx-1 p-3 bg-navy-800 rounded-lg border border-navy-700 text-xs text-navy-300 space-y-1.5">
              <div className="font-medium text-navy-200 pb-1 border-b border-navy-700">
                Partner Profile
              </div>
              <div>📧 {currentPartner.contactEmail}</div>
              <div>📞 {currentPartner.contactPhone}</div>
              <div>🏢 {currentPartner.type}</div>
              <div className="pt-1 border-t border-navy-700 text-navy-400">
                Partner since {new Date(currentPartner.joinedDate).getFullYear()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QI Admin footer */}
      {isAdmin && (
        <div className="px-3 py-3 border-t border-navy-700">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 bg-gold-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-white text-xs font-medium">ADE Admin</div>
              <div className="text-navy-400 text-xs">admin@ade.com</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
