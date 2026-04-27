export function BotoUnit() {
  return (
    <section className="ik-boto-unit" aria-label="Boto unit status">
      <div className="ik-boto-unit__image-frame">
        <img
          alt="Boto, compagnon robotique du royaume"
          className="ik-boto-unit__image"
          draggable={false}
          src="/assets/boto/boto-head.png"
        />
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
