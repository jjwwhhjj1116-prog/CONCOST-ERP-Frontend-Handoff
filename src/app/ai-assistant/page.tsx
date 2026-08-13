import { Suspense } from 'react';
import { AssistantWorkspace } from '@/features/assistant/AssistantWorkspace';

export default function AiAssistantPage() {
  return <Suspense fallback={<main className="min-h-[70vh]" aria-busy="true" />}><AssistantWorkspace /></Suspense>;
}
