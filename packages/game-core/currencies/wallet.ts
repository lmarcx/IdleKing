import type { CurrencyId, WalletState } from "./types.js";

export function createDefaultWalletState(): WalletState {
  return {
    balances: {
      ECU: 0,
    },
  };
}

export function normalizeWalletState(value: Partial<WalletState> | undefined): WalletState {
  const balances = value?.balances && typeof value.balances === "object" ? value.balances : {};

  return {
    balances: {
      ECU: getCurrencyBalance({ balances }, "ECU"),
      ...Object.fromEntries(
        Object.entries(balances).map(([id, amount]) => [
          id,
          Math.max(0, Math.floor(typeof amount === "number" && Number.isFinite(amount) ? amount : 0)),
        ]),
      ),
    },
  };
}

export function getCurrencyBalance(wallet: WalletState, currencyId: CurrencyId): number {
  return Math.max(0, Math.floor(wallet.balances[currencyId] ?? 0));
}

export function grantCurrency(wallet: WalletState, currencyId: CurrencyId, amount: number): WalletState {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (safeAmount <= 0) return normalizeWalletState(wallet);

  return {
    balances: {
      ...normalizeWalletState(wallet).balances,
      [currencyId]: getCurrencyBalance(wallet, currencyId) + safeAmount,
    },
  };
}

export function canSpendCurrency(wallet: WalletState, currencyId: CurrencyId, amount: number): boolean {
  const safeAmount = Math.max(0, Math.floor(amount));
  return getCurrencyBalance(wallet, currencyId) >= safeAmount;
}

export function spendCurrency(
  wallet: WalletState,
  currencyId: CurrencyId,
  amount: number,
): { ok: boolean; wallet: WalletState } {
  const safeAmount = Math.max(0, Math.floor(amount));
  const normalized = normalizeWalletState(wallet);

  if (safeAmount <= 0) return { ok: true, wallet: normalized };
  if (!canSpendCurrency(normalized, currencyId, safeAmount)) {
    return { ok: false, wallet: normalized };
  }

  return {
    ok: true,
    wallet: {
      balances: {
        ...normalized.balances,
        [currencyId]: getCurrencyBalance(normalized, currencyId) - safeAmount,
      },
    },
  };
}
