// src/app/domain-logs/domain-logs.component.ts
import { Component, OnInit } from "@angular/core";
import {
  DomainLogsService,
  DomainLog,
} from "../services/domain-logs.service";

@Component({
  selector: "app-domain-logs",
  templateUrl: "./domain-logs.component.html",
  styleUrls: ["./domain-logs.component.css"],
})
export class DomainLogsComponent implements OnInit {
  logs: DomainLog[] = [];
  filteredLogs: DomainLog[] = [];

  loading = true;
  error = "";

  // filtros
  searchText: string = "";
  selectedUser: string = "";
  usersDistinct: string[] = [];

  constructor(private logSvc: DomainLogsService) {}

  async ngOnInit() {
    await this.loadLogs();
  }

  async loadLogs() {
    this.loading = true;
    this.error = "";
    try {
      const resp = await this.logSvc.getLogs();
      this.logs = (resp || []).sort((a, b) => {
        // ordenar por fecha descendente
        return (
          new Date(b.createdDate).getTime() -
          new Date(a.createdDate).getTime()
        );
      });

      // usuarios distintos para filtro
      const setUsers = new Set<string>();
      this.logs.forEach((l) => {
        if (l.userName) setUsers.add(l.userName);
      });
      this.usersDistinct = Array.from(setUsers).sort();

      this.applyFilters();
    } catch (err: any) {
      console.error("Error al cargar logs:", err);
      this.error = err?.message || "No se pudieron cargar los logs.";
    } finally {
      this.loading = false;
    }
  }

  // ================== FILTROS ==================
  onFiltersChange() {
    this.applyFilters();
  }

  applyFilters() {
    const text = this.searchText.toLowerCase().trim();

    this.filteredLogs = this.logs.filter((log) => {
      const byUser =
        !this.selectedUser || log.userName === this.selectedUser;

      if (!text) {
        return byUser;
      }

      const info = (log.information || "").toLowerCase();
      const user = (log.userName || "").toLowerCase();
      const dateStr = new Date(log.createdDate)
        .toLocaleString()
        .toLowerCase();

      const matchesText =
        info.includes(text) ||
        user.includes(text) ||
        dateStr.includes(text) ||
        String(log.id).toLowerCase().includes(text);

      return byUser && matchesText;
    });
  }
}
