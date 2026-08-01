export type ProfilePhotoState =
  | 'EMPTY'
  | 'UPLOADED'
  | 'EDITING'
  | 'AI_PENDING'
  | 'AI_REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED';

export type ProfilePhotoBackground = 'WHITE' | 'LIGHT_GRAY' | 'PALE_BLUE';

export interface ProfilePhotoTransform {
  zoom: number;
  rotation: number;
  brightness: number;
  alignX: number;
  alignY: number;
  background: ProfilePhotoBackground;
}

export interface ProfilePhotoDraft {
  id: string;
  userId: string;
  originalDataUrl: string;
  previewDataUrl: string;
  state: ProfilePhotoState;
  transform: ProfilePhotoTransform;
  originalPreserved: true;
  identityChangeAllowed: false;
  createdAt: string;
}

export const defaultProfilePhotoTransform: ProfilePhotoTransform = {
  zoom: 1,
  rotation: 0,
  brightness: 100,
  alignX: 50,
  alignY: 50,
  background: 'WHITE',
};

const transitions: Record<ProfilePhotoState, readonly ProfilePhotoState[]> = {
  EMPTY: ['UPLOADED'],
  UPLOADED: ['EDITING', 'AI_PENDING', 'APPROVED', 'REJECTED'],
  EDITING: ['AI_PENDING', 'APPROVED', 'REJECTED'],
  AI_PENDING: ['AI_REVIEW_REQUIRED', 'FAILED'],
  AI_REVIEW_REQUIRED: ['EDITING', 'APPROVED', 'REJECTED'],
  APPROVED: ['EDITING'],
  REJECTED: ['EDITING'],
  FAILED: ['EDITING', 'AI_PENDING'],
};

export function canTransitionProfilePhoto(
  from: ProfilePhotoState,
  to: ProfilePhotoState,
) {
  return transitions[from].includes(to);
}

export function createProfilePhotoDraft(
  userId: string,
  dataUrl: string,
  now = new Date(),
): ProfilePhotoDraft {
  return {
    id: `profile-photo-${now.getTime()}`,
    userId,
    originalDataUrl: dataUrl,
    previewDataUrl: dataUrl,
    state: 'UPLOADED',
    transform: { ...defaultProfilePhotoTransform },
    originalPreserved: true,
    identityChangeAllowed: false,
    createdAt: now.toISOString(),
  };
}

export function profilePhotoBackgroundColor(background: ProfilePhotoBackground) {
  if (background === 'LIGHT_GRAY') return '#eef1f5';
  if (background === 'PALE_BLUE') return '#eaf3fb';
  return '#ffffff';
}

export function isAcceptedProfilePhotoFile(file: Pick<File, 'type' | 'size'>) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    && file.size > 0
    && file.size <= 10 * 1024 * 1024;
}
