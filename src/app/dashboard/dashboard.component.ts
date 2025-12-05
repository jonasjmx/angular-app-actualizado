// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  selectedSection = 'inicio';

  // ====== ROLES DEL USUARIO LOGUEADO ======
  roles: string[] = [];
  isAdmin = false;
  isLimitedUser = false;
  notAuthorized = false;

  // ========= KPI / MÉTRICAS DEL DASHBOARD (ejemplo) =========
  totalClientes = 120;
  totalVentasMes = 13450.75;
  totalProductos = 48;
  totalOrdenesPendientes = 7;

  monthlySales = [
    { label: 'Ene', value: 800 },
    { label: 'Feb', value: 1200 },
    { label: 'Mar', value: 950 },
    { label: 'Abr', value: 1500 },
    { label: 'May', value: 1100 },
    { label: 'Jun', value: 1700 },
  ];

  topProducts = [
    { name: 'Chai', value: 120 },
    { name: 'Chang', value: 95 },
    { name: 'Aniseed Syrup', value: 80 },
    { name: 'Ikura', value: 60 },
  ];

  get maxMonthlySales(): number {
    return Math.max(...this.monthlySales.map(m => m.value), 1);
  }

  get maxProductSales(): number {
    return Math.max(...this.topProducts.map(p => p.value), 1);
  }

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  async ngOnInit(): Promise<void> {

    console.log("========== DASHBOARD INIT ==========");

    const token = localStorage.getItem('token');
    console.log("TOKEN:", token);

    if (!token) {
      console.warn("No token → redirigiendo a login.");
      localStorage.clear();
      this.router.navigate(['/login']);
      return;
    }

    // ================================
    // 1) DECODIFICAR TOKEN Y OBTENER EMAIL
    // ================================
    const payload = this.decodeToken(token);
    console.log("PAYLOAD TOKEN:", payload);

    const emailClaim =
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

    const email: string | undefined =
      payload?.[emailClaim] || payload?.email || null;

    console.log("EMAIL OBTENIDO DEL TOKEN:", email);

    if (!email) {
      alert('No se pudo obtener el email del usuario desde el token.');
      localStorage.clear();
      this.router.navigate(['/login']);
      return;
    }

    // ================================
    // 2) OBTENER USUARIO POR EMAIL (BACKEND)
    // ================================
    try {
      const url = `https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/obtenerUsuarioPorEmail/${encodeURIComponent(email)}`;
      console.log("Llamando a:", url);

      const user = await this.api.get<any>(url);

      console.log("USUARIO OBTENIDO DESDE BACKEND:", user);
      console.log("Claves del objeto usuario:", user ? Object.keys(user) : null);

      // ================================
      // 3) EXTRAER ROLES DEL USUARIO
      // ================================
      let rolesNames: string[] = [];

      // Caso más probable: user.roles = ["Administrator", "DataEntry", ...]
      if (user && Array.isArray(user.roles)) {
        if (user.roles.length && typeof user.roles[0] === 'string') {
          rolesNames = user.roles as string[];
          console.log("→ Roles como string[]:", rolesNames);
        } else if (user.roles.length && typeof user.roles[0] === 'object') {
          rolesNames = user.roles
            .map((r: any) => r?.name)
            .filter((n: any) => typeof n === 'string');
          console.log("→ Roles como objetos, nombres extraídos:", rolesNames);
        }
      }

      // Por si el backend envía un único rol como propiedad suelta
      if (rolesNames.length === 0 && user?.role && typeof user.role === 'string') {
        rolesNames = [user.role];
        console.log("→ Un solo rol en user.role:", rolesNames);
      }

      // Guardamos roles en la propiedad del componente
      this.roles = rolesNames;
      console.log("ROLES PROCESADOS EN DASHBOARD:", this.roles);

    } catch (err) {
      console.error("Error al obtener usuario por email:", err);
      alert('No se pudieron obtener los roles del usuario.');
      localStorage.clear();
      this.router.navigate(['/login']);
      return;
    }

    // ================================
    // 4) REGLAS DE ACCESO SEGÚN ROL
    // ================================
    const adminRoles = ["Administrator", "ReadAdmin"];

    this.isAdmin = this.roles.some(r => adminRoles.includes(r));
    this.isLimitedUser = this.roles.length > 0 && !this.isAdmin;
    this.notAuthorized = this.roles.length === 0;

    console.log("isAdmin:", this.isAdmin);
    console.log("isLimitedUser:", this.isLimitedUser);
    console.log("notAuthorized:", this.notAuthorized);

    if (this.notAuthorized) {
      alert("No tienes roles asignados. Contacta al administrador del sistema.");
      localStorage.clear();
      this.router.navigate(['/login']);
      return;
    }

    // Para que el usuario limitado no vea el inicio de "admin" como algo raro
    if (this.isLimitedUser) {
      this.selectedSection = 'clientes';
    }
  }

  // ================================
  //   CAMBIO DE SECCIÓN
  // ================================
  selectSection(id: string) {
    console.log("Usuario intenta abrir sección:", id);

    if (this.isAdmin) {
      console.log("→ ADMIN, acceso permitido a:", id);
      this.selectedSection = id;
      return;
    }

    // Usuarios con cualquier otro rol:
    const allowed = ["inicio", "clientes", "ventas", "productos"];

    if (!allowed.includes(id)) {
      console.warn("→ ACCESO DENEGADO a sección:", id);
      this.selectedSection = "clientes";
      return;
    }

    console.log("→ Usuario con rol limitado, acceso permitido a:", id);
    this.selectedSection = id;
  }

  logout() {
    console.log("Cerrando sesión…");
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ================================
  //   HELPER PARA DECODIFICAR JWT
  // ================================
  private decodeToken(token: string): any {
    try {
      const payloadBase64 = token.split('.')[1];
      const json = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch (e) {
      console.error("Error al decodificar token:", e);
      return null;
    }
  }
}
