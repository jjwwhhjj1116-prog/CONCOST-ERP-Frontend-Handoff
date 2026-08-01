import type { ReactNode } from 'react';

import type {
  NavigationPictogramName,
  NavigationTone,
} from '@/lib/navigationVisuals';

type PictogramSize = 'header' | 'item' | 'nested';

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
};

const palettes: Record<NavigationTone, Palette> = {
  orange: { primary: '#f97316', secondary: '#fdba74', accent: '#fbbf24', ink: '#7c2d12' },
  blue: { primary: '#2563eb', secondary: '#93c5fd', accent: '#22d3ee', ink: '#1e3a8a' },
  cyan: { primary: '#0891b2', secondary: '#67e8f9', accent: '#38bdf8', ink: '#164e63' },
  teal: { primary: '#0f766e', secondary: '#5eead4', accent: '#34d399', ink: '#134e4a' },
  green: { primary: '#059669', secondary: '#6ee7b7', accent: '#a3e635', ink: '#14532d' },
  amber: { primary: '#d97706', secondary: '#fcd34d', accent: '#fb923c', ink: '#78350f' },
  rose: { primary: '#e11d48', secondary: '#fda4af', accent: '#fb7185', ink: '#881337' },
  pink: { primary: '#db2777', secondary: '#f9a8d4', accent: '#c084fc', ink: '#831843' },
  violet: { primary: '#7c3aed', secondary: '#c4b5fd', accent: '#818cf8', ink: '#4c1d95' },
  indigo: { primary: '#4f46e5', secondary: '#a5b4fc', accent: '#60a5fa', ink: '#312e81' },
  slate: { primary: '#475569', secondary: '#cbd5e1', accent: '#94a3b8', ink: '#0f172a' },
};

const sizeClass: Record<PictogramSize, string> = {
  header: 'h-8 w-8',
  item: 'h-5 w-5',
  nested: 'h-[18px] w-[18px]',
};

function Paper({ palette, mark }: { palette: Palette; mark: 'pen' | 'calculator' | 'chart' | 'check' | 'clock' | 'seal' | 'question' | 'lines' }) {
  const markNode: Record<typeof mark, ReactNode> = {
    pen: <><path d="M14.2 15.8l4.7-4.7 2 2-4.7 4.7-2.8.8z" fill={palette.primary}/><path d="M18.1 11.9l1-1a1.2 1.2 0 011.7 0l.3.3a1.2 1.2 0 010 1.7l-.9.9z" fill={palette.accent}/></>,
    calculator: <><rect x="11.8" y="9" width="8" height="9.5" rx="1.8" fill={palette.primary}/><rect x="13.4" y="10.5" width="4.8" height="2" rx=".7" fill="white" opacity=".9"/><path d="M13.6 14.4h1.1m2.2 0H18m-4.4 2.1h1.1m2.2 0H18" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></>,
    chart: <><path d="M12 17v-3m3 3v-6m3 6V9" stroke={palette.primary} strokeWidth="2.4" strokeLinecap="round"/><path d="M11.2 8.5l2.6-2.1 2 1.5 3-2.4" stroke={palette.accent} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    check: <><circle cx="16.2" cy="14.2" r="4.4" fill={palette.primary}/><path d="M14.2 14.2l1.3 1.3 2.7-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    clock: <><circle cx="16.2" cy="14.2" r="4.4" fill={palette.primary}/><path d="M16.2 11.8v2.7l1.8 1" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    seal: <><path d="M12.3 12.3a4 4 0 117.9 0 4 4 0 01-7.9 0z" fill={palette.primary}/><path d="M14.8 15.3l-.6 3.8 2.1-1 2.1 1-.6-3.8" fill={palette.accent}/></>,
    question: <><path d="M12.2 12.4a4.2 4.2 0 118.4 0 4.2 4.2 0 01-8.4 0z" fill={palette.primary}/><path d="M15.2 10.8a1.4 1.4 0 012.7.5c0 1.4-1.6 1.4-1.6 2.5m0 1.8h.01" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    lines: <><path d="M11.5 10h6.8M11.5 13h6.8M11.5 16h4.4" stroke={palette.primary} strokeWidth="1.5" strokeLinecap="round"/><circle cx="9.1" cy="10" r=".8" fill={palette.accent}/><circle cx="9.1" cy="13" r=".8" fill={palette.accent}/><circle cx="9.1" cy="16" r=".8" fill={palette.accent}/></>,
  };
  return <><path d="M4.2 3.2h10.5l4.1 4.2v12.8H4.2z" fill={palette.secondary} opacity=".65"/><path d="M14.6 3.4v4.2h4" fill={palette.accent} opacity=".85"/><path d="M7.2 7.2h5" stroke={palette.ink} strokeWidth="1.25" strokeLinecap="round" opacity=".75"/>{markNode[mark]}</>;
}

