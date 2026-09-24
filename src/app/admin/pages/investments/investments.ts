import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Table } from '../../../common/components/table/table';
import { Store } from '@ngxs/store';

import { map, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import {
  FetchAllInvestments,
  MatureInvestment,
  UpdateAccruedReturn,
  TriggerAccrual,
  CreateTestInvestment,
} from './state/investments.actions';
import { InvestmentState } from './state/investments.state';
import { InvestmentPlansState } from '../investment-plans/state/investment-plans.state';
import { UsersState } from '../users/state/users.state';
import { FetchPlans } from '../investment-plans/state/investment-plans.actions';
import { FetchUsers } from '../users/state/users.action';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { UsersApiService } from '../../../core/services/users.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, Table, FormsModule],
  templateUrl: './investments.html',
})
export class Investments implements OnInit {
  private store = inject(Store);
    private notify = inject(NotificationService);
    private usersApi = inject(UsersApiService);

  // Use a Subject for the filter to make the stream reactive
  private filter$ = new BehaviorSubject<string>('all');
  activeFilter = 'all';

  isEditModalOpen = false;
  selectedInvestment: any = null;
  newProfitValue: number = 0;

      // Test investment form state
  isCreateTestOpen = false;
  isFetchingWallet$ = new BehaviorSubject(false);
  testPlanId: string = '';
  testAmount: number = 0;
  testDurationMinutes: number = 10;
  testUserId: string = '';
  testWalletId: string = '';

  // Reactive streams for dependent dropdowns
  plans$ = this.store.select(InvestmentPlansState.plans);
  users$ = this.store.select(UsersState.list);

  openEditProfit(inv: any) {
    this.selectedInvestment = inv;
    this.newProfitValue = 0;
    this.isEditModalOpen = true;
  }

  onSaveProfit() {
    this.store
      .dispatch(
        new UpdateAccruedReturn({
          investment_id: this.selectedInvestment.id,
          amount: this.newProfitValue,
        }),
      )
      .subscribe(() => (this.isEditModalOpen = false));
  }

  // 1. Reactive stream for the table data
  investments$ = combineLatest([
    this.store.select(InvestmentState.list),
    this.filter$,
  ]).pipe(
    map(([list, filter]) => {
      if (filter === 'all') return list;
      return list.filter((inv) => inv.status === filter);
    }),
  );

  // 2. Dynamic Totals derived from the full list (not just filtered)
  stats$ = this.store.select(InvestmentState.list).pipe(
    map((list) => ({
      aum: list.reduce((sum, inv) => sum + Number(inv.principal), 0),
      expectedPayout: list
        .filter((inv) => inv.status === 'active')
        .reduce(
          (sum, inv) =>
            sum + Number(inv.principal) + Number(inv.accrued_return),
          0,
        ),
      count: list.length,
    })),
  );

  meta$ = this.store.select(InvestmentState.meta);

  ngOnInit() {
    this.store.dispatch(new FetchAllInvestments());
    // Pre-load plans and users for the test investment form dropdowns
    this.store.dispatch(new FetchPlans());
    this.store.dispatch(new FetchUsers({ kyc_status: 'all' }));
  }

  async onMature(id: string) {
    const confirm = await this.notify.confirm(
      'Confirm Investment Maturity',
      'Are you sure you want to mark this investment as matured? This will credit the investors wallet.',
      'Confirm',
    );
    if (confirm) {
      this.store.dispatch(new MatureInvestment(id));
    }
  }

  onTriggerAccrual() {
    this.store.dispatch(new TriggerAccrual());
  }

    openCreateTestModal() {
    this.testPlanId = '';
    this.testAmount = 0;
    this.testDurationMinutes = 10;
    this.testUserId = '';
    this.testWalletId = '';
        this.isFetchingWallet$.next(false);
    this.isCreateTestOpen = true;
  }

    async onUserSelected() {
    if (!this.testUserId) {
            this.testWalletId = '';
      this.isFetchingWallet$.next(false);
      return;
    }

    this.isFetchingWallet$.next(true);
    try {
      const { user } = await this.usersApi.fetchOne(this.testUserId);
      this.testWalletId = user?.wallet?.id ?? '';
    } catch (err) {
      console.error('Failed to fetch user wallet', err);
      this.testWalletId = '';
        } finally {
            this.isFetchingWallet$.next(false);
    }
  }

  createTestInvestment() {
    if (
      !this.testPlanId ||
      !this.testAmount ||
      !this.testDurationMinutes ||
      !this.testWalletId
    ) {
      this.notify.show('Please fill in all required fields', 'error');
      return;
    }

        const payload = {
      plan_id: this.testPlanId,
      amount: this.testAmount,
      wallet_id: this.testWalletId,
      user_id: this.testUserId,
      duration_minutes: this.testDurationMinutes,
    };

    this.store.dispatch(new CreateTestInvestment(payload)).subscribe({
      next: () => {
        this.isCreateTestOpen = false;
      },
    });
  }

  calculateProgress(start: string, end: string): number {
    const total = new Date(end).getTime() - new Date(start).getTime();
    const current = new Date().getTime() - new Date(start).getTime();
    return Math.min(Math.max(Math.round((current / total) * 100), 0), 100);
  }
  // investments.ts
  setFilter(val: string) {
    this.activeFilter = val;
    // Now passing an object that matches 'InvestmentParams'
    this.store.dispatch(
      new FetchAllInvestments({
        page: 1,
        status: val,
      }),
    );
  }

  onPageChange(page: number) {
    this.store.dispatch(
      new FetchAllInvestments({
        page,
        status: this.activeFilter,
      }),
    );
  }
}
