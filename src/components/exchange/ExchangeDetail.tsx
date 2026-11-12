'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Exchange } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownPill } from '@/components/ui/CountdownPill';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import { PlainEnglishExplainer } from '@/components/exchange/PlainEnglishExplainer';
import {
  formatDate,
  formatCurrency,
  daysUntil,
  getStageColor,
  cn,
} from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Shield,
  MapPin,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface ExchangeDetailProps {
  exchangeId: string;
  onBack: () => void;
  onGenerateArtifact: (id: string) => void;
}

export function ExchangeDetail({
  exchangeId,
  onBack,
  onGenerateArtifact,
}: ExchangeDetailProps) {
  const { state, visibleExchanges } = useApp();
  const exchange = visibleExchanges.find((e) => e.id === exchangeId);

  if (!exchange) {
    return (
      <div className="p-8 text-center text-slate-500">
        Exchange not found.{' '}
        <button onClick={onBack} className="text-navy-600 underline">
          Go back
        </button>
      </div>
    );
  }

  const partner = state.partners.find((p) => p.id === exchange.partnerId);
  const sc = getStageColor(exchange.stage);
  const d45 = daysUntil(exchange.deadline45Day);
  const d180 = daysUntil(exchange.deadline180Day);
  const isCompleted = exchange.stage === 'Completed';

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Back + header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exchanges
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              {exchange.atRisk && !isCompleted && (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  AT RISK — Deadline Approaching
                </div>
              )}
              <span
                className={cn(
                  'inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border',
                  sc.bg, sc.text, sc.border
                )}
              >
                {exchange.stage}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{exchange.clientName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Exchange ID: {exchange.id.toUpperCase()} · Opened {formatDate(exchange.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateArtifact(exchange.id)}
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-700">Exchange Timeline</h2>
        </CardHeader>
        <CardBody className="py-5">
          <div className="relative">
            {exchange.milestones.map((m, i) => {
              const isLast = i === exchange.milestones.length - 1;
              return (
                <div key={i} className="flex items-start gap-4">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                        m.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : m.current
                          ? 'bg-navy-600 border-navy-600'
                          : 'bg-white border-slate-300'
                      )}
                    >
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : m.current ? (
                        <Clock className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          'w-0.5 h-10 mt-1',
                          m.completed ? 'bg-emerald-300' : 'bg-slate-200'
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn('pb-6', isLast && 'pb-0')}>
                    <div
                      className={cn(
                        'text-sm font-semibold',
                        m.completed
                          ? 'text-emerald-700'
                          : m.current
                          ? 'text-navy-700'
                          : 'text-slate-400'
                      )}
                    >
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(m.date)}
                    </div>
                    {m.current && (
                      <span className="inline-flex mt-1 px-2 py-0.5 bg-navy-100 text-navy-700 text-xs font-medium rounded-full">
                        Current Stage
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Key dates & metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Relinquished Closing',
            value: formatDate(exchange.closingDate),
            icon: Calendar,
            color: '#475569',
          },
          {
            label: '45-Day Deadline',
            value: formatDate(exchange.deadline45Day),
            sub: !isCompleted && d45 >= 0 ? `${d45} days remaining` : 'Passed',
            icon: Clock,
            color: d45 <= 10 && !isCompleted ? '#dc2626' : '#1e3a5f',
          },
          {
            label: '180-Day Deadline',
            value: formatDate(exchange.deadline180Day),
            sub: !isCompleted && d180 >= 0 ? `${d180} days remaining` : 'Passed',
            icon: Clock,
            color: d180 <= 10 && !isCompleted ? '#dc2626' : '#1e3a5f',
          },
          {
            label: 'Exchange Value',
            value: formatCurrency(exchange.fundsAmount),
            icon: DollarSign,
            color: '#065f46',
          },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.color + '15' }}
              >
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{item.value}</p>
                {item.sub && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: item.color }}
                  >
                    {item.sub}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Property + Escrow */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Property */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Property Details
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Relinquished */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Relinquished Property
              </p>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {exchange.propertyDetails.address}
                  </p>
                  <p className="text-xs text-slate-500">
                    {exchange.propertyDetails.city}, {exchange.propertyDetails.state}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {exchange.propertyDetails.propertyType} ·{' '}
                    {formatCurrency(exchange.propertyDetails.salePrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            {exchange.propertyDetails.replacementAddress && (
              <>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="flex-1 h-px bg-slate-100" />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Replacement */}
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                    Replacement Property
                  </p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {exchange.propertyDetails.replacementAddress}
                      </p>
                      <p className="text-xs text-slate-500">
                        {exchange.propertyDetails.replacementCity},{' '}
                        {exchange.propertyDetails.replacementState}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exchange.propertyDetails.replacementPropertyType} ·{' '}
                        {formatCurrency(exchange.propertyDetails.replacementPrice ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!exchange.propertyDetails.replacementAddress && (
              <div className="text-xs text-slate-400 italic">
                Replacement property not yet identified.
              </div>
            )}
          </CardBody>
        </Card>

        {/* Escrow */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              Escrow & Fund Status
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  exchange.escrowStatus === 'Verified'
                    ? 'bg-emerald-100'
                    : 'bg-amber-100'
                )}
              >
                <Shield
                  className={cn(
                    'w-5 h-5',
                    exchange.escrowStatus === 'Verified'
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  )}
                />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Escrow {exchange.escrowStatus}
                </div>
                <div className="text-xs text-slate-500">
                  {formatCurrency(exchange.fundsAmount)} held
                </div>
              </div>
              <Badge
                variant={
                  exchange.escrowStatus === 'Verified' ? 'success' : 'warning'
                }
                className="ml-auto"
              >
                {exchange.escrowStatus}
              </Badge>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed">
              {exchange.escrowNotes}
            </div>

            {partner && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <PartnerLogo
                  initials={partner.logoInitials}
                  color={partner.primaryColor}
                  logoPath={partner.logoPath}
                  size="sm"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {partner.organizationName}
                  </p>
                  <p className="text-xs text-slate-400">{partner.type}</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* AI Plain-English Explainer */}
      <PlainEnglishExplainer exchange={exchange} />
    </div>
  );
}
