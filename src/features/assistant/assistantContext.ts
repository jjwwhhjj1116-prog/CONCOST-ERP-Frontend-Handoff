import type { AssistantCompanyId, AssistantPageContext } from './assistantModel';

const first = (params: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return null;
};

export function createAssistantPageContext(
  route: string,
  params: URLSearchParams,
  companyId: AssistantCompanyId,
): AssistantPageContext {
  const projectId = first(params, ['projectId']);
  const claimId = first(params, ['claimId']);
  const customerId = first(params, ['customerId']);
  const postId = first(params, ['postId', 'id']);
  const entity = (route.startsWith('/claims') || route.startsWith('/claim-center')) && claimId
    ? { entityType: 'CLAIM', entityId: claimId, label: `Claim ${claimId}` }
    : projectId
    ? { entityType: 'PROJECT', entityId: projectId, label: `Project ${projectId}` }
    : claimId
      ? { entityType: 'CLAIM', entityId: claimId, label: `Claim ${claimId}` }
      : customerId
        ? { entityType: 'CUSTOMER', entityId: customerId, label: `Customer ${customerId}` }
        : route.startsWith('/board') && postId
          ? { entityType: 'BOARD_POST', entityId: postId, label: `Board post ${postId}` }
          : { entityType: null, entityId: null, label: null };

  const sensitivity = route.startsWith('/finance')
    ? 'FINANCE'
    : route.startsWith('/organization')
      ? 'HR'
      : route.startsWith('/claims') || route.startsWith('/claim-center')
        ? 'RESTRICTED_LEGAL'
        : 'NORMAL';

  return { companyId, route, ...entity, sensitivity };
}

export const isSensitiveAssistantContext = (context: AssistantPageContext) =>
  context.sensitivity !== 'NORMAL';
