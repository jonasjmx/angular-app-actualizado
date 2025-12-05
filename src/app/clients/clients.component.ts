import { Component, OnInit } from "@angular/core";
import { CustomerService, CustomerPayload } from "../services/customer.service";

@Component({
  selector: "app-clients",
  templateUrl: "./clients.component.html",
  styleUrls: ["./clients.component.css"],
})
export class ClientsComponent implements OnInit {
  clientes: any[] = [];
  loading = true;
  error = ""; // Para errores no-modal

  // Modales de control de errores y confirmación
  isErrorModalOpen = false;
  modalErrorMessage = ""; // MODAL CREAR

  isCreateModalOpen = false;
  newCustomer: CustomerPayload = {
    firstName: "",
    lastName: "",
    cedula: "",
    email: "",
    phoneNumber: "",
  }; // MODAL EDITAR

  isEditModalOpen = false;
  editCustomerId: string | null = null;
  editCustomer: CustomerPayload = {
    firstName: "",
    lastName: "",
    cedula: "",
    email: "",
    phoneNumber: "",
  };
  editCurrentBalance = 0; // solo lectura

  // MODAL ELIMINAR
  isDeleteModalOpen = false;
  clientToDelete: any = null; // flags para mostrar errores extra

  cedulaCreateInvalid = false;
  phoneCreateInvalid = false;
  phoneEditInvalid = false;

  constructor(private customerSvc: CustomerService) {}

  async ngOnInit() {
    await this.loadCustomers();
  }

  // ============== MODAL DE ERROR GENÉRICO ==============
  openErrorModal(message: string) {
    this.modalErrorMessage = message;
    this.isErrorModalOpen = true;
  }

  closeErrorModal() {
    this.isErrorModalOpen = false;
    this.modalErrorMessage = "";
  }

  // ============== SANITIZACIÓN DE NOMBRES ==============

  /**
   * Se ejecuta en evento (input).
   * Convierte a Mayúsculas y elimina todo lo que NO sea letra o espacio.
   */
  sanitizeNameInput(obj: any, field: string) {
    if (!obj[field]) return;

    // 1. Eliminar caracteres no permitidos (números, símbolos, excepto espacios, acentos y ñ/Ñ)
    // Se permite ñ y acentos.
    let val = obj[field].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");

    // 2. Convertir a mayúsculas
    obj[field] = val.toUpperCase();
  }

  async loadCustomers() {
    this.loading = true;
    this.error = "";

    try {
      const resp = await this.customerSvc.getCustomers();
      this.clientes = resp || [];
    } catch (err: any) {
      console.error("Error al cargar clientes:", err);
      this.error = err?.message || "Error al cargar clientes";
    } finally {
      this.loading = false;
    }
  } // ======== CREAR ========

