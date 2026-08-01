export type ProjectIntakeSelectionMode = 'CREATE' | 'EDIT' | 'LIST';

export type ProjectIntakeSelection = {
  selectedId: string | null;
  requestedIdMissing: boolean;
};

export function resolveProjectIntakeSelection(input: {
  mode: ProjectIntakeSelectionMode;
  requestedIntakeId?: string;
  selectedId?: string;
  createdDraftId?: string;
  availableIds: readonly string[];
  filteredIds?: readonly string[];
}): ProjectIntakeSelection {
  const available = new Set(input.availableIds);

  if (input.mode === 'EDIT') {
    const requestedId = input.requestedIntakeId?.trim();
    if (!requestedId) return { selectedId: null, requestedIdMissing: true };
    return {
      selectedId: available.has(requestedId) ? requestedId : null,
      requestedIdMissing: !available.has(requestedId),
    };
  }

  if (input.mode === 'CREATE') {
    const selectedId = input.createdDraftId?.trim();
    return {
      selectedId: selectedId && available.has(selectedId) ? selectedId : null,
      requestedIdMissing: false,
    };
  }

  const selectedId = input.selectedId?.trim();
  if (selectedId && available.has(selectedId)) {
    return { selectedId, requestedIdMissing: false };
  }
  const firstFilteredId = input.filteredIds?.find((id) => available.has(id));
  return { selectedId: firstFilteredId || null, requestedIdMissing: false };
}
