export interface LoginCredentials {
  userName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  roles: string[];
}

export interface ValidateSessionResponse {
  user: User;
}