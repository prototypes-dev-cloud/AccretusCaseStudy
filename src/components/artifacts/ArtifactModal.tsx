'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import {
  formatDate,
  formatCurrency,
  daysUntil,
  getStageColor,
  generateTokenizedLink,
  cn,
} from '@/lib/utils';
import {
  Download,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Loader2,
  Link2,
  BarChart2,
} from 'lucide-react';

interface ArtifactModalProps {
  exchangeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtifactModal({ exchangeId, isOpen, onClose }: ArtifactModalProps) {
  const { state, logArtifact, visibleExchanges } = useApp();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [link, setLink] = useState('');

  const exchange = visibleExchanges.find((e) => e.id === exchangeId);
  const partner = exchange
    ? state.partners.find((p) => p.id === exchange.partnerId)
    : null;

  // Log generation event
  useEffect(() => {
    if (generated && exchange && partner) {
      logArtifact(partner.id, exchange.id, 'generate');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated]);

  const handleGenerate = () => {
    if (!exchange || !partner) return;
    setGenerating(true);
    setTimeout(() => {
      setLink(generateTokenizedLink(exchange.id, partner.id));
      setGenerating(false);
      setGenerated(true);
    }, 1000);
  };

  const handleCopyLink = () => {
    if (!exchange || !partner) return;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    logArtifact(partner.id, exchange.id, 'copy_link');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!exchange || !partner) return;
    setDownloading(true);
    logArtifact(partner.id, exchange.id, 'download_pdf');

    // PDF generation with jsPDF + pristine native vector co-branding logo cards
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;

        // ── Header band ───────────────────────────────────────────────────────
        doc.setFillColor(255, 255, 255); // clean white background
        doc.rect(0, 0, pageW, 46, 'F');

        // Top navy accent line
        doc.setFillColor(30, 58, 95);
        doc.rect(0, 0, pageW, 4, 'F');

        // ── ADE Logo Card (Left Side) ──
        // Navy logo card container matching ade-qi.svg
        doc.setFillColor(15, 31, 53); // #0f1f35
        doc.roundedRect(margin, 9, 72, 22, 2, 2, 'F');
        // Gold accent stripe on left edge
        doc.setFillColor(245, 158, 11); // #f59e0b
        doc.rect(margin, 9, 2.5, 22, 'F');
        // Shield badge
        doc.setFillColor(245, 158, 11);
        doc.roundedRect(margin + 5, 13, 14, 14, 2, 2, 'F');
        doc.setTextColor(15, 31, 53);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('ADE', margin + 12, 22.5, { align: 'center' });
        // ADE Titles
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Atlanta Deferred Exchange', margin + 22, 17.5);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text('Qualified Intermediary · IRC §1031', margin + 22, 22);
        doc.setFontSize(5.5);
        doc.setTextColor(148, 163, 184);
        doc.text('1200 Peachtree St NE, Atlanta, GA', margin + 22, 26.5);

        // Center vertical divider
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.4);
        doc.line(pageW / 2, 8, pageW / 2, 36);

        // ── Partner Logo Card (Right Side) ──
        const pCardX = pageW - margin - 72;
        if (partner.type === 'CPA' || partner.id === 'partner-1') {
          // Apex CPA Group logo card matching apex-cpa.svg
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(pCardX, 9, 72, 22, 2, 2, 'FD');
          // Stylized 'A CPA' mark
          doc.setFillColor(15, 76, 129); // #0f4c81
          doc.roundedRect(pCardX + 4, 12, 14, 16, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('A', pCardX + 11, 21, { align: 'center' });
          doc.setFontSize(4.5);
          doc.setTextColor(147, 197, 253);
          doc.text('CPA', pCardX + 11, 25.5, { align: 'center' });
          // Name
          doc.setTextColor(15, 76, 129);
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.text(partner.organizationName, pCardX + 22, 16.5);
          // Type Badge
          doc.setFillColor(219, 234, 254);
          doc.roundedRect(pCardX + 22, 18.5, 46, 4.5, 1, 1, 'F');
          doc.setTextColor(29, 78, 216);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.text('Certified Public Accountants', pCardX + 24, 21.8);
          // Contact
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.text(partner.contactEmail, pCardX + 22, 27);
        } else if (partner.type.toLowerCase().includes('attorney') || partner.id === 'partner-2') {
          // Meridian Real Estate Law logo card matching meridian-law.svg
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(pCardX, 9, 72, 22, 2, 2, 'FD');
          // Scales / Law icon box
          doc.setFillColor(124, 58, 237); // #7c3aed
          doc.roundedRect(pCardX + 4, 12, 14, 16, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.text('LAW', pCardX + 11, 21, { align: 'center' });
          doc.setFontSize(4.5);
          doc.setTextColor(196, 181, 253);
          doc.text('ESQ', pCardX + 11, 25.5, { align: 'center' });
          // Name
          doc.setTextColor(124, 58, 237);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(partner.organizationName, pCardX + 22, 16.5);
          // Type Badge
          doc.setFillColor(237, 233, 254);
          doc.roundedRect(pCardX + 22, 18.5, 46, 4.5, 1, 1, 'F');
          doc.setTextColor(109, 40, 217);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.text('Real Estate Attorneys', pCardX + 24, 21.8);
          // Contact
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.text(partner.contactEmail, pCardX + 22, 27);
        } else {
          // Vanguard Commercial Brokerage matching vanguard-cre.svg
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(pCardX, 9, 72, 22, 2, 2, 'FD');
          // Building / CRE box
          doc.setFillColor(6, 95, 70); // #065f46
          doc.roundedRect(pCardX + 4, 12, 14, 16, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.text('CRE', pCardX + 11, 21, { align: 'center' });
          doc.setFontSize(4);
          doc.setTextColor(110, 231, 183);
          doc.text('BROKER', pCardX + 11, 25.5, { align: 'center' });
          // Name
          doc.setTextColor(6, 95, 70);
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.text(partner.organizationName, pCardX + 22, 16.5);
          // Type Badge
          doc.setFillColor(209, 250, 229);
          doc.roundedRect(pCardX + 22, 18.5, 46, 4.5, 1, 1, 'F');
          doc.setTextColor(4, 120, 87);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.text('Commercial Real Estate', pCardX + 24, 21.8);
          // Contact
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.text(partner.contactEmail, pCardX + 22, 27);
        }

        // Co-branded bottom banner in header
        doc.setFillColor(30, 58, 95); // navy #1e3a5f
        doc.rect(0, 36, pageW, 10, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('ATLANTA DEFERRED EXCHANGE  ·  CO-BRANDED PARTNER STATUS REPORT', pageW / 2, 42, { align: 'center' });

        // Title band
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(0, 48, pageW, 18, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('1031 Exchange Status Report', margin, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          pageW - margin,
          60,
          { align: 'right' }
        );

        let y = 78;
        const sc = getStageColor(exchange.stage);

        // Client section
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENT INFORMATION', margin, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const clientFields = [
          ['Client Name', exchange.clientName],
          ['Exchange ID', exchange.id.toUpperCase()],
          ['Current Stage', exchange.stage],
          ['Escrow Status', exchange.escrowStatus],
          ['Exchange Value', formatCurrency(exchange.fundsAmount)],
        ];
        clientFields.forEach(([label, value]) => {
          doc.setTextColor(100, 116, 139);
          doc.text(label + ':', margin, y);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(value, margin + 42, y);
          doc.setFont('helvetica', 'normal');
          y += 6;
        });

        y += 4;

        // Property section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('PROPERTY DETAILS', margin, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const propFields = [
          ['Relinquished Property', `${exchange.propertyDetails.address}, ${exchange.propertyDetails.city}, ${exchange.propertyDetails.state}`],
          ['Property Type', exchange.propertyDetails.propertyType],
          ['Sale Price', formatCurrency(exchange.propertyDetails.salePrice)],
          ['Closing Date', formatDate(exchange.closingDate)],
        ];
        if (exchange.propertyDetails.replacementAddress) {
          propFields.push([
            'Replacement Property',
            `${exchange.propertyDetails.replacementAddress}, ${exchange.propertyDetails.replacementCity}, ${exchange.propertyDetails.replacementState}`,
          ]);
        }
        propFields.forEach(([label, value]) => {
          doc.setTextColor(100, 116, 139);
          doc.text(label + ':', margin, y);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          const lines = doc.splitTextToSize(value, 100);
          doc.text(lines, margin + 52, y);
          doc.setFont('helvetica', 'normal');
          y += 6 * lines.length;
        });

        y += 4;

        // Deadline section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('CRITICAL DEADLINES', margin, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const d45 = daysUntil(exchange.deadline45Day);
        const d180 = daysUntil(exchange.deadline180Day);

        const deadlineFields = [
          [
            '45-Day Identification Deadline',
            formatDate(exchange.deadline45Day) + (d45 >= 0 ? ` (${d45} days remaining)` : ' (Passed)'),
          ],
          [
            '180-Day Exchange Completion',
            formatDate(exchange.deadline180Day) + (d180 >= 0 ? ` (${d180} days remaining)` : ' (Passed)'),
          ],
        ];
        deadlineFields.forEach(([label, value]) => {
          doc.setTextColor(100, 116, 139);
          doc.text(label + ':', margin, y);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(value, margin + 70, y);
          doc.setFont('helvetica', 'normal');
          y += 6;
        });

        y += 4;

        // Escrow notes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('ESCROW NOTES', margin, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const noteLines = doc.splitTextToSize(exchange.escrowNotes, pageW - margin * 2);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 5 + 8;

        // Disclaimer
        doc.setFillColor(255, 251, 235); // amber-50
        const discH = 22;
        doc.rect(margin, y, pageW - margin * 2, discH, 'F');
        doc.setDrawColor(252, 211, 77);
        doc.rect(margin, y, pageW - margin * 2, discH, 'S');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(146, 64, 14);
        doc.text('DISCLAIMER', margin + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        const discText =
          'This report is for informational purposes only and does not constitute tax, legal, or financial advice. ' +
          'Clients should consult their qualified tax advisor and/or legal counsel. Atlanta Deferred Exchange acts solely as Qualified Intermediary and does not provide tax or legal advice.';
        const discLines = doc.splitTextToSize(discText, pageW - margin * 2 - 6);
        doc.text(discLines, margin + 3, y + 10);

        y += discH + 8;

        // Link
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Live Status Link: ${link}`, margin, y);

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFillColor(241, 245, 249);
        doc.rect(0, footerY - 6, pageW, 16, 'F');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Atlanta Deferred Exchange · 1200 Peachtree St NE · Atlanta, GA 30309 · (404) 555-0100`,
          pageW / 2,
          footerY,
          { align: 'center' }
        );

        doc.save(`ADE-StatusReport-${exchange.id.toUpperCase()}.pdf`);
      } catch (err) {
        console.error('PDF generation error:', err);
      }
      setDownloading(false);
    }, 800);
  };

