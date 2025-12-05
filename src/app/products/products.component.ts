import { Component, OnInit } from '@angular/core';
import { ProductService, ProductPayload } from '../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {

  productos: any[] = [];
  loading = true;
  error = '';

  // Variable para controlar si se intentó enviar el form y mostrar bordes rojos
  formSubmitted = false;

  // MODAL CREAR
  isCreateModalOpen = false;
  newProduct: ProductPayload = {
    name: '',
    unitsInStock: 0,
    unitPrice: 0
  };

  // MODAL EDITAR
  isEditModalOpen = false;
  editProductId: number | null = null;
  editProduct: ProductPayload = {
    name: '',
    unitsInStock: 0,
    unitPrice: 0
  };

  // MODAL ELIMINAR
  isDeleteModalOpen = false;
  productToDelete: any = null;

  // ========== IMAGEN EN MODAL ==========
  currentProductImageSrc: string | null = null;
  selectedProductImageBase64: string | null = null;
  hasProductImage: boolean = false;
  loadingImage: boolean = false;

  constructor(private prodSvc: ProductService) {}

  async ngOnInit() {
    await this.loadProducts();
  }

  // ================== CARGAR PRODUCTOS ==================
  async loadProducts() {
    this.loading = true;
    this.error = '';

    try {
      const resp = await this.prodSvc.getProducts();
      const products = resp || [];

      // Cargar imagen de cada producto en paralelo
      await Promise.all(
        products.map(async (p: any) => {
          try {
            const img = await this.prodSvc.getProductImage(p.id);
            p.imageBase64 = img; 
          } catch {
            p.imageBase64 = null;
          }
        })
      );

      this.productos = products;
    } catch (err: any) {
      this.error = err?.message || 'Error al cargar productos';
    }

    this.loading = false;
  }

  // ================== VALIDACIONES ==================

  // Sanitiza el input mientras escriben (Mayúsculas)
  sanitizeInput(type: 'new' | 'edit') {
    if (type === 'new') {
      this.newProduct.name = this.newProduct.name.toUpperCase();
    } else {
      this.editProduct.name = this.editProduct.name.toUpperCase();
    }
  }

  // Verifica Regex: Solo letras, números, guiones y comillas simples
  isNameValid(name: string): boolean {
    const regex = /^[A-Z0-9\-\'\s]+$/;
    return regex.test(name);
  }

  // Verifica Stock invalido (nulo, negativo o cero)
  isStockInvalid(val: any): boolean {
    return val === null || val === undefined || val <= 0;
  }

  // Verifica Precio invalido (nulo, negativo o cero)
  isPriceInvalid(val: any): boolean {
    return val === null || val === undefined || val <= 0;
  }

  // Verifica si el nombre ya existe (Duplicado)
  isNameDuplicate(name: string, excludeId?: number): boolean {
    const upperName = name.trim().toUpperCase();
    return this.productos.some(p => 
      p.name.toUpperCase() === upperName && p.id !== excludeId
    );
  }

  // ================== CREAR ==================
  openCreateModal() {
    this.newProduct = { name: '', unitsInStock: 0, unitPrice: 0 };
    this.isCreateModalOpen = true;
    this.formSubmitted = false; // Resetear validación visual
    this.error = '';
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  async createProduct() {
    this.formSubmitted = true;
    this.error = '';

    const name = this.newProduct.name.trim();
    const stock = Number(this.newProduct.unitsInStock);
    const price = Number(this.newProduct.unitPrice);

    // 1. Validar campos requeridos y formato
    if (!name || !this.isNameValid(name)) {
      this.error = 'El nombre es inválido o contiene caracteres no permitidos.';
      return;
    }
    if (this.isStockInvalid(stock)) {
      this.error = 'El stock debe ser mayor a 0.';
      return;
    }
    if (this.isPriceInvalid(price)) {
      this.error = 'El precio debe ser mayor a 0.';
      return;
    }

    // 2. Validar duplicado
    if (this.isNameDuplicate(name)) {
      this.error = `El producto "${name}" ya existe.`;
      return;
    }

    const payload = {
      name: name,
      unitsInStock: stock,
      unitPrice: price
    };

    try {
      await this.prodSvc.createProduct(payload);
      await this.loadProducts();
      this.closeCreateModal();
    } catch {
      this.error = 'No se pudo crear el producto';
    }
  }

  // ================== EDITAR ==================
  openEditModal(p: any) {
    this.editProductId = p.id;
    this.editProduct = {
      name: p.name,
      unitsInStock: p.unitsInStock,
      unitPrice: p.unitPrice
    };
    this.sanitizeInput('edit'); // Asegurar mayúsculas al abrir

    // Cargar imagen
    this.hasProductImage = !!p.imageBase64;
    this.currentProductImageSrc = p.imageBase64
      ? `data:image/jpeg;base64,${p.imageBase64}`
      : null;
    this.selectedProductImageBase64 = null;

    this.isEditModalOpen = true;
    this.formSubmitted = false;
    this.error = '';
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editProductId = null;
    this.currentProductImageSrc = null;
    this.selectedProductImageBase64 = null;
    this.hasProductImage = false;
  }

  async updateProduct() {
    if (this.editProductId == null) return;
    this.formSubmitted = true;
    this.error = '';

    const name = this.editProduct.name.trim();
    const stock = Number(this.editProduct.unitsInStock);
    const price = Number(this.editProduct.unitPrice);

    // 1. Validar campos
    if (!name || !this.isNameValid(name)) {
      this.error = 'El nombre es inválido o contiene caracteres no permitidos.';
      return;
    }
    if (this.isStockInvalid(stock)) {
      this.error = 'El stock debe ser mayor a 0.';
      return;
    }
    if (this.isPriceInvalid(price)) {
      this.error = 'El precio debe ser mayor a 0.';
      return;
    }

    // 2. Validar duplicado (excluyendo el actual)
    if (this.isNameDuplicate(name, this.editProductId)) {
      this.error = `El nombre "${name}" ya está en uso por otro producto.`;
      return;
    }

    const payload = {
      name: name,
      unitsInStock: stock,
      unitPrice: price
    };

    try {
      await this.prodSvc.updateProduct(this.editProductId, payload);
      await this.loadProducts();
      this.closeEditModal();
    } catch {
      this.error = 'No se pudo actualizar el producto';
    }
  }

  // ================== ELIMINAR (MODAL) ==================
  openDeleteModal(p: any) {
    this.productToDelete = p;
    this.isDeleteModalOpen = true;
    this.error = '';
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.productToDelete = null;
  }

  async confirmDelete() {
    if (!this.productToDelete) return;

    try {
      await this.prodSvc.deleteProduct(this.productToDelete.id);
      await this.loadProducts();
      this.closeDeleteModal();
    } catch {
      this.error = 'No se pudo eliminar el producto';
      // Cierra el modal de confirmación para mostrar el error global
      this.closeDeleteModal();
      // Restauramos el mensaje de error porque closeDeleteModal lo limpia
      this.error = 'No se pudo eliminar el producto (Error de servidor)';
    }
  }

  // ================== IMÁGENES ==================
  onProductImageSelected(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error = 'El archivo seleccionado no es una imagen.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; 
      const base64 = result.split(',')[1];
      this.selectedProductImageBase64 = base64;
      this.currentProductImageSrc = result;
    };
    reader.readAsDataURL(file);
  }

  async saveProductImage() {
    if (this.editProductId == null) return;
    if (!this.selectedProductImageBase64) {
      this.error = 'Seleccione una imagen antes de guardar.';
      return;
    }

    try {
      if (this.hasProductImage) {
        await this.prodSvc.updateProductImage(this.editProductId, this.selectedProductImageBase64);
      } else {
        await this.prodSvc.createProductImage(this.editProductId, this.selectedProductImageBase64);
      }
      this.hasProductImage = true;
      const prod = this.productos.find(p => p.id === this.editProductId);
      if (prod) prod.imageBase64 = this.selectedProductImageBase64;
      
      // Feedback visual opcional: cerrar modal o mostrar éxito
      // this.closeEditModal(); 
    } catch (err) {
      this.error = 'No se pudo guardar la imagen.';
      console.error(err);
    }
  }

  async deleteProductImage() {
    if (this.editProductId == null) return;
    // Usamos el confirm nativo aquí o podríamos crear otro modal, 
    // pero el requerimiento específico fue para borrar PRODUCTO.
    const ok = confirm('¿Eliminar imagen del producto?');
    if (!ok) return;

    try {
      await this.prodSvc.deleteProductImage(this.editProductId);
      this.currentProductImageSrc = null;
      this.selectedProductImageBase64 = null;
      this.hasProductImage = false;
      const prod = this.productos.find(p => p.id === this.editProductId);
      if (prod) prod.imageBase64 = null;
    } catch (err) {
      this.error = 'No se pudo eliminar la imagen.';
      console.error(err);
    }
  }
}