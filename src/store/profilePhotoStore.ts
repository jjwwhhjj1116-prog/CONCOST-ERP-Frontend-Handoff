import { create } from 'zustand';

interface ProfilePhotoState {
  appliedPreviewByUserId: Record<string, string>;
  applyPreview: (userId: string, dataUrl: string) => void;
}

export const useProfilePhotoStore = create<ProfilePhotoState>((set) => ({
  appliedPreviewByUserId: {},
  applyPreview: (userId, dataUrl) =>
    set((state) => ({
      appliedPreviewByUserId: {
        ...state.appliedPreviewByUserId,
        [userId]: dataUrl,
      },
    })),
}));
