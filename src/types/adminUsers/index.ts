export interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  roles: string[];
  hasRoles: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend representation of user for UI display
export interface UserData {
  id: string;
  nombre: string;
  usuario: string;
  email: string;
  rol: string;
  emailConfirmed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend form data for creating users
export interface CreateUserFormData {
  nombre: string;
  usuario: string;
  email: string;
  password: string;
  rol: string;
}

// Frontend form data for editing users
export interface EditUserFormData {
  nombre: string;
  usuario: string;
  email: string;
  rol: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  total: number;
  count: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrevious: boolean;
  data: T[];
}

export interface CreateUserData {
  name: string;
  userName: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserData {
  name: string;
  userName: string;
  email: string;
  roles: string[];
}

export interface CreateUserResponse {
  user: User;
  message: string;
}

export interface UpdateUserResponse {
  user: User;
  message: string;
}

export interface DeleteUserResponse {
  message: string;
  deletedUserId: string;
}