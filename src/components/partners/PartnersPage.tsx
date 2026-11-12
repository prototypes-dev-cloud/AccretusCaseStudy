'use client';

import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import { formatDate } from '@/lib/utils';
import { Users, Mail, Phone, Globe, Building2 } from 'lucide-react';

export function PartnersPage() {
  const { state } = useApp();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          Partner Organizations
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Referral partner directory — {state.partners.length} active partners
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.partners.map((partner) => {
          const exchanges = state.exchanges.filter((e) => e.partnerId === partner.id);
          const active = exchanges.filter((e) => e.stage !== 'Completed').length;
          const completed = exchanges.filter((e) => e.stage === 'Completed').length;
          const logs = state.artifactLogs.filter((l) => l.partnerId === partner.id);

          return (
            <Card key={partner.id} className="overflow-hidden">
              {/* Header band */}
              <div
                className="h-2"
                style={{ backgroundColor: partner.primaryColor }}
              />
              <div className="p-5 space-y-4">
                {/* Logo + name */}
                <div className="flex items-start gap-3">
                  <PartnerLogo
                    initials={partner.logoInitials}
                    color={partner.primaryColor}
                    logoPath={partner.logoPath}
                    size="lg"
                  />
                  <div>
                    <h2 className="font-bold text-slate-900">{partner.organizationName}</h2>
                    <Badge variant="info" className="mt-1">
                      {partner.type}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Active', value: active },
                    { label: 'Completed', value: completed },
                    { label: 'Actions', value: logs.length },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-slate-50 border border-slate-100 rounded-lg py-2"
                    >
                      <p className="text-lg font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Contact */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700">{partner.contactName}</div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {partner.contactEmail}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {partner.contactPhone}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    {partner.website}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span>{partner.address}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
                  Partner since {new Date(partner.joinedDate).getFullYear()} ·{' '}
                  {formatDate(partner.joinedDate)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
