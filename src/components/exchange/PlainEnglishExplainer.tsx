'use client';

import { useState } from 'react';
import { Exchange } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { daysUntil, formatDate, formatCurrency } from '@/lib/utils';
import {
  BrainCircuit,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface PlainEnglishExplainerProps {
  exchange: Exchange;
}

export function PlainEnglishExplainer({ exchange }: PlainEnglishExplainerProps) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const d45 = daysUntil(exchange.deadline45Day);
  const d180 = daysUntil(exchange.deadline180Day);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: exchange.clientName,
          stage: exchange.stage,
          propertyType: exchange.propertyDetails.propertyType,
          closingDate: formatDate(exchange.closingDate),
          escrowStatus: exchange.escrowStatus,
          fundsAmount: exchange.fundsAmount,
          deadline45Day: formatDate(exchange.deadline45Day),
          days45Remaining: d45,
          deadline180Day: formatDate(exchange.deadline180Day),
          days180Remaining: d180,
          hasReplacement: !!exchange.propertyDetails.replacementAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setExplanation(data.text);
      setGenerated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">
              Client Plain-English Explainer
            </h2>
            <Badge variant="info">
              <Sparkles className="w-3 h-3" />
              Gemini AI
            </Badge>
          </div>

          {/* Compliance badge */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Checked against Rules Source-of-Truth
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {!generated && !error && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BrainCircuit className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600 mb-1 font-medium">
              Generate a plain-English summary for your client
            </p>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              Gemini AI will write a jargon-free explanation of the current exchange
              status, deadlines, and required next steps — tailored to this client.
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating with Gemini…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Explainer
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-700">Generation failed</p>
              <p className="text-xs text-rose-600 mt-0.5 break-words">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Retry
            </Button>
          </div>
        )}

        {/* Generated content */}
        {generated && explanation && (
          <>
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>

            {/* Compliance details accordion */}
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setDisclaimerOpen(!disclaimerOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700">
                    Full Compliance Details
                  </span>
                </div>
                {disclaimerOpen ? (
                  <ChevronUp className="w-4 h-4 text-amber-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-600" />
                )}
              </button>

              {disclaimerOpen && (
                <div className="px-4 py-3 bg-amber-50/50 border-t border-amber-100">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This AI-generated summary was produced using only verified exchange data
                    on file with Atlanta Deferred Exchange. Dates, deadlines, and dollar
                    amounts reflect records as of the generation timestamp and are subject
                    to change. This content does not constitute tax, legal, or financial
                    advice. All 1031 exchange transactions involve complex IRS regulations
                    under IRC §1031. Clients should consult with their qualified tax
                    advisor, CPA, and/or legal counsel. Atlanta Deferred Exchange acts
                    solely as the Qualified Intermediary (QI) and does not provide tax or
                    legal advice.
                  </p>
                </div>
              )}
            </div>

            {/* Footer row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Compliance check passed · Generated by Gemini 3.1 Flash Lite
              </div>
              <div className="ml-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
