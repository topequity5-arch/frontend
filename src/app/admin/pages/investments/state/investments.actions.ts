import { InvestmentParams } from "../../../../core/services/investment.service";

export class FetchAllInvestments {
  static readonly type = '[Investments] Fetch All';
  constructor(public params?: InvestmentParams) {}
}

export class MatureInvestment {
  static readonly type = '[Investments] Mature';
  constructor(public id: string) {}
}

export class TriggerAccrual {
  static readonly type = '[Investments] Trigger Accrual';
}

export class CreateTestInvestment {
  static readonly type = '[Investments] Create Test Investment';
  constructor(public payload: any) {}
}

export class UpdateAccruedReturn {
  static readonly type = '[Investments] Update Accrued Return';
  constructor(public payload: any) {}
}