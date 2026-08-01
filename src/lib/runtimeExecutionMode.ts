export type RuntimeExecutionMode = 'DEMO_LOCAL' | 'API_SANDBOX' | 'PRODUCTION_SERVER';

export type RuntimeBoundary =
  | { kind: 'DEMO_SIMULATION'; message: string }
  | { kind: 'BLOCKED'; message: string };

const MODES: RuntimeExecutionMode[] = ['DEMO_LOCAL', 'API_SANDBOX', 'PRODUCTION_SERVER'];

export const getRuntimeExecutionMode = (): RuntimeExecutionMode => {
  const configured = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  if (configured && MODES.includes(configured as RuntimeExecutionMode)) {
    return configured as RuntimeExecutionMode;
  }
  return process.env.NODE_ENV === 'production' ? 'PRODUCTION_SERVER' : 'DEMO_LOCAL';
};

export const isDemoLocalMode = (mode = getRuntimeExecutionMode()) => mode === 'DEMO_LOCAL';

export const getMailSendBoundary = (
  mode = getRuntimeExecutionMode(),
  providerReady = process.env.NEXT_PUBLIC_MAIL_PROVIDER_READY === 'true',
): RuntimeBoundary => {
  if (mode === 'DEMO_LOCAL') {
    return {
      kind: 'DEMO_SIMULATION',
      message: 'Demo simulation only. This message was not sent or saved to a server.',
    };
  }
  return {
    kind: 'BLOCKED',
    message: providerReady
      ? 'Mail backend adapter is not connected. No message was sent.'
      : 'Mail provider is not configured. No message was sent.',
  };
};

export const getApprovalBoundary = (
  mode = getRuntimeExecutionMode(),
  serverReady = process.env.NEXT_PUBLIC_APPROVAL_SERVER_READY === 'true',
  policyReady = process.env.NEXT_PUBLIC_APPROVAL_POLICY_READY === 'true',
): RuntimeBoundary => {
  if (mode === 'DEMO_LOCAL') {
    return {
      kind: 'DEMO_SIMULATION',
      message: 'Demo simulation only. This is not an official approval record.',
    };
  }
  return {
    kind: 'BLOCKED',
    message: !serverReady
      ? 'Approval server is not connected. No approval state changed.'
      : !policyReady
        ? 'Approval policy is not configured. No approval state changed.'
        : 'Approval backend adapter is not connected. No approval state changed.',
  };
};

export const getProjectIntakePersistenceMode = (
  mode = getRuntimeExecutionMode(),
): 'LOCAL_DEMO' | 'SERVER' => mode === 'DEMO_LOCAL' ? 'LOCAL_DEMO' : 'SERVER';
