import type { BusinessCardFields } from '@/lib/businessCardOcr';

export const LEGACY_CONTACT_STORAGE_KEY = 'erp-contact-storage-v1';

export type LegacyUnscopedContact = BusinessCardFields & {
  id: string;
  confidence: number;
  imageName?: string;
  createdAt: string;
  updatedAt: string;
};

const emptyFields = (): BusinessCardFields => ({
  name: '', company: '', department: '', position: '', mobile: '', telephone: '', fax: '', email: '', homepage: '', address: '',
});

const safeText = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function readLegacyUnscopedContacts(storage: Pick<Storage, 'getItem'>): LegacyUnscopedContact[] {
  try {
    const raw = storage.getItem(LEGACY_CONTACT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { contacts?: unknown[] } };
    if (!Array.isArray(parsed?.state?.contacts)) return [];
    return parsed.state.contacts.flatMap((candidate) => {
      if (!candidate || typeof candidate !== 'object') return [];
      const record = candidate as Record<string, unknown>;
      const fields = emptyFields();
      for (const key of Object.keys(fields) as Array<keyof BusinessCardFields>) fields[key] = safeText(record[key]);
      if (!fields.name && !fields.company) return [];
      return [{
        ...fields,
        id: safeText(record.id) || `legacy-contact-${Math.random().toString(36).slice(2)}`,
        confidence: Number.isFinite(Number(record.confidence)) ? Number(record.confidence) : 0,
        imageName: safeText(record.imageName) || undefined,
        createdAt: safeText(record.createdAt),
        updatedAt: safeText(record.updatedAt),
      }];
    });
  } catch {
    return [];
  }
}

export function clearLegacyUnscopedContacts(storage: Pick<Storage, 'removeItem'>) {
  storage.removeItem(LEGACY_CONTACT_STORAGE_KEY);
}

// Legacy records have no companyId. They must never be silently assigned to a company.
export function legacyContactsRequireExplicitCompanyReview(contacts: LegacyUnscopedContact[]) {
  return contacts.map((contact) => ({ legacyId: contact.id, status: 'COMPANY_REVIEW_REQUIRED' as const }));
}
