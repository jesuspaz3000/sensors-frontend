import type { UpdateProfileData, ValidationError, ValidationResult } from '../../types/profile';

export const isPasswordChangeAttempt = (data: UpdateProfileData): boolean => {
  return !!(data.newPassword || data.confirmNewPassword);
};

export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
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
};

export const validateProfileData = (data: UpdateProfileData): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'El nombre debe tener al menos 2 caracteres'
    });
  }

  if (!data.userName || data.userName.trim().length < 3) {
    errors.push({
      field: 'userName',
      message: 'El nombre de usuario debe tener al menos 3 caracteres'
    });
  }

  if (data.userName && data.userName.includes(' ')) {
    errors.push({
      field: 'userName',
      message: 'El nombre de usuario no puede contener espacios'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push({
      field: 'email',
      message: 'Ingrese un email válido'
    });
  }

  const changingPassword = isPasswordChangeAttempt(data);

  if (!data.currentPassword) {
    errors.push({
      field: 'currentPassword',
      message: 'La contraseña actual es requerida para actualizar el perfil'
    });
  }

  if (changingPassword) {
    if (data.newPassword) {
      const passwordValidation = validatePasswordStrength(data.newPassword);
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
};

export const formatValidationErrors = (errors: ValidationError[]): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  errors.forEach(error => {
    formattedErrors[error.field] = error.message;
  });
  return formattedErrors;
};
