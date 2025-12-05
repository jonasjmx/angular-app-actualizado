import { Component, OnInit } from "@angular/core";
import {
  SalesService,
  CartDetailPayload,
  CreateOrderPayload,
} from "../services/sales.service";
import { ProductService } from "../services/product.service";
import { CustomerService } from "../services/customer.service";

// 👇 imports para PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

@Component({
  selector: "app-sales",
  templateUrl: "./sales.component.html",
  styleUrls: ["./sales.component.css"],
})
export class SalesComponent implements OnInit {
  customers: any[] = [];
  products: any[] = [];

  selectedCustomerId = "";
  cartItems: any[] = [];
  cartCount = 0;

  // Subtotales
  cartSubtotal = 0;
  cartIVA = 0;
  cartTotalPagar = 0;

  // formulario para agregar item
  selectedProductId: number | null = null;
  newQuantity = 1;

  // formulario para crear orden
  shipAddress = "";
  shipCity = "";
  shipCountry = "";
  shipPostalCode = "";

  loading = false;
  error = "";
  success = "";

  constructor(
    private salesSvc: SalesService,
    private prodSvc: ProductService,
    private customerSvc: CustomerService
  ) {}

  async ngOnInit() {
    await this.loadCustomersAndProducts();
  }

  // ================== CLIENTES / PRODUCTOS ==================

  private async loadCustomersAndProducts() {
    this.loading = true;
    this.error = "";
    try {
      const [customers, products] = await Promise.all([
        this.customerSvc.getCustomers(),
        this.prodSvc.getProducts(),
      ]);
      this.customers = customers || [];
      this.products = products || [];

      console.log("🟦 Clientes en Sales:", this.customers);

      this.loading = false;
    } catch (err: any) {
      console.error("Error cargando clientes/productos:", err);
      this.error = "No se pudieron cargar clientes y productos";
      this.loading = false;
    }
  }
  /** Devuelve el cliente actualmente seleccionado */
  private getSelectedCustomer() {
    return this.customers.find((c) => c.id === this.selectedCustomerId);
  }

  /** Etiqueta bonita para mostrar en el combo de clientes */
  getCustomerLabel(c: any): string {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
    if (fullName && c.cedula) return `${fullName} - ${c.cedula}`;
    return fullName || c.cedula || c.id;
  }

  // ================== CARRITO ==================
  async onCustomerChange() {
    this.success = "";
    this.error = "";
    if (!this.selectedCustomerId) {
      this.cartItems = [];
      this.cartCount = 0;
      this.cartSubtotal = 0;
      this.cartIVA = 0;
      this.cartTotalPagar = 0;
      return;
    }
    await this.loadCart();
  }

  private async loadCart() {
    if (!this.selectedCustomerId) return;

    this.loading = true;
    this.error = "";

    try {
      const items = await this.salesSvc.getCartByCustomer(
        this.selectedCustomerId
      );

      this.cartItems = (items || []).map((x: any) => {
        const prod = this.products.find((p) => p.id === x.productId);
        return {
          ...x,
          productName: prod ? prod.name : `Producto #${x.productId}`,
        };
      });

      // 🔥 Recalcular totales al cargar carrito
      this.recalcTotals();

      this.loading = false;
    } catch (err: any) {
      console.error("Error al cargar carrito:", err);
      this.error = "No se pudo cargar el carrito del cliente";
      this.loading = false;
    }
  }

  /** 🔄 Recalcula Subtotal, IVA, Total y número de ítems a partir de cartItems */
  private recalcTotals() {
    this.cartSubtotal = this.cartItems.reduce(
      (acc, it) => acc + (it.unitPrice || 0) * (it.quantity || 0),
      0
    );
    this.cartIVA = this.cartSubtotal * 0.15;
    this.cartTotalPagar = this.cartSubtotal + this.cartIVA;

    this.cartCount = this.cartItems.reduce(
      (acc, it) => acc + (it.quantity || 0),
      0
    );
  }

  /** Cuando cambia la cantidad en el input, recalculamos totales en vivo */
  onQuantityChanged(item: any) {
    // asegurar que quantity sea número >= 1
    const q = Number(item.quantity);
    if (isNaN(q) || q <= 0) {
      item.quantity = 1;
    }
    this.recalcTotals();
  }

