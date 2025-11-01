
export enum DocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
}

export interface KycData {
  documentType?: DocumentType;
  fullName?: string;
  nationalId?: string;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  issueDate?: string;
  expiryDate?: string;
  mrz?: string;
  bloodGroup?: string;
}

export interface SavedKycData extends KycData {
  id: string;
  timestamp: number;
}
