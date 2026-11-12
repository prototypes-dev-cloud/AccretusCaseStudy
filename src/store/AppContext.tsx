'use client';

import React, {
  createContext, useContext, useReducer, useEffect,
  ReactNode, useState,
} from 'react';
import { AppState, ArtifactLog, Partner, UserRole, QIEntity, Exchange } from '@/types';

// ── Default / loading state ──────────────────────────────────────────────────

const DEFAULT_QI: QIEntity = {
  id: 'qi-ade', name: 'Atlanta Deferred Exchange', logoInitials: 'ADE',
  primaryColor: '#1e3a5f', website: '', phone: '', email: '', address: '',
};

const EMPTY_STATE: AppState = {
  currentUser: { role: 'Partner User', partnerId: 'partner-1', name: 'Sarah Mitchell, CPA' },
  qi: DEFAULT_QI,
  partners: [],
  exchanges: [],
  artifactLogs: [],
};

// ── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ROLE'; role: UserRole; partnerId: string | null; name: string }
  | { type: 'SWITCH_PARTNER'; partnerId: string; partners: Partner[] }
  | { type: 'LOG_ARTIFACT_LOCAL'; log: ArtifactLog }
  | { type: 'BOOTSTRAP'; qi: QIEntity; partners: Partner[]; exchanges: Exchange[]; artifactLogs: ArtifactLog[] }
  | { type: 'SET_EXCHANGES'; exchanges: Exchange[] }
  | { type: 'SET_LOGS'; logs: ArtifactLog[] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'BOOTSTRAP':
      return {
        ...state,
        qi: action.qi,
        partners: action.partners,
        exchanges: action.exchanges,
        artifactLogs: action.artifactLogs,
      };
    case 'SET_EXCHANGES':
      return { ...state, exchanges: action.exchanges };
    case 'SET_LOGS':
      return { ...state, artifactLogs: action.logs };
    case 'SET_ROLE':
      return {
        ...state,
        currentUser: { role: action.role, partnerId: action.partnerId, name: action.name },
      };
    case 'SWITCH_PARTNER': {
      const partner = action.partners.find((p) => p.id === action.partnerId);
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          partnerId: action.partnerId,
          name: partner?.contactName ?? state.currentUser.name,
        },
      };
    }
    case 'LOG_ARTIFACT_LOCAL':
      return { ...state, artifactLogs: [action.log, ...state.artifactLogs] };
    default:
      return state;
  }
}

// ── Auth headers helper ───────────────────────────────────────────────────────
// Every API request must include these headers. The backend enforces scoping
// based on them — query params and body fields are NOT trusted for access control.

function authHeaders(role: UserRole, partnerId: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Role': role,
  };
  if (role === 'Partner User' && partnerId) {
    headers['X-Partner-Id'] = partnerId;
  }
  return headers;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentPartner: Partner | null;
  // visibleExchanges is now exactly what the backend returned for this identity —
  // no frontend filtering needed or applied.
  visibleExchanges: Exchange[];
  loading: boolean;
  refreshExchanges: () => Promise<void>;
  logArtifact: (partnerId: string, exchangeId: string, action: ArtifactLog['action']) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  const { role, partnerId } = state.currentUser;

  // ── Bootstrap: load all data from DB via API (identity enforced server-side) ──
  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const res = await fetch('/api/bootstrap', {
          headers: authHeaders(role, partnerId),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        dispatch({
          type: 'BOOTSTRAP',
          qi: data.qi,
          partners: data.partners,
          exchanges: data.exchanges,
          artifactLogs: data.artifactLogs,
        });
      } catch (err) {
        console.error('[AppContext] bootstrap error:', err);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [role, partnerId]);

  // ── Refresh exchanges from DB ─────────────────────────────────────────────
  const refreshExchanges = async () => {
    const res = await fetch('/api/exchanges', {
      headers: authHeaders(role, partnerId),
    });
    if (res.ok) {
      const exchanges = await res.json();
      dispatch({ type: 'SET_EXCHANGES', exchanges });
    }
  };

  // ── Log artifact action — backend validates ownership, then writes to DB ──
  const logArtifact = async (
    logPartnerId: string,
    exchangeId: string,
    action: ArtifactLog['action']
  ) => {
    try {
      const res = await fetch('/api/artifact-logs', {
        method: 'POST',
        headers: authHeaders(role, partnerId),
        body: JSON.stringify({ partnerId: logPartnerId, exchangeId, action }),
      });
      if (res.ok) {
        const log: ArtifactLog = await res.json();
        dispatch({ type: 'LOG_ARTIFACT_LOCAL', log });
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[logArtifact] rejected:', err.error ?? res.status);
      }
    } catch (err) {
      console.error('[AppContext] logArtifact error:', err);
    }
  };

  const currentPartner =
    role === 'Partner User' && partnerId
      ? state.partners.find((p) => p.id === partnerId) ?? null
      : null;

  // No frontend filtering — the backend already returned only what this identity
  // is authorised to see. visibleExchanges === state.exchanges.
  const visibleExchanges = state.exchanges;

  return (
    <AppContext.Provider
      value={{ state, dispatch, currentPartner, visibleExchanges, loading, refreshExchanges, logArtifact }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
