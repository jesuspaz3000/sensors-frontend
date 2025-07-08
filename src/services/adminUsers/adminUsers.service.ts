import { api, ApiResponse } from '../api.service';

// Tipos para usuario
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

// Tipos para paginación
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

// Tipos para crear usuario
export interface CreateUserData {
  name: string;
  userName: string;
  email: string;
  password: string;
  roles: string[];
}

// Tipos para actualizar usuario
export interface UpdateUserData {
  name: string;
  userName: string;
  email: string;
  roles: string[];
}

// Tipos de respuesta específicos
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

// Clase principal del servicio de administración de usuarios
export class AdminUsersService {

  /**
   * Lista todos los usuarios con paginación
   * @param params - Parámetros de paginación (limit, offset)
   * @returns Promise con la lista paginada de usuarios
   */
  static async listUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    try {
      const { limit = 10, offset = 0 } = params;
      
      const response = await api.secureGet<PaginatedResponse<User>>(
        `admin/users?limit=${limit}&offset=${offset}`
      );

      // El API devuelve directamente la estructura de paginación
      return response as unknown as PaginatedResponse<User>;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID
   * @param userId - ID del usuario
   * @returns Promise con los datos del usuario
   */
  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await api.secureGet<User>(`admin/users/${userId}`);

      return response;
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Promise con la respuesta de creación
   */
  static async createUser(userData: CreateUserData): Promise<ApiResponse<CreateUserResponse>> {
    try {
      const response = await api.securePost<CreateUserResponse>('admin/users', userData);

      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   * @param userId - ID del usuario a actualizar
   * @param userData - Datos actualizados del usuario
   * @returns Promise con la respuesta de actualización
   */
  static async updateUser(userId: string, userData: UpdateUserData): Promise<ApiResponse<UpdateUserResponse>> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await api.securePatch<UpdateUserResponse>(`admin/users/${userId}`, userData);

      return response;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param userId - ID del usuario a eliminar
   * @returns Promise con la respuesta de eliminación
   */
  static async deleteUser(userId: string): Promise<ApiResponse<DeleteUserResponse>> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await api.secureDelete<DeleteUserResponse>(`admin/users/${userId}`);

      return response;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }
}

export default AdminUsersService;
