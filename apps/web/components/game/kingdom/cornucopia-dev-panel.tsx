"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { getResourceAssetPath } from "@/lib/resource-assets";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { useResourceFeedbackStore } from "@/store/resource-feedback-store";
import {
  CORNUCOPIA_MAX_CLAIM_AMOUNT,
  claimCornucopia,
  claimCornucopiaCurrency,
  claimCornucopiaEffectSet,
  claimCornucopiaEquipment,
  claimCornucopiaEra,
  claimCornucopiaSpecialItem,
  claimCornucopiaUnlock,
  getCornucopiaClaimables,
  getCornucopiaCurrencyClaimables,
  getCornucopiaEffectSetClaimables,
  getCornucopiaEquipmentRarityOptions,
  getCornucopiaEquipmentSetOptions,
  getCornucopiaEquipmentSlotOptions,
  getCornucopiaEraClaimables,
  getCornucopiaRingSkillOptions,
  getCornucopiaSpecialItemClaimables,
  getCornucopiaUnlockClaimables,
  getCurrencyBalance,
  getEquipmentSetDefinition,
  getQty,
  getSkillDefinition,
  type CornucopiaSpecialItemId,
  type CurrencyId,
  type EffectSetId,
  type EquipmentSetId,
  type EquipmentSlot,
  type EraId,
  type ItemRarity,
  type ResourceId,
  type UnlockId,
} from "@idleking/game-core";
import type { SkillId } from "@idleking/game-core/skills";

type TabId = "resources" | "currencies" | "equipment" | "special" | "unlocks";

const TABS: readonly { id: TabId; label: string }[] = [
  { id: "resources", label: "Resources" },
  { id: "currencies", label: "Currencies" },
  { id: "equipment", label: "Equipment" },
  { id: "special", label: "Special" },
  { id: "unlocks", label: "Unlocks" },
];

function formatLabel(id: string): string {
  return id.replaceAll("_", " ");
}

function clampAmount(amount: number, max = CORNUCOPIA_MAX_CLAIM_AMOUNT): number {
  if (!Number.isFinite(amount)) return 1;
  return Math.min(max, Math.max(1, Math.floor(amount)));
}

