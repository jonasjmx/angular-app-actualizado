import { Component, OnInit } from "@angular/core";
import { UserService, UpdateUserRequest } from "../services/user.service";

@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.css"],
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  roles: any[] = [];

  loadingUsers = true;
  loadingRoles = true;

  // Alertbox superior para mensajes de éxito/error general
  error = "";
  success = "";

  // Variables para el modal de error
  isErrorModalOpen = false;
  modalErrorMessage = "";


  // Regex de Contraseña Segura
  passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/;

  // Pattern para validación final (NgModel)
  public namePattern = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$";

  // ----------- CREAR USUARIO (MODAL) -----------
  isCreateModalOpen = false;
  newUser = {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  };

  // ----------- EDITAR USUARIO (MODAL) -----------
  isEditModalOpen = false;
  editUserId: string | null = null;
  editUser: UpdateUserRequest = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailConfirmed: false,
    lockoutEnabled: false,
    lockoutEnd: null,
  };

  // Roles dentro del modal de edición
  editUserRoles: string[] = []; 
  editCurrentRoleId: string = ""; 
  editNewRoleId: string = ""; 

  // ----------- ELIMINAR USUARIO (MODAL) -----------
  isDeleteModalOpen = false;
  userToDelete: any = null;

  // ========== IMAGEN DE USUARIO ==========
  currentUserImageSrc: string | null = null;
  selectedImageBase64: string | null = null;
  hasUserImage: boolean = false;
  loadingImage: boolean = false;

  // ========== VALIDACIONES EXTRA ==========
  phoneEditInvalid = false;

  constructor(private userSvc: UserService) {}

  async ngOnInit() {
    await this.loadUsers();
    await this.loadRoles();
  }

  // ------------ CARGAS INICIALES ------------
  async loadUsers() {
    this.loadingUsers = true;
    try {
      this.users = await this.userSvc.getUsers();
      
      // Cargar foto de cada usuario
      for (let u of this.users) {
        try {
          const img = await this.userSvc.getUserImage(u.id);
          u.profileImage = img;
        } catch {
          u.profileImage = null;
        }
      }

      this.loadingUsers = false;
    } catch (err) {
      console.error(err);
      this.error = "Error al cargar usuarios";
      this.loadingUsers = false;
    }
  }

  async loadRoles() {
    try {
      this.roles = await this.userSvc.getRoles();
      this.loadingRoles = false;
    } catch (err) {
      console.error(err);
      this.error = "Error al cargar roles";
      this.loadingRoles = false;
    }
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

  // ============== VALIDACIÓN Y SANITIZACIÓN DE NOMBRES ==============
  
  /**
   * (input): Convierte a Mayúsculas y limpia si pegaron texto inválido.
   */
  sanitizeNameInput(obj: any, field: string) {
    if (!obj[field]) return;
    
    // Eliminar caracteres no permitidos (fallback para paste)
    let val = obj[field].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    
    // Convertir a mayúsculas
    obj[field] = val.toUpperCase();
  }

  /**
   * (keydown): BLOQUEA la entrada de teclas no permitidas.
   * Si la tecla no es letra o espacio, detiene el evento.
   */
  allowOnlyLetters(event: KeyboardEvent) {
    const key = event.key;

    // 1. Permitir teclas de control (Backspace, Tab, Enter, Arrows, Delete)
    // Estas teclas suelen tener nombres largos (ej: "Backspace")
    if (key.length > 1) return;

    // 2. Regex de lo permitido: Letras (a-z), mayúsculas, acentos, ñ y espacio.
    const allowed = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;

    // 3. Si la tecla presionada NO coincide con el regex, cancelamos la acción.
    if (!allowed.test(key)) {
      event.preventDefault();
    }
  }

  // ============== CREAR USUARIO (MODAL) ==============
  openCreateModal() {
    this.error = "";
    this.success = "";
    this.newUser = { email: "", password: "", firstName: "", lastName: "" };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  async register() {
    this.error = "";
    this.success = "";

    const email = this.newUser.email.trim();
    const password = this.newUser.password;
    const firstName = this.newUser.firstName.trim();
    const lastName = this.newUser.lastName.trim();

    // Validar duplicidad de correo
    const emailExists = this.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      this.openErrorModal("Ya existe un correo similar registrado en el sistema.");
      return;
    }

    // Validar complejidad de contraseña
    if (!this.passwordPattern.test(password)) {
      this.openErrorModal("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    if (!firstName || !lastName) {
      this.openErrorModal("Nombres y apellidos son obligatorios.");
      return;
    }

    try {
      await this.userSvc.registerUser({
        email,
        password,
        firstName,
        lastName,
      });
      this.success = "Usuario registrado correctamente";
      await this.loadUsers();
      this.closeCreateModal();
    } catch (err) {
      console.error(err);
      this.openErrorModal("No se pudo registrar el usuario. Verifique los datos o intente más tarde.");
    }
  }

  // ============== EDITAR USUARIO (MODAL) ==============
  async openEditModal(user: any) {
    this.editUserId = user.id;

    this.editUser = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      emailConfirmed: !!user.emailConfirmed,
      lockoutEnabled: !!user.lockoutEnabled,
      lockoutEnd: user.lockoutEnd || null,
    };

    // Asegurar mayúsculas
    this.sanitizeNameInput(this.editUser, 'firstName');
    this.sanitizeNameInput(this.editUser, 'lastName');

    this.editUserRoles = user.roles || [];

    if (this.editUserRoles.length > 0) {
      this.editCurrentRoleId = this.findRoleIdByName(this.editUserRoles[0]);
    } else {
      this.editCurrentRoleId = "";
    }

    this.editNewRoleId = "";
    this.isEditModalOpen = true;
    this.error = "";
    this.success = "";
    this.phoneEditInvalid = false;

    // Cargar imagen
    this.currentUserImageSrc = null;
    this.selectedImageBase64 = null;
    this.hasUserImage = false;
    if (this.editUserId) {
      await this.loadUserImage(this.editUserId);
    }
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editUserId = null;
    this.editUserRoles = [];
    this.editCurrentRoleId = "";
    this.editNewRoleId = "";
    this.currentUserImageSrc = null;
    this.selectedImageBase64 = null;
    this.hasUserImage = false;
    this.phoneEditInvalid = false;
  }

  async saveEdit() {
    if (!this.editUserId) return;

    this.error = "";
    this.success = "";

    const firstName = (this.editUser.firstName || "").trim();
    const lastName = (this.editUser.lastName || "").trim();
    const phone = (this.editUser.phoneNumber || "").trim();

    if (!firstName || !lastName) {
      this.openErrorModal("Nombres y apellidos son campos obligatorios.");
      return;
    }

    if (phone && !this.validatePhone(phone)) {
      this.phoneEditInvalid = true;
      this.openErrorModal("El número de teléfono no es válido (deben ser 10 dígitos).");
      return;
    } else {
      this.phoneEditInvalid = false;
    }

    this.editUser.firstName = firstName;
    this.editUser.lastName = lastName;
    this.editUser.phoneNumber = phone;

    try {
      await this.userSvc.updateUser(this.editUserId, this.editUser);
      this.success = "Datos del usuario actualizados correctamente";
      await this.loadUsers();
    } catch (err) {
      console.error(err);
      this.error = "No se pudieron actualizar los datos del usuario";
    }
  }

  // ============== ROLES ==============
  findRoleIdByName(name: string): string {
    const r = this.roles.find((x: any) => x.name === name);
    return r ? r.id : "";
  }

  async changeRole() {
    if (!this.editUserId) return;
    this.error = "";
    this.success = "";

    try {
      if (this.editUserRoles.length === 0) {
        if (!this.editNewRoleId) {
          this.openErrorModal("Seleccione un rol para asignar.");
          return;
        }
        await this.userSvc.assignRoleToUser(this.editUserId, this.editNewRoleId);
      } else {
        if (!this.editCurrentRoleId || !this.editNewRoleId) {
          this.openErrorModal("Seleccione el rol actual y el nuevo rol.");
          return;
        }
        await this.userSvc.updateUserRole(this.editUserId, this.editCurrentRoleId, this.editNewRoleId);
      }

      this.success = "Rol actualizado correctamente.";
      await this.loadUsers();
      this.refreshRolesLocalData();
    } catch (err) {
      console.error(err);
      this.error = "No se pudo actualizar el rol del usuario.";
    }
  }

  async removeRole() {
    if (!this.editUserId || !this.editCurrentRoleId) {
      this.openErrorModal("Seleccione un rol a eliminar.");
      return;
    }
    this.error = "";
    this.success = "";

    try {
      await this.userSvc.removeUserRole(this.editUserId, this.editCurrentRoleId);
      this.success = "Rol eliminado del usuario.";
      await this.loadUsers();
      this.refreshRolesLocalData();
    } catch (err) {
      console.error(err);
      this.error = "No se pudo quitar el rol del usuario.";
    }
  }

  refreshRolesLocalData() {
    const updated = this.users.find((u) => u.id === this.editUserId);
    this.editUserRoles = updated?.roles || [];
    if (this.editUserRoles.length > 0) {
      this.editCurrentRoleId = this.findRoleIdByName(this.editUserRoles[0]);
    } else {
      this.editCurrentRoleId = "";
    }
    this.editNewRoleId = "";
  }

  // ============== ELIMINAR USUARIO ==============
  openDeleteModal(user: any) {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
    this.error = "";
    this.success = "";
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.userToDelete = null;
  }

  async confirmDelete() {
    if (!this.userToDelete) return;

    this.error = "";
    this.success = "";

    try {
      await this.userSvc.deleteUser(this.userToDelete.id);
      this.success = "Usuario eliminado correctamente";
      await this.loadUsers();
      this.closeDeleteModal();
    } catch (err) {
      console.error(err);
      this.error = "No se pudo eliminar el usuario";
      this.closeDeleteModal();
    }
  }

  // ============== IMAGEN DE USUARIO ==============
  private async loadUserImage(userId: string) {
    this.loadingImage = true;
    try {
      const base64 = await this.userSvc.getUserImage(userId);
      if (base64) {
        this.currentUserImageSrc = `data:image/jpeg;base64,${base64}`;
        this.hasUserImage = true;
      } else {
        this.currentUserImageSrc = null;
        this.hasUserImage = false;
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.loadingImage = false;
    }
  }

  onImageSelected(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.error = "El archivo seleccionado no es una imagen.";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      this.selectedImageBase64 = base64;
      this.currentUserImageSrc = result;
    };
    reader.readAsDataURL(file);
  }

  async saveUserImage() {
    if (!this.editUserId) return;
    this.error = "";
    this.success = "";

    if (!this.selectedImageBase64) {
      this.openErrorModal("Seleccione una imagen antes de guardar.");
      return;
    }

    try {
      if (this.hasUserImage) {
        await this.userSvc.updateUserImage(this.editUserId, this.selectedImageBase64);
      } else {
        await this.userSvc.createUserImage(this.editUserId, this.selectedImageBase64);
      }
      this.hasUserImage = true;
      this.success = "Imagen de usuario guardada correctamente.";
      await this.loadUsers();
    } catch (err) {
      console.error(err);
      this.error = "No se pudo guardar la imagen del usuario.";
    }
  }

  async deleteUserImage() {
    if (!this.editUserId) return;
    const ok = confirm("¿Seguro que deseas eliminar la imagen de este usuario?");
    if (!ok) return;

    this.error = "";
    this.success = "";

    try {
      await this.userSvc.deleteUserImage(this.editUserId);
      this.currentUserImageSrc = null;
      this.selectedImageBase64 = null;
      this.hasUserImage = false;
      this.success = "Imagen eliminada correctamente.";
      await this.loadUsers();
    } catch (err) {
      console.error(err);
      this.error = "No se pudo eliminar la imagen del usuario.";
    }
  }

  // ============== VALIDACIONES EXTRA HELPER ==============
  validatePhone(phone: string | undefined | null): boolean {
    if (!phone) return false;
    return /^[0-9]{10}$/.test(phone);
  }

  /**
   * Bloquea entrada de letras en campo teléfono
   */
  allowOnlyNumbers(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return;
    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
    }
  }
}