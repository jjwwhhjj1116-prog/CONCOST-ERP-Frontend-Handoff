import { Suspense } from 'react';
import { DriveWorkspace } from '@/components/drive/DriveWorkspace';

export default function DrivePage() {
  return <Suspense fallback={null}><DriveWorkspace /></Suspense>;
}
