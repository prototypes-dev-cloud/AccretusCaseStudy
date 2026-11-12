'use client';

import { useState } from 'react';
import { AppProvider } from '@/store/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { ExchangeDetail } from '@/components/exchange/ExchangeDetail';
import { ArtifactAnalyticsPage } from '@/components/artifacts/ArtifactAnalyticsPage';
import { PartnersPage } from '@/components/partners/PartnersPage';
import { ArtifactModal } from '@/components/artifacts/ArtifactModal';
import { ExchangeTable } from '@/components/dashboard/ExchangeTable';
import { useApp } from '@/store/AppContext';
import { ArrowLeftRight, Building2, Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'exchanges' | 'exchange-detail' | 'artifacts' | 'partners';

function AppShell() {
  const { state, loading } = useApp();
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(null);
  const [artifactExchangeId, setArtifactExchangeId] = useState<string | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  const navigate = (page: string, exchangeId?: string) => {
    if (page === 'exchange-detail' && exchangeId) {
      setSelectedExchangeId(exchangeId);
      setActivePage('exchange-detail');
    } else {
      setActivePage(page as Page);
    }
  };

  const openArtifact = (id: string) => {
    setArtifactExchangeId(id);
    setIsArtifactOpen(true);
  };

  const isAdmin = state.currentUser.role === 'QI Admin';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-[#0f1f35] rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">ADE Partner Hub</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading exchange data…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        activePage={activePage === 'exchange-detail' ? 'exchanges' : activePage}
        onNavigate={navigate}
      />

      <main className="flex-1 overflow-y-auto">
        {activePage === 'dashboard' && (
          <DashboardPage
            onViewExchange={(id) => navigate('exchange-detail', id)}
            onGenerateArtifact={openArtifact}
          />
        )}

        {activePage === 'exchanges' && (
          <div className="p-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-slate-400" />
                Exchange Portfolio
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isAdmin
                  ? 'All exchanges across all partner organizations'
                  : 'Your assigned client exchanges'}
              </p>
            </div>
            <ExchangeTable
              onViewExchange={(id) => navigate('exchange-detail', id)}
              onGenerateArtifact={openArtifact}
            />
          </div>
        )}

        {activePage === 'exchange-detail' && selectedExchangeId && (
          <ExchangeDetail
            exchangeId={selectedExchangeId}
            onBack={() => navigate('exchanges')}
            onGenerateArtifact={openArtifact}
          />
        )}

        {activePage === 'artifacts' && (
          <ArtifactAnalyticsPage onGenerateForExchange={openArtifact} />
        )}

        {activePage === 'partners' && isAdmin && <PartnersPage />}
      </main>

      <ArtifactModal
        exchangeId={artifactExchangeId}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
