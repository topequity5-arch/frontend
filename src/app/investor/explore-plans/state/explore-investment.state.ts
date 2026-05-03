// src/app/store/investment/investment.state.ts
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { inject, Injectable } from '@angular/core';

import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { InvestmentPlansService } from '../../../core/services/investment-plans.service';
import { InvestmentsService } from '../../../core/services/investment.service';
import { LoadInvestmentPlans, CreateInvestment } from './explore-investment.actions';
import { SetLoading } from '../../../auth/state/auth.actions';
import { NotificationService } from '../../../core/services/notification.service';

export interface ExploreInvestmentStateModel {
    plans: any[];
    userInvestments: any[];
    loading: boolean;
    error: string | null;
}

// Actions


@State<ExploreInvestmentStateModel>({
    name: 'exploreinvestments',
    defaults: {
        plans: [],
        userInvestments: [],
        loading: false,
        error: null
    }
})
@Injectable()
export class ExploreInvestmentState {
    private plansService = inject(InvestmentPlansService);
    private investService = inject(InvestmentsService);
    private notify = inject(NotificationService);

    @Selector()
    static getPlans(state: ExploreInvestmentStateModel) { return state.plans; }

    @Selector()
    static isLoading(state: ExploreInvestmentStateModel) { return state.loading; }

    @Action(LoadInvestmentPlans)
    loadPlans(ctx: StateContext<ExploreInvestmentStateModel>) {
        ctx.dispatch(new SetLoading(true));
        return this.plansService.findAll().pipe(
            tap((plans) => {
                ctx.dispatch(new SetLoading(false));

                ctx.patchState({ plans, loading: false });
            }),
            catchError(err => {
                ctx.dispatch(new SetLoading(false));

                ctx.patchState({ error: err.message, loading: false });
                return of([]);
            })
        );
    }

    @Action(CreateInvestment)
    createInvestment(ctx: StateContext<ExploreInvestmentStateModel>, { payload }: CreateInvestment) {
        ctx.dispatch(new SetLoading(true))
        // This calls your backend InvestmentsService.create()
        return this.investService.createInvestment(payload).pipe(
            tap(() => {
                ctx.dispatch(new SetLoading(false))
                this.notify.show('Investment created successfuly', 'success')

            }),
            catchError(err => {
                ctx.dispatch(new SetLoading(false))
                this.notify.show(err.error.message ? err.error.message : 'An error occurred while creating the investment', 'error');
                throw err;
            })
        );
    }
}