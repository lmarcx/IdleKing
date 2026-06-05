import { CURRENCIES, isCurrencyId, type CurrencyId, type WalletState } from "./types.js";

export function createDefaultWalletState(): WalletState {
  return {
    balances: {
      ECU: 0,
      BOSS_TOKEN: 0,
    },
  };
}

export function normalizeWalletState(value: Partial<WalletState> | undefined): WalletState {
  const balances = value?.balances && typeof value.balances === "object" ? value.balances : {};

  return {
    balances: Object.fromEntries(
      CURRENCIES.map(({ id }) => [id, getCurrencyBalance({ balances }, id)])
    ),
  };
}

export function getCurrencyBalance(wallet: WalletState, currencyId: CurrencyId): number {
  assertKnownCurrency(currencyId);
  return Math.max(0, Math.floor(wallet.balances[currencyId] ?? 0));
}

export function grantCurrency(wallet: WalletState, currencyId: CurrencyId, amount: number): WalletState {
  assertKnownCurrency(currencyId);
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
  assertKnownCurrency(currencyId);
  const safeAmount = Math.max(0, Math.floor(amount));
  return getCurrencyBalance(wallet, currencyId) >= safeAmount;
}

export function spendCurrency(
  wallet: WalletState,
  currencyId: CurrencyId,
  amount: number,
): { ok: boolean; wallet: WalletState } {
  assertKnownCurrency(currencyId);
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

function assertKnownCurrency(currencyId: string): asserts currencyId is CurrencyId {
  if (!isCurrencyId(currencyId)) {
    throw new Error(`Unknown MVP currency id: ${currencyId}`);
  }
}
