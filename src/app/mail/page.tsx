import { Suspense } from 'react';

import { MailWorkspace } from '@/components/mail/MailWorkspace';

export default function MailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-72 place-items-center text-sm font-semibold text-[var(--color-text-sub)]">
          Loading mail workspace...
        </div>
      }
    >
      <MailWorkspace />
    </Suspense>
  );
}
