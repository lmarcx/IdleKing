export type CurrencyId = "ECU" | (string & {});

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

export const CURRENCIES: CurrencyDef[] = [ECU];
