// src/app/orders/orders.component.ts
import { Component, OnInit } from "@angular/core";
import {
  OrderService,
  Order,
  UpdateOrderPayload,
} from "../services/order.service";
import { CustomerService } from "../services/customer.service";
import { ProductService } from "../services/product.service";

// 👉 imports para generar PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

@Component({
  selector: "app-orders",
  templateUrl: "./orders.component.html",
  styleUrls: ["./orders.component.css"],
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  customers: any[] = [];
  products: any[] = [];

  loading = false;
  error = "";
  success = "";

  searchText: string = "";
  filteredOrders: Order[] = [];

  // filtro por cliente (id del cliente)
  selectedCustomerFilter = "";

  // expansión de detalles
  expandedOrderId: number | null = null;

  // modal edición
  showEditModal = false;
  editOrder: Order | null = null;
  editShipAddress = "";
  editShipCity = "";
  editShipCountry = "";
  editShipPostalCode = "";

  // modal detalle
  showDetailModal = false;
  detailOrder: Order | null = null;

  constructor(
    private orderSvc: OrderService,
    private customerSvc: CustomerService,
    private productSvc: ProductService
  ) {}

  async ngOnInit() {
    await this.loadCustomersAndProducts();
    await this.loadOrders();
    this.filteredOrders = [...this.orders];
  }

  private async loadCustomersAndProducts() {
    try {
      const [customers, products] = await Promise.all([
        this.customerSvc.getCustomers(),
        this.productSvc.getProducts(),
      ]);
      this.customers = customers || [];
      this.products = products || [];

      console.log("🟦 Clientes cargados en Orders:", this.customers);
    } catch (err) {
      console.error("Error cargando clientes/productos:", err);
    }
  }

  async loadOrders() {
    this.loading = true;
    this.error = "";
    this.success = "";

    try {
      let data: Order[];

      if (this.selectedCustomerFilter) {
        data = await this.orderSvc.getOrdersByCustomer(
          this.selectedCustomerFilter
        );
      } else {
        data = await this.orderSvc.getOrders();
      }

      this.orders = data || [];
      this.applySearchFilter();
    } catch (err: any) {
      console.error("Error cargando órdenes:", err);
      this.error = "No se pudieron cargar las órdenes.";
    } finally {
      this.loading = false;
    }
  }

  // ================= Filtros / helpers =================

  onFilterChange() {
    this.loadOrders();
  }

  /** Buscar cliente por id */
  private findCustomerById(customerId: string) {
    return this.customers.find((c) => c.id === customerId);
  }

  /** Nombre completo del cliente usando firstName + lastName */
  getCustomerName(order: Order | null | undefined): string {
    if (!order) return "";

    const c = this.findCustomerById(order.customerId);
    if (!c) return order.customerId;

    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
    if (fullName) return fullName;
    if (c.cedula) return c.cedula;
    return order.customerId;
  }

  /** Cédula del cliente */
  getCustomerCedula(order: Order | null | undefined): string {
    if (!order) return "";
    const c = this.findCustomerById(order.customerId);
    return c?.cedula || "";
  }

  /** Email del cliente */
  getCustomerEmail(order: Order | null | undefined): string {
    if (!order) return "";
    const c = this.findCustomerById(order.customerId);
    return c?.email || "";
  }

  /** Teléfono del cliente */
  getCustomerPhone(order: Order | null | undefined): string {
    if (!order) return "";
    const c = this.findCustomerById(order.customerId);
    return c?.phoneNumber || "";
  }

  /** Etiqueta para el combo de filtro de clientes */
  getCustomerLabel(c: any): string {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
    if (fullName && c.cedula) return `${fullName} - ${c.cedula}`;
    return fullName || c.cedula || c.id;
  }

  getProductName(productId: number): string {
    const p = this.products.find((x) => x.id === productId);
    return p ? p.name : `Producto #${productId}`;
  }

  applySearchFilter() {
    const text = this.searchText.toLowerCase().trim();

    if (!text) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter((order) => {
      const customer = this.getCustomerName(order).toLowerCase();
      const orderId = String(order.id).toLowerCase();
      const date = new Date(order.orderDate).toLocaleDateString().toLowerCase();
      const shipAddress =
        `${order.shipAddress} ${order.shipCity} ${order.shipCountry}`.toLowerCase();

      // Buscar dentro del detalle
      const productsText = (order.orderDetails || [])
        .map((d) => this.getProductName(d.productId))
        .join(" ")
        .toLowerCase();

      return (
        customer.includes(text) ||
        orderId.includes(text) ||
        date.includes(text) ||
        shipAddress.includes(text) ||
        productsText.includes(text)
      );
    });
  }

  getOrderSubtotal(order: Order): number {
    return (order.orderDetails || []).reduce(
      (acc, d) => acc + (d.unitPrice || 0) * (d.quantity || 0),
      0
    );
  }

  getOrderIVA(order: Order): number {
    return this.getOrderSubtotal(order) * 0.15;
  }

  getOrderTotal(order: Order): number {
    return this.getOrderSubtotal(order) + this.getOrderIVA(order);
  }

  toggleDetails(orderId: number) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  // ====== Edición ======

  openEdit(order: Order) {
    this.editOrder = order;
    this.editShipAddress = order.shipAddress;
    this.editShipCity = order.shipCity;
    this.editShipCountry = order.shipCountry;
    this.editShipPostalCode = order.shipPostalCode;
    this.showEditModal = true;
    this.error = "";
    this.success = "";
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editOrder = null;
  }

  async saveEdit() {
    if (!this.editOrder) return;

    if (
      !this.editShipAddress ||
      !this.editShipCity ||
      !this.editShipCountry ||
      !this.editShipPostalCode
    ) {
      this.error = "Complete todos los campos de envío.";
      return;
    }

    const payload: UpdateOrderPayload = {
      customerId: this.editOrder.customerId,
      shipAddress: this.editShipAddress,
      shipCity: this.editShipCity,
      shipCountry: this.editShipCountry,
      shipPostalCode: this.editShipPostalCode,
    };

    try {
      await this.orderSvc.updateOrder(this.editOrder.id, payload);
      this.success = "Orden actualizada correctamente.";

      // actualizamos en memoria
      this.editOrder.shipAddress = this.editShipAddress;
      this.editOrder.shipCity = this.editShipCity;
      this.editOrder.shipCountry = this.editShipCountry;
      this.editOrder.shipPostalCode = this.editShipPostalCode;

      this.closeEditModal();
    } catch (err: any) {
      console.error("Error al actualizar orden:", err);
     	this.error = "No se pudo actualizar la orden.";
    }
  }

  // ====== Eliminar ======

  async deleteOrder(order: Order) {
    const ok = confirm(`¿Eliminar la orden #${order.id}?`);
    if (!ok) return;

    try {
      await this.orderSvc.deleteOrder(order.id);
      this.success = "Orden eliminada correctamente.";
      this.orders = this.orders.filter((o) => o.id !== order.id);
      this.applySearchFilter();
    } catch (err: any) {
      console.error("Error al eliminar orden:", err);
      this.error = "No se pudo eliminar la orden.";
    }
  }

  // ====== DESCARGAR PDF ======

  downloadPdf(order: Order) {
    this.error = "";
    this.success = "";
    this.generateInvoicePdf(order);
  }

  private generateInvoicePdf(order: Order) {
    const doc = new jsPDF("p", "mm", "a4");
    const fecha = new Date(order.orderDate || new Date()).toLocaleString();

    const customerName = this.getCustomerName(order);
    const cedula = this.getCustomerCedula(order);
    const email = this.getCustomerEmail(order);
    const phone = this.getCustomerPhone(order);

    // ===== ENCABEZADO AZUL =====
    doc.setFillColor(35, 111, 162);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("NorthWind Admin", 14, 18);

    doc.setFontSize(14);
    doc.text("Factura de Venta", 14, 30);

    doc.setFontSize(10);
    doc.text("RUC: 9999999999001", 150, 14);
    doc.text("Tel: +593 99 999 9999", 150, 20);
    doc.text("Email: ventas@northwind.com", 150, 26);

    // ===== CUADRO FACTURA & CLIENTE =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    doc.roundedRect(10, 45, 90, 30, 2, 2);
    doc.text(`Factura N°: ${order.id}`, 14, 55);
    doc.text(`Fecha: ${fecha}`, 14, 62);

    // aumentamos altura para más datos
    doc.roundedRect(110, 45, 90, 45, 2, 2);
    let yClient = 52;
    doc.text(`Cliente: ${customerName}`, 114, yClient);
    if (cedula) {
      yClient += 7;
      doc.text(`Cédula: ${cedula}`, 114, yClient);
    }
    if (email) {
      yClient += 7;
      doc.text(`Email: ${email}`, 114, yClient);
    }
    if (phone) {
      yClient += 7;
      doc.text(`Teléfono: ${phone}`, 114, yClient);
    }

    // ===== DATOS DE ENVÍO =====
    doc.setFontSize(11);
    doc.text("Datos de envío", 14, 95);
    doc.setFontSize(10);

    let yInfo = 100;
    doc.text(`Dirección: ${order.shipAddress || "-"}`, 14, yInfo);
    doc.text(`Ciudad: ${order.shipCity || "-"}`, 14, yInfo + 6);
    doc.text(`País: ${order.shipCountry || "-"}`, 14, yInfo + 12);
    doc.text(`Código Postal: ${order.shipPostalCode || "-"}`, 14, yInfo + 18);

    // ===== TABLA DETALLE =====
    const details = order.orderDetails || [];
    const body = details.map((d) => {
      const name = this.getProductName(d.productId);
      const subtotal = (d.unitPrice || 0) * (d.quantity || 0);
      return [
        name,
        d.quantity,
        `$${(d.unitPrice || 0).toFixed(2)}`,
        `$${subtotal.toFixed(2)}`,
      ];
    });

    (autoTable as any)(doc, {
      startY: 125,
      head: [["Producto", "Cant.", "Precio Unit.", "Subtotal"]],
      body,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [35, 111, 162],
        textColor: 255,
      },
    });

    // ===== TOTALES =====
    const subtotal = this.getOrderSubtotal(order);
    const iva = this.getOrderIVA(order);
    const total = this.getOrderTotal(order);

    const finalY = (doc as any).lastAutoTable?.finalY || 140;

    doc.setFontSize(11);
    doc.text("Resumen", 140, finalY + 4);

    doc.setFontSize(10);
    doc.text(`Subtotal:  $${subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`IVA 15%:  $${iva.toFixed(2)}`, 140, finalY + 16);
    doc.setFontSize(11);
    doc.text(`Total:  $${total.toFixed(2)}`, 140, finalY + 24);

    doc.setFontSize(10);
    doc.text("¡Gracias por su compra!", 14, finalY + 24);

    doc.save(`factura_orden_${order.id}.pdf`);
  }

  // ====== Modal ver detalle ======

  openDetail(order: Order) {
    this.detailOrder = order;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.detailOrder = null;
  }
}
