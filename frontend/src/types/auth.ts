export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  cnic: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  phone?: string;
  cnic?: string;
}

export interface ProfileUpdatePayload {
  email?: string;
  phone?: string;
  cnic?: string;
}
