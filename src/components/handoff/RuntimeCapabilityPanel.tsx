'use client';

import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  FlaskConical,
  Server,
} from 'lucide-react';

import type { FrontendModuleBoundary } from '@/lib/frontendDataSource';

import styles from './RuntimeCapabilityPanel.module.css';

interface RuntimeCapabilityPanelProps {
  boundary: FrontendModuleBoundary;
  compact?: boolean;
}

const icons = {
  DEMO_SIMULATION: FlaskConical,
  SERVER_READY: CheckCircle2,
  BACKEND_REQUIRED: Server,
  PROVIDER_REQUIRED: CloudOff,
  UNAVAILABLE: AlertTriangle,
};

const stateLabels = {
  DEMO_SIMULATION: 'DEMO',
  SERVER_READY: 'API READY',
  BACKEND_REQUIRED: 'BACKEND REQUIRED',
  PROVIDER_REQUIRED: 'PROVIDER REQUIRED',
  UNAVAILABLE: 'UNAVAILABLE',
};

export function RuntimeCapabilityPanel({
  boundary,
  compact = false,
}: RuntimeCapabilityPanelProps) {
  const Icon = icons[boundary.state];

  return (
    <section
      className={styles.panel}
      data-compact={compact}
      data-state={boundary.state}
      aria-label={`${boundary.title} runtime status`}
    >
      <div className={styles.icon} aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className={styles.copy}>
        <div className={styles.heading}>
          <strong>{boundary.title}</strong>
          <span>{stateLabels[boundary.state]}</span>
        </div>
        <p>{boundary.message}</p>
      </div>
      <dl className={styles.meta}>
        <div>
          <dt>Mode</dt>
          <dd>{boundary.mode}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{boundary.providerState}</dd>
        </div>
      </dl>
      {!compact && (
        <details className={styles.operations}>
          <summary>OpenAPI operations</summary>
          <ul>
            {boundary.operations.map((operation) => (
              <li key={operation}>
                <code>{operation}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
