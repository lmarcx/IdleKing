export function BotoUnit() {
  return (
    <section className="ik-boto-unit" aria-label="Boto unit status">
      <div className="ik-boto-unit__image-frame">
        <svg
          aria-label="Boto, compagnon robotique du royaume"
          className="ik-boto-unit__image"
          fill="none"
          role="img"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 96 96"
        >
          {/* Antenna */}
          <path d="M48 10 V20" />
          <circle cx="48" cy="7" r="3" fill="currentColor" stroke="none" />
          {/* Head block */}
          <rect height="44" width="56" x="20" y="20" />
          {/* Eye bar */}
          <rect fill="currentColor" height="8" stroke="none" width="36" x="30" y="34" />
          {/* Mouth grid */}
          <path d="M34 52 H62 M40 52 V58 M48 52 V58 M56 52 V58 M34 58 H62" strokeWidth={1.5} />
          {/* Side plates */}
          <rect height="16" width="6" x="12" y="34" />
          <rect height="16" width="6" x="78" y="34" />
          {/* Neck + shoulder base */}
          <path d="M40 64 V72 H56 V64" />
          <path d="M28 80 H68" />
        </svg>
      </div>

      <div className="ik-boto-unit__status">
        <p className="ik-boto-unit__eyebrow">BOTO UNIT -- LINK ESTABLISHED</p>
        <dl className="ik-boto-unit__meta">
          <div>
            <dt>Signal</dt>
            <dd>Stable</dd>
          </div>
          <div>
            <dt>Origin</dt>
            <dd>Rift Layer C</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
