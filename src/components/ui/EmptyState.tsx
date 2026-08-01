import React from 'react';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--color-bg)]/50 border border-[var(--color-border)] border-dashed rounded-[var(--radius-card)]">
      <div className="w-12 h-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex items-center justify-center mb-4 shadow-sm">
        <FileQuestion className="w-6 h-6 text-[var(--color-text-sub)]" />
      </div>
      <h3 className="text-[15px] font-bold text-[var(--color-text-main)] mb-2">{title}</h3>
      <p className="text-[13px] text-[var(--color-text-sub)] mb-6 max-w-sm mx-auto">{description}</p>
      {actions && (
        <div className="flex items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