function Envelope({ palette, kind }: { palette: Palette; kind: 'stack' | 'inbox' | 'sent' | 'star' | 'receipt' | 'draft' | 'memo' | 'spam' | 'trash' | 'user' | 'project' | 'storage' | 'settings' }) {
  const base = <><rect x="3" y="6" width="16" height="11" rx="2.2" fill={palette.secondary}/><path d="M4.2 7.2l6.8 5 6.8-5" stroke={palette.ink} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M4.2 15.7l4.5-4m8.9 4l-4.3-4" stroke={palette.primary} strokeWidth="1.1" opacity=".8"/></>;
  const overlays: Record<typeof kind, ReactNode> = {
    stack: <><rect x="6" y="3" width="15" height="10" rx="2" fill={palette.primary} opacity=".35"/>{base}</>,
    inbox: <><path d="M3 15h5l1.5 2h5l1.5-2h5v4H3z" fill={palette.primary}/>{base}</>,
    sent: <><path d="M11 3l10 4.5-10 4 2-3-2-1.2z" fill={palette.primary}/><path d="M13 8.5l4.5-1" stroke="white" strokeWidth="1.2"/>{base}</>,
    star: <><path d="M17 2.8l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill={palette.accent}/>{base}</>,
    receipt: <><circle cx="18" cy="15.5" r="4.3" fill={palette.primary}/><path d="M16 15.5l1.3 1.3 2.7-3" stroke="white" strokeWidth="1.45" fill="none" strokeLinecap="round"/>{base}</>,
    draft: <><path d="M14 16l5-5 2 2-5 5-3 .8z" fill={palette.primary}/><path d="M18.2 11.8l1.1-1.1 2 2-1.1 1.1z" fill={palette.accent}/>{base}</>,
    memo: <><path d="M5 3h13v16H5z" fill={palette.secondary}/><path d="M8 8h7M8 11h7M8 14h4" stroke={palette.ink} strokeWidth="1.3" strokeLinecap="round"/><path d="M15 3h3v3z" fill={palette.accent}/></>,
    spam: <><path d="M17.5 2.8l4 4v5.6l-4 3.3-4-3.3V6.8z" fill={palette.primary}/><path d="M17.5 6.2v4m0 2h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>{base}</>,
    trash: <><path d="M7 7h10l-1 13H8z" fill={palette.primary}/><path d="M6 5h12M9 5l1-2h4l1 2" stroke={palette.ink} strokeWidth="1.4" strokeLinecap="round"/>{base}</>,
    user: <><path d="M3 8h7l2-2h8v12H3z" fill={palette.secondary}/><circle cx="15.5" cy="11" r="2.1" fill={palette.primary}/><path d="M12.4 16c.5-2 1.8-3 3.1-3s2.7 1 3.1 3" fill={palette.accent}/></>,
    project: <><path d="M3 8h6l2-2h9v12H3z" fill={palette.secondary}/><rect x="8" y="10" width="8" height="5.5" rx="1.3" fill={palette.primary}/><path d="M10 10V8.5h4V10" stroke={palette.ink} strokeWidth="1.1"/></>,
    storage: <><ellipse cx="17" cy="6" rx="4" ry="2" fill={palette.primary}/><path d="M13 6v8c0 1.1 1.8 2 4 2s4-.9 4-2V6" fill={palette.secondary}/><path d="M13 10c0 1.1 1.8 2 4 2s4-.9 4-2" stroke={palette.primary} strokeWidth="1.2" fill="none"/>{base}</>,
    settings: <><circle cx="17" cy="13" r="4.5" fill={palette.primary}/><circle cx="17" cy="13" r="1.6" fill="white"/><path d="M17 7v2m0 8v2m-6-6h2m8 0h2m-10.2-4.2l1.4 1.4m5.6 5.6l1.4 1.4m0-8.4l-1.4 1.4m-5.6 5.6l-1.4 1.4" stroke={palette.ink} strokeWidth="1.2" strokeLinecap="round"/>{base}</>,
  };
  return <>{overlays[kind]}</>;
}

function CalendarArt({ palette, kind }: { palette: Palette; kind: 'all' | 'today' | 'upcoming' | 'finish' | 'structure' | 'civil' | 'claim' | 'development' }) {
  const badge: Record<typeof kind, ReactNode> = {
    all: <><rect x="7" y="10" width="3" height="3" rx=".7" fill={palette.primary}/><rect x="12" y="10" width="3" height="3" rx=".7" fill={palette.accent}/><rect x="7" y="15" width="3" height="3" rx=".7" fill={palette.accent}/><rect x="12" y="15" width="3" height="3" rx=".7" fill={palette.primary}/></>,
    today: <><circle cx="12" cy="14" r="4" fill={palette.primary}/><path d="M12 11.5v2.8l2 1" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    upcoming: <><path d="M7 16h8l-2.1-2.2m2.1 2.2l-2.1 2.2" stroke={palette.primary} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="11" r="1.6" fill={palette.accent}/></>,
    finish: <><path d="M6 17h10v-3H6zm1-4h4v-3H7zm5 0h4v-3h-4" fill={palette.primary}/><rect x="15" y="8" width="4" height="1.5" rx=".7" fill={palette.accent}/></>,
    structure: <><path d="M7 18V9m10 9V9M6 10h12M8 14h8" stroke={palette.primary} strokeWidth="2"/><path d="M9 7h6" stroke={palette.accent} strokeWidth="2"/></>,
    civil: <><path d="M6 18l4-8h4l4 8M9 15h6" stroke={palette.primary} strokeWidth="1.8" fill="none"/><path d="M17 12V8m0 0l-2 2m2-2l2 2" stroke={palette.accent} strokeWidth="1.5"/></>,
    claim: <><path d="M12 9l5 2v3.2c0 2.8-2 4.5-5 5.5-3-1-5-2.7-5-5.5V11z" fill={palette.primary}/><path d="M10 14h4" stroke="white" strokeWidth="1.5"/></>,
    development: <><rect x="6" y="10" width="12" height="8" rx="1.5" fill={palette.primary}/><path d="M9.5 13l-2 1.5 2 1.5m5-3l2 1.5-2 1.5m-3.5 1l2-5" stroke="white" strokeWidth="1.1" fill="none" strokeLinecap="round"/></>,
  };
  return <><rect x="3.5" y="4" width="17" height="17" rx="3" fill={palette.secondary} opacity=".72"/><path d="M3.5 8.3h17" stroke={palette.ink} strokeWidth="1.3"/><path d="M8 2.8v3M16 2.8v3" stroke={palette.primary} strokeWidth="2" strokeLinecap="round"/>{badge[kind]}</>;
}

