export interface UpdateProfileData {
  name: string;
  userName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface UpdateProfileResponse {
  user: {
    id: string;
    name: string;
    userName: string;
    email: string;
    emailConfirmed: boolean;
    roles: string[];
  };
  message: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}