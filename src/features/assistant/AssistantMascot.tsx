'use client';

import type { AssistantMascotState } from './assistantModel';

interface AssistantMascotProps {
  state?: AssistantMascotState;
  brand?: 'CON_COST' | 'VIET_QS';
  size?: 'sm' | 'md' | 'lg';
  motion?: boolean;
}

export function AssistantMascot({ state = 'IDLE', brand = 'CON_COST', size = 'md', motion = true }: AssistantMascotProps) {
  const accent = brand === 'VIET_QS' ? '#0871bd' : '#f36b00';
  const accentSoft = brand === 'VIET_QS' ? '#d9efff' : '#ffead6';
  const stateColor = state === 'ERROR' ? '#dc2626' : state === 'BLOCKED' ? '#d97706' : state === 'ANSWER_READY' ? '#16a34a' : accent;
  const dimensions = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-20 w-20' : 'h-14 w-14';
  const expressive = state === 'GREETING' || state === 'ANSWER_READY';
  const thinking = state === 'THINKING';

  return (
    <span className={`relative inline-flex shrink-0 ${dimensions}`} aria-hidden="true" data-mascot-state={state}>
      <svg viewBox="0 0 80 80" className={`h-full w-full drop-shadow-[0_8px_14px_rgba(15,23,42,.18)] ${motion ? 'motion-safe:transition-transform motion-safe:duration-300' : ''}`}>
        <path d="M18 14h37a11 11 0 0 1 11 11v25a11 11 0 0 1-11 11H39L27 71v-10h-9A11 11 0 0 1 7 50V25a11 11 0 0 1 11-11Z" fill="#fff" stroke={accent} strokeWidth="3" />
        <path d="M16 18h40a7 7 0 0 1 7 7v5H10v-5a7 7 0 0 1 6-7Z" fill={accentSoft} />
        <path d="M24 7l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill={accent} opacity=".92" />
        <circle cx="28" cy="39" r={thinking ? 2.4 : 3.3} fill="#172554" />
        <circle cx="48" cy="39" r={thinking ? 2.4 : 3.3} fill="#172554" />
        {expressive ? <path d="M27 49c5 6 16 6 21 0" fill="none" stroke="#172554" strokeLinecap="round" strokeWidth="3" /> : <path d="M31 51h14" fill="none" stroke="#172554" strokeLinecap="round" strokeWidth="3" />}
        {thinking && <><circle cx="60" cy="57" r="3" fill={accent} /><circle cx="68" cy="64" r="2" fill={accentSoft} stroke={accent} /></>}
      </svg>
      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white" style={{ backgroundColor: stateColor }} />
    </span>
  );
}
