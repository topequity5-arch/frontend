import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Table } from '../../../common/components/table/table';
import { Store } from '@ngxs/store';

import { map, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { FetchAllInvestments, MatureInvestment, UpdateAccruedReturn } from './state/investments.actions';
import { InvestmentState } from './state/investments.state';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, Table, FormsModule],
  templateUrl: './investments.html',
})
export class Investments implements OnInit {
  private store = inject(Store);
  private notify = inject(NotificationService);

  // Use a Subject for the filter to make the stream reactive
  private filter$ = new BehaviorSubject<string>('all');
  activeFilter = 'all';

  isEditModalOpen = false;
  selectedInvestment: any = null;
  newProfitValue: number = 0;

  openEditProfit(inv: any) {
    this.selectedInvestment = inv;
    this.newProfitValue = 0;
    this.isEditModalOpen = true;
  }

  onSaveProfit() {
    this.store.dispatch(new UpdateAccruedReturn({
      investment_id: this.selectedInvestment.id,
      amount: this.newProfitValue
    })).subscribe(() => this.isEditModalOpen = false);
  }

  // 1. Reactive stream for the table data
  investments$ = combineLatest([
    this.store.select(InvestmentState.list),
    this.filter$
  ]).pipe(
    map(([list, filter]) => {
      if (filter === 'all') return list;
      return list.filter(inv => inv.status === filter);
    })
  );

  // 2. Dynamic Totals derived from the full list (not just filtered)
  stats$ = this.store.select(InvestmentState.list).pipe(
    map(list => ({
      aum: list.reduce((sum, inv) => sum + Number(inv.principal), 0),
      expectedPayout: list
        .filter(inv => inv.status === 'active')
        .reduce((sum, inv) => sum + Number(inv.principal) + Number(inv.accrued_return), 0),
      count: list.length
    }))
  );

  meta$ = this.store.select(InvestmentState.meta);

  ngOnInit() {
    this.store.dispatch(new FetchAllInvestments());
  }



  async onMature(id: string) {
    const confirm = await this.notify.confirm('Confirm Investment Maturity', 'Are you sure you want to mark this investment as matured? This will credit the investors wallet.', 'Confirm')
    if (confirm) {
      this.store.dispatch(new MatureInvestment(id));
    }
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
    this.store.dispatch(new FetchAllInvestments({
      page: 1,
      status: val
    }));
  }

  onPageChange(page: number) {
    this.store.dispatch(new FetchAllInvestments({
      page,
      status: this.activeFilter
    }));
  }

}