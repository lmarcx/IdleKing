import { BotoActions } from "@/components/game/boto/boto-actions";
import { BotoUnit } from "@/components/game/boto/boto-unit";
import { TerminalDialogue } from "@/components/game/boto/terminal-dialogue";
import { HoloPanel } from "@/components/ui/holo-panel";

const BOTO_MESSAGES = [
  {
    speaker: "BOTO" as const,
    text: "Tu m'as l'ai familier, d'où viens tu ? Et que fais-tu dans ce Royaume en ruines, il n'y a plus rien à faire ici...",
  },
  {
    speaker: "ROI" as const,
    text: "Je ne sais pas, j'ai l'impression d'être sorti d'un long sommeil. Quel est cet endroit ? Qui es-tu ?",
  },
  {
    speaker: "BOTO" as const,
    text: "Je suis BOTO, un vestige de ce monde dévasté. J'avais pour habitude de servir les anciens rois, mais maintenant je suis seul. Je peux t'aider à explorer ce royaume et à découvrir ses secrets, si tu le souhaites. Bien qu'il ne reste pas grand chose...",
  },
];

export default function BotoPage() {
  return (
    <div className="p-6">
      <div className="ik-boto-console">
        <BotoUnit />

        <div className="ik-boto-right">
          <HoloPanel className="ik-boto-console-heading py-4">
            <div className="font-ik-boto font-semibold tracking-wide text-emerald-100">
              COMPANION CONSOLE
            </div>
            <div className="font-ik-boto mt-1 text-sm text-emerald-200/60">
              Matrix guidance protocol online
            </div>
          </HoloPanel>

          <TerminalDialogue messages={BOTO_MESSAGES} />
          <BotoActions />
        </div>
      </div>
    </div>
  );
}