function ProjectArt({ palette, kind }: { palette: Palette; kind: 'workflow' | 'intake' | 'technical' | 'portfolio' | 'finish' | 'structure' | 'civil' | 'meeting' | 'archive' | 'claim' | 'claimPortfolio' | 'evidence' | 'legal' | 'development' | 'app' | 'code' | 'devMeeting' | 'question' | 'finishQuestion' | 'structureQuestion' | 'civilQuestion' | 'daily' | 'delivery' }) {
  const art: Record<typeof kind, ReactNode> = {
    workflow: <><path d="M3 7h6l2-2h10v14H3z" fill={palette.secondary}/><circle cx="8" cy="13" r="2" fill={palette.primary}/><circle cx="16" cy="10" r="2" fill={palette.accent}/><circle cx="16" cy="16" r="2" fill={palette.primary}/><path d="M10 13h2l2-2m-2 2l2 2" stroke={palette.ink} strokeWidth="1.2" fill="none"/></>,
    intake: <><path d="M4 12h5l1.5 2h3L15 12h5v7H4z" fill={palette.primary}/><path d="M8 3h8l3 3v7h-4l-1.5 2h-3L9 13H5V3z" fill={palette.secondary}/><path d="M10 7h4m-4 3h4" stroke={palette.ink} strokeWidth="1.3"/></>,
    technical: <><path d="M4 5h12v13H4z" fill={palette.secondary}/><path d="M7 8h6M7 11h4M7 14h6" stroke={palette.primary} strokeWidth="1.3"/><path d="M11 5a6 6 0 0110 4v2h-10V9a6 6 0 010-4z" fill={palette.accent}/><path d="M10 11h12" stroke={palette.ink} strokeWidth="1.3"/></>,
    portfolio: <><path d="M3 10l4-4 4 4v9H3zm10-3l4-4 4 4v12h-8z" fill={palette.secondary}/><path d="M6 13h2v3H6zm10-2h2v5h-2z" fill={palette.primary}/></>,
    finish: <><path d="M4 17h12v-4H4zm1-5h5V8H5zm6 0h5V8h-5" fill={palette.primary}/><path d="M14 5h6v2h-4v8" stroke={palette.accent} strokeWidth="2" fill="none" strokeLinecap="round"/><rect x="15" y="14" width="3" height="6" rx="1" fill={palette.secondary}/></>,
    structure: <><path d="M5 20V5m14 15V5M4 7h16M7 13h10M7 19h10" stroke={palette.primary} strokeWidth="2.2"/><path d="M8 4h8" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round"/></>,
    civil: <><path d="M3 20l5-12h4l5 12z" fill={palette.secondary}/><path d="M10 8l-2 12m4-12l2 12M6 16h10" stroke={palette.primary} strokeWidth="1.4"/><path d="M18 18V9m0 0l-3 3m3-3l3 3" stroke={palette.ink} strokeWidth="1.4"/><circle cx="18" cy="7" r="2.5" fill={palette.accent}/></>,
    meeting: <><rect x="4" y="4" width="16" height="16" rx="2.5" fill={palette.secondary}/><path d="M8 9h8M8 12h8M8 15h5" stroke={palette.ink} strokeWidth="1.3"/><circle cx="7" cy="5" r="2" fill={palette.primary}/><circle cx="12" cy="4" r="2" fill={palette.accent}/><circle cx="17" cy="5" r="2" fill={palette.primary}/></>,
    archive: <><path d="M3 8h7l2-2h9v13H3z" fill={palette.secondary}/><path d="M7 8V4h10v7" stroke={palette.primary} strokeWidth="1.5"/><path d="M9 12h6m-6 3h4" stroke={palette.ink} strokeWidth="1.3"/><path d="M16 13h3v4h-3z" fill={palette.accent}/></>,
    claim: <><path d="M12 3l7 3v5c0 4.8-3 7.7-7 9-4-1.3-7-4.2-7-9V6z" fill={palette.secondary}/><path d="M12 7v9M8 10h8m-6 0l-2 4h4zm4 0l-2 4h4z" stroke={palette.primary} strokeWidth="1.4" fill="none" strokeLinejoin="round"/></>,
    claimPortfolio: <><path d="M3 7h7l2-2h9v14H3z" fill={palette.secondary}/><path d="M12 9l5 2v3c0 2.5-1.8 4-5 5-3.2-1-5-2.5-5-5v-3z" fill={palette.primary}/><path d="M10 14h4" stroke="white" strokeWidth="1.3"/></>,
    evidence: <><path d="M3 7h7l2-2h9v14H3z" fill={palette.secondary}/><circle cx="14" cy="13" r="4" fill={palette.primary}/><circle cx="14" cy="13" r="1.5" fill="white"/><path d="M17 16l3 3" stroke={palette.ink} strokeWidth="1.7" strokeLinecap="round"/></>,
    legal: <><rect x="4" y="4" width="11" height="16" rx="2" fill={palette.secondary}/><path d="M7 9h5M7 12h5M7 15h3" stroke={palette.ink} strokeWidth="1.2"/><path d="M18 7v10M15 10h6m-4.5 0L15 14h3zm3 0L19 14h3" stroke={palette.primary} strokeWidth="1.3" fill="none"/></>,
    development: <><rect x="3" y="5" width="18" height="14" rx="2.5" fill={palette.secondary}/><path d="M8 10l-2 2 2 2m8-4l2 2-2 2m-5 2l2-8" stroke={palette.primary} strokeWidth="1.7" fill="none" strokeLinecap="round"/><circle cx="6" cy="7.5" r="1" fill={palette.accent}/></>,
    app: <><rect x="3" y="4" width="8" height="7" rx="2" fill={palette.primary}/><rect x="13" y="4" width="8" height="7" rx="2" fill={palette.secondary}/><rect x="3" y="13" width="8" height="7" rx="2" fill={palette.secondary}/><rect x="13" y="13" width="8" height="7" rx="2" fill={palette.accent}/></>,
    code: <><path d="M3 7h7l2-2h9v14H3z" fill={palette.secondary}/><path d="M9 11l-2 2 2 2m6-4l2 2-2 2m-4 1l2-6" stroke={palette.primary} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    devMeeting: <><rect x="4" y="4" width="16" height="16" rx="2" fill={palette.secondary}/><path d="M8 9l-2 2 2 2m8-4l2 2-2 2m-5 2l2-8" stroke={palette.primary} strokeWidth="1.4" fill="none"/><path d="M7 17h10" stroke={palette.accent} strokeWidth="1.4"/></>,
    question: <><path d="M4 4h13v12H9l-4 4v-4H4z" fill={palette.secondary}/><path d="M9 8a2.2 2.2 0 014.2.8c0 2-2.2 2-2.2 3.5m0 1.7h.01" stroke={palette.primary} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M17 9h4v8h-3l-2 2" fill={palette.accent} opacity=".8"/></>,
    finishQuestion: <><path d="M4 4h13v12H9l-4 4v-4H4z" fill={palette.secondary}/><path d="M8 12h7v3H8zm1-4h3v3H9" fill={palette.primary}/><path d="M17 8h4v2h-3v5" stroke={palette.accent} strokeWidth="1.5"/></>,
    structureQuestion: <><path d="M4 4h13v12H9l-4 4v-4H4z" fill={palette.secondary}/><path d="M8 14V7m6 7V7M7 8h8m-6 3h4" stroke={palette.primary} strokeWidth="1.5"/></>,
    civilQuestion: <><path d="M4 4h13v12H9l-4 4v-4H4z" fill={palette.secondary}/><path d="M7 14l3-7h2l3 7M9 11h4" stroke={palette.primary} strokeWidth="1.4" fill="none"/><circle cx="18.5" cy="8" r="2.4" fill={palette.accent}/></>,
    daily: <><rect x="4" y="3" width="16" height="18" rx="2.5" fill={palette.secondary}/><path d="M8 8h8M8 12h8M8 16h5" stroke={palette.ink} strokeWidth="1.3"/><path d="M16 18l4-4 1.5 1.5-4 4-2.2.6z" fill={palette.primary}/></>,
    delivery: <><path d="M4 8l8-4 8 4-8 4z" fill={palette.secondary}/><path d="M4 8v9l8 4 8-4V8" fill={palette.primary} opacity=".82"/><path d="M12 12v9" stroke="white" strokeWidth="1.2"/><circle cx="18" cy="17" r="3.5" fill={palette.accent}/><path d="M16.5 17l1 1 2-2" stroke={palette.ink} strokeWidth="1.1" fill="none"/></>,
  };
  return <>{art[kind]}</>;
}

