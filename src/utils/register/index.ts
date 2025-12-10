import type { RegisterData, ValidationError, ValidationResult } from '../../types/register';

export const validateRegisterData = (data: RegisterData): ValidationResult => {
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

  if (!data.password || data.password.length < 6) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  if (data.password !== data.confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Las contraseñas no coinciden'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const generateUsernameSuggestions = (name: string, email: string): string[] => {
  const suggestions: string[] = [];
  
  if (!name && !email) return suggestions;

  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
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

  if (cleanName) {
    for (let i = 0; i < 3; i++) {
      const randomNum = Math.floor(Math.random() * 999) + 1;
      suggestions.push(`${cleanName}${randomNum}`);
    }
  }

  return [...new Set(suggestions)].slice(0, 5);
};

export const formatValidationErrors = (errors: ValidationError[]): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  errors.forEach(error => {
    formattedErrors[error.field] = error.message;
  });
  return formattedErrors;
};
