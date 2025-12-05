// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

// =========================
// ENDPOINTS PRODUCTOS
// =========================
const API_URL_PRODUCTOS   = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/obtenerProductos';
const API_URL_CREAR       = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/crearProducto';
const API_URL_ACTUALIZAR  = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/actualizarProducto';
const API_URL_ELIMINAR    = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/eliminarProducto';

// =========================
// ENDPOINTS IMÁGENES PRODUCTO
// =========================
const API_IMG_GET    = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/image/obtenerImagenProducto';
const API_IMG_CREATE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/image/crearImagenProducto';
const API_IMG_UPDATE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/image/actualizarImagenProducto';
const API_IMG_DELETE = 'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/products/image/eliminarImagenProducto';

export interface ProductPayload {
  name: string;
  unitsInStock: number;
  unitPrice: number;
}

interface ProductImageDto {
  image: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  // ====================
  // CRUD PRODUCTOS
  // ====================
  async getProducts() {
    return await this.api.get<any[]>(API_URL_PRODUCTOS);
  }

  async createProduct(payload: ProductPayload) {
    return await this.api.post<any>(API_URL_CREAR, payload);
  }

  async updateProduct(id: number, payload: ProductPayload) {
    const url = `${API_URL_ACTUALIZAR}/${id}`;
    return await this.api.put<any>(url, payload);
  }

  async deleteProduct(id: number) {
    const url = `${API_URL_ELIMINAR}/${id}`;
    return await this.api.delete<any>(url);
  }

  // ====================
  //   IMÁGENES PRODUCTO
  // ====================

  /** Obtener imagen del producto (base64) */
  async getProductImage(id: number): Promise<string | null> {
    const url = `${API_IMG_GET}/${id}`;

    try {
      const result = await this.api.get<ProductImageDto>(url);
      return result?.image || null;
    } catch (err: any) {
      if (err.status === 404) return null; // Si no existe imagen
      throw err;
    }
  }

  /** Crear imagen del producto */
  async createProductImage(id: number, base64: string) {
    const url = `${API_IMG_CREATE}/${id}`;
    return await this.api.post(url, { image: base64 });
  }

  /** Actualizar imagen del producto */
  async updateProductImage(id: number, base64: string) {
    const url = `${API_IMG_UPDATE}/${id}`;
    return await this.api.put(url, { image: base64 });
  }

  /** Eliminar imagen del producto */
  async deleteProductImage(id: number) {
    const url = `${API_IMG_DELETE}/${id}`;
    return await this.api.delete(url);
  }
}
