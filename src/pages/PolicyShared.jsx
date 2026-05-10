export function PolicyHero({ palette, eyebrow, title, description }) {
  return (
    <section
      className="rounded-[2rem] border p-6 shadow-sm md:p-8"
      style={{
        borderColor: palette.border,
        background: `linear-gradient(135deg, ${palette.white} 0%, ${palette.softGray} 100%)`,
      }}
    >
      <div
        className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ backgroundColor: `${palette.gold}14`, color: palette.gold }}
      >
        {eyebrow}
      </div>
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>
        {title}
      </h2>
      <p className="mt-4 max-w-4xl text-base leading-7 md:text-lg" style={{ color: palette.body }}>
        {description}
      </p>
    </section>
  );
}

export function PolicySection({ palette, number, title, children }) {
  return (
    <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm md:p-7" style={{ borderColor: palette.border }}>
      <div className="mb-4 flex items-start gap-3">
        {number && (
          <div
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: palette.burgundy }}
          >
            {number}
          </div>
        )}
        <h3 className="pt-1 text-2xl font-bold tracking-tight" style={{ color: palette.charcoal }}>
          {title}
        </h3>
      </div>
      <div className="policy-copy space-y-4 text-sm leading-7 md:text-base" style={{ color: palette.body }}>
        {children}
      </div>
    </section>
  );
}

export function PolicyList({ items }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dd7d00]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PolicyCallout({ palette, title, children }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: `${palette.gold}55`, backgroundColor: `${palette.gold}0f` }}
    >
      {title && <div className="mb-2 font-bold" style={{ color: palette.charcoal }}>{title}</div>}
      <div className="text-sm leading-7 md:text-base" style={{ color: palette.body }}>{children}</div>
    </div>
  );
}

export function PolicyTable({ palette, columns, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: palette.border }}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: palette.border }}>
          <thead style={{ backgroundColor: palette.softGray }}>
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em]" style={{ color: palette.charcoal }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y bg-white" style={{ borderColor: palette.border }}>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`} className="px-4 py-4 align-top text-sm leading-6" style={{ color: palette.body }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