  if (!exchange || !partner) return null;

  const sc = getStageColor(exchange.stage);
  const d45 = daysUntil(exchange.deadline45Day);
  const d180 = daysUntil(exchange.deadline180Day);
  const isCompleted = exchange.stage === 'Completed';

  // Count artifact logs for this exchange
  const logCount = state.artifactLogs.filter((l) => l.exchangeId === exchange.id).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Co-Branded Status Report Generator"
      size="xl"
    >
      <div className="p-6 space-y-5">
        {/* Two-column layout: controls | preview */}
        <div className="grid md:grid-cols-5 gap-5">
          {/* Left: controls */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Report Configuration
              </h3>

              {/* Exchange info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-700">{exchange.clientName}</div>
                <div className="text-slate-500">{exchange.id.toUpperCase()}</div>
                <div className={cn('inline-flex px-2 py-0.5 rounded-md border', sc.bg, sc.text, sc.border)}>
                  {exchange.stage}
                </div>
              </div>

              {/* Partner branding preview */}
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-2 font-medium">Partner Branding</p>
                <div className="flex items-center gap-2.5">
                  <PartnerLogo
                    initials={partner.logoInitials}
                    color={partner.primaryColor}
                    logoPath={partner.logoPath}
                    size="md"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {partner.organizationName}
                    </p>
                    <p className="text-xs text-slate-500">{partner.type}</p>
                  </div>
                </div>
              </div>

              {/* ADE branding */}
              <div className="mt-3 p-3 bg-[#0f1f35] rounded-xl">
                <div className="flex items-center gap-2.5">
                  <PartnerLogo
                    initials="ADE"
                    color="#f59e0b"
                    logoPath={state.qi.logoPath}
                    size="md"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Atlanta Deferred Exchange
                    </p>
                    <p className="text-xs text-blue-300 opacity-70">Qualified Intermediary</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">Engagement Log</p>
              </div>
              <p className="text-xs text-slate-500">
                {logCount === 0
                  ? 'No activity recorded yet.'
                  : `${logCount} action${logCount !== 1 ? 's' : ''} logged for this exchange.`}
              </p>
              {logCount > 0 && (
                <div className="mt-2 space-y-1">
                  {state.artifactLogs
                    .filter((l) => l.exchangeId === exchange.id)
                    .slice(-5)
                    .map((log) => (
                      <div key={log.id} className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-navy-400 shrink-0" />
                        <span className="capitalize">{log.action.replace('_', ' ')}</span>
                        <span className="ml-auto">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: live preview */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Report Preview
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {/* Report header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: '#0f1f35' }}
              >
                <div className="flex items-center gap-3">
                  <PartnerLogo
                    initials="ADE"
                    color="#f59e0b"
                    logoPath={state.qi.logoPath}
                    size="sm"
                  />
                  <div>
                    <p className="text-white text-xs font-bold">Atlanta Deferred Exchange</p>
                    <p className="text-blue-200 text-xs opacity-70">Qualified Intermediary</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-blue-200 text-xs opacity-50">+</span>
                  <PartnerLogo
                    initials={partner.logoInitials}
                    color={partner.primaryColor}
                    logoPath={partner.logoPath}
                    size="sm"
                  />
                  <div>
                    <p className="text-white text-xs font-semibold">{partner.organizationName}</p>
                    <p className="text-blue-200 text-xs opacity-70">{partner.type}</p>
                  </div>
                </div>
              </div>

              {/* Report title band */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  1031 Exchange Status Report
                </span>
                <span className="text-xs text-slate-400">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Report body */}
              <div className="bg-white px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Client</p>
                    <p className="text-sm font-bold text-slate-900">{exchange.clientName}</p>
                  </div>
                  <span className={cn('px-2 py-1 rounded-md text-xs font-semibold border', sc.bg, sc.text, sc.border)}>
                    {exchange.stage}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Exchange Value', value: formatCurrency(exchange.fundsAmount) },
                    { label: 'Escrow Status', value: exchange.escrowStatus },
                    {
                      label: '45-Day Deadline',
                      value: formatDate(exchange.deadline45Day),
                      sub: !isCompleted && d45 >= 0 ? `${d45}d remaining` : 'Passed',
                      urgent: !isCompleted && d45 >= 0 && d45 <= 10,
                    },
                    {
                      label: '180-Day Deadline',
                      value: formatDate(exchange.deadline180Day),
                      sub: !isCompleted && d180 >= 0 ? `${d180}d remaining` : 'Passed',
                      urgent: !isCompleted && d180 >= 0 && d180 <= 10,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        'p-2.5 rounded-lg border text-xs',
                        item.urgent
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-slate-50 border-slate-100'
                      )}
                    >
                      <p className={cn('font-medium mb-0.5', item.urgent ? 'text-rose-500' : 'text-slate-400')}>
                        {item.label}
                      </p>
                      <p className={cn('font-bold', item.urgent ? 'text-rose-700' : 'text-slate-800')}>
                        {item.value}
                      </p>
                      {item.sub && (
                        <p className={cn('text-xs mt-0.5', item.urgent ? 'text-rose-500' : 'text-slate-500')}>
                          {item.sub}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Disclaimer strip */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <strong>Disclaimer:</strong> For informational purposes only. Not tax or legal advice. Consult your qualified advisors.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          {!generated ? (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 md:flex-none"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Status Report
                </>
              )}
            </Button>
          ) : (
            <>
              {/* Copy link */}
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 md:flex-none"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Copy Tokenized Live Link
                  </>
                )}
              </Button>

              {/* Download PDF */}
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex-1 md:flex-none"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Building PDF…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </>
                )}
              </Button>
            </>
          )}

          {link && (
            <div className="text-xs text-slate-400 truncate max-w-xs hidden md:block">
              {link}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
