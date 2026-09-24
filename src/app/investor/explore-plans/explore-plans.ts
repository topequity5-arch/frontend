import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ExploreInvestmentState } from './state/explore-investment.state';
import { CreateInvestment, LoadInvestmentPlans } from './state/explore-investment.actions';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverviewState } from '../dashboard/state/overview.state';
import { AuthState } from '../../auth/state/auth.state';
import { take } from 'rxjs';

@Component({
  selector: 'app-explore-plans',
  imports: [CommonModule, FormsModule],
  templateUrl: './explore-plans.html',
  styleUrl: './explore-plans.css',
})
export class ExplorePlans implements OnInit {
  private store = inject(Store);

  stats$ = this.store.select(OverviewState.getStats);
  plans$ = this.store.select(ExploreInvestmentState.getPlans);
  loading$ = this.store.select(ExploreInvestmentState.isLoading);
  user$ = this.store.select(AuthState.user);

  // UI State for Modal
  isModalOpen = false;
  selectedPlan: any = null;
  investAmount: number = 0;

  ngOnInit() {
    this.store.dispatch(new LoadInvestmentPlans());
  }

  openInvestModal(plan: any) {
    this.selectedPlan = plan;
    this.investAmount = plan.min_amount;
    this.isModalOpen = true;
  }

  confirmInvestment() {
    if (!this.selectedPlan) return;
    let userWalletId = ''
    this.user$.pipe(take(1)).subscribe((e) => {
      userWalletId = e?.wallet?.id ?? '';
      console.log(userWalletId);
    });

    const payload = {
      plan_id: this.selectedPlan.id,
      amount: this.investAmount,
      wallet_id: userWalletId // This should come from your AuthState
    };

    this.store.dispatch(new CreateInvestment(payload)).subscribe({
      next: () => {
        this.isModalOpen = false;
        // Optional: Refresh balance or redirect to "My Investments"
      },
      error: (err) => console.error('Investment failed', err)
    });
  }
}
