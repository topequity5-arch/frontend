import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface InvestmentParams {
  page?: number;
  limit?: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class InvestmentsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/investments`;

  getAll(params?: InvestmentParams) {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status && params.status !== 'all') {
        httpParams = httpParams.set('status', params.status);
      }
    }

    // Returns { data: [], meta: { total, page, last_page } }
    return this.http.get<any>(`${this.API_URL}`, { params: httpParams });
  }

  mature(id: string) {
    return this.http.post(`${this.API_URL}/${id}/mature`, {});
  }

  updateReturn(dto: { investment_id: string; amount: number }) {
    return this.http.patch(`${this.API_URL}/return`, dto);
  }

  withdrawAccruedReturn(id: string, dto: { amount: number }) {
    return this.http.post(`${this.API_URL}/${id}/withdraw`, dto);
  }


  createInvestment(payload: any) {
    return this.http.post(`${this.API_URL}`, payload);
  }
  
  getUserInvestments() {
    return this.http.get(`${this.API_URL}/me`);
  }
}