function DriveArt({ palette, kind }: { palette: Palette; kind: 'home' | 'technical' | 'claim' | 'development' | 'connection' }) {
  const badge: Record<typeof kind, ReactNode> = {
    home: <path d="M9 17h7a4 4 0 00.8-7.9A5.4 5.4 0 006.6 10.5 3.3 3.3 0 009 17z" fill={palette.primary}/>,
    technical: <><path d="M6 15h12V7H6z" fill={palette.primary}/><path d="M8 10h8M8 12.5h5" stroke="white" strokeWidth="1.1"/><path d="M12 7a5 5 0 019 4v1h-9z" fill={palette.accent}/></>,
    claim: <><path d="M12 7l5 2v3c0 3-2 4.8-5 6-3-1.2-5-3-5-6V9z" fill={palette.primary}/><path d="M10 12h4" stroke="white" strokeWidth="1.3"/><circle cx="17.5" cy="8" r="2" fill={palette.accent}/></>,
    development: <><rect x="6" y="8" width="12" height="8" rx="1.5" fill={palette.primary}/><path d="M10 10.5l-2 1.5 2 1.5m4-3l2 1.5-2 1.5m-2 1l1.5-5" stroke="white" strokeWidth="1" fill="none"/></>,
    connection: <><path d="M8 14l-2 2a3 3 0 004.2 4.2l2.3-2.3m3.5-8l2-2a3 3 0 10-4.2-4.2L11.5 6" stroke={palette.primary} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M9 15l6-6" stroke={palette.accent} strokeWidth="2.2"/></>,
  };
  return <><path d="M3 10h6l2-3h9v11H3z" fill={palette.secondary} opacity=".72"/>{badge[kind]}</>;
}

function TaskArt({ palette, kind }: { palette: Palette; kind: 'all' | 'today' | 'review' | 'done' }) {
  const badge: Record<typeof kind, ReactNode> = {
    all: <><path d="M8 8h8M8 12h8M8 16h6" stroke={palette.ink} strokeWidth="1.3"/><path d="M4.5 8l1 1 1.8-2m-2.8 5l1 1 1.8-2m-2.8 5l1 1 1.8-2" stroke={palette.primary} strokeWidth="1.3" fill="none"/></>,
    today: <><circle cx="15" cy="14" r="4.5" fill={palette.primary}/><path d="M15 11.5v2.8l2 1" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round"/><path d="M5 9l1 1 2-2" stroke={palette.accent} strokeWidth="1.5"/></>,
    review: <><circle cx="15" cy="14" r="4.5" fill={palette.accent}/><path d="M15 11.5v5M12.5 14h5" stroke={palette.ink} strokeWidth="1.2"/><path d="M5 9h4M5 13h4" stroke={palette.primary} strokeWidth="1.4"/></>,
    done: <><circle cx="15" cy="14" r="4.5" fill={palette.primary}/><path d="M12.8 14l1.4 1.5 3-3.3" stroke="white" strokeWidth="1.4" fill="none"/><path d="M5 9l1 1 2-2" stroke={palette.accent} strokeWidth="1.5"/></>,
  };
  return <><rect x="3" y="3" width="16" height="18" rx="3" fill={palette.secondary} opacity=".7"/>{badge[kind]}</>;
}

function BoardArt({ palette, kind }: { palette: Palette; kind: 'ceo' | 'notice' | 'hr' | 'celebration' | 'community' | 'photo' | 'free' | 'library' }) {
  const art: Record<typeof kind, ReactNode> = {
    ceo: <><circle cx="9" cy="8" r="3.5" fill={palette.primary}/><path d="M3.5 19c.6-4.2 2.7-6.4 5.5-6.4s5 2.2 5.5 6.4" fill={palette.secondary}/><path d="M16 6h5v9h-5l-2.5 2.5V8.5z" fill={palette.accent}/></>,
    notice: <><path d="M3 10l11-5v12L3 13z" fill={palette.primary}/><path d="M14 8l5-2v10l-5-2z" fill={palette.secondary}/><path d="M5 13l2 6h3l-1.5-5" fill={palette.accent}/><path d="M20 8l2-1m-2 5h2m-2 3l2 1" stroke={palette.ink} strokeWidth="1.3"/></>,
    hr: <><circle cx="8" cy="8" r="3" fill={palette.primary}/><path d="M3 18c.5-3.7 2.5-5.7 5-5.7s4.5 2 5 5.7" fill={palette.secondary}/><path d="M15 5h6v11h-6z" fill={palette.accent}/><path d="M16.5 8h3m-3 3h3m-3 3h2" stroke={palette.ink} strokeWidth="1"/></>,
    celebration: <><path d="M6 20l3-10 6 6z" fill={palette.primary}/><path d="M9 10l6 6" stroke="white" strokeWidth="1.1"/><path d="M15 4v3m4-1l-2 2M11 5l1.5 2M19 11h3" stroke={palette.accent} strokeWidth="2" strokeLinecap="round"/><circle cx="18" cy="3.5" r="1.4" fill={palette.secondary}/></>,
    community: <><path d="M3 5h13v10H8l-4 4v-4H3z" fill={palette.primary}/><path d="M11 9h10v8h-3l-3 3v-3h-4z" fill={palette.secondary}/><circle cx="7" cy="10" r="1" fill="white"/><circle cx="10" cy="10" r="1" fill="white"/><circle cx="15" cy="13" r="1" fill={palette.ink}/><circle cx="18" cy="13" r="1" fill={palette.ink}/></>,
    photo: <><rect x="3" y="5" width="18" height="14" rx="2.5" fill={palette.secondary}/><circle cx="16.5" cy="9" r="2.2" fill={palette.accent}/><path d="M5 17l5-5 3 3 2-2 4 4" fill={palette.primary}/></>,
    free: <><path d="M4 8h11v7a5 5 0 01-5 5H9a5 5 0 01-5-5z" fill={palette.secondary}/><path d="M15 10h2a3 3 0 010 6h-2" stroke={palette.primary} strokeWidth="2" fill="none"/><path d="M7 5c-1-2 1-2 0-4m4 4c-1-2 1-2 0-4" stroke={palette.accent} strokeWidth="1.4" fill="none"/><path d="M18 4h3v6h-2l-2 2" fill={palette.primary}/></>,
    library: <><path d="M4 4h5v16H4zm6 2h5v14h-5zm6-3h4v17h-4z" fill={palette.secondary}/><path d="M5.5 8h2m4 2h2m4-3h1" stroke={palette.primary} strokeWidth="1.3"/><path d="M3 20h18" stroke={palette.ink} strokeWidth="1.5"/></>,
  };
  return <>{art[kind]}</>;
}

