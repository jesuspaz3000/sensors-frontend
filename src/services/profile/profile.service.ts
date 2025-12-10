import { ApiService } from '../api.service';
import { AuthService } from '../login/auth.service';
import type { UpdateProfileData, UpdateProfileResponse } from '../../types/profile';
import { validateProfileData, formatValidationErrors } from '../../utils/profile';

export const ProfileService = {
  updateProfile: async (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
    if (!AuthService.isAuthenticated()) {
      throw new Error('Usuario no autenticado');
    }

    const validation = validateProfileData(data);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const updatePayload: Record<string, string> = {
      name: data.name.trim(),
      userName: data.userName.trim(),
      email: data.email.trim().toLowerCase(),
      currentPassword: data.currentPassword || ''
    };

    if (data.newPassword && data.confirmNewPassword) {
      updatePayload.newPassword = data.newPassword;
      updatePayload.confirmNewPassword = data.confirmNewPassword;
    }

    const response = await ApiService.patch<UpdateProfileResponse>('/auth/profile', updatePayload);
    return response;
  },

  getProfile: async (): Promise<UpdateProfileResponse['user']> => {
    const currentUser = AuthService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user data found in localStorage');
    }

    return currentUser;
  },

  getProfileFromAPI: async (): Promise<UpdateProfileResponse['user']> => {
    const response = await ApiService.get<UpdateProfileResponse['user']>('/auth/me');
    
    if (response) {
      const saveUser = (user: UpdateProfileResponse['user']): void => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
      };
      saveUser(response);
    }
    
    return response;
  },

  validateProfileData,
  formatValidationErrors,
};

export default ProfileService;
