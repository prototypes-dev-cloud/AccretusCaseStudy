'use client';

import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  FileText,
  Link2,
  Download,
  BarChart2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ArtifactAnalyticsPageProps {
  onGenerateForExchange: (exchangeId: string) => void;
}

export function ArtifactAnalyticsPage({ onGenerateForExchange }: ArtifactAnalyticsPageProps) {
  const { state, visibleExchanges } = useApp();
  const isAdmin = state.currentUser.role === 'QI Admin';

  const logs = state.artifactLogs;

  const actionBreakdown = useMemo(() => {
    return [
      {
        label: 'Reports Generated',
        icon: FileText,
        count: logs.filter((l) => l.action === 'generate').length,
        color: '#1e3a5f',
      },
      {
        label: 'Links Copied',
        icon: Link2,
        count: logs.filter((l) => l.action === 'copy_link').length,
        color: '#7c3aed',
      },
      {
        label: 'PDFs Downloaded',
        icon: Download,
        count: logs.filter((l) => l.action === 'download_pdf').length,
        color: '#065f46',
      },
    ];
  }, [logs]);

  const perPartnerData = useMemo(() => {
    return state.partners.map((p) => {
      const pLogs = logs.filter((l) => l.partnerId === p.id);
      const activeExch = state.exchanges.filter(
        (e) => e.partnerId === p.id && e.stage !== 'Completed'
      ).length;
      return {
        name: p.organizationName.split(' ')[0],
        full: p.organizationName,
        color: p.primaryColor,
        reports: pLogs.filter((l) => l.action === 'generate').length,
        links: pLogs.filter((l) => l.action === 'copy_link').length,
        pdfs: pLogs.filter((l) => l.action === 'download_pdf').length,
        total: pLogs.length,
        activeExchanges: activeExch,
      };
    });
  }, [logs, state.partners, state.exchanges]);

  const recentLogs = useMemo(
    () =>
      [...logs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
    [logs]
  );

  const getExchangeName = (id: string) =>
    state.exchanges.find((e) => e.id === id)?.clientName ?? id;

  const getPartnerName = (id: string) =>
    state.partners.find((p) => p.id === id)?.organizationName ?? id;

  const getPartnerForExchange = (exchangeId: string) => {
    const e = state.exchanges.find((ex) => ex.id === exchangeId);
    return e ? state.partners.find((p) => p.id === e.partnerId) : null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          Report Generator & Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate co-branded client status reports and track engagement
        </p>
      </div>

      {/* Quick generate */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Generate</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleExchanges
            .filter((e) => e.stage !== 'Completed')
            .slice(0, 6)
            .map((e) => {
              const partner = state.partners.find((p) => p.id === e.partnerId);
              return (
                <button
                  key={e.id}
                  onClick={() => onGenerateForExchange(e.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-navy-300 hover:bg-slate-50 transition-colors text-left"
                >
                  {partner && (
                    <PartnerLogo
                      initials={partner.logoInitials}
                      color={partner.primaryColor}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {e.clientName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{e.stage}</p>
                  </div>
                  <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              );
            })}
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {actionBreakdown.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-5">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.color + '15' }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{item.count}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      {isAdmin && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">
                Engagement by Partner
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={perPartnerData} barSize={24}>
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="reports" name="Reports" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="links" name="Links" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pdfs" name="PDFs" fill="#065f46" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">
                Engagement vs. Active Exchanges
              </h2>
            </div>
            <div className="space-y-3">
              {perPartnerData.map((p) => {
                const partner = state.partners.find(
                  (pt) => pt.organizationName.startsWith(p.name)
                );
                const engagementRate =
                  p.activeExchanges > 0
                    ? Math.min(100, Math.round((p.total / p.activeExchanges) * 100))
                    : 0;

                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {partner && (
                          <PartnerLogo
                            initials={partner.logoInitials}
                            color={partner.primaryColor}
                            size="sm"
                          />
                        )}
                        <span className="font-medium text-slate-700">{p.full}</span>
                      </div>
                      <span className="text-slate-500">
                        {p.total} actions / {p.activeExchanges} exchanges
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${engagementRate}%`,
                          backgroundColor: partner?.primaryColor ?? '#1e3a5f',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Activity log */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Recent Activity Log</h2>
        </div>
        {recentLogs.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">
            No report activity yet. Generate your first report above.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentLogs.map((log) => {
              const partner = getPartnerForExchange(log.exchangeId);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  {partner && (
                    <PartnerLogo
                      initials={partner.logoInitials}
                      color={partner.primaryColor}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">
                      {getExchangeName(log.exchangeId)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isAdmin ? getPartnerName(log.partnerId) + ' · ' : ''}
                      {log.action === 'generate'
                        ? 'Report generated'
                        : log.action === 'copy_link'
                        ? 'Live link copied'
                        : 'PDF downloaded'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-slate-300">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
