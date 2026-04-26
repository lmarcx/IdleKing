// apps/web/app/game/boto/page.tsx
import { HoloPanel } from "@/components/ui/holo-panel";

export default function BotoPage() {
  return (
    <div className="p-6">
      <div className="ik-boto-console">
        {/* Left: Portrait */}
        <div className="ik-boto-portrait">
          <div className="ik-boto-portrait-core">
            <div className="ik-boto-humanoid" />
          </div>

          <div className="font-ik-boto absolute left-4 top-4 text-sm tracking-wide text-white/80">
            BOTO UNIT — LINK ESTABLISHED
          </div>
          <div className="font-ik-boto absolute left-4 bottom-4 text-xs text-white/60">
            Signal: Stable • Origin: Rift Layer C
          </div>
        </div>

        {/* Right: Console */}
        <div className="ik-boto-right">
          <HoloPanel className="py-4">
            <div className="font-ik-boto text-white/90 font-semibold tracking-wide">
              COMPANION CONSOLE
            </div>
            <div className="font-ik-boto text-white/60 text-sm mt-1">
              Cosmic interface • Guidance protocol online
            </div>
          </HoloPanel>

          <div className="ik-dialogue">
            <div className="ik-dialogue-line ik-dialogue-line--boto">
              <div className="font-ik-boto text-xs text-white/60 mb-1">BOTO</div>
              <div className="font-ik-boto text-white/90">
                Mon lien avec ce monde est instable… mais suffisant pour te guider.
              </div>
            </div>

            <div className="ik-dialogue-line ik-dialogue-line--player">
              <div className="font-ik-boto text-xs text-white/60 mb-1">ROI</div>
              <div className="font-ik-boto text-white/90">
                Alors montre-moi quoi faire maintenant.
              </div>
            </div>

            <div className="ik-dialogue-line ik-dialogue-line--boto">
              <div className="font-ik-boto text-xs text-white/60 mb-1">BOTO</div>
              <div className="font-ik-boto text-white/90">
                Commence par stabiliser le Royaume. Construis la Ferme puis la Mine.
              </div>
            </div>
          </div>

          <div className="ik-choice-bar">
            <button className="font-ik-boto ik-holo-button">Ouvrir le Royaume</button>
            <button className="font-ik-boto ik-holo-button">Pourquoi moi ?</button>
            <button className="font-ik-boto ik-holo-button">Analyser les ressources</button>
            <button className="font-ik-boto ik-holo-button">Mode veille</button>
          </div>
        </div>
      </div>
    </div>
  );
}
