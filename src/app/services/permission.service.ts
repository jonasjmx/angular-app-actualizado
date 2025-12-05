import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

const API_URL_PERMISOS = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/permissions/obtenerPermisos';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private api: ApiService) {}

  async getPermissions() {
    // ApiService ya envía el Authorization: Bearer <token>
    return await this.api.get<any[]>(API_URL_PERMISOS);
  }
}
