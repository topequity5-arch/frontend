// my-investments.state.ts
import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FetchMyInvestments, SelectInvestment, WithdrawAccruedReturn } from './user-investment.actions';
import { InvestmentsService } from '../../../core/services/investment.service';
import { SetLoading } from '../../../auth/state/auth.actions';

export interface MyInvestmentsStateModel {
    items: any[];
    selectedItem: any | null;
    loading: boolean;
    error: string | null;
}

@State<MyInvestmentsStateModel>({
    name: 'myInvestments',
    defaults: {
        items: [],
        selectedItem: null,
        loading: false,
        error: null
    }
})
@Injectable()
export class MyInvestmentsState {
    private investService = inject(InvestmentsService);

    @Selector()
    static getInvestments(state: MyInvestmentsStateModel) {
        return state.items;
    }

    @Selector()
    static getActiveInvestments(state: MyInvestmentsStateModel) {
        return state.items.filter(i => i.status === 'active');
    }

    @Selector()
    static isLoading(state: MyInvestmentsStateModel) {
        return state.loading;
    }

    @Action(FetchMyInvestments)
    fetch(ctx: StateContext<MyInvestmentsStateModel>) {
        ctx.dispatch(new SetLoading(true))
        ctx.patchState({ loading: true, error: null });

        return this.investService.getUserInvestments().pipe(
            tap((items: any) => {
                ctx.dispatch(new SetLoading(false))

                ctx.patchState({
                    items,
                    loading: false
                });
            }),
            catchError((err) => {
                ctx.dispatch(new SetLoading(false))

                ctx.patchState({
                    loading: false,
                    error: err.message || 'Failed to load portfolio'
                });
                return of([]);
            })
        );
    }

        @Action(SelectInvestment)
    select(ctx: StateContext<MyInvestmentsStateModel>, { payload }: SelectInvestment) {
        const state = ctx.getState();
        const item = state.items.find(i => i.id === payload);
        ctx.patchState({ selectedItem: item });
    }

        @Action(WithdrawAccruedReturn)
    withdraw(ctx: StateContext<MyInvestmentsStateModel>, { payload }: WithdrawAccruedReturn) {
        ctx.dispatch(new SetLoading(true));

        return this.investService.withdrawAccruedReturn(payload.investment_id, { amount: payload.amount }).pipe(
            tap(() => {
                ctx.dispatch(new SetLoading(false));
                // Optimistically deduct the withdrawn amount from the selected item
                const current = ctx.getState().selectedItem;
                if (current) {
                    ctx.patchState({
                        selectedItem: {
                            ...current,
                            accrued_return: Number(current.accrued_return) - payload.amount
                        },
                        items: ctx.getState().items.map(i =>
                            i.id === payload.investment_id
                                ? { ...i, accrued_return: Number(i.accrued_return) - payload.amount }
                                : i
                        )
                    });
                }
            }),
            catchError((err) => {
                ctx.dispatch(new SetLoading(false));
                ctx.patchState({ error: err.message || 'Withdrawal failed' });
                return of(err);
            })
        );
    }
}