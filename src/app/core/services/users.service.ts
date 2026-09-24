import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { User } from '../../common/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UsersApiService {
    private http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    async fetchAll(params: any = {}): Promise<any> {
        const queryParams = {
            kyc_status: 'all',
            ...params
        };

        return lastValueFrom(
            this.http.get(`${this.API_URL}/users`, { params: queryParams })
        );
    }

    async fetchOne(userId: string): Promise<{ user: User }> {
        const user = await lastValueFrom(
            this.http.get<User>(`${this.API_URL}/users/${userId}`)
        );
        return { user };
    }
}