import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface LoginResponse {
  token?: string;
  accessToken?: string;
  Token?: string;
  jwt?: string;
  // agrega aquí otras propiedades que devuelva tu API si quieres
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  async onSubmit() {
    this.errorMessage = '';

    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, ingrese usuario y contraseña.';
      return;
    }

    try {
      // 1. LOGIN
      const resp = await this.http
        .post<LoginResponse>(
          'https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/users/LoginAccessCount',
          { email: this.username, password: this.password },
          { responseType: 'json' }
        )
        .toPromise();

      const token =
        resp?.token ||
        resp?.accessToken ||
        resp?.Token ||
        resp?.jwt ||
        '';

      if (!token || typeof token !== 'string' || token.length < 10) {
        console.error('Respuesta de login completa:', resp);
        this.errorMessage = 'Token inválido recibido del servidor.';
        return;
      }

      // Guarda token (y opcionalmente username)
      localStorage.setItem('token', token);
      localStorage.setItem('username', this.username);

      // 2. PERMISOS
      const headers = new HttpHeaders({
        Authorization: 'Bearer ' + token,
        Accept: 'application/json'
      });

      let permisos: any = await this.http
        .get<any[]>('https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/permissions/obtenerPermisos', {
          headers
        })
        .toPromise();

      console.log('Permisos crudos recibidos:', permisos);

      // Normalizar forma de permisos
      if (!permisos) permisos = [];
      else if (Array.isArray(permisos)) permisos = permisos;
      else if (permisos.permisos && Array.isArray(permisos.permisos))
        permisos = permisos.permisos;
      else if (permisos.data && Array.isArray(permisos.data))
        permisos = permisos.data;
      else permisos = [];

      console.log('Permisos normalizados:', permisos);

      localStorage.setItem('permisos', JSON.stringify(permisos));

      // 3. Ir al dashboard
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Error en login o permisos:', err);

      if (err?.status === 401)
        this.errorMessage = 'Usuario o contraseña incorrectos.';
      else
        this.errorMessage =
          'No se pudo conectar con el servidor o cargar permisos.';
    }
  }
}
