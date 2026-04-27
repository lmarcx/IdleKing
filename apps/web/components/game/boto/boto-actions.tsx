const BOTO_ACTIONS = ["Ouvrir le Royaume", "Pourquoi moi ?", "Analyser les ressources", "Mode veille"];

export function BotoActions() {
  return (
    <div className="ik-boto-actions" aria-label="Boto quick actions">
      {BOTO_ACTIONS.map((label) => (
        <button key={label} className="ik-boto-action-button font-ik-boto" type="button">
          {label}
        </button>
      ))}
    </div>
  );
}
