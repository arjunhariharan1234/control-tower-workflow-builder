export type IntegrationCategory =
  | 'notifications'
  | 'telephony'
  | 'crm-support'
  | 'communication'
  | 'analytics'
  | 'cloud-infra'
  | 'databases'
  | 'ai-ml'
  | 'logistics'
  | 'payments'
  | 'webhook';

export type AuthType = 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token' | 'none';

export interface AuthField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
}

export interface IntegrationTrigger {
  id: string;
  label: string;
  description: string;
}

export interface IntegrationAction {
  id: string;
  label: string;
  description: string;
  inputFields: {
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
  }[];
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: string;
  color: string;
  website: string;
  authType: AuthType;
  authFields: AuthField[];
  triggers: IntegrationTrigger[];
  actions: IntegrationAction[];
  tags: string[];
  popular?: boolean;
}

export interface IntegrationConnection {
  integrationId: string;
  label: string;
  credentials: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  status: 'connected' | 'error' | 'unchecked';
}
