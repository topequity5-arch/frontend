import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_net_worth: number;
  total_principal: number;
  total_accrued_return: number;
  growth_percentage: number;
  active_investments: number;
  ledger_balance: number;
  yield_progress: number;
  next_distribution_days: number;
  active_portfolio: any[];
  recent_activity: any[];
}

@Injectable({ providedIn: 'root' })
export class OverviewService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;


  getDashboardSummary(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/overview/summary`);
  }
  getAdminDashboardSummary(): Observable<any> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/admin/dashboard/summary`);
  }

}