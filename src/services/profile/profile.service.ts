import { api, ApiResponse } from '../api.service';
import { AuthService } from '../login/auth.service';

// Tipos para actualización de perfil
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

// Tipos para validación de datos
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Clase principal del servicio de perfil
export class ProfileService {

  /**
   * Valida los datos de actualización de perfil
   * 
   * COMPORTAMIENTO:
   * - Siempre requiere contraseña actual para cualquier modificación
   * - Solo requiere nueva contraseña si el usuario intenta cambiarla
   * - La nueva contraseña debe tener al menos 6 caracteres, letras y números
   * - Si se cambia contraseña, debe ser diferente a la actual
   * 
   * @param data - Datos de actualización
   * @returns ValidationResult
   */
  static validateProfileData(data: UpdateProfileData): ValidationResult {
    const errors: ValidationError[] = [];

    // Validar nombre
    if (!data.name || data.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    // Validar nombre de usuario
    if (!data.userName || data.userName.trim().length < 3) {
      errors.push({
        field: 'userName',
        message: 'El nombre de usuario debe tener al menos 3 caracteres'
      });
    }

    // Validar que el username no contenga espacios
    if (data.userName && data.userName.includes(' ')) {
      errors.push({
        field: 'userName',
        message: 'El nombre de usuario no puede contener espacios'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push({
        field: 'email',
        message: 'Ingrese un email válido'
      });
    }

    // Determinar si se está intentando cambiar la contraseña
    const isChangingPassword = this.isPasswordChangeAttempt(data);

    // Siempre requerir contraseña actual para cualquier modificación de perfil
    if (!data.currentPassword) {
      errors.push({
        field: 'currentPassword',
        message: 'La contraseña actual es requerida para actualizar el perfil'
      });
    }

    // Si se está cambiando la contraseña, validar campos relacionados
    if (isChangingPassword) {
      // Validar nueva contraseña usando la función helper
      if (data.newPassword) {
        const passwordValidation = this.validatePasswordStrength(data.newPassword);
        if (!passwordValidation.isValid) {
          errors.push({
            field: 'newPassword',
            message: passwordValidation.message || 'Contraseña inválida'
          });
        }
      } else {
        errors.push({
          field: 'newPassword',
          message: 'La nueva contraseña es requerida'
        });
      }

      // Validar confirmación de nueva contraseña
      if (!data.confirmNewPassword) {
        errors.push({
          field: 'confirmNewPassword',
          message: 'Debe confirmar la nueva contraseña'
        });
      } else if (data.newPassword !== data.confirmNewPassword) {
        errors.push({
          field: 'confirmNewPassword',
          message: 'Las contraseñas no coinciden'
        });
      }

      // Validar que la nueva contraseña sea diferente a la actual
      if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
        errors.push({
          field: 'newPassword',
          message: 'La nueva contraseña debe ser diferente a la actual'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Actualiza el perfil del usuario
   * @param data - Datos de actualización
   * @returns Promise con la respuesta de la API
   */
  static async updateProfile(data: UpdateProfileData): Promise<ApiResponse<UpdateProfileResponse>> {
    try {
      // Verificar que el usuario esté autenticado
      if (!AuthService.isAuthenticated()) {
        throw new Error('Usuario no autenticado');
      }

      // Validar datos antes de enviar
      const validation = this.validateProfileData(data);
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Preparar datos para enviar
      const updatePayload: Record<string, string> = {
        name: data.name.trim(),
        userName: data.userName.trim(),
        email: data.email.trim().toLowerCase(),
        currentPassword: data.currentPassword || '' // Siempre incluir la contraseña actual
      };

      // Solo incluir campos de nueva contraseña si realmente se está cambiando
      if (data.newPassword && data.confirmNewPassword) {
        updatePayload.newPassword = data.newPassword;
        updatePayload.confirmNewPassword = data.confirmNewPassword;
        console.log('Updating profile with password change');
      } else {
        console.log('Updating profile without password change');
      }

      console.log('Updating profile with payload:', updatePayload);
      console.log('Access token exists:', !!AuthService.getAccessToken());

      const response = await api.securePatch<UpdateProfileResponse>('auth/profile', updatePayload);

      console.log('Update profile API response:', response);

      // Verificar si la respuesta tiene el wrapper ApiResponse o es directa
      if (response.success !== undefined) {
        // Respuesta con wrapper ApiResponse
        return response;
      } else {
        // Respuesta directa del servidor - crear wrapper ApiResponse
        return {
          success: true,
          data: response as unknown as UpdateProfileResponse,
          message: 'Perfil actualizado exitosamente'
        };
      }
    } catch (error) {
      console.error('Error during profile update:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos del perfil actual del usuario desde localStorage
   * @returns Promise con los datos del usuario
   */
  static async getProfile(): Promise<ApiResponse<UpdateProfileResponse['user']>> {
    try {
      // Obtener datos del usuario desde localStorage
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No user data found in localStorage');
      }

      console.log('Get profile from localStorage:', currentUser);

      return {
        success: true,
        data: currentUser,
        message: 'Datos del perfil obtenidos exitosamente'
      };
    } catch (error) {
      console.error('Error getting profile from localStorage:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos del perfil del usuario desde la API y actualiza localStorage
   * Útil para sincronizar datos actuales del servidor
   * @returns Promise con los datos del usuario
   */
  static async getProfileFromAPI(): Promise<ApiResponse<UpdateProfileResponse['user']>> {
    try {
      const response = await api.get<UpdateProfileResponse['user']>('auth/me');
      
      console.log('Get profile API response:', response);

      let userData: UpdateProfileResponse['user'];
      let isSuccess = false;

      // Verificar si la respuesta tiene el wrapper ApiResponse o es directa
      if (response.success !== undefined) {
        userData = response.data!;
        isSuccess = response.success;
      } else {
        userData = response as unknown as UpdateProfileResponse['user'];
        isSuccess = true;
      }

      if (isSuccess && userData) {
        // Actualizar datos en localStorage
        AuthService.saveUser(userData);
        
        return {
          success: true,
          data: userData,
          message: 'Datos del perfil obtenidos y sincronizados exitosamente'
        };
      }

      return {
        success: false,
        message: 'Error al obtener datos del perfil desde la API'
      };
    } catch (error) {
      console.error('Error getting profile from API:', error);
      throw error;
    }
  }

  /**
   * Formatea los errores de validación para mostrar en la UI
   * @param errors - Array de errores de validación
   * @returns Record<string, string>
   */
  static formatValidationErrors(errors: ValidationError[]): Record<string, string> {
    const formattedErrors: Record<string, string> = {};
    
    errors.forEach(error => {
      formattedErrors[error.field] = error.message;
    });

    return formattedErrors;
  }

  /**
   * Función de diagnóstico para probar la autenticación
   * @returns Promise con información de diagnóstico
   */
  static async testAuthentication(): Promise<void> {
    try {
      console.log('=== DIAGNÓSTICO DE AUTENTICACIÓN ===');
      console.log('isAuthenticated:', AuthService.isAuthenticated());
      console.log('accessToken exists:', !!AuthService.getAccessToken());
      console.log('refreshToken exists:', !!AuthService.getRefreshToken());
      console.log('currentUser:', AuthService.getCurrentUser());
      
      // Probar endpoint protegido
      try {
        const response = await api.get('auth/me');
        console.log('Test auth/me response:', response);
      } catch (authError) {
        console.error('Error testing auth/me:', authError);
      }
      
      console.log('======================================');
    } catch (error) {
      console.error('Error in authentication test:', error);
    }
  }

  /**
   * Determina si los datos indican un intento de cambio de contraseña
   * @param data - Datos de actualización
   * @returns boolean
   */
  static isPasswordChangeAttempt(data: UpdateProfileData): boolean {
    return !!(data.newPassword || data.confirmNewPassword);
  }

  /**
   * Valida que una contraseña cumple con los requisitos de seguridad
   * @param password - Contraseña a validar
   * @returns { isValid: boolean, message?: string }
   */
  static validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      return {
        isValid: false,
        message: 'La contraseña debe contener al menos una letra y un número'
      };
    }

    return { isValid: true };
  }

  /**
   * Función de prueba para verificar el comportamiento de validación
   * Útil para debugging y testing
   */
  static testValidationBehavior(): void {
    console.log('=== TEST DE VALIDACIÓN DE PERFIL ===');
    
    // Caso 1: Solo actualizar datos básicos (sin cambio de contraseña)
    const basicUpdate: UpdateProfileData = {
      name: 'Juan Pérez',
      userName: 'juanperez',
      email: 'juan@email.com',
      currentPassword: 'password123'
    };
    
    console.log('Caso 1 - Solo datos básicos:');
    console.log('¿Intento de cambio de contraseña?', this.isPasswordChangeAttempt(basicUpdate));
    console.log('Validación:', this.validateProfileData(basicUpdate));
    
    // Caso 2: Actualizar con cambio de contraseña
    const passwordUpdate: UpdateProfileData = {
      name: 'Juan Pérez',
      userName: 'juanperez',
      email: 'juan@email.com',
      currentPassword: 'password123',
      newPassword: 'newpass456',
      confirmNewPassword: 'newpass456'
    };
    
    console.log('\nCaso 2 - Con cambio de contraseña:');
    console.log('¿Intento de cambio de contraseña?', this.isPasswordChangeAttempt(passwordUpdate));
    console.log('Validación:', this.validateProfileData(passwordUpdate));
    
    // Caso 3: Contraseña débil (solo números)
    const weakPassword: UpdateProfileData = {
      name: 'Juan Pérez',
      userName: 'juanperez',
      email: 'juan@email.com',
      currentPassword: 'password123',
      newPassword: '123456',
      confirmNewPassword: '123456'
    };
    
    console.log('\nCaso 3 - Contraseña débil (solo números):');
    console.log('Validación de contraseña:', this.validatePasswordStrength('123456'));
    console.log('Validación completa:', this.validateProfileData(weakPassword));
    
    console.log('======================================');
  }
}

export default ProfileService;

/*
=== RESUMEN DE CAMBIOS EN VALIDACIÓN DE PERFIL ===

COMPORTAMIENTO ANTERIOR:
- Requería nueva contraseña solo si se proporcionaba algún campo de contraseña

COMPORTAMIENTO ACTUAL:
- Siempre requiere contraseña actual para cualquier modificación del perfil
- Solo requiere nueva contraseña si el usuario realmente quiere cambiarla
- Nueva contraseña debe cumplir requisitos de seguridad (letras + números, mín 6 caracteres)

CASOS DE USO:
1. Actualizar solo datos básicos (name, userName, email):
   - Requiere: currentPassword
   - NO requiere: newPassword, confirmNewPassword

2. Actualizar datos básicos + cambiar contraseña:
   - Requiere: currentPassword, newPassword, confirmNewPassword
   - Validaciones adicionales de seguridad para newPassword

FUNCIONES HELPER AGREGADAS:
- isPasswordChangeAttempt(): Detecta si hay intento de cambio de contraseña
- validatePasswordStrength(): Valida requisitos de seguridad de contraseña
- testValidationBehavior(): Función de prueba para debugging

======================================================
*/
