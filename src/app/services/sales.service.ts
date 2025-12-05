import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

const CART_BASE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/orders/DetailsCarritoCompras';
const CREATE_ORDER_URL = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/CreateOrder';

export interface CartDetailPayload {
  productId: number;
  customerId: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDetailPayload {
  productId: number;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customerId: string;
  shipAddress: string;
  shipCity: string;
  shipCountry: string;
  shipPostalCode: string;
  orderDetails: OrderDetailPayload[];
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private api: ApiService) {}

  // Carrito
  async getCartByCustomer(customerId: string) {
    const url = `${CART_BASE}/obtenerPorCliente/${customerId}`;
    return await this.api.get<any[]>(url);
  }

  async getCartCountByCustomer(customerId: string) {
    const url = `${CART_BASE}/contarPorCliente/${customerId}`;
    return await this.api.get<number>(url);
  }

  async addCartDetail(payload: CartDetailPayload) {
    const url = `${CART_BASE}/crear`;
    return await this.api.post<any>(url, payload);
  }

  async updateCartDetail(payload: CartDetailPayload) {
    const url = `${CART_BASE}/actualizar`;
    return await this.api.put<any>(url, payload);
  }

  async deleteCartDetail(customerId: string, productId: number) {
    const url = `${CART_BASE}/eliminarDetalle/${customerId}/${productId}`;
    return await this.api.delete<any>(url);
  }

  async clearCartByCustomer(customerId: string) {
    const url = `${CART_BASE}/limpiarPorCliente/${customerId}`;
    return await this.api.delete<any>(url);
  }

  async getAllCartDetails() {
    const url = `${CART_BASE}/obtenerTodos`;
    return await this.api.get<any[]>(url);
  }

  // Orden final
  async createOrder(payload: CreateOrderPayload) {
    return await this.api.post<any>(CREATE_ORDER_URL, payload);
  }
}
