import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { FetchMyInvestments, WithdrawAccruedReturn } from './state/user-investment.actions';
import { MyInvestmentsState } from './state/user-investment.state';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { tap } from 'rxjs/operators';
import { LoadOverviewData } from '../dashboard/state/overview.actions';

@Component({
  selector: 'app-investments',
  imports: [CommonModule, FormsModule],
  templateUrl: './investments.html',
  styleUrl: './investments.css',
})
export class Investments implements OnInit {
  private store = inject(Store);
  private notify = inject(NotificationService);

  investments$ = this.store.select(MyInvestmentsState.getInvestments);
  loading$ = this.store.select(MyInvestmentsState.isLoading);

  getTotalPrincipal(items: any[]): number {
    return items.reduce((acc, curr) => acc + Number(curr.principal), 0);
  }

  getTotalReturns(items: any[]): number {
    return items.reduce((acc, curr) => acc + Number(curr.accrued_return), 0);
  }

  // Helper: Number() is not available in Angular template expressions
  toNumber(value: any): number {
    return Number(value) || 0;
  }

  // Withdrawal modal
  isWithdrawModalOpen = false;
  selectedInvestment: any = null;
  withdrawAmount: number = 0;

  openWithdrawModal(inv: any) {
    this.selectedInvestment = inv;
    this.withdrawAmount = 0;
    this.isWithdrawModalOpen = true;
  }

  confirmWithdrawal() {
    if (!this.selectedInvestment || this.withdrawAmount <= 0) return;

    const available = Number(this.selectedInvestment.accrued_return);
    if (this.withdrawAmount > available) {
      this.notify.show(`Cannot withdraw more than available accrued return ($${available.toFixed(2)})`, 'error');
      return;
    }

    this.store.dispatch(new WithdrawAccruedReturn({
      investment_id: this.selectedInvestment.id,
      amount: this.withdrawAmount
    })).pipe(
      tap(() => {
        this.notify.show('Accrued return withdrawn successfully', 'success');
        this.isWithdrawModalOpen = false;
        this.withdrawAmount = 0;
        // Refresh investments list and dashboard to show updated balances
        this.store.dispatch(new FetchMyInvestments());
        this.store.dispatch(new LoadOverviewData());
      })
    ).subscribe();
  }

  ngOnInit() {
    this.store.dispatch(new FetchMyInvestments());
  }
}
