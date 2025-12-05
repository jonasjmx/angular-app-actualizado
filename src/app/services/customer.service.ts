// src/app/services/customer.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

const API_URL_CLIENTES   = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/customers/obtenerClientes';
const API_URL_CREAR      = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/customers/crearCliente';
const API_URL_ACTUALIZAR = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/customers/actualizarCliente';
const API_URL_ELIMINAR   = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/customers/eliminarCliente';

export interface CustomerPayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email: string;
  phoneNumber: string;
  // currentBalance no se envía, lo calcula el backend
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor(private api: ApiService) {}

  async getCustomers() {
    return await this.api.get<any[]>(API_URL_CLIENTES);
  }

  async createCustomer(payload: CustomerPayload) {
    return await this.api.post<any>(API_URL_CREAR, payload);
  }

  async updateCustomer(id: string, payload: CustomerPayload) {
    const url = `${API_URL_ACTUALIZAR}/${id}`;
    return await this.api.put<any>(url, payload);
  }

  async deleteCustomer(id: string) {
    const url = `${API_URL_ELIMINAR}/${id}`;
    return await this.api.delete<any>(url);
  }
}
