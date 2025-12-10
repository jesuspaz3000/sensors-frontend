import { ApiService } from '../api.service';
import type {
  User,
  PaginationParams,
  PaginatedResponse,
  CreateUserData,
  UpdateUserData,
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
} from '../../types/adminUsers';
import { validateUserId, buildPaginationQuery } from '../../utils/adminUsers';

export const AdminUsersService = {
  listUsers: async (params: PaginationParams = {}): Promise<PaginatedResponse<User>> => {
    const { limit = 10, offset = 0 } = params;
    const query = buildPaginationQuery(limit, offset);
    return await ApiService.get<PaginatedResponse<User>>(`/admin/users?${query}`);
  },

  getUserById: async (userId: string): Promise<User> => {
    validateUserId(userId);
    return await ApiService.get<User>(`/admin/users/${userId}`);
  },

  createUser: async (userData: CreateUserData): Promise<CreateUserResponse> => {
    return await ApiService.post<CreateUserResponse>('/admin/users', userData);
  },

  updateUser: async (userId: string, userData: UpdateUserData): Promise<UpdateUserResponse> => {
    validateUserId(userId);
    return await ApiService.patch<UpdateUserResponse>(`/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId: string): Promise<DeleteUserResponse> => {
    validateUserId(userId);
    return await ApiService.delete<DeleteUserResponse>(`/admin/users/${userId}`);
  },
};

export default AdminUsersService;