  async addToCart() {
    this.success = "";
    this.error = "";

    if (!this.selectedCustomerId) {
      this.error = "Seleccione un cliente primero.";
      return;
    }
    if (!this.selectedProductId) {
      this.error = "Seleccione un producto.";
      return;
    }
    if (this.newQuantity <= 0) {
      this.error = "La cantidad debe ser mayor a 0.";
      return;
    }

    const prod = this.products.find((p) => p.id === this.selectedProductId);
    if (!prod) {
      this.error = "Producto no encontrado.";
      return;
    }

    const payload: CartDetailPayload = {
      productId: prod.id,
      customerId: this.selectedCustomerId,
      unitPrice: prod.unitPrice || 0,
      quantity: this.newQuantity,
    };

    try {
      await this.salesSvc.addCartDetail(payload);
      this.success = "Producto agregado al carrito.";
      this.newQuantity = 1;
      await this.loadCart();
    } catch (err: any) {
      console.error("Error al agregar al carrito:", err);
      this.error = "No se pudo agregar el producto al carrito";
    }
  }

  async updateItem(item: any) {
    this.success = "";
    this.error = "";

    if (!this.selectedCustomerId) return;
    if (item.quantity <= 0) {
      this.error = "La cantidad debe ser mayor a 0.";
      return;
    }

    const payload: CartDetailPayload = {
      productId: item.productId,
      customerId: this.selectedCustomerId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    };

    try {
      await this.salesSvc.updateCartDetail(payload);
      this.success = "Detalle actualizado.";
      // por si el backend toca algo (descuentos, etc.), recargamos
      await this.loadCart();
    } catch (err: any) {
      console.error("Error al actualizar detalle:", err);
      this.error = "No se pudo actualizar el detalle.";
    }
  }

  async deleteItem(item: any) {
    this.success = "";
    this.error = "";
    if (!this.selectedCustomerId) return;

    const ok = confirm(
      `¿Eliminar del carrito el producto "${item.productName}"?`
    );
    if (!ok) return;

    try {
      await this.salesSvc.deleteCartDetail(
        this.selectedCustomerId,
        item.productId
      );
      this.success = "Producto eliminado del carrito.";
      await this.loadCart();
    } catch (err: any) {
      console.error("Error al eliminar detalle:", err);
      this.error = "No se pudo eliminar el producto del carrito.";
    }
  }

  async clearCart() {
    this.success = "";
    this.error = "";
    if (!this.selectedCustomerId) return;

    const ok = confirm("¿Vaciar todo el carrito de este cliente?");
    if (!ok) return;

    try {
      await this.salesSvc.clearCartByCustomer(this.selectedCustomerId);
      this.success = "Carrito vaciado.";
      await this.loadCart();
    } catch (err: any) {
      console.error("Error al limpiar carrito:", err);
      this.error = "No se pudo limpiar el carrito.";
    }
  }

  // ================== CREAR ORDEN + PDF ==================
  async createOrder() {
    this.success = "";
    this.error = "";

    if (!this.selectedCustomerId) {
      this.error = "Seleccione un cliente.";
      return;
    }
    if (!this.cartItems.length) {
      this.error = "El carrito está vacío.";
      return;
    }

    if (
      !this.shipAddress.trim() ||
      !this.shipCity.trim() ||
      !this.shipCountry.trim() ||
      !this.shipPostalCode.trim()
    ) {
      this.error = "Complete todos los datos de envío.";
      return;
    }

    const payload: CreateOrderPayload = {
      customerId: this.selectedCustomerId,
      shipAddress: this.shipAddress.trim(),
      shipCity: this.shipCity.trim(),
      shipCountry: this.shipCountry.trim(),
      shipPostalCode: this.shipPostalCode.trim(),
      orderDetails: this.cartItems.map((it) => ({
        productId: it.productId,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
      })),
    };

    console.log("📦 Payload a /CreateOrder:", JSON.stringify(payload, null, 2));

    try {
      const resp = await this.salesSvc.createOrder(payload);
      const invoiceNumber = resp?.orderId || resp?.id || new Date().getTime();

      this.success = "Orden creada correctamente.";
      this.generateInvoicePdf(invoiceNumber);

      await this.loadCart();
    } catch (err: any) {
      console.error("Error al crear orden:", err);
      if (err?.error) {
        console.log("Detalle del error del backend:", err.error);
        console.log("Detalle JSON:", JSON.stringify(err.error, null, 2));
      }

      const backend = err?.error;
      const detail = backend?.detail;
      const modelErrors = backend?.errors;

      if (detail) {
        this.error = detail;
      } else if (modelErrors) {
        const mensajes: string[] = [];
        for (const key of Object.keys(modelErrors)) {
          const arr = modelErrors[key];
          if (Array.isArray(arr)) {
            mensajes.push(`${key}: ${arr.join(", ")}`);
          }
        }
        this.error = mensajes.join(" | ") || "Error en los datos de la orden.";
      } else if (backend?.title) {
        this.error = backend.title;
      } else {
        this.error =
          "No se pudo crear la orden (400). Revisa la consola para más detalles.";
      }
    }
  }

