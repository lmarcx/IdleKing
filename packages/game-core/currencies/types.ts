export type CurrencyId = "ECU" | "BOSS_TOKEN";

export type CurrencyFamily = "core" | "mode" | "online" | "event" | "premium";

export type CurrencyDef = {
  id: CurrencyId;
  name: string;
  family: CurrencyFamily;
  hudVisible: boolean;
};

export type WalletState = {
  balances: Partial<Record<CurrencyId, number>>;
};

export const ECU: CurrencyDef = {
  id: "ECU",
  name: "Ecu",
  family: "core",
  hudVisible: true,
};

export const BOSS_TOKEN: CurrencyDef = {
  id: "BOSS_TOKEN",
  name: "Boss Token",
  family: "core",
  hudVisible: false,
};

export const CURRENCIES: readonly CurrencyDef[] = [ECU, BOSS_TOKEN];

export function isCurrencyId(currencyId: unknown): currencyId is CurrencyId {
  return typeof currencyId === "string" && CURRENCIES.some((currency) => currency.id === currencyId);
}
