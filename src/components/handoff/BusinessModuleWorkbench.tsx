'use client';

import { FinanceOperationsWorkbench } from '@/components/handoff/FinanceOperationsWorkbench';
import { SalesOperationsWorkbench } from '@/components/handoff/SalesOperationsWorkbench';

interface BusinessModuleWorkbenchProps {
  module: 'SALES' | 'FINANCE';
}

export function BusinessModuleWorkbench({ module }: BusinessModuleWorkbenchProps) {
  return module === 'SALES' ? (
    <SalesOperationsWorkbench />
  ) : (
    <FinanceOperationsWorkbench />
  );
}