  // ================== GENERAR PDF ==================
  private generateInvoicePdf(invoiceNumber: number | string) {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleString();

    const customer = this.getSelectedCustomer();

    const fullName = customer
      ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
      : this.selectedCustomerId;

    const cedula = customer?.cedula || "";
    const email = customer?.email || "";
    const phone = customer?.phoneNumber || "";

    // ============= ENCABEZADO =============
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 25, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Northwind Sales", 14, 16);

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`Factura N°: ${invoiceNumber}`, 210 - 14, 10, { align: "right" });
    doc.text(`Fecha: ${fecha}`, 210 - 14, 16, { align: "right" });

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("FACTURA DE VENTA", 105, 35, { align: "center" });

    // ============= DATOS CLIENTE / ENVÍO =============
    const boxStartY = 42;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, boxStartY, 90, 50, 2, 2);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Datos del Cliente", 16, boxStartY + 6);

    doc.setFontSize(10);
    let y = boxStartY + 14;
    doc.text(`Cliente: ${fullName}`, 16, y);
    if (cedula) {
      y += 6;
      doc.text(`Cédula: ${cedula}`, 16, y);
    }
    if (email) {
      y += 6;
      doc.text(`Email: ${email}`, 16, y);
    }
    if (phone) {
      y += 6;
      doc.text(`Teléfono: ${phone}`, 16, y);
    }

    doc.roundedRect(110, boxStartY, 86, 40, 2, 2);
    doc.setFontSize(11);
    doc.text("Datos de Envío", 112, boxStartY + 6);

    doc.setFontSize(10);
    doc.text(`Dirección: ${this.shipAddress}`, 112, boxStartY + 14);
    doc.text(`Ciudad: ${this.shipCity}`, 112, boxStartY + 20);
    doc.text(`País: ${this.shipCountry}`, 112, boxStartY + 26);
    doc.text(`Cód. Postal: ${this.shipPostalCode}`, 112, boxStartY + 32);

    // ============= TABLA DE DETALLES =============
    const body = this.cartItems.map((it) => [
      it.productName,
      it.quantity,
      `$ ${(it.unitPrice || 0).toFixed(2)}`,
      `$ ${((it.unitPrice || 0) * (it.quantity || 0)).toFixed(2)}`,
    ]);

    (autoTable as any)(doc, {
      startY: boxStartY + 55,
      head: [["Producto", "Cant.", "Precio Unit.", "Subtotal"]],
      body,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [245, 248, 255],
      },
      columnStyles: {
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "right", cellWidth: 30 },
        3: { halign: "right", cellWidth: 30 },
      },
    });

    // ============= RESUMEN DE TOTALES =============
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    const resumenX = 120;
    const resumenW = 76;
    const resumenH = 30;

    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(resumenX, finalY + 6, resumenW, resumenH, 2, 2);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    const line1Y = finalY + 14;
    const line2Y = finalY + 20;
    const line3Y = finalY + 26;

    doc.text("Subtotal:", resumenX + 4, line1Y);
    doc.text("IVA (15%):", resumenX + 4, line2Y);
    doc.text("TOTAL:", resumenX + 4, line3Y);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `$ ${this.cartSubtotal.toFixed(2)}`,
      resumenX + resumenW - 4,
      line1Y,
      { align: "right" }
    );
    doc.text(`$ ${this.cartIVA.toFixed(2)}`, resumenX + resumenW - 4, line2Y, {
      align: "right",
    });

    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(
      `$ ${this.cartTotalPagar.toFixed(2)}`,
      resumenX + resumenW - 4,
      line3Y,
      { align: "right" }
    );

    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("Gracias por su compra.", 14, 290);
    doc.text("Northwind Sales - Sistema de Ventas", 210 - 14, 290, {
      align: "right",
    });

    doc.save(`factura_${invoiceNumber}.pdf`);
  }
}