  openCreateModal() {
    this.newCustomer = {
      firstName: "",
      lastName: "",
      cedula: "",
      email: "",
      phoneNumber: "",
    };
    this.cedulaCreateInvalid = false;
    this.phoneCreateInvalid = false;
    this.error = "";
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  async createCustomer() {
    this.error = "";

    const firstName = this.newCustomer.firstName.trim();
    const lastName = this.newCustomer.lastName.trim();
    const cedula = this.newCustomer.cedula.trim();
    const email = this.newCustomer.email.trim();
    const phone = this.newCustomer.phoneNumber.trim(); // Validaciones básicas obligatorias (aunque el form las controla, se reafirman)

    if (!firstName || !lastName || !cedula || !email || !phone) {
      this.openErrorModal(
        "Todos los campos obligatorios deben ser llenados correctamente."
      );
      return;
    }

    // 1. Validar unicidad de cédula localmente
    const cedulaExists = this.clientes.some((c) => c.cedula === cedula);
    if (cedulaExists) {
      this.openErrorModal(
        "Ya existe un cliente con esta cédula registrado en el sistema."
      );
      return;
    } // 2. Validar cédula ecuatoriana

    if (!this.validateCedulaEc(cedula)) {
      this.cedulaCreateInvalid = true;
      this.openErrorModal(
        "La cédula ingresada no es válida según el algoritmo de Ecuador."
      );
      return;
    } else {
      this.cedulaCreateInvalid = false;
    } // 3. Validar teléfono

    if (!this.validatePhone(phone)) {
      this.phoneCreateInvalid = true;
      this.openErrorModal(
        "El teléfono ingresado no es válido (deben ser 10 dígitos)."
      );
      return;
    } else {
      this.phoneCreateInvalid = false;
    }

    try {
      const payload: CustomerPayload = {
        firstName, // Ya viene en mayúsculas por el sanitizeNameInput
        lastName, // Ya viene en mayúsculas por el sanitizeNameInput
        cedula,
        email,
        phoneNumber: phone,
      };

      await this.customerSvc.createCustomer(payload);
      await this.loadCustomers();
      this.closeCreateModal();
    } catch (err: any) {
      console.error("Error al crear cliente:", err);
      this.openErrorModal(
        "No se pudo crear el cliente. Verifique los datos o inténtelo más tarde."
      );
    }
  } // ======== EDITAR ========

  openEditModal(c: any) {
    this.editCustomerId = c.id;

    this.editCustomer = {
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      cedula: c.cedula || "",
      email: c.email || "",
      phoneNumber: c.phoneNumber || "",
    };

    // Asegurar que los nombres y apellidos estén en mayúsculas al abrir
    this.sanitizeNameInput(this.editCustomer, "firstName");
    this.sanitizeNameInput(this.editCustomer, "lastName");

    this.editCurrentBalance = c.currentBalance ?? 0;
    this.phoneEditInvalid = false;
    this.error = "";
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editCustomerId = null;
    this.phoneEditInvalid = false;
  }

  async updateCustomer() {
    if (!this.editCustomerId) return;

    this.error = "";

    const firstName = this.editCustomer.firstName.trim();
    const lastName = this.editCustomer.lastName.trim();
    const cedula = this.editCustomer.cedula.trim();
    const email = this.editCustomer.email.trim();
    const phone = this.editCustomer.phoneNumber.trim();

    if (!firstName || !lastName || !cedula || !email) {
      this.openErrorModal("Nombre, apellido, cédula y email son obligatorios.");
      return;
    } // Teléfono debe ser válido

    if (!this.validatePhone(phone)) {
      this.phoneEditInvalid = true;
      this.openErrorModal(
        "El teléfono ingresado no es válido (deben ser 10 dígitos)."
      );
      return;
    } else {
      this.phoneEditInvalid = false;
    }

    // Asegurar que los datos finales de envío estén en mayúsculas y limpios
    this.editCustomer.firstName = firstName;
    this.editCustomer.lastName = lastName;
    // La sanitización en el input ya lo hizo, pero garantizamos que no se envíen caracteres especiales
    this.sanitizeNameInput(this.editCustomer, "firstName");
    this.sanitizeNameInput(this.editCustomer, "lastName");

    try {
      const payload: CustomerPayload = {
        firstName: this.editCustomer.firstName,
        lastName: this.editCustomer.lastName,
        cedula,
        email,
        phoneNumber: phone,
      };

      await this.customerSvc.updateCustomer(this.editCustomerId, payload);
      await this.loadCustomers();
      this.closeEditModal();
    } catch (err: any) {
      console.error("Error al actualizar cliente:", err);
      this.openErrorModal("No se pudo actualizar el cliente.");
    }
  } // ======== ELIMINAR (MODAL) ========

  openDeleteModal(c: any) {
    this.clientToDelete = c;
    this.isDeleteModalOpen = true;
    this.error = "";
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.clientToDelete = null;
  }

  async confirmDelete() {
    if (!this.clientToDelete) return;

    this.error = "";

    try {
      await this.customerSvc.deleteCustomer(this.clientToDelete.id);
      await this.loadCustomers();
      this.closeDeleteModal();
    } catch (err: any) {
      console.error("Error al eliminar cliente:", err);
      this.openErrorModal("No se pudo eliminar el cliente.");
      this.closeDeleteModal();
    }
  } // ================== VALIDACIONES EXTRA ==================

  /** Valida cédula ecuatoriana de 10 dígitos */
  validateCedulaEc(cedula: string | undefined | null): boolean {
    if (!cedula) return false;
    if (!/^[0-9]{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const digitos = cedula.split("").map((d) => parseInt(d, 10));
    const verificador = digitos[9];

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = digitos[i] * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const decenaSuperior = Math.ceil(suma / 10) * 10;
    const digitoCalculado = decenaSuperior - suma;
    const digitoFinal = digitoCalculado === 10 ? 0 : digitoCalculado;

    return digitoFinal === verificador;
  } /** Valida teléfono: exactamente 10 dígitos */

  validatePhone(phone: string | undefined | null): boolean {
    if (!phone) return false;
    return /^[0-9]{10}$/.test(phone);
  } /** Permitir solo letras (incluye acentos y espacios) */

  allowOnlyLetters(event: KeyboardEvent) {
    const key = event.key; // permitir teclas especiales (backspace, tab, flechas, etc.)

    if (key.length > 1) {
      return;
    }

    const pattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    if (!pattern.test(key)) {
      event.preventDefault();
    }
  } /** Permitir solo números */

  allowOnlyNumbers(event: KeyboardEvent) {
    const key = event.key; // permitir teclas especiales

    if (key.length > 1) {
      return;
    }

    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
    }
  }
}
