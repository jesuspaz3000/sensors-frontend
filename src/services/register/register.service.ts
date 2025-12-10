import { ApiService } from '../api.service';
import type { RegisterData, RegisterResponse } from '../../types/register';
import { validateRegisterData, generateUsernameSuggestions, formatValidationErrors } from '../../utils/register';

export const RegisterService = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const validation = validateRegisterData(data);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const registerPayload = {
      name: data.name.trim(),
      userName: data.userName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword
    };

    return await ApiService.post<RegisterResponse>('/auth/register', registerPayload);
  },

  checkUserNameAvailability: async (userName: string): Promise<boolean> => {
    if (!userName || userName.trim().length < 3) {
      return false;
    }

    try {
      const response = await ApiService.get<{ available: boolean }>(`/auth/check-username/${userName.trim()}`);
      return response?.available === true;
    } catch {
      return false;
    }
  },

  checkEmailAvailability: async (email: string): Promise<boolean> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return false;
    }

    try {
      const response = await ApiService.get<{ available: boolean }>(`/auth/check-email/${email.trim().toLowerCase()}`);
      return response?.available === true;
    } catch {
      return false;
    }
  },

  validateRegisterData,
  formatValidationErrors,
  generateUsernameSuggestions,
};

export default RegisterService;
