import { clsx, type ClassValue } from 'clsx';
import { differenceInDays, format, parseISO, isValid } from 'date-fns';
import { Exchange, ExchangeStage } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return '—';
    return format(d, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return 999;
  try {
    const target = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(target, today);
  } catch {
    return 999;
  }
}

export function getStageColor(stage: ExchangeStage): {
  bg: string;
  text: string;
  border: string;
} {
  switch (stage) {
    case 'Initial Intake':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    case 'Document Review':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case '45-Day ID Window Active':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case '180-Day Close Active':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'Completed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
}

export function getDeadlinePillStyle(daysLeft: number): {
  bg: string;
  text: string;
} {
  if (daysLeft < 0) return { bg: 'bg-gray-100', text: 'text-gray-500' };
  if (daysLeft <= 5) return { bg: 'bg-red-100', text: 'text-red-700' };
  if (daysLeft <= 10) return { bg: 'bg-orange-100', text: 'text-orange-700' };
  if (daysLeft <= 20) return { bg: 'bg-amber-100', text: 'text-amber-700' };
  return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
}

export function getExchangeUrgencyScore(exchange: Exchange): number {
  const d45 = daysUntil(exchange.deadline45Day);
  const d180 = daysUntil(exchange.deadline180Day);
  if (exchange.stage === 'Completed') return 9999;
  if (exchange.atRisk) return -100 + Math.min(d45, d180);
  return Math.min(d45, d180);
}

export function generateTokenizedLink(exchangeId: string, partnerId: string): string {
  const token = btoa(`${exchangeId}:${partnerId}:${Date.now()}`).slice(0, 24);
  return `https://portal.atlantadeferredexchange.com/report/${token}`;
}

export function getPlainEnglishExplainer(exchange: Exchange): string {
  const d45 = daysUntil(exchange.deadline45Day);
  const d180 = daysUntil(exchange.deadline180Day);
  const clientFirstName = exchange.clientName.split(' ')[0];

  switch (exchange.stage) {
    case 'Initial Intake':
      return `${clientFirstName}, your property sale has just been reported to Atlanta Deferred Exchange. To qualify for tax deferral under IRC §1031, we're preparing your exchange documents. No action is needed from you yet — your dedicated QI team will reach out within 1 business day to review next steps. Your 45-day identification window will officially open once we confirm receipt of your sale proceeds.`;

    case 'Document Review':
      return `Your 1031 exchange is in the document review phase. Your exchange agreement is being finalized. Once executed, your 45-day identification clock will start. This means you will have exactly 45 days from your property closing date (${formatDate(exchange.closingDate)}) to formally identify up to 3 potential replacement properties in writing. Now is the time to work with your broker to shortlist candidates.`;

    case '45-Day ID Window Active':
      if (d45 <= 10) {
        return `⚠️ URGENT: ${clientFirstName}, you have only ${d45} day${d45 !== 1 ? 's' : ''} remaining to identify your replacement property. Under IRS rules, you must submit written identification of up to 3 replacement properties to Atlanta Deferred Exchange by ${formatDate(exchange.deadline45Day)} — no extensions are granted. Missing this deadline would disqualify your entire exchange and result in full recognition of capital gains. Please contact your partner immediately.`;
      }
      return `${clientFirstName}, your 45-day identification window is active. You have ${d45} days remaining (deadline: ${formatDate(exchange.deadline45Day)}) to identify your replacement property or properties in writing. You may designate up to 3 properties. Once identified, your team will submit the formal identification letter to Atlanta Deferred Exchange. Begin due diligence on your top candidates now.`;

    case '180-Day Close Active':
      if (d180 <= 10) {
        return `⚠️ URGENT: ${clientFirstName}, your 180-day exchange completion deadline is ${formatDate(exchange.deadline180Day)} — only ${d180} day${d180 !== 1 ? 's' : ''} away. You must close on your identified replacement property before this date. If the acquisition does not close in time, your exchange funds will be released back to you as taxable income. Coordinate with your attorney and lender to confirm the closing timeline immediately.`;
      }
      return `${clientFirstName}, your replacement property has been identified and you're in the final stretch. You have ${d180} days to close on your replacement property (deadline: ${formatDate(exchange.deadline180Day)}). Your exchange funds are safely held by Atlanta Deferred Exchange and will be wired directly to escrow at closing. Work with your team to finalize financing and schedule your closing.`;

    case 'Completed':
      return `${clientFirstName}, congratulations — your 1031 exchange has been successfully completed! Your replacement property acquisition closed on time and your capital gains tax has been deferred. Atlanta Deferred Exchange has disbursed all exchange funds to the appropriate parties. Your exchange file is now closed. Please consult your CPA for any remaining tax reporting obligations on IRS Form 8824.`;
  }
}
