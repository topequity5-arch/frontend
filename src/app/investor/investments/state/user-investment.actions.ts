export class FetchMyInvestments {
  static readonly type = '[Investor] Fetch My Investments';
}

/**
 * Select a single investment (used for detail view, withdrawal flow, etc.)
 */
export class SelectInvestment {
  static readonly type = '[Investor] Select Investment';
  constructor(public payload: string) {} // ID of the investment
}

/**
 * Withdraw accrued returns from an investment.
 * Principal remains locked; only accrued profit is released to the user's wallet.
 * Backend endpoint: POST /investments/:id/withdraw
 */
export class WithdrawAccruedReturn {
  static readonly type = '[Investor] Withdraw Accrued Return';
  constructor(public payload: { investment_id: string; amount: number }) {}
}