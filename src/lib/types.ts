
export interface CredentialField {
  type: string;
  name: string;
  value: string;
}

export interface Credential {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  fields: CredentialField[];
  isAutoFill: boolean;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface FormData {
  formAction: string;
  formId: string;
  formName: string;
  inputs: {
    type: string;
    name: string;
    value: string;
    isAutoFill: boolean;
  }[];
}
