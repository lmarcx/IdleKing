import { combat, type SkillDefinition } from "@idleking/game-core";
import { getStorySkillRuntimeProfile } from "@idleking/game-core/skills";

/**
 * Short, category-aware effect line shared by the skill bar tooltip and the
 * Skills menu — mirrors what the skill actually does at runtime by reading
 * the same StorySkillRuntimeProfile used for real hit detection, so the UI
 * never drifts from combat behavior. See STORY_SKILL_RUNTIME_PROFILES.
 */
export function describeSkillEffect(
  skillDef: SkillDefinition,
  attack: number,
  ringSkillScaling?: number | null
): string {
  const profile = getStorySkillRuntimeProfile(skillDef.id);

  if (skillDef.category === "attack") {
    const damage = combat.computeSkillDamage({
      attack,
      ringSkillScaling: ringSkillScaling ?? undefined,
      skillDamageMultiplier: skillDef.basePower,
    });
    const shape = profile.attack;
    const area =
      shape?.shape === "cone"
        ? `cône ${shape.range}px`
        : shape?.shape === "line"
          ? `ligne ${shape.range}px`
          : shape?.shape === "aoe" || shape?.shape === "enemy_cast"
            ? `zone r.${shape.radius ?? 80}px`
            : `portée ${shape?.range ?? "—"}px`;
    return `Dégâts ≈ ${Math.round(damage.damage)} · ${area}`;
  }

  if (skillDef.category === "movement" && profile.movement) {
    return `Déplacement ${profile.movement.distance}px (${profile.movement.mode})`;
  }

  if (skillDef.category === "defense" && profile.defense) {
    const reduction = Math.round((1 - profile.defense.incomingDamageMultiplier) * 100);
    return `Réduit les dégâts subis de ${reduction}% · ${Math.round(profile.defense.durationMs / 1000)}s`;
  }

  if (skillDef.category === "utility" && profile.utility) {
    if (profile.utility.kind === "damage_buff") {
      return `+${Math.round(((profile.utility.damageMultiplier ?? 1) - 1) * 100)}% dégâts · ${Math.round(profile.utility.durationMs / 1000)}s`;
    }
    if (profile.utility.kind === "mana_regen_buff") {
      return `+${profile.utility.manaRegenPerSecond ?? 0} Mana/s · ${Math.round(profile.utility.durationMs / 1000)}s`;
    }
    if (profile.utility.kind === "enemy_vulnerability_debuff") {
      return `Cible +${Math.round(((profile.utility.incomingDamageMultiplier ?? 1) - 1) * 100)}% dégâts subis`;
    }
  }

  if (skillDef.category === "summon" && profile.summon) {
    return `Invocation · ${Math.round(profile.summon.durationMs / 1000)}s`;
  }

  return skillDef.description;
}