function OrganizationArt({ palette, kind }: { palette: Palette; kind: 'tree' | 'concost' | 'vietqs' | 'personnel' }) {
  if (kind === 'tree') return <><circle cx="12" cy="5" r="3" fill={palette.primary}/><circle cx="5" cy="18" r="3" fill={palette.secondary}/><circle cx="12" cy="18" r="3" fill={palette.accent}/><circle cx="19" cy="18" r="3" fill={palette.secondary}/><path d="M12 8v4M5 15v-3h14v3" stroke={palette.ink} strokeWidth="1.5" fill="none"/></>;
  if (kind === 'personnel') return <><rect x="3" y="4" width="18" height="16" rx="3" fill={palette.secondary}/><circle cx="9" cy="10" r="3" fill={palette.primary}/><path d="M5.5 17c.5-2.7 1.8-4 3.5-4s3 1.3 3.5 4" fill={palette.accent}/><path d="M15 9h4m-4 3h4m-4 3h3" stroke={palette.ink} strokeWidth="1.2"/></>;
  const viet = kind === 'vietqs';
  return <><path d="M4 20V8l8-5 8 5v12z" fill={palette.secondary}/><path d="M8 20v-5h3v5m2-8h3v3h-3z" fill={palette.primary}/>{viet ? <><circle cx="17.5" cy="7" r="4" fill={palette.accent}/><path d="M14 7h7M17.5 3.2c1.6 1.8 1.6 5.8 0 7.6m0-7.6c-1.6 1.8-1.6 5.8 0 7.6" stroke={palette.ink} strokeWidth=".8" fill="none"/></> : <path d="M4 8h16" stroke={palette.accent} strokeWidth="2"/>}</>;
}

function SalesArt({ palette, kind }: { palette: Palette; kind: 'dashboard' | 'customer' | 'opportunity' | 'proposal' | 'contract' | 'card' | 'inbox' | 'capture' | 'activity' }) {
  const art: Record<typeof kind, ReactNode> = {
    dashboard: <><path d="M4 19V5h16v14z" fill={palette.secondary}/><path d="M7 16l3-4 3 2 4-6" stroke={palette.primary} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M15 8h2v2" stroke={palette.accent} strokeWidth="1.5"/></>,
    customer: <><path d="M3 20V8l6-4 6 4v12z" fill={palette.secondary}/><circle cx="17" cy="9" r="3" fill={palette.primary}/><path d="M12.5 19c.6-4 2.3-6 4.5-6s4 2 4.5 6" fill={palette.accent}/><path d="M6 11h2m-2 3h2" stroke={palette.ink} strokeWidth="1.2"/></>,
    opportunity: <><circle cx="12" cy="12" r="8" fill={palette.secondary}/><circle cx="12" cy="12" r="5" fill={palette.primary}/><circle cx="12" cy="12" r="2" fill="white"/><path d="M13.5 10.5L21 3m-3 0h3v3" stroke={palette.accent} strokeWidth="2" fill="none"/></>,
    proposal: <><path d="M4 3h12l4 4v14H4z" fill={palette.secondary}/><path d="M8 9h7M8 13h5M8 17h4" stroke={palette.ink} strokeWidth="1.3"/><path d="M14 3v5h5" fill={palette.accent}/><circle cx="17" cy="16" r="3.5" fill={palette.primary}/><path d="M17 14v4m-2-2h4" stroke="white" strokeWidth="1.2"/></>,
    contract: <><path d="M5 3h11l3 3v15H5z" fill={palette.secondary}/><path d="M8 9h8M8 12h8M8 15h5" stroke={palette.ink} strokeWidth="1.2"/><path d="M12 17c2-2 3 2 5 0" stroke={palette.primary} strokeWidth="1.4" fill="none"/><circle cx="18" cy="18" r="3" fill={palette.accent}/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2.5" fill={palette.secondary}/><circle cx="8" cy="11" r="3" fill={palette.primary}/><path d="M5 17c.4-2.3 1.5-3.5 3-3.5s2.6 1.2 3 3.5" fill={palette.accent}/><path d="M13 9h5m-5 3h5m-5 3h3" stroke={palette.ink} strokeWidth="1.1"/></>,
    inbox: <><path d="M4 12h5l1.5 2h3L15 12h5v7H4z" fill={palette.primary}/><rect x="6" y="4" width="12" height="10" rx="2" fill={palette.secondary}/><circle cx="10" cy="8" r="2" fill={palette.accent}/><path d="M13 8h3m-7 3h7" stroke={palette.ink} strokeWidth="1"/></>,
    capture: <><rect x="3" y="6" width="18" height="13" rx="2.5" fill={palette.secondary}/><path d="M8 6l1.5-2h5L16 6" fill={palette.primary}/><circle cx="12" cy="12.5" r="4" fill={palette.primary}/><circle cx="12" cy="12.5" r="2" fill="white"/><path d="M18 8h1" stroke={palette.accent} strokeWidth="2"/></>,
    activity: <><path d="M4 3h14v18H4z" fill={palette.secondary}/><path d="M7 8h8M7 12h5M7 16h4" stroke={palette.ink} strokeWidth="1.2"/><circle cx="17" cy="16" r="4" fill={palette.primary}/><path d="M17 13.7v2.6l1.7 1" stroke="white" strokeWidth="1.2" fill="none"/></>,
  };
  return <>{art[kind]}</>;
}

