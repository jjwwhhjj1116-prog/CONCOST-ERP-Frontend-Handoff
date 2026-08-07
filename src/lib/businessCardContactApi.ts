import { apiClient } from '@/lib/apiClient';
import type { BusinessCardRegistrationInput } from '@/lib/businessOperations';
import type { CompanyId } from '@/types/models';

export interface BusinessCardRegistrationResponse {
  contactId: string;
  customerId: string;
  businessCardId: string;
  merged: boolean;
  revision: number;
}

export function registerBusinessCardContact(
  companyId: CompanyId,
  input: BusinessCardRegistrationInput,
) {
  return apiClient<BusinessCardRegistrationResponse>('/v1/business-cards/register', {
    method: 'POST',
    companyId,
    companyScope: 'required',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
