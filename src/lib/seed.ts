import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

function daysFromRef(days: number): string {
  const d = new Date('2026-11-10');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function daysBeforeRef(days: number): string {
  return daysFromRef(-days);
}

interface MilestoneSeed {
  label: string;
  date: string;
  completed: boolean;
  current: boolean;
}

function buildMilestones(
  closingDate: string,
  d45: string,
  d180: string,
  stage: string
): MilestoneSeed[] {
  const stageOrder = [
    'Initial Intake',
    'Document Review',
    '45-Day ID Window Active',
    '180-Day Close Active',
    'Completed',
  ];
  const idx = stageOrder.indexOf(stage);
  return [
    { label: 'Relinquished Property Closed', date: closingDate, completed: idx >= 0, current: idx === 0 },
    { label: 'Exchange Documents Executed', date: daysFromRef(-38), completed: idx >= 1, current: idx === 1 },
    { label: '45-Day Identification Deadline', date: d45, completed: idx >= 3, current: idx === 2 },
    { label: 'Replacement Property Under Contract', date: daysFromRef(-8), completed: idx >= 4, current: idx === 3 },
    { label: '180-Day Exchange Completion', date: d180, completed: idx >= 4, current: idx === 4 },
  ];
}

export function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM qi_entity').get() as { cnt: number };
  if (existing.cnt > 0) return; // already seeded

  console.log('[seed] Seeding database…');

  const insertQI = db.prepare(`
    INSERT INTO qi_entity (id, name, logo_initials, primary_color, logo_path, website, phone, email, address)
    VALUES (@id, @name, @logo_initials, @primary_color, @logo_path, @website, @phone, @email, @address)
  `);

  const insertPartner = db.prepare(`
    INSERT INTO partners (id, organization_name, type, logo_initials, primary_color, logo_path, contact_name, contact_email, contact_phone, website, address, joined_date)
    VALUES (@id, @organization_name, @type, @logo_initials, @primary_color, @logo_path, @contact_name, @contact_email, @contact_phone, @website, @address, @joined_date)
  `);

  const insertExchange = db.prepare(`
    INSERT INTO exchanges (
      id, client_name, client_email, partner_id, stage,
      prop_address, prop_city, prop_state, prop_type, sale_price, relinquished_date,
      rep_address, rep_city, rep_state, rep_type, rep_price,
      closing_date, deadline_45_day, deadline_180_day,
      escrow_status, escrow_notes, at_risk, funds_amount, created_at
    ) VALUES (
      @id, @client_name, @client_email, @partner_id, @stage,
      @prop_address, @prop_city, @prop_state, @prop_type, @sale_price, @relinquished_date,
      @rep_address, @rep_city, @rep_state, @rep_type, @rep_price,
      @closing_date, @deadline_45_day, @deadline_180_day,
      @escrow_status, @escrow_notes, @at_risk, @funds_amount, @created_at
    )
  `);

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (id, exchange_id, label, date, completed, current, sort_order)
    VALUES (@id, @exchange_id, @label, @date, @completed, @current, @sort_order)
  `);

  const runAll = db.transaction(() => {
    // ── QI Entity ──
    insertQI.run({
      id: 'qi-ade',
      name: 'Atlanta Deferred Exchange',
      logo_initials: 'ADE',
      primary_color: '#1e3a5f',
      logo_path: 'logos/ade-qi.svg',
      website: 'www.atlantadeferredexchange.com',
      phone: '(404) 555-0100',
      email: 'info@atlantadeferredexchange.com',
      address: '1200 Peachtree St NE, Suite 800, Atlanta, GA 30309',
    });

    // ── Partners ──
    const partners = [
      {
        id: 'partner-1',
        organization_name: 'Apex CPA Group',
        type: 'CPA',
        logo_initials: 'ACG',
        primary_color: '#0f4c81',
        logo_path: 'logos/apex-cpa.svg',
        contact_name: 'Sarah Mitchell, CPA',
        contact_email: 'smitchell@apexcpagroup.com',
        contact_phone: '(404) 555-0201',
        website: 'www.apexcpagroup.com',
        address: '300 Galleria Pkwy SE, Suite 1200, Atlanta, GA 30339',
        joined_date: '2024-03-15',
      },
      {
        id: 'partner-2',
        organization_name: 'Meridian Real Estate Law',
        type: 'Real Estate Attorney',
        logo_initials: 'MRL',
        primary_color: '#7c3aed',
        logo_path: 'logos/meridian-law.svg',
        contact_name: 'James Thornton, Esq.',
        contact_email: 'jthornton@meridianrelaw.com',
        contact_phone: '(404) 555-0302',
        website: 'www.meridianrelaw.com',
        address: '191 Peachtree Tower, Suite 3800, Atlanta, GA 30303',
        joined_date: '2024-06-01',
      },
      {
        id: 'partner-3',
        organization_name: 'Vanguard Commercial Brokerage',
        type: 'CRE Broker',
        logo_initials: 'VCB',
        primary_color: '#065f46',
        logo_path: 'logos/vanguard-cre.svg',
        contact_name: 'Marcus Webb',
        contact_email: 'mwebb@vanguardcre.com',
        contact_phone: '(404) 555-0403',
        website: 'www.vanguardcre.com',
        address: '3344 Peachtree Rd NE, Suite 500, Atlanta, GA 30326',
        joined_date: '2025-01-10',
      },
    ];
    partners.forEach((p) => insertPartner.run(p));

    // ── Exchanges ──
    type ExchangeSeed = {
      id: string; client_name: string; client_email: string; partner_id: string; stage: string;
      prop_address: string; prop_city: string; prop_state: string; prop_type: string;
      sale_price: number; relinquished_date: string;
      rep_address: string | null; rep_city: string | null; rep_state: string | null;
      rep_type: string | null; rep_price: number | null;
      closing_date: string; deadline_45_day: string; deadline_180_day: string;
      escrow_status: string; escrow_notes: string; at_risk: number; funds_amount: number; created_at: string;
    };

    const exchanges: ExchangeSeed[] = [
      // ── Apex CPA Group ──
      {
        id: 'exch-001', client_name: 'Robert & Linda Hargrove', client_email: 'rhargrove@email.com',
        partner_id: 'partner-1', stage: '45-Day ID Window Active',
        prop_address: '742 Evergreen Terrace', prop_city: 'Marietta', prop_state: 'GA', prop_type: 'Commercial Office',
        sale_price: 1850000, relinquished_date: daysBeforeRef(28),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(28), deadline_45_day: daysFromRef(17), deadline_180_day: daysFromRef(152),
        escrow_status: 'Verified', escrow_notes: 'Wire confirmed $1,850,000. EW#2026-1041.',
        at_risk: 0, funds_amount: 1850000, created_at: daysBeforeRef(28),
      },
      {
        id: 'exch-002', client_name: 'Patricia Nguyen', client_email: 'pnguyen@email.com',
        partner_id: 'partner-1', stage: '45-Day ID Window Active',
        prop_address: '1120 Roswell Rd', prop_city: 'Sandy Springs', prop_state: 'GA', prop_type: 'Multifamily',
        sale_price: 3200000, relinquished_date: daysBeforeRef(39),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(39), deadline_45_day: daysFromRef(6), deadline_180_day: daysFromRef(141),
        escrow_status: 'Verified', escrow_notes: 'Funds held at ADE. Wire #2026-1038.',
        at_risk: 1, funds_amount: 3200000, created_at: daysBeforeRef(39),
      },
      {
        id: 'exch-003', client_name: 'Thompson Family Trust', client_email: 'trust@thompsonfamily.com',
        partner_id: 'partner-1', stage: '180-Day Close Active',
        prop_address: '455 Pharr Rd NE', prop_city: 'Atlanta', prop_state: 'GA', prop_type: 'Retail Strip',
        sale_price: 2100000, relinquished_date: daysBeforeRef(68),
        rep_address: '880 Holcomb Bridge Rd', rep_city: 'Roswell', rep_state: 'GA', rep_type: 'Mixed-Use', rep_price: 2350000,
        closing_date: daysBeforeRef(68), deadline_45_day: daysBeforeRef(23), deadline_180_day: daysFromRef(112),
        escrow_status: 'Verified', escrow_notes: 'Funds verified. Replacement property identified.',
        at_risk: 0, funds_amount: 2100000, created_at: daysBeforeRef(68),
      },
      {
        id: 'exch-004', client_name: 'Gerald & Susan Park', client_email: 'gspark@email.com',
        partner_id: 'partner-1', stage: '180-Day Close Active',
        prop_address: '2200 Lake Park Dr', prop_city: 'Smyrna', prop_state: 'GA', prop_type: 'Industrial Warehouse',
        sale_price: 4750000, relinquished_date: daysBeforeRef(90),
        rep_address: '5000 Kings Hwy', rep_city: 'Peachtree City', rep_state: 'GA', rep_type: 'Industrial', rep_price: 5200000,
        closing_date: daysBeforeRef(90), deadline_45_day: daysBeforeRef(45), deadline_180_day: daysFromRef(8),
        escrow_status: 'Verified', escrow_notes: 'Replacement identified. Closing scheduled.',
        at_risk: 1, funds_amount: 4750000, created_at: daysBeforeRef(90),
      },
      {
        id: 'exch-005', client_name: 'Oakridge Properties LLC', client_email: 'admin@oakridgeprop.com',
        partner_id: 'partner-1', stage: 'Document Review',
        prop_address: '321 Peachtree Industrial Blvd', prop_city: 'Duluth', prop_state: 'GA', prop_type: 'Commercial Office',
        sale_price: 1200000, relinquished_date: daysBeforeRef(5),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(5), deadline_45_day: daysFromRef(40), deadline_180_day: daysFromRef(175),
        escrow_status: 'Pending', escrow_notes: 'Awaiting wire confirmation from title company.',
        at_risk: 0, funds_amount: 1200000, created_at: daysBeforeRef(5),
      },
      {
        id: 'exch-006', client_name: 'Beverly Carter', client_email: 'bcarter@email.com',
        partner_id: 'partner-1', stage: 'Completed',
        prop_address: '890 Windward Pkwy', prop_city: 'Alpharetta', prop_state: 'GA', prop_type: 'Net Lease Retail',
        sale_price: 2900000, relinquished_date: daysBeforeRef(200),
        rep_address: '1500 Mansell Rd', rep_city: 'Alpharetta', rep_state: 'GA', rep_type: 'Net Lease Retail', rep_price: 3050000,
        closing_date: daysBeforeRef(200), deadline_45_day: daysBeforeRef(155), deadline_180_day: daysBeforeRef(20),
        escrow_status: 'Verified', escrow_notes: 'Exchange completed successfully. File closed.',
        at_risk: 0, funds_amount: 2900000, created_at: daysBeforeRef(200),
      },
      {
        id: 'exch-007', client_name: 'Waverly Investments Inc.', client_email: 'admin@waverlyinv.com',
        partner_id: 'partner-1', stage: 'Completed',
        prop_address: '1050 Crown Pointe Pkwy', prop_city: 'Dunwoody', prop_state: 'GA', prop_type: 'Multifamily',
        sale_price: 6400000, relinquished_date: daysBeforeRef(250),
        rep_address: '400 Perimeter Center Ter', rep_city: 'Atlanta', rep_state: 'GA', rep_type: 'Multifamily', rep_price: 6800000,
        closing_date: daysBeforeRef(250), deadline_45_day: daysBeforeRef(205), deadline_180_day: daysBeforeRef(70),
        escrow_status: 'Verified', escrow_notes: 'Completed. Final disbursement confirmed.',
        at_risk: 0, funds_amount: 6400000, created_at: daysBeforeRef(250),
      },
      {
        id: 'exch-008', client_name: 'Fairview Holdings LLC', client_email: 'legal@fairviewhold.com',
        partner_id: 'partner-1', stage: 'Initial Intake',
        prop_address: '630 Old Peachtree Rd', prop_city: 'Lawrenceville', prop_state: 'GA', prop_type: 'Retail',
        sale_price: 980000, relinquished_date: daysBeforeRef(2),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(2), deadline_45_day: daysFromRef(43), deadline_180_day: daysFromRef(178),
        escrow_status: 'Pending', escrow_notes: 'Initial intake submitted. Awaiting documents.',
        at_risk: 0, funds_amount: 980000, created_at: daysBeforeRef(2),
      },
      // ── Meridian Real Estate Law ──
      {
        id: 'exch-009', client_name: 'Dr. Alan & Priya Rosen', client_email: 'arosen@email.com',
        partner_id: 'partner-2', stage: '45-Day ID Window Active',
        prop_address: '2450 Cumberland Pkwy', prop_city: 'Atlanta', prop_state: 'GA', prop_type: 'Medical Office',
        sale_price: 3800000, relinquished_date: daysBeforeRef(30),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(30), deadline_45_day: daysFromRef(15), deadline_180_day: daysFromRef(150),
        escrow_status: 'Verified', escrow_notes: 'Wire #2026-1044 confirmed.',
        at_risk: 0, funds_amount: 3800000, created_at: daysBeforeRef(30),
      },
      {
        id: 'exch-010', client_name: 'Brentwood Capital Partners', client_email: 'deals@brentwoodcap.com',
        partner_id: 'partner-2', stage: '180-Day Close Active',
        prop_address: '800 Battery Ave SE', prop_city: 'Atlanta', prop_state: 'GA', prop_type: 'Mixed-Use',
        sale_price: 8500000, relinquished_date: daysBeforeRef(100),
        rep_address: '1000 Marietta St NW', rep_city: 'Atlanta', rep_state: 'GA', rep_type: 'Mixed-Use', rep_price: 9200000,
        closing_date: daysBeforeRef(100), deadline_45_day: daysBeforeRef(55), deadline_180_day: daysFromRef(80),
        escrow_status: 'Verified', escrow_notes: 'Replacement property identified and under contract.',
        at_risk: 0, funds_amount: 8500000, created_at: daysBeforeRef(100),
      },
      {
        id: 'exch-011', client_name: 'Sandra & Keith Monroe', client_email: 'smonroe@email.com',
        partner_id: 'partner-2', stage: 'Document Review',
        prop_address: '550 Pharr Rd NE', prop_city: 'Buckhead', prop_state: 'GA', prop_type: 'Retail',
        sale_price: 1650000, relinquished_date: daysBeforeRef(8),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(8), deadline_45_day: daysFromRef(37), deadline_180_day: daysFromRef(172),
        escrow_status: 'Pending', escrow_notes: 'Awaiting executed exchange agreement.',
        at_risk: 0, funds_amount: 1650000, created_at: daysBeforeRef(8),
      },
      {
        id: 'exch-012', client_name: 'TerraVest Group LLC', client_email: 'ops@terravest.com',
        partner_id: 'partner-2', stage: '45-Day ID Window Active',
        prop_address: '4400 Ashford Dunwoody Rd', prop_city: 'Dunwoody', prop_state: 'GA', prop_type: 'Commercial Office',
        sale_price: 5600000, relinquished_date: daysBeforeRef(42),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(42), deadline_45_day: daysFromRef(3), deadline_180_day: daysFromRef(138),
        escrow_status: 'Verified', escrow_notes: 'Funds secured. Identification letters pending.',
        at_risk: 1, funds_amount: 5600000, created_at: daysBeforeRef(42),
      },
      {
        id: 'exch-013', client_name: 'Clearwater Asset Group', client_email: 'info@clearwaterasset.com',
        partner_id: 'partner-2', stage: 'Completed',
        prop_address: '1750 Century Blvd NE', prop_city: 'Atlanta', prop_state: 'GA', prop_type: 'Industrial',
        sale_price: 7300000, relinquished_date: daysBeforeRef(210),
        rep_address: '1700 Montreal Rd', rep_city: 'Tucker', rep_state: 'GA', rep_type: 'Industrial', rep_price: 7900000,
        closing_date: daysBeforeRef(210), deadline_45_day: daysBeforeRef(165), deadline_180_day: daysBeforeRef(30),
        escrow_status: 'Verified', escrow_notes: 'Exchange completed and closed.',
        at_risk: 0, funds_amount: 7300000, created_at: daysBeforeRef(210),
      },
      {
        id: 'exch-014', client_name: 'Northgate REIT Partners', client_email: 'admin@northgatereit.com',
        partner_id: 'partner-2', stage: '180-Day Close Active',
        prop_address: '2100 Powers Ferry Rd', prop_city: 'Marietta', prop_state: 'GA', prop_type: 'Class A Office',
        sale_price: 12000000, relinquished_date: daysBeforeRef(110),
        rep_address: '1 Concourse Pkwy', rep_city: 'Atlanta', rep_state: 'GA', rep_type: 'Class A Office', rep_price: 13500000,
        closing_date: daysBeforeRef(110), deadline_45_day: daysBeforeRef(65), deadline_180_day: daysFromRef(70),
        escrow_status: 'Verified', escrow_notes: 'Replacement under contract. Final diligence ongoing.',
        at_risk: 0, funds_amount: 12000000, created_at: daysBeforeRef(110),
      },
      {
        id: 'exch-015', client_name: 'Helena & George Papadakis', client_email: 'gpapadakis@email.com',
        partner_id: 'partner-2', stage: 'Initial Intake',
        prop_address: '340 E Paces Ferry Rd NE', prop_city: 'Atlanta', prop_state: 'GA', prop_type: 'Residential Income',
        sale_price: 820000, relinquished_date: daysBeforeRef(1),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(1), deadline_45_day: daysFromRef(44), deadline_180_day: daysFromRef(179),
        escrow_status: 'Pending', escrow_notes: 'New intake. Documents requested.',
        at_risk: 0, funds_amount: 820000, created_at: daysBeforeRef(1),
      },
      // ── Vanguard Commercial Brokerage ──
      {
        id: 'exch-016', client_name: 'Sunrise Logistics LLC', client_email: 'ops@sunriselog.com',
        partner_id: 'partner-3', stage: '45-Day ID Window Active',
        prop_address: '6500 McDonough Dr', prop_city: 'Norcross', prop_state: 'GA', prop_type: 'Industrial Flex',
        sale_price: 2750000, relinquished_date: daysBeforeRef(35),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(35), deadline_45_day: daysFromRef(10), deadline_180_day: daysFromRef(145),
        escrow_status: 'Verified', escrow_notes: 'Funds confirmed. Broker sourcing replacement options.',
        at_risk: 0, funds_amount: 2750000, created_at: daysBeforeRef(35),
      },
      {
        id: 'exch-017', client_name: 'Premier Storage Group Inc.', client_email: 'finance@premierstorage.com',
        partner_id: 'partner-3', stage: '180-Day Close Active',
        prop_address: '800 Dekalb Industrial Way', prop_city: 'Decatur', prop_state: 'GA', prop_type: 'Self-Storage',
        sale_price: 4100000, relinquished_date: daysBeforeRef(95),
        rep_address: '2200 Bouldercrest Rd', rep_city: 'Atlanta', rep_state: 'GA', rep_type: 'Self-Storage', rep_price: 4600000,
        closing_date: daysBeforeRef(95), deadline_45_day: daysBeforeRef(50), deadline_180_day: daysFromRef(85),
        escrow_status: 'Verified', escrow_notes: 'Replacement under LOI. Due diligence period.',
        at_risk: 0, funds_amount: 4100000, created_at: daysBeforeRef(95),
      },
      {
        id: 'exch-018', client_name: 'Peachtree NNN Fund LP', client_email: 'fund@peachtreennn.com',
        partner_id: 'partner-3', stage: 'Completed',
        prop_address: '100 Embassy Suites Dr', prop_city: 'Kennesaw', prop_state: 'GA', prop_type: 'Net Lease',
        sale_price: 9200000, relinquished_date: daysBeforeRef(230),
        rep_address: '5120 Sugarloaf Pkwy', rep_city: 'Lawrenceville', rep_state: 'GA', rep_type: 'Net Lease', rep_price: 9800000,
        closing_date: daysBeforeRef(230), deadline_45_day: daysBeforeRef(185), deadline_180_day: daysBeforeRef(50),
        escrow_status: 'Verified', escrow_notes: 'Completed. Disbursement confirmed June 2026.',
        at_risk: 0, funds_amount: 9200000, created_at: daysBeforeRef(230),
      },
      {
        id: 'exch-019', client_name: 'RiverStone Development Co.', client_email: 'dev@riverstonedev.com',
        partner_id: 'partner-3', stage: 'Document Review',
        prop_address: '1800 Riverside Pkwy', prop_city: 'Lawrenceville', prop_state: 'GA', prop_type: 'Land / Development',
        sale_price: 3300000, relinquished_date: daysBeforeRef(10),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(10), deadline_45_day: daysFromRef(35), deadline_180_day: daysFromRef(170),
        escrow_status: 'Pending', escrow_notes: 'QI agreement circulated for signature.',
        at_risk: 0, funds_amount: 3300000, created_at: daysBeforeRef(10),
      },
      {
        id: 'exch-020', client_name: 'Atlas Capital Holdings', client_email: 'investments@atlascap.com',
        partner_id: 'partner-3', stage: '45-Day ID Window Active',
        prop_address: '3000 Polar Dr', prop_city: 'Buford', prop_state: 'GA', prop_type: 'Industrial',
        sale_price: 6800000, relinquished_date: daysBeforeRef(36),
        rep_address: null, rep_city: null, rep_state: null, rep_type: null, rep_price: null,
        closing_date: daysBeforeRef(36), deadline_45_day: daysFromRef(9), deadline_180_day: daysFromRef(144),
        escrow_status: 'Verified', escrow_notes: 'Large commercial transaction. Senior QI assigned.',
        at_risk: 1, funds_amount: 6800000, created_at: daysBeforeRef(36),
      },
    ];

    for (const exch of exchanges) {
      insertExchange.run(exch);
      const milestones = buildMilestones(exch.closing_date, exch.deadline_45_day, exch.deadline_180_day, exch.stage);
      milestones.forEach((m, idx) => {
        insertMilestone.run({
          id: uuidv4(),
          exchange_id: exch.id,
          label: m.label,
          date: m.date,
          completed: m.completed ? 1 : 0,
          current: m.current ? 1 : 0,
          sort_order: idx,
        });
      });
    }
  });

  runAll();
  console.log('[seed] Done — seeded QI, 3 partners, 20 exchanges.');
}
