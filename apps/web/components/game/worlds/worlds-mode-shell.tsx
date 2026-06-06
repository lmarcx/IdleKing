import { TimeGatePanel } from "@/components/game/worlds/time-gate-panel";

type WorldsModeShellProps = {
  initialMode?: "time_gate";
  initialOpponentId?: string | null;
};

export function WorldsModeShell({ initialMode = "time_gate", initialOpponentId = null }: WorldsModeShellProps) {
  void initialMode;
  void initialOpponentId;

  return <TimeGatePanel />;
}