function OptionList({
  items,
  selectedId,
  onSelect,
  renderLabel,
  renderSublabel,
  renderIcon,
}: {
  items: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderLabel: (id: string) => string;
  renderSublabel?: (id: string) => string;
  renderIcon?: (id: string) => ReactNode;
}) {
  return (
    <div className="max-h-[22rem] space-y-1 overflow-y-auto border border-neutral-800 bg-black/40 p-2">
      {items.map((id) => {
        const active = id === selectedId;
        return (
          <button
            className={cn(
              "ik-card-hover flex w-full items-center gap-3 border px-3 py-2 text-left font-ik-menu text-xs uppercase tracking-[0.1em] transition",
              active
                ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-100",
            )}
            key={id}
            onClick={() => onSelect(id)}
            type="button"
          >
            {renderIcon ? renderIcon(id) : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{renderLabel(id)}</span>
              {renderSublabel ? (
                <span className="block font-ik-body normal-case tracking-normal text-[0.65rem] opacity-70">
                  {renderSublabel(id)}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AmountControl({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-neutral-500">Quantity</div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 10, 100, 1000].map((amount) => (
          <button
            className="border border-neutral-700 bg-neutral-950 px-2 py-1 font-ik-menu text-xs text-neutral-200 transition hover:border-neutral-300 hover:text-neutral-100"
            key={amount}
            onClick={() => onChange(amount)}
            type="button"
          >
            +{amount}
          </button>
        ))}
      </div>
      <input
        className="w-full border border-neutral-700 bg-black px-3 py-2 font-ik-menu text-sm text-neutral-100 outline-none transition focus:border-neutral-300"
        max={CORNUCOPIA_MAX_CLAIM_AMOUNT}
        min={1}
        onChange={(event) => onChange(clampAmount(Number(event.target.value)))}
        type="number"
        value={value}
      />
    </div>
  );
}

function UnlockGrantList({
  items,
  isGranted,
  renderLabel,
  onGrant,
}: {
  items: string[];
  isGranted: (id: string) => boolean;
  renderLabel: (id: string) => string;
  onGrant: (id: string) => void;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {items.map((id) => {
        const granted = isGranted(id);
        return (
          <button
            className={cn(
              "ik-card-hover flex items-center justify-between gap-2 border px-3 py-2 text-left font-ik-menu text-[0.68rem] uppercase tracking-[0.08em] transition",
              granted
                ? "cursor-default border-neutral-800 bg-neutral-900/60 text-neutral-500"
                : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-300 hover:text-neutral-100",
            )}
            disabled={granted}
            key={id}
            onClick={() => onGrant(id)}
            type="button"
          >
            <span className="truncate">{renderLabel(id)}</span>
            <span className="shrink-0 text-[0.6rem] text-neutral-500">{granted ? "Owned" : "Grant"}</span>
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-neutral-400">{children}</div>;
}

export function CornucopiaDevPanel() {
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const showResourceGain = useResourceFeedbackStore((store) => store.showResourceGain);
  const [activeTab, setActiveTab] = useState<TabId>("resources");

  const resourceOptions = useMemo(() => getCornucopiaClaimables(state), [state]);
  const currencyOptions = useMemo(() => getCornucopiaCurrencyClaimables(), []);
  const slotOptions = useMemo(() => getCornucopiaEquipmentSlotOptions(), []);
  const rarityOptions = useMemo(() => getCornucopiaEquipmentRarityOptions(), []);
  const ringSkillOptions = useMemo(() => getCornucopiaRingSkillOptions(), []);
  const setOptions = useMemo(() => getCornucopiaEquipmentSetOptions(), []);
  const specialItemOptions = useMemo(() => getCornucopiaSpecialItemClaimables(), []);
  const unlockOptions = useMemo(() => getCornucopiaUnlockClaimables(), []);
  const eraOptions = useMemo(() => getCornucopiaEraClaimables(), []);
  const effectSetOptions = useMemo(() => getCornucopiaEffectSetClaimables(), []);

  const [selectedResourceId, setSelectedResourceId] = useState<ResourceId | null>(resourceOptions[0] ?? null);
  const [resourceAmount, setResourceAmount] = useState(100);

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<CurrencyId | null>(currencyOptions[0] ?? null);
  const [currencyAmount, setCurrencyAmount] = useState(100);

  const [equipmentSlot, setEquipmentSlot] = useState<EquipmentSlot>(slotOptions[0] ?? "main_hand");
  const [equipmentRarity, setEquipmentRarity] = useState<ItemRarity>("COMMON");
  const [equipmentItemLevel, setEquipmentItemLevel] = useState(1);
  const [equipmentSkillId, setEquipmentSkillId] = useState<SkillId | "">("");
  const [equipmentSetId, setEquipmentSetId] = useState<EquipmentSetId | "">("");

  const [fragmentAmount, setFragmentAmount] = useState(1);

  function handleClaimResource() {
    if (!selectedResourceId) return;
    const result = claimCornucopia(useGameStore.getState().state, {
      resourceId: selectedResourceId,
      amount: resourceAmount,
    });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.error}`);
      return;
    }

    dispatch(() => result.next);
    showResourceGain({ amount: result.amount, resourceId: result.resourceId });
    toast.success(`+${result.amount} ${formatLabel(result.resourceId)}`);
  }

  function handleClaimCurrency() {
    if (!selectedCurrencyId) return;
    const result = claimCornucopiaCurrency(useGameStore.getState().state, {
      currencyId: selectedCurrencyId,
      amount: currencyAmount,
    });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.error}`);
      return;
    }

    dispatch(() => result.next);
    toast.success(`+${result.amount} ${formatLabel(result.currencyId)}`);
  }

  function handleClaimEquipment() {
    const result = claimCornucopiaEquipment(useGameStore.getState().state, {
      slot: equipmentSlot,
      rarity: equipmentRarity,
      itemLevel: equipmentItemLevel,
      skillId: equipmentSlot === "ring" && equipmentSkillId ? equipmentSkillId : undefined,
      setId: equipmentSetId || undefined,
    });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.error}`);
      return;
    }

    dispatch(() => result.next);
    toast.success(`Granted ${result.item.name} (${result.item.rarity}, ilvl ${result.item.ilvl})`);
  }

  function handleClaimSpecialItem(specialItemId: CornucopiaSpecialItemId, amount?: number) {
    const result = claimCornucopiaSpecialItem(useGameStore.getState().state, { specialItemId, amount });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.error}`);
      return;
    }

    dispatch(() => result.next);
    toast.success(`Granted ${formatLabel(result.specialItemId)}`);
  }

  function handleClaimUnlock(unlockId: string) {
    const result = claimCornucopiaUnlock(useGameStore.getState().state, { unlockId: unlockId as UnlockId });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.error}`);
      return;
    }

    dispatch(() => result.next);
    toast.success(`Unlocked ${formatLabel(result.unlockId)}`);
  }

  function handleClaimEra(eraId: string) {
    const result = claimCornucopiaEra(useGameStore.getState().state, { eraId: eraId as EraId });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.reason}`);
      return;
    }

    dispatch(() => result.next);
    toast.success(`Unlocked era ${formatLabel(result.eraId)}`);
  }

  function handleClaimEffectSet(effectSetId: string) {
    const result = claimCornucopiaEffectSet(useGameStore.getState().state, { effectSetId: effectSetId as EffectSetId });

    if (!result.ok) {
      toast.error(`Cornucopia: ${result.error}`);
      return;
    }

    dispatch(() => result.next);
    toast.success(`Unlocked effect set ${formatLabel(result.effectSetId)}`);
  }

  return (
    <div className="space-y-4">
      <div className="ik-seg" role="tablist">
        {TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className="ik-seg__tab"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resources" ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <OptionList
            items={resourceOptions}
            onSelect={(id) => setSelectedResourceId(id as ResourceId)}
            renderIcon={(id) => (
              <img alt="" aria-hidden="true" className="h-6 w-6 shrink-0" src={getResourceAssetPath(id)} />
            )}
            renderLabel={formatLabel}
            renderSublabel={(id) => `Owned ${getQty(state.resources, id as ResourceId)}`}
            selectedId={selectedResourceId}
          />

          <div className="space-y-4 border border-neutral-800 bg-black/40 p-4">
            {selectedResourceId ? (
              <>
                <div className="font-ik-title text-sm text-neutral-100">{formatLabel(selectedResourceId)}</div>
                <AmountControl onChange={setResourceAmount} value={resourceAmount} />
                <button
                  className="w-full border-2 border-neutral-100 bg-neutral-100 px-4 py-2 font-ik-menu text-xs text-neutral-950 transition hover:bg-neutral-300"
                  onClick={handleClaimResource}
                  type="button"
                >
                  Grant Resource
                </button>
              </>
            ) : (
              <div className="font-ik-body text-sm text-neutral-500">No resource selected</div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "currencies" ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <OptionList
            items={currencyOptions}
            onSelect={(id) => setSelectedCurrencyId(id as CurrencyId)}
            renderLabel={formatLabel}
            renderSublabel={(id) => `Owned ${getCurrencyBalance(state.wallet, id as CurrencyId)}`}
            selectedId={selectedCurrencyId}
          />

          <div className="space-y-4 border border-neutral-800 bg-black/40 p-4">
            {selectedCurrencyId ? (
              <>
                <div className="font-ik-title text-sm text-neutral-100">{formatLabel(selectedCurrencyId)}</div>
                <AmountControl onChange={setCurrencyAmount} value={currencyAmount} />
                <button
                  className="w-full border-2 border-neutral-100 bg-neutral-100 px-4 py-2 font-ik-menu text-xs text-neutral-950 transition hover:bg-neutral-300"
                  onClick={handleClaimCurrency}
                  type="button"
                >
                  Grant Currency
                </button>
              </>
            ) : (
              <div className="font-ik-body text-sm text-neutral-500">No currency selected</div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "equipment" ? (
        <div className="space-y-4 border border-neutral-800 bg-black/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block font-ik-menu text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500">Slot</span>
              <select
                className="w-full border border-neutral-700 bg-black px-3 py-2 font-ik-menu text-sm text-neutral-100 outline-none focus:border-neutral-300"
                onChange={(event) => setEquipmentSlot(event.target.value as EquipmentSlot)}
                value={equipmentSlot}
              >
                {slotOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatLabel(slot)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="block font-ik-menu text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500">Rarity</span>
              <select
                className="w-full border border-neutral-700 bg-black px-3 py-2 font-ik-menu text-sm text-neutral-100 outline-none focus:border-neutral-300"
                onChange={(event) => setEquipmentRarity(event.target.value as ItemRarity)}
                value={equipmentRarity}
              >
                {rarityOptions.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {formatLabel(rarity)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="block font-ik-menu text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500">Item Level</span>
              <input
                className="w-full border border-neutral-700 bg-black px-3 py-2 font-ik-menu text-sm text-neutral-100 outline-none focus:border-neutral-300"
                max={1000}
                min={1}
                onChange={(event) => setEquipmentItemLevel(clampAmount(Number(event.target.value), 1000))}
                type="number"
                value={equipmentItemLevel}
              />
            </label>

            {equipmentSlot === "ring" ? (
              <label className="space-y-1.5">
                <span className="block font-ik-menu text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500">
                  Ring Skill (optional)
                </span>
                <select
                  className="w-full border border-neutral-700 bg-black px-3 py-2 font-ik-menu text-sm text-neutral-100 outline-none focus:border-neutral-300"
                  onChange={(event) => setEquipmentSkillId(event.target.value as SkillId | "")}
                  value={equipmentSkillId}
                >
                  <option value="">Random</option>
                  {ringSkillOptions.map((skillId) => (
                    <option key={skillId} value={skillId}>
                      {getSkillDefinition(skillId)?.name ?? skillId}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="space-y-1.5">
              <span className="block font-ik-menu text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500">
                Equipment Set (optional)
              </span>
              <select
                className="w-full border border-neutral-700 bg-black px-3 py-2 font-ik-menu text-sm text-neutral-100 outline-none focus:border-neutral-300"
                onChange={(event) => setEquipmentSetId(event.target.value as EquipmentSetId | "")}
                value={equipmentSetId}
              >
                <option value="">None</option>
                {setOptions.map((setId) => (
                  <option key={setId} value={setId}>
                    {getEquipmentSetDefinition(setId)?.name ?? setId}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="w-full border-2 border-neutral-100 bg-neutral-100 px-4 py-2 font-ik-menu text-xs text-neutral-950 transition hover:bg-neutral-300"
            onClick={handleClaimEquipment}
            type="button"
          >
            Generate &amp; Grant Equipment
          </button>
        </div>
      ) : null}

      {activeTab === "special" ? (
        <div className="space-y-3">
          {specialItemOptions.map((specialItemId) => {
            const isFragment = specialItemId === "FRAGMENT_DU_TEMPS";
            const owned =
              specialItemId === "KALEIDOSCOPE"
                ? state.specialItems.kaleidoscopeOwned
                : specialItemId === "DROP_OF_DARKNESS"
                  ? state.specialItems.dropOfDarknessOwned
                  : state.specialItems.fragmentDuTemps;

            return (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border border-neutral-800 bg-black/40 p-3"
                key={specialItemId}
              >
                <div>
                  <div className="font-ik-title text-sm text-neutral-100">{formatLabel(specialItemId)}</div>
                  <div className="font-ik-body text-xs text-neutral-500">
                    {isFragment ? `Owned ${owned}` : owned ? "Owned" : "Not owned"}
                  </div>
                </div>
                {isFragment ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="w-24 border border-neutral-700 bg-black px-2 py-1.5 font-ik-menu text-sm text-neutral-100 outline-none focus:border-neutral-300"
                      min={1}
                      onChange={(event) => setFragmentAmount(clampAmount(Number(event.target.value)))}
                      type="number"
                      value={fragmentAmount}
                    />
                    <button
                      className="border-2 border-neutral-100 bg-neutral-100 px-4 py-1.5 font-ik-menu text-xs text-neutral-950 transition hover:bg-neutral-300"
                      onClick={() => handleClaimSpecialItem(specialItemId, fragmentAmount)}
                      type="button"
                    >
                      Grant
                    </button>
                  </div>
                ) : (
                  <button
                    className={cn(
                      "border-2 px-4 py-1.5 font-ik-menu text-xs transition",
                      owned
                        ? "cursor-default border-neutral-800 text-neutral-600"
                        : "border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300",
                    )}
                    disabled={Boolean(owned)}
                    onClick={() => handleClaimSpecialItem(specialItemId)}
                    type="button"
                  >
                    {owned ? "Owned" : "Grant"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "unlocks" ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <SectionTitle>Buildings &amp; Story</SectionTitle>
            <UnlockGrantList
              isGranted={(id) => state.story.unlocked.has(id as UnlockId)}
              items={unlockOptions}
              onGrant={handleClaimUnlock}
              renderLabel={formatLabel}
            />
          </div>

          <div className="space-y-2">
            <SectionTitle>Eras (Time Gate)</SectionTitle>
            <UnlockGrantList
              isGranted={(id) => state.specialItems.unlockedEras.includes(id as EraId)}
              items={eraOptions}
              onGrant={handleClaimEra}
              renderLabel={formatLabel}
            />
          </div>

          <div className="space-y-2">
            <SectionTitle>Effect Sets</SectionTitle>
            <UnlockGrantList
              isGranted={(id) => state.effectSets.unlockedEffectSetIds.includes(id as EffectSetId)}
              items={effectSetOptions}
              onGrant={handleClaimEffectSet}
              renderLabel={formatLabel}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
