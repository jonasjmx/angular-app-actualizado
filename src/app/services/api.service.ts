// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token,
        Accept: 'application/json'
      })
    };
  }

  get<T>(url: string) {
    return this.http.get<T>(url, this.getAuthHeaders()).toPromise();
  }

  post<T>(url: string, body: any) {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.post<T>(url, body, { headers }).toPromise();
  }

  put<T>(url: string, body: any) {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.put<T>(url, body, { headers }).toPromise();
  }

  delete<T>(url: string) {
    return this.http.delete<T>(url, this.getAuthHeaders()).toPromise();
  }
}
