export interface RegisterData {
  name: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    name: string;
    userName: string;
    email: string;
    role?: string;
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