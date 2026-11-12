'use client';

import { useState, useMemo } from 'react';
import { Exchange, ExchangeStage } from '@/types';
import { useApp } from '@/store/AppContext';
import {
  formatDate,
  formatCurrency,
  daysUntil,
  getStageColor,
  getExchangeUrgencyScore,
  cn,
} from '@/lib/utils';
import { CountdownPill } from '@/components/ui/CountdownPill';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Filter,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FileText,
} from 'lucide-react';

const STAGES: ExchangeStage[] = [
  'Initial Intake',
  'Document Review',
  '45-Day ID Window Active',
  '180-Day Close Active',
  'Completed',
];

interface ExchangeTableProps {
  onViewExchange: (id: string) => void;
  onGenerateArtifact: (id: string) => void;
}

export function ExchangeTable({ onViewExchange, onGenerateArtifact }: ExchangeTableProps) {
  const { visibleExchanges, state } = useApp();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ExchangeStage | 'All'>('All');
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [sortField, setSortField] = useState<'urgency' | 'client' | 'stage' | 'deadline45' | 'deadline180'>('urgency');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = [...visibleExchanges];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.clientName.toLowerCase().includes(q) ||
          e.propertyDetails.address.toLowerCase().includes(q) ||
          e.propertyDetails.city.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== 'All') list = list.filter((e) => e.stage === stageFilter);
    if (atRiskOnly) list = list.filter((e) => e.atRisk);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'urgency':
          cmp = getExchangeUrgencyScore(a) - getExchangeUrgencyScore(b);
          break;
        case 'client':
          cmp = a.clientName.localeCompare(b.clientName);
          break;
        case 'stage':
          cmp = STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage);
          break;
        case 'deadline45':
          cmp = daysUntil(a.deadline45Day) - daysUntil(b.deadline45Day);
          break;
        case 'deadline180':
          cmp = daysUntil(a.deadline180Day) - daysUntil(b.deadline180Day);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [visibleExchanges, search, stageFilter, atRiskOnly, sortField, sortDir]);

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
    );

  const getPartnerName = (partnerId: string) =>
    state.partners.find((p) => p.id === partnerId)?.organizationName ?? partnerId;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients or properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-500 text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Stage filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All', ...STAGES] as const).map((s) => {
            const colors = s !== 'All' ? getStageColor(s) : null;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  stageFilter === s
                    ? 'bg-navy-600 text-white'
                    : colors
                    ? `${colors.bg} ${colors.text} hover:opacity-80`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s === '45-Day ID Window Active' ? '45-Day Active' :
                 s === '180-Day Close Active' ? '180-Day Active' : s}
              </button>
            );
          })}
        </div>

        {/* At-risk toggle */}
        <button
          onClick={() => setAtRiskOnly(!atRiskOnly)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            atRiskOnly
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          At-Risk Only
        </button>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} of {visibleExchanges.length} exchanges
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                { label: 'Client', field: 'client' as const },
                { label: 'Stage', field: 'stage' as const },
                { label: 'Property', field: null },
                ...(state.currentUser.role === 'QI Admin'
                  ? [{ label: 'Partner', field: null }]
                  : []),
                { label: '45-Day', field: 'deadline45' as const },
                { label: '180-Day', field: 'deadline180' as const },
                { label: 'Escrow', field: null },
                { label: 'Urgency', field: 'urgency' as const },
                { label: '', field: null },
              ].map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide',
                    col.field && 'cursor-pointer hover:text-slate-700 select-none'
                  )}
                  onClick={() => col.field && handleSort(col.field)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.field && <SortIcon field={col.field} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-slate-400 text-sm"
                >
                  No exchanges match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((exchange) => {
                const sc = getStageColor(exchange.stage);
                const d45 = daysUntil(exchange.deadline45Day);
                const d180 = daysUntil(exchange.deadline180Day);
                const isCompleted = exchange.stage === 'Completed';

                return (
                  <tr
                    key={exchange.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => onViewExchange(exchange.id)}
                  >
                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {exchange.atRisk && !isCompleted && (
                          <span title="At Risk">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 leading-tight">
                            {exchange.clientName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {exchange.id.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 rounded-md text-xs font-medium border',
                          sc.bg, sc.text, sc.border
                        )}
                      >
                        {exchange.stage === '45-Day ID Window Active'
                          ? '45-Day Active'
                          : exchange.stage === '180-Day Close Active'
                          ? '180-Day Active'
                          : exchange.stage}
                      </span>
                    </td>

                    {/* Property */}
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="text-slate-700 text-xs leading-tight truncate">
                        {exchange.propertyDetails.address}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {exchange.propertyDetails.city}, {exchange.propertyDetails.state}
                      </div>
                    </td>

                    {/* Partner (admin only) */}
                    {state.currentUser.role === 'QI Admin' && (
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600 font-medium">
                          {getPartnerName(exchange.partnerId)}
                        </span>
                      </td>
                    )}

                    {/* 45-day */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-500 mb-1">
                        {formatDate(exchange.deadline45Day)}
                      </div>
                      <CountdownPill
                        label="45-Day"
                        dateStr={exchange.deadline45Day}
                        isPast={isCompleted || d45 < 0}
                      />
                    </td>

                    {/* 180-day */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-500 mb-1">
                        {formatDate(exchange.deadline180Day)}
                      </div>
                      <CountdownPill
                        label="180-Day"
                        dateStr={exchange.deadline180Day}
                        isPast={isCompleted || d180 < 0}
                      />
                    </td>

                    {/* Escrow */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          exchange.escrowStatus === 'Verified' ? 'success' : 'warning'
                        }
                      >
                        {exchange.escrowStatus}
                      </Badge>
                    </td>

                    {/* Urgency */}
                    <td className="px-4 py-3">
                      {isCompleted ? (
                        <Badge variant="neutral">Done</Badge>
                      ) : exchange.atRisk ? (
                        <Badge variant="danger">
                          <AlertTriangle className="w-3 h-3" />
                          At Risk
                        </Badge>
                      ) : (
                        <Badge variant="success">On Track</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateArtifact(exchange.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                        title="Generate Report"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
