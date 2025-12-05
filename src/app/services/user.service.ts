// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

const API_USERS        = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/obtenerUsuarios';
const API_REGISTER     = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/Register';
const API_ROLES        = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/roles/obtenerRoles';
const API_USERS_BASE   = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users';

const API_USER_ROLES_ASSIGN = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/user-roles/asignarRolAUsuario';
const API_USER_ROLES_UPDATE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/user-roles/actualizarRolUsuario';
const API_USER_ROLES_REMOVE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/user-roles/removerRolDeUsuario';

// 👉 ENDPOINTS DE IMÁGENES
const API_USER_IMAGE_GET    = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/image/obtenerImagenUsuario';
const API_USER_IMAGE_CREATE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/image/crearImagenUsuario';
const API_USER_IMAGE_UPDATE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/image/actualizarImagenUsuario';
const API_USER_IMAGE_DELETE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/image/eliminarImagenUsuario';

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailConfirmed: boolean;
  lockoutEnabled: boolean;
  lockoutEnd: string | null;
}

// dto de imagen según el swagger: { "image": "string" }
export interface UserImageDto {
  image: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  // ================= USUARIOS =================

  getUsers() {
    return this.api.get<any[]>(API_USERS);
  }

  registerUser(payload: any) {
    return this.api.post<any>(API_REGISTER, payload);
  }

  getRoles() {
    return this.api.get<any[]>(API_ROLES);
  }

  updateUser(id: string, payload: UpdateUserRequest) {
    const url = `${API_USERS_BASE}/actualizarUsuario/${id}`;
    return this.api.put<any>(url, payload);
  }

  deleteUser(id: string) {
    const url = `${API_USERS_BASE}/eliminarUsuario/${id}`;
    return this.api.delete<any>(url);
  }

  // ================= ROLES DE USUARIO =================

  // asignar cuando el usuario NO tiene rol
  assignRoleToUser(userId: string, roleId: string) {
    return this.api.post<any>(API_USER_ROLES_ASSIGN, { userId, roleId });
  }

  // cambiar rol: usa el endpoint PUT
  updateUserRole(userId: string, currentRoleId: string, newRoleId: string) {
    return this.api.put<any>(API_USER_ROLES_UPDATE, {
      userId,
      currentRoleId,
      newRoleId
    });
  }

  // quitar rol: usa el endpoint DELETE con userId y roleId en la ruta
  removeUserRole(userId: string, roleId: string) {
    const url = `${API_USER_ROLES_REMOVE}/${userId}/${roleId}`;
    return this.api.delete<any>(url);
  }

  // ================= IMÁGENES DE USUARIO =================
  // Todos estos métodos usan async/await para devolverte Promises sencillas.

  /** Obtener la imagen del usuario como base64 (solo la parte base64) */
  async getUserImage(userId: string): Promise<string | null> {
    const url = `${API_USER_IMAGE_GET}/${userId}`;
    try {
      const resp = await this.api.get<UserImageDto>(url);
      return resp?.image || null;
    } catch (err: any) {
      // si el backend devuelve 404 cuando no hay imagen, devolvemos null
      if (err?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /** Crear imagen de usuario (cuando no tiene) */
  async createUserImage(userId: string, base64: string): Promise<void> {
    const url = `${API_USER_IMAGE_CREATE}/${userId}`;
    const body: UserImageDto = { image: base64 };
    await this.api.post<void>(url, body);
  }

  /** Actualizar imagen de usuario (cuando ya tiene) */
  async updateUserImage(userId: string, base64: string): Promise<void> {
    const url = `${API_USER_IMAGE_UPDATE}/${userId}`;
    const body: UserImageDto = { image: base64 };
    await this.api.put<void>(url, body);
  }

  /** Eliminar imagen de usuario */
  async deleteUserImage(userId: string): Promise<void> {
    const url = `${API_USER_IMAGE_DELETE}/${userId}`;
    await this.api.delete<void>(url);
  }
}
