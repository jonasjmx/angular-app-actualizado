// src/app/services/domain-logs.service.ts
import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";

const API_URL_LOGS = "https://northwindsaleswebapi20251110192941-hzemfyhkbxdydna7.canadacentral-01.azurewebsites.net/logs/obtenerLogs";

export interface DomainLog {
  id: number;
  createdDate: string;   // vendrá como string ISO
  information: string;
  userName: string;
}

@Injectable({ providedIn: "root" })
export class DomainLogsService {
  constructor(private api: ApiService) {}

  async getLogs(): Promise<DomainLog[]> {
    return await this.api.get<DomainLog[]>(API_URL_LOGS);
  }
}