function FinanceArt({ palette, kind }: { palette: Palette; kind: 'dashboard' | 'revenue' | 'tax' | 'cashflow' | 'budget' | 'expense' | 'treasury' | 'closing' }) {
  const art: Record<typeof kind, ReactNode> = {
    dashboard: <><path d="M3 9l9-6 9 6z" fill={palette.primary}/><path d="M5 10h14v8H5z" fill={palette.secondary}/><path d="M4 19h16M8 10v8m4-8v8m4-8v8" stroke={palette.ink} strokeWidth="1.2"/><path d="M15 5h4v4" stroke={palette.accent} strokeWidth="1.6"/></>,
    revenue: <><circle cx="8" cy="15" r="5" fill={palette.secondary}/><path d="M8 12v6m-2-4h3a1.5 1.5 0 010 3H6" stroke={palette.ink} strokeWidth="1.2"/><path d="M12 15l6-8m0 0v5m0-5h-5" stroke={palette.primary} strokeWidth="2" fill="none"/><circle cx="18" cy="7" r="2.5" fill={palette.accent}/></>,
    tax: <><path d="M5 3h14v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L5 21z" fill={palette.secondary}/><path d="M8 8h8M8 12h5" stroke={palette.ink} strokeWidth="1.2"/><circle cx="15.5" cy="15" r="3.5" fill={palette.primary}/><path d="M14 13.5l3 3m0-3l-3 3" stroke="white" strokeWidth="1"/></>,
    cashflow: <><path d="M4 7h16v12H4z" fill={palette.secondary}/><path d="M4 10h16" stroke={palette.ink} strokeWidth="1.2"/><path d="M7 15h4m6-2l3 2-3 2m0-7l-3-2 3-2" stroke={palette.primary} strokeWidth="1.5" fill="none"/><circle cx="10" cy="15" r="2.5" fill={palette.accent}/></>,
    budget: <><circle cx="10" cy="12" r="8" fill={palette.secondary}/><path d="M10 12V4a8 8 0 018 8z" fill={palette.primary}/><path d="M10 12l5.7 5.7A8 8 0 0110 20z" fill={palette.accent}/><circle cx="10" cy="12" r="2" fill="white"/></>,
    expense: <><path d="M4 6h16v13H4z" fill={palette.secondary}/><path d="M4 10h16" stroke={palette.ink} strokeWidth="1.2"/><path d="M15 5v8m0 0l-3-3m3 3l3-3" stroke={palette.primary} strokeWidth="1.8" fill="none"/><path d="M7 15h4" stroke={palette.accent} strokeWidth="2"/></>,
    treasury: <><rect x="3" y="5" width="18" height="15" rx="2.5" fill={palette.secondary}/><circle cx="12" cy="12.5" r="5" fill={palette.primary}/><circle cx="12" cy="12.5" r="2" fill="white"/><path d="M12 8v2m0 5v2m-4.5-4.5h2m5 0h2" stroke={palette.ink} strokeWidth="1.1"/><path d="M6 5V3h12v2" stroke={palette.accent} strokeWidth="2"/></>,
    closing: <><path d="M5 3h14v18H5z" fill={palette.secondary}/><path d="M8 8h8M8 12h8M8 16h5" stroke={palette.ink} strokeWidth="1.2"/><circle cx="17" cy="17" r="4" fill={palette.primary}/><path d="M15 17l1.3 1.3 2.7-3" stroke="white" strokeWidth="1.2" fill="none"/></>,
  };
  return <>{art[kind]}</>;
}

