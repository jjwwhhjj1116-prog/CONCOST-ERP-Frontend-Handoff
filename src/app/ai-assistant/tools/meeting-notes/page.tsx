import { Suspense } from 'react';
import { AiMeetingWorkspace } from '@/components/handoff/AiMeetingWorkspace';

export default function AiMeetingNotesPage() {
  return <Suspense fallback={<main className="min-h-[70vh]" aria-busy="true" />}><AiMeetingWorkspace /></Suspense>;
}
