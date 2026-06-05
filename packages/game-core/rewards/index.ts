import { grantCurrency, isCurrencyId, type WalletState } from "../currencies/index.js";
import { addResourceToStock, calculateResourceBundleValue, type ResourceStock } from "../resources/index.js";

export type ResourceReward = Readonly<{
  resourceId: string;
  amount: number;
}>;

export type CurrencyReward = Readonly<{
  currencyId: string;
  amount: number;
}>;

export type RewardBundle = Readonly<{
  resources?: readonly ResourceReward[];
  currencies?: readonly CurrencyReward[];
}>;

export type RewardBundleState = Readonly<{
  resources: ResourceStock;
  wallet: WalletState;
}>;

export function grantResourceReward(stock: ResourceStock, reward: ResourceReward): ResourceStock {
  return addResourceToStock(stock, reward.resourceId, reward.amount);
}

export function grantCurrencyReward(wallet: WalletState, reward: CurrencyReward): WalletState {
  if (!isCurrencyId(reward.currencyId)) {
    throw new Error(`Unknown MVP currency id: ${reward.currencyId}`);
  }
  return grantCurrency(wallet, reward.currencyId, normalizeRewardAmount(reward.amount));
}

export function grantRewardBundle<T extends RewardBundleState>(state: T, rewards: RewardBundle): T {
  const resources = (rewards.resources ?? []).reduce(grantResourceReward, state.resources);
  const wallet = (rewards.currencies ?? []).reduce(grantCurrencyReward, state.wallet);
  return { ...state, resources, wallet };
}

export function calculateResourceRewardBundleValue(rewards: readonly ResourceReward[]): number {
  const resources = rewards.reduce<Record<string, number>>((bundle, reward) => {
    const amount = normalizeRewardAmount(reward.amount);
    bundle[reward.resourceId] = (bundle[reward.resourceId] ?? 0) + amount;
    return bundle;
  }, {});
  return calculateResourceBundleValue(resources);
}

function normalizeRewardAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`Reward amount must be a non-negative finite number: ${amount}`);
  }
  return Math.floor(amount);
}