function UtilityArt({ palette, kind }: { palette: Palette; kind: 'ai' | 'profile' | 'translation' | 'permission' | 'settings' | 'workspace' | 'quality' | 'approval' | 'received' | 'sent' | 'consensus' | 'distributed' | 'home' }) {
  const art: Record<typeof kind, ReactNode> = {
    ai: <><path d="M12 3a5 5 0 015 5c2 1 3 2.7 3 4.5a4.5 4.5 0 01-4.5 4.5H15l-3 4-1-4H8.5A4.5 4.5 0 014 12.5C4 10.7 5 9 7 8a5 5 0 015-5z" fill={palette.secondary}/><path d="M9 11h6m-5 3h4" stroke={palette.ink} strokeWidth="1.2"/><path d="M18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8z" fill={palette.primary}/><circle cx="7" cy="5" r="1.7" fill={palette.accent}/></>,
    profile: <><rect x="3" y="4" width="18" height="16" rx="3" fill={palette.secondary}/><circle cx="10" cy="10" r="3" fill={palette.primary}/><path d="M5 18c.5-3.3 2.3-5 5-5s4.5 1.7 5 5" fill={palette.accent}/><path d="M18 4l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill={palette.primary}/></>,
    translation: <><path d="M3 5h9v11H7l-3 3v-3H3z" fill={palette.secondary}/><path d="M7.5 7v6m-2-3h4m-3.3-2c.4 2 1.4 3.5 3 4.5" stroke={palette.primary} strokeWidth="1.1"/><path d="M12 8h9v11h-4l-3 3v-3h-2z" fill={palette.accent} opacity=".85"/><path d="M15 16l2-5 2 5m-3.3-1h2.6" stroke={palette.ink} strokeWidth="1.1" fill="none"/></>,
    permission: <><path d="M10 3l7 3v5c0 4.8-3 7.7-7 9-4-1.3-7-4.2-7-9V6z" fill={palette.secondary}/><circle cx="15.5" cy="9" r="3" fill={palette.primary}/><path d="M18 9h3m-1.2 0v2" stroke={palette.ink} strokeWidth="1.4"/><path d="M7.5 12l1.5 1.5 3-3" stroke={palette.primary} strokeWidth="1.4" fill="none"/></>,
    settings: <><circle cx="12" cy="12" r="7" fill={palette.secondary}/><circle cx="12" cy="12" r="3" fill={palette.primary}/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9L7 7m10 10l2.1 2.1m0-14.2L17 7M7 17l-2.1 2.1" stroke={palette.ink} strokeWidth="1.6" strokeLinecap="round"/><circle cx="18" cy="6" r="2" fill={palette.accent}/></>,
    workspace: <><rect x="3" y="4" width="18" height="16" rx="2.5" fill={palette.secondary}/><path d="M3 8h18" stroke={palette.ink} strokeWidth="1.2"/><rect x="6" y="11" width="5" height="6" rx="1" fill={palette.primary}/><circle cx="17" cy="14" r="3" fill={palette.accent}/><path d="M17 12v4m-2-2h4" stroke={palette.ink} strokeWidth="1"/></>,
    quality: <><ellipse cx="10" cy="6" rx="6" ry="3" fill={palette.primary}/><path d="M4 6v11c0 1.7 2.7 3 6 3s6-1.3 6-3V6" fill={palette.secondary}/><path d="M4 11c0 1.7 2.7 3 6 3s6-1.3 6-3" stroke={palette.primary} strokeWidth="1.2" fill="none"/><circle cx="18" cy="16" r="4" fill={palette.accent}/><path d="M16 16l1.3 1.3 2.7-3" stroke={palette.ink} strokeWidth="1.1" fill="none"/></>,
    approval: <Paper palette={palette} mark="seal"/>,
    received: <Paper palette={palette} mark="check"/>,
    sent: <><Paper palette={palette} mark="lines"/><path d="M14 4l8 3.5-8 3 1.5-2.3L14 7.3z" fill={palette.primary}/></>,
    consensus: <><Paper palette={palette} mark="check"/><circle cx="7" cy="17" r="2.3" fill={palette.accent}/><circle cx="11" cy="19" r="2.3" fill={palette.primary}/></>,
    distributed: <><Paper palette={palette} mark="seal"/><path d="M5 18l-2 2m4-1l-1 3m12-2l2 2" stroke={palette.accent} strokeWidth="1.4"/></>,
    home: <><rect x="3" y="3" width="8" height="8" rx="2" fill={palette.primary}/><rect x="13" y="3" width="8" height="5" rx="2" fill={palette.secondary}/><rect x="3" y="13" width="8" height="8" rx="2" fill={palette.accent}/><rect x="13" y="10" width="8" height="11" rx="2" fill={palette.secondary}/></>,
  };
  return <>{art[kind]}</>;
}

