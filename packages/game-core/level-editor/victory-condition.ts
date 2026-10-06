/**
 * Data-driven encounter completion rules. Replaces inferring a Story map's win condition from
 * the shape of its data (see StoryMapObjective/deriveStoryMapObjective in
 * story-map-objectives.ts, kept as the fallback for maps authored before this existed) with an
 * explicit, authored VictoryCondition a level designer sets per dungeon.
 */
export type VictoryConditionKind = "ALL_ENEMIES" | "BOSS_ONLY" | "ESCAPE" | "SURVIVE" | "CUSTOM";

export type VictoryCondition =
  | Readonly<{ kind: "ALL_ENEMIES" }>
  /** bossEnemyId is optional: when omitted, resolved at evaluation time from the enemy flagged isBoss. */
  | Readonly<{ kind: "BOSS_ONLY"; bossEnemyId?: string }>
  | Readonly<{ kind: "ESCAPE"; triggerId: string }>
  | Readonly<{ kind: "SURVIVE"; durationSeconds: number }>
  /** evaluatorId must be registered via registerCustomVictoryConditionEvaluator before evaluation. */
  | Readonly<{ kind: "CUSTOM"; evaluatorId: string }>;

export type VictoryConditionEnemyContext = Readonly<{ id: string; isDead: boolean; isBoss?: boolean }>;

export type VictoryConditionContext = Readonly<{
  enemies: readonly VictoryConditionEnemyContext[];
  exitReached: boolean;
  elapsedSeconds?: number;
}>;

export type VictoryConditionEvaluator = (context: VictoryConditionContext) => boolean;

const customVictoryConditionEvaluators = new Map<string, VictoryConditionEvaluator>();

export function registerCustomVictoryConditionEvaluator(evaluatorId: string, evaluator: VictoryConditionEvaluator): void {
  if (customVictoryConditionEvaluators.has(evaluatorId)) {
    throw new Error(`Custom victory condition evaluator already registered: ${evaluatorId}`);
  }
  customVictoryConditionEvaluators.set(evaluatorId, evaluator);
}

/** Test-only escape hatch: registries are module-level singletons and tests need a clean slate. */
export function clearCustomVictoryConditionEvaluators(): void {
  customVictoryConditionEvaluators.clear();
}

/**
 * Pure predicate: is `condition` satisfied given the current runtime state? Mirrors
 * isStoryMapObjectiveSatisfied's ALL_ENEMIES/BOSS_ONLY/ESCAPE semantics (defeat_all_enemies on a
 * zero-enemy map is never satisfied, boss-only ignores non-boss enemies) and adds SURVIVE/CUSTOM.
 */
export function isVictoryConditionSatisfied(condition: VictoryCondition, context: VictoryConditionContext): boolean {
  switch (condition.kind) {
    case "ALL_ENEMIES":
      return context.enemies.length > 0 && context.enemies.every((enemy) => enemy.isDead);
    case "BOSS_ONLY": {
      const boss = condition.bossEnemyId
        ? context.enemies.find((enemy) => enemy.id === condition.bossEnemyId)
        : context.enemies.find((enemy) => enemy.isBoss);
      return boss?.isDead ?? false;
    }
    case "ESCAPE":
      return context.exitReached;
    case "SURVIVE":
      return (context.elapsedSeconds ?? 0) >= condition.durationSeconds;
    case "CUSTOM": {
      const evaluator = customVictoryConditionEvaluators.get(condition.evaluatorId);
      if (!evaluator) throw new Error(`Unknown custom victory condition evaluator: ${condition.evaluatorId}`);
      return evaluator(context);
    }
    default:
      return false;
  }
}
