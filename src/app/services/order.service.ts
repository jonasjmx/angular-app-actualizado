// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

const API_BASE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/orders';

export interface OrderDetail {
  orderId: number;
  productId: number;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerId: string;
  shipAddress: string;
  shipCity: string;
  shipCountry: string;
  shipPostalCode: string;
  orderDate?: string;
  shippingType?: string;
  discount?: number;
  orderDetails: OrderDetail[];
}

export interface UpdateOrderPayload {
  customerId: string;
  shipAddress: string;
  shipCity: string;
  shipCountry: string;
  shipPostalCode: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  getOrders(): Promise<Order[]> {
    return this.api.get<Order[]>(`${API_BASE}/obtenerOrdenes`);
  }

  getOrderById(id: number): Promise<Order> {
    return this.api.get<Order>(`${API_BASE}/obtenerOrdenPorId/${id}`);
  }

  getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.api.get<Order[]>(`${API_BASE}/obtenerOrdenesPorCustomer?customerId=${customerId}`);
  }

  updateOrder(id: number, payload: UpdateOrderPayload): Promise<any> {
    return this.api.put<any>(`${API_BASE}/actualizarOrden/${id}`, payload);
  }

  deleteOrder(id: number): Promise<any> {
    return this.api.delete<any>(`${API_BASE}/eliminarOrden/${id}`);
  }
}