function artwork(name: NavigationPictogramName, palette: Palette): ReactNode {
  switch (name) {
    case 'homeDashboard': return <UtilityArt palette={palette} kind="home"/>;
    case 'approvalPending': return <Paper palette={palette} mark="clock"/>;
    case 'todayTask': return <TaskArt palette={palette} kind="today"/>;
    case 'monthCalendar': return <CalendarArt palette={palette} kind="all"/>;
    case 'mailAll': return <Envelope palette={palette} kind="stack"/>;
    case 'mailInbox': return <Envelope palette={palette} kind="inbox"/>;
    case 'mailSent': return <Envelope palette={palette} kind="sent"/>;
    case 'mailImportant': return <Envelope palette={palette} kind="star"/>;
    case 'mailReceipt': return <Envelope palette={palette} kind="receipt"/>;
    case 'mailDraft': return <Envelope palette={palette} kind="draft"/>;
    case 'mailMemo': return <Envelope palette={palette} kind="memo"/>;
    case 'mailSpam': return <Envelope palette={palette} kind="spam"/>;
    case 'mailTrash': return <Envelope palette={palette} kind="trash"/>;
    case 'mailUserFolder': return <Envelope palette={palette} kind="user"/>;
    case 'mailProjectFolder': return <Envelope palette={palette} kind="project"/>;
    case 'mailStorage': return <Envelope palette={palette} kind="storage"/>;
    case 'mailSettings': return <Envelope palette={palette} kind="settings"/>;
    case 'approvalHome': return <UtilityArt palette={palette} kind="approval"/>;
    case 'approvalReceived': return <UtilityArt palette={palette} kind="received"/>;
    case 'approvalSent': return <UtilityArt palette={palette} kind="sent"/>;
    case 'approvalConsensus': return <UtilityArt palette={palette} kind="consensus"/>;
    case 'approvalDistributed': return <UtilityArt palette={palette} kind="distributed"/>;
    case 'calendarAll': return <CalendarArt palette={palette} kind="all"/>;
    case 'calendarToday': return <CalendarArt palette={palette} kind="today"/>;
    case 'calendarUpcoming': return <CalendarArt palette={palette} kind="upcoming"/>;
    case 'projectWorkflow': return <ProjectArt palette={palette} kind="workflow"/>;
    case 'estimateRequest': return <Paper palette={palette} mark="pen"/>;
    case 'estimateSheet': return <Paper palette={palette} mark="calculator"/>;
    case 'projectPerformance': return <Paper palette={palette} mark="chart"/>;
    case 'projectIntake': return <ProjectArt palette={palette} kind="intake"/>;
    case 'technicalHeadquarters': return <ProjectArt palette={palette} kind="technical"/>;
    case 'technicalPortfolio': return <ProjectArt palette={palette} kind="portfolio"/>;
    case 'finishTeam': return <ProjectArt palette={palette} kind="finish"/>;
    case 'structureTeam': return <ProjectArt palette={palette} kind="structure"/>;
    case 'civilLandscape': return <ProjectArt palette={palette} kind="civil"/>;
    case 'meetingMinutes': return <ProjectArt palette={palette} kind="meeting"/>;
    case 'technicalArchive': return <ProjectArt palette={palette} kind="archive"/>;
    case 'claimCenter': return <ProjectArt palette={palette} kind="claim"/>;
    case 'claimPortfolio': return <ProjectArt palette={palette} kind="claimPortfolio"/>;
    case 'claimEvidence': return <ProjectArt palette={palette} kind="evidence"/>;
    case 'legalMeeting': return <ProjectArt palette={palette} kind="legal"/>;
    case 'developmentTeam': return <ProjectArt palette={palette} kind="development"/>;
    case 'developmentPortfolio': return <ProjectArt palette={palette} kind="app"/>;
    case 'codeArchive': return <ProjectArt palette={palette} kind="code"/>;
    case 'developmentMeeting': return <ProjectArt palette={palette} kind="devMeeting"/>;
    case 'projectSchedule': return <CalendarArt palette={palette} kind="all"/>;
    case 'finishSchedule': return <CalendarArt palette={palette} kind="finish"/>;
    case 'structureSchedule': return <CalendarArt palette={palette} kind="structure"/>;
    case 'civilSchedule': return <CalendarArt palette={palette} kind="civil"/>;
    case 'claimSchedule': return <CalendarArt palette={palette} kind="claim"/>;
    case 'developmentSchedule': return <CalendarArt palette={palette} kind="development"/>;
    case 'projectQuestion': return <ProjectArt palette={palette} kind="question"/>;
    case 'finishQuestion': return <ProjectArt palette={palette} kind="finishQuestion"/>;
    case 'structureQuestion': return <ProjectArt palette={palette} kind="structureQuestion"/>;
    case 'civilQuestion': return <ProjectArt palette={palette} kind="civilQuestion"/>;
    case 'projectDailyReport': return <ProjectArt palette={palette} kind="daily"/>;
    case 'projectDelivery': return <ProjectArt palette={palette} kind="delivery"/>;
    case 'driveHome': return <DriveArt palette={palette} kind="home"/>;
    case 'driveTechnical': return <DriveArt palette={palette} kind="technical"/>;
    case 'driveClaim': return <DriveArt palette={palette} kind="claim"/>;
    case 'driveDevelopment': return <DriveArt palette={palette} kind="development"/>;
    case 'taskAll': return <TaskArt palette={palette} kind="all"/>;
    case 'taskToday': return <TaskArt palette={palette} kind="today"/>;
    case 'taskReview': return <TaskArt palette={palette} kind="review"/>;
    case 'taskDone': return <TaskArt palette={palette} kind="done"/>;
    case 'boardCeo': return <BoardArt palette={palette} kind="ceo"/>;
    case 'boardNotice': return <BoardArt palette={palette} kind="notice"/>;
    case 'boardHr': return <BoardArt palette={palette} kind="hr"/>;
    case 'boardCelebration': return <BoardArt palette={palette} kind="celebration"/>;
    case 'boardCommunity': return <BoardArt palette={palette} kind="community"/>;
    case 'boardPhoto': return <BoardArt palette={palette} kind="photo"/>;
    case 'boardFree': return <BoardArt palette={palette} kind="free"/>;
    case 'boardLibrary': return <BoardArt palette={palette} kind="library"/>;
    case 'organization': return <OrganizationArt palette={palette} kind="tree"/>;
    case 'concostOffice': return <OrganizationArt palette={palette} kind="concost"/>;
    case 'vietqsOffice': return <OrganizationArt palette={palette} kind="vietqs"/>;
    case 'salesDashboard': return <SalesArt palette={palette} kind="dashboard"/>;
    case 'customer': return <SalesArt palette={palette} kind="customer"/>;
    case 'opportunity': return <SalesArt palette={palette} kind="opportunity"/>;
    case 'proposal': return <SalesArt palette={palette} kind="proposal"/>;
    case 'contract': return <SalesArt palette={palette} kind="contract"/>;
    case 'businessCard': return <SalesArt palette={palette} kind="card"/>;
    case 'businessCardInbox': return <SalesArt palette={palette} kind="inbox"/>;
    case 'businessCardCapture': return <SalesArt palette={palette} kind="capture"/>;
    case 'salesActivity': return <SalesArt palette={palette} kind="activity"/>;
    case 'financeDashboard': return <FinanceArt palette={palette} kind="dashboard"/>;
    case 'salesRevenue': return <FinanceArt palette={palette} kind="revenue"/>;
    case 'taxInvoice': return <FinanceArt palette={palette} kind="tax"/>;
    case 'cashflow': return <FinanceArt palette={palette} kind="cashflow"/>;
    case 'budget': return <FinanceArt palette={palette} kind="budget"/>;
    case 'expense': return <FinanceArt palette={palette} kind="expense"/>;
    case 'treasury': return <FinanceArt palette={palette} kind="treasury"/>;
    case 'closing': return <FinanceArt palette={palette} kind="closing"/>;
    case 'aiAssistant': return <UtilityArt palette={palette} kind="ai"/>;
    case 'settingsHome': return <UtilityArt palette={palette} kind="settings"/>;
    case 'aiProfile': return <UtilityArt palette={palette} kind="profile"/>;
    case 'translation': return <UtilityArt palette={palette} kind="translation"/>;
    case 'permissionManagement': return <UtilityArt palette={palette} kind="permission"/>;
    case 'driveConnection': return <DriveArt palette={palette} kind="connection"/>;
    case 'personnel': return <OrganizationArt palette={palette} kind="personnel"/>;
    case 'workspaceSettings': return <UtilityArt palette={palette} kind="workspace"/>;
    case 'dataQuality': return <UtilityArt palette={palette} kind="quality"/>;
    case 'fallback': return <><circle cx="8" cy="12" r="4" fill={palette.secondary}/><circle cx="16" cy="12" r="4" fill={palette.primary}/></>;
  }
}

export function NavigationPictogram({
  name,
  tone,
  size = 'item',
  active = false,
  disabled = false,
  title,
}: {
  name: NavigationPictogramName;
  tone: NavigationTone;
  size?: PictogramSize;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const palette = palettes[tone];
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${sizeClass[size]} shrink-0 overflow-visible transition-[transform,filter,opacity] duration-150 motion-reduce:transition-none ${
        active ? 'scale-[1.08] drop-shadow-[0_2px_2px_rgba(15,23,42,.16)]' : 'group-hover:scale-[1.04]'
      } ${disabled ? 'opacity-40 grayscale' : ''}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-pictogram-name={name}
      data-pictogram-tone={tone}
      data-pictogram-style="duotone-semi-filled"
    >
      {title ? <title>{title}</title> : null}
      {artwork(name, palette)}
    </svg>
  );
}
