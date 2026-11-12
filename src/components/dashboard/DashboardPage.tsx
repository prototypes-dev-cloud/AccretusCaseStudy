'use client';

import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { MetricCard } from './MetricCard';
import { ExchangeTable } from './ExchangeTable';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import { daysUntil } from '@/lib/utils';
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DashboardPageProps {
  onViewExchange: (id: string) => void;
  onGenerateArtifact: (id: string) => void;
}

export function DashboardPage({ onViewExchange, onGenerateArtifact }: DashboardPageProps) {
  const { state, currentPartner, visibleExchanges } = useApp();
  const isAdmin = state.currentUser.role === 'QI Admin';

  const metrics = useMemo(() => {
    const active = visibleExchanges.filter((e) => e.stage !== 'Completed');
    const completed = visibleExchanges.filter((e) => e.stage === 'Completed');
    const nearing45 = active.filter(
      (e) =>
        (e.stage === '45-Day ID Window Active') &&
        daysUntil(e.deadline45Day) <= 15 &&
        daysUntil(e.deadline45Day) >= 0
    );
    const atRisk = active.filter((e) => e.atRisk);
    return {
      total: visibleExchanges.length,
      active: active.length,
      completed: completed.length,
      nearing45: nearing45.length,
      atRisk: atRisk.length,
    };
  }, [visibleExchanges]);

  // Stage distribution for mini chart
  const stageData = useMemo(() => {
    const stages = [
      'Initial Intake',
      'Document Review',
      '45-Day ID Window Active',
      '180-Day Close Active',
      'Completed',
    ];
    return stages.map((s) => ({
      name:
        s === '45-Day ID Window Active'
          ? '45-Day'
          : s === '180-Day Close Active'
          ? '180-Day'
          : s.replace(' Review', '').replace(' Intake', ''),
      count: visibleExchanges.filter((e) => e.stage === s).length,
    }));
  }, [visibleExchanges]);

  const stageColors = ['#64748b', '#3b82f6', '#f59e0b', '#6366f1', '#10b981'];

  // Analytics: engagement by partner (admin view)
  const engagementData = useMemo(() => {
    return state.partners.map((p) => {
      const logs = state.artifactLogs.filter((l) => l.partnerId === p.id);
      const exch = state.exchanges.filter((e) => e.partnerId === p.id);
      return {
        name: p.organizationName.split(' ')[0],
        reports: logs.filter((l) => l.action === 'generate').length,
        exchanges: exch.filter((e) => e.stage !== 'Completed').length,
        color: p.primaryColor,
      };
    });
  }, [state.artifactLogs, state.partners, state.exchanges]);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {currentPartner ? (
            <div className="flex items-center gap-3 mb-1">
              <PartnerLogo
                initials={currentPartner.logoInitials}
                color={currentPartner.primaryColor}
                logoPath={currentPartner.logoPath}
                size="md"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {currentPartner.organizationName}
                </h1>
                <p className="text-sm text-slate-500">{currentPartner.type}</p>
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-slate-900">QI Admin Dashboard</h1>
          )}
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? `Viewing all ${state.exchanges.length} exchanges across ${state.partners.length} partners`
              : `Welcome back, ${state.currentUser.name}`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Reference Date</p>
          <p className="text-sm font-semibold text-slate-700">November 10, 2026</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Active Exchanges"
          value={metrics.active}
          subtitle={`${metrics.total} total on file`}
          icon={ArrowLeftRight}
          accentColor="#1e3a5f"
        />
        <MetricCard
          title="Nearing 45-Day Deadline"
          value={metrics.nearing45}
          subtitle="Within 15 days"
          icon={AlertTriangle}
          accentColor={metrics.nearing45 > 0 ? '#dc2626' : '#1e3a5f'}
          trend={
            metrics.nearing45 > 0
              ? { value: 'Action required', positive: false }
              : undefined
          }
        />
        <MetricCard
          title="Completed YTD"
          value={metrics.completed}
          subtitle="Successfully closed"
          icon={CheckCircle2}
          accentColor="#059669"
          trend={{ value: 'All on-time', positive: true }}
        />
        <MetricCard
          title="Total Referrals"
          value={isAdmin ? state.exchanges.length : visibleExchanges.length}
          subtitle={isAdmin ? `Across ${state.partners.length} partners` : 'Your lifetime volume'}
          icon={Users}
          accentColor="#7c3aed"
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Stage distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Exchange Stage Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stageData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageData.map((_, i) => (
                  <Cell key={i} fill={stageColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement / Partner breakdown (admin) or deadline map (partner) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">
              {isAdmin ? 'Partner Engagement vs. Active Exchanges' : 'Your Upcoming Deadlines'}
            </h2>
          </div>

          {isAdmin ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={engagementData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="exchanges" name="Active Exchanges" fill="#c7d6fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reports" name="Reports Generated" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-2.5">
              {visibleExchanges
                .filter((e) => e.stage !== 'Completed' && e.stage !== 'Initial Intake')
                .sort((a, b) => {
                  const aD = Math.min(daysUntil(a.deadline45Day), daysUntil(a.deadline180Day));
                  const bD = Math.min(daysUntil(b.deadline45Day), daysUntil(b.deadline180Day));
                  return aD - bD;
                })
                .slice(0, 5)
                .map((e) => {
                  const d45 = daysUntil(e.deadline45Day);
                  const d180 = daysUntil(e.deadline180Day);
                  const isD45Active = e.stage === '45-Day ID Window Active' && d45 >= 0;
                  const days = isD45Active ? d45 : d180;
                  const urgent = days <= 10;

                  return (
                    <button
                      key={e.id}
                      onClick={() => onViewExchange(e.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          urgent ? 'bg-rose-100' : 'bg-slate-100'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 ${urgent ? 'text-rose-500' : 'text-slate-400'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {e.clientName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isD45Active ? '45-Day' : '180-Day'} deadline
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          urgent
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {days}d
                      </span>
                    </button>
                  );
                })}

              {visibleExchanges.filter(
                (e) => e.stage !== 'Completed' && e.stage !== 'Initial Intake'
              ).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  No upcoming deadlines.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exchange table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
          Exchange Portfolio
        </h2>
        <ExchangeTable
          onViewExchange={onViewExchange}
          onGenerateArtifact={onGenerateArtifact}
        />
      </div>
    </div>
  );
}
