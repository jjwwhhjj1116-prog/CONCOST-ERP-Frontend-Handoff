export type HistoryUndoShortcut = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  defaultPrevented: boolean;
  editableTarget: boolean;
};

export const shouldNavigateBackFromUndoShortcut = (shortcut: HistoryUndoShortcut) => (
  !shortcut.defaultPrevented
  && !shortcut.editableTarget
  && (shortcut.ctrlKey || shortcut.metaKey)
  && !shortcut.altKey
  && !shortcut.shiftKey
  && shortcut.key.toLocaleLowerCase() === 'z'
);
