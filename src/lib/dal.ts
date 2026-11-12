/**
 * Data Access Layer — all DB reads/writes go through here.
 * Returns typed objects that match the existing frontend types.
 */
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import {
  QIEntity, Partner, Exchange, Milestone,
  ExchangeStage, EscrowStatus, PartnerType, ArtifactLog,
} from '@/types';

// ── Row types (raw SQLite rows) ──────────────────────────────────────────────

interface QIRow {
  id: string; name: string; logo_initials: string; primary_color: string;
  logo_path: string | null;
  website: string; phone: string; email: string; address: string;
}
interface PartnerRow {
  id: string; organization_name: string; type: string; logo_initials: string;
  primary_color: string; logo_path: string | null; contact_name: string;
  contact_email: string; contact_phone: string; website: string;
  address: string; joined_date: string;
}
interface ExchangeRow {
  id: string; client_name: string; client_email: string; partner_id: string;
  stage: string; prop_address: string; prop_city: string; prop_state: string;
  prop_type: string; sale_price: number; relinquished_date: string;
  rep_address: string | null; rep_city: string | null; rep_state: string | null;
  rep_type: string | null; rep_price: number | null;
  closing_date: string; deadline_45_day: string; deadline_180_day: string;
  escrow_status: string; escrow_notes: string; at_risk: number;
  funds_amount: number; created_at: string;
}
interface MilestoneRow {
  id: string; exchange_id: string; label: string; date: string;
  completed: number; current: number; sort_order: number;
}
interface ArtifactLogRow {
  id: string; partner_id: string; exchange_id: string; action: string; timestamp: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapQI(row: QIRow): QIEntity {
  return {
    id: row.id, name: row.name, logoInitials: row.logo_initials,
    primaryColor: row.primary_color,
    logoPath: row.logo_path ?? undefined,
    website: row.website, phone: row.phone, email: row.email, address: row.address,
  };
}

function mapPartner(row: PartnerRow): Partner {
  return {
    id: row.id, organizationName: row.organization_name,
    type: row.type as PartnerType, logoInitials: row.logo_initials,
    primaryColor: row.primary_color,
    logoPath: row.logo_path ?? undefined,
    contactName: row.contact_name, contactEmail: row.contact_email,
    contactPhone: row.contact_phone, website: row.website,
    address: row.address, joinedDate: row.joined_date,
  };
}

function mapMilestone(row: MilestoneRow): Milestone {
  return {
    label: row.label, date: row.date,
    completed: row.completed === 1, current: row.current === 1,
  };
}

function mapExchange(row: ExchangeRow, milestones: Milestone[]): Exchange {
  return {
    id: row.id, clientName: row.client_name, clientEmail: row.client_email,
    partnerId: row.partner_id, stage: row.stage as ExchangeStage,
    propertyDetails: {
      address: row.prop_address, city: row.prop_city, state: row.prop_state,
      propertyType: row.prop_type, salePrice: row.sale_price,
      relinquishedDate: row.relinquished_date,
      replacementAddress: row.rep_address ?? undefined,
      replacementCity: row.rep_city ?? undefined,
      replacementState: row.rep_state ?? undefined,
      replacementPropertyType: row.rep_type ?? undefined,
      replacementPrice: row.rep_price ?? undefined,
    },
    closingDate: row.closing_date,
    deadline45Day: row.deadline_45_day,
    deadline180Day: row.deadline_180_day,
    escrowStatus: row.escrow_status as EscrowStatus,
    escrowNotes: row.escrow_notes,
    atRisk: row.at_risk === 1,
    fundsAmount: row.funds_amount,
    createdAt: row.created_at,
    milestones,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function getQI(): QIEntity {
  const row = db.prepare('SELECT * FROM qi_entity LIMIT 1').get() as QIRow;
  return mapQI(row);
}

export function getAllPartners(): Partner[] {
  const rows = db.prepare('SELECT * FROM partners ORDER BY organization_name').all() as PartnerRow[];
  return rows.map(mapPartner);
}

export function getPartnerById(id: string): Partner | null {
  const row = db.prepare('SELECT * FROM partners WHERE id = ?').get(id) as PartnerRow | undefined;
  return row ? mapPartner(row) : null;
}

function getMilestonesForExchange(exchangeId: string): Milestone[] {
  const rows = db.prepare(
    'SELECT * FROM milestones WHERE exchange_id = ? ORDER BY sort_order'
  ).all(exchangeId) as MilestoneRow[];
  return rows.map(mapMilestone);
}

export function getAllExchanges(): Exchange[] {
  const rows = db.prepare('SELECT * FROM exchanges ORDER BY created_at DESC').all() as ExchangeRow[];
  return rows.map((r) => mapExchange(r, getMilestonesForExchange(r.id)));
}

export function getExchangesByPartner(partnerId: string): Exchange[] {
  const rows = db.prepare(
    'SELECT * FROM exchanges WHERE partner_id = ? ORDER BY created_at DESC'
  ).all(partnerId) as ExchangeRow[];
  return rows.map((r) => mapExchange(r, getMilestonesForExchange(r.id)));
}

export function getExchangeById(id: string): Exchange | null {
  const row = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id) as ExchangeRow | undefined;
  if (!row) return null;
  return mapExchange(row, getMilestonesForExchange(row.id));
}

export function getAllArtifactLogs(): ArtifactLog[] {
  const rows = db.prepare(
    'SELECT * FROM artifact_logs ORDER BY timestamp DESC'
  ).all() as ArtifactLogRow[];
  return rows.map((r) => ({
    id: r.id, partnerId: r.partner_id, exchangeId: r.exchange_id,
    action: r.action as ArtifactLog['action'], timestamp: r.timestamp,
  }));
}

export function getArtifactLogsByPartner(partnerId: string): ArtifactLog[] {
  const rows = db.prepare(
    'SELECT * FROM artifact_logs WHERE partner_id = ? ORDER BY timestamp DESC'
  ).all(partnerId) as ArtifactLogRow[];
  return rows.map((r) => ({
    id: r.id, partnerId: r.partner_id, exchangeId: r.exchange_id,
    action: r.action as ArtifactLog['action'], timestamp: r.timestamp,
  }));
}

// ── Writes ───────────────────────────────────────────────────────────────────

export function insertArtifactLog(
  partnerId: string,
  exchangeId: string,
  action: ArtifactLog['action']
): ArtifactLog {
  const log = {
    id: uuidv4(),
    partner_id: partnerId,
    exchange_id: exchangeId,
    action,
    timestamp: new Date().toISOString(),
  };
  db.prepare(`
    INSERT INTO artifact_logs (id, partner_id, exchange_id, action, timestamp)
    VALUES (@id, @partner_id, @exchange_id, @action, @timestamp)
  `).run(log);
  return {
    id: log.id, partnerId: log.partner_id, exchangeId: log.exchange_id,
    action: log.action as ArtifactLog['action'], timestamp: log.timestamp,
  };
}
