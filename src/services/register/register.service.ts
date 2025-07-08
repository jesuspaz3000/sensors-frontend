import { api, ApiResponse } from '../api.service';

// Tipos para registro
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

// Tipos para validación de datos
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Clase principal del servicio de registro
export class RegisterService {

  /**
   * Valida los datos de registro antes de enviarlos
   * @param data - Datos de registro
   * @returns ValidationResult
   */
  static validateRegisterData(data: RegisterData): ValidationResult {
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

    // Validar contraseña
    if (!data.password || data.password.length < 6) {
      errors.push({
        field: 'password',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar que las contraseñas coincidan
    if (data.password !== data.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: 'Las contraseñas no coinciden'
      });
    }

    // Validar fortaleza de contraseña (comentado temporalmente para simplificar)
    /*
    if (data.password && data.password.length >= 6) {
      const hasUpperCase = /[A-Z]/.test(data.password);
      const hasLowerCase = /[a-z]/.test(data.password);
      const hasNumbers = /\d/.test(data.password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        errors.push({
          field: 'password',
          message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
        });
      }
    }
    */

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Registra un nuevo usuario
   * @param data - Datos de registro
   * @returns Promise con la respuesta de la API
   */
  static async register(data: RegisterData): Promise<ApiResponse<RegisterResponse>> {
    try {
      // Validar datos antes de enviar
      const validation = this.validateRegisterData(data);
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Preparar datos para enviar (incluir ConfirmPassword con mayúscula)
      const registerPayload = {
        name: data.name.trim(),
        userName: data.userName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword // Backend espera ConfirmPassword con C mayúscula
      };

      const response = await api.post<RegisterResponse>('auth/register', registerPayload);

      console.log('Register API response:', response);

      // Verificar si la respuesta tiene el wrapper ApiResponse o es directa
      if (response.success !== undefined) {
        // Respuesta con wrapper ApiResponse
        return response;
      } else {
        // Respuesta directa del servidor - crear wrapper ApiResponse
        return {
          success: true,
          data: response as unknown as RegisterResponse,
          message: 'Usuario registrado exitosamente'
        };
      }
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Verifica si un nombre de usuario está disponible
   * @param userName - Nombre de usuario a verificar
   * @returns Promise<boolean>
   */
  static async checkUserNameAvailability(userName: string): Promise<boolean> {
    try {
      if (!userName || userName.trim().length < 3) {
        return false;
      }

      const response = await api.get<{ available: boolean }>(`auth/check-username/${userName.trim()}`);
      return response.success && response.data?.available === true;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Verifica si un email está disponible
   * @param email - Email a verificar
   * @returns Promise<boolean>
   */
  static async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return false;
      }

      const response = await api.get<{ available: boolean }>(`auth/check-email/${email.trim().toLowerCase()}`);
      return response.success && response.data?.available === true;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return false;
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
   * Genera sugerencias de nombre de usuario basadas en el nombre y email
   * @param name - Nombre del usuario
   * @param email - Email del usuario
   * @returns string[]
   */
  static generateUsernameSuggestions(name: string, email: string): string[] {
    const suggestions: string[] = [];
    
    if (!name && !email) return suggestions;

    // Limpiar nombre
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Obtener parte del email antes del @
    const emailPrefix = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

    if (cleanName) {
      suggestions.push(cleanName);
      suggestions.push(`${cleanName}123`);
      suggestions.push(`${cleanName}${new Date().getFullYear()}`);
    }

    if (emailPrefix && emailPrefix !== cleanName) {
      suggestions.push(emailPrefix);
      suggestions.push(`${emailPrefix}123`);
    }

    // Combinar nombre con números aleatorios
    if (cleanName) {
      for (let i = 0; i < 3; i++) {
        const randomNum = Math.floor(Math.random() * 999) + 1;
        suggestions.push(`${cleanName}${randomNum}`);
      }
    }

    // Remover duplicados y retornar máximo 5 sugerencias
    return [...new Set(suggestions)].slice(0, 5);
  }
}

export default RegisterService;
