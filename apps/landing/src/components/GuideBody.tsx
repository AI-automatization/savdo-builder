import Image from "next/image";
import type { Guide } from "@/lib/guides";

type GuideBodyProps = {
  guide: Guide;
  /** Localised label for the "updated" line — freshness is a citation signal, so it ships visible. */
  updatedLabel: string;
};

/**
 * Renders one guide. Server component on purpose: the answer, the tables and the
 * FAQ have to exist in the first HTML response, otherwise the crawlers and answer
 * engines this content was written for never see it.
 */
export default function GuideBody({ guide, updatedLabel }: GuideBodyProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
        {guide.h1}
      </h1>

      <p className="mt-3 text-xs uppercase tracking-widest text-brand-muted">
        {updatedLabel}{" "}
        <time dateTime={guide.updated}>{guide.updated}</time>
      </p>

      {/*
        The direct answer, first thing after the H1. Same string as Article.abstract
        in the JSON-LD — one source, so the machine answer and the human answer match.
      */}
      <p
        className="card-glass-highlight mt-8 px-5 py-4 text-base leading-relaxed text-brand-text"
        style={{ borderLeft: "3px solid #E8A552" }}
      >
        {guide.answer}
      </p>

      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-brand-text sm:text-2xl">
            {section.heading}
          </h2>

          {section.body?.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mt-4 text-sm leading-relaxed text-brand-muted sm:text-base"
            >
              {paragraph}
            </p>
          ))}

          {section.image ? (
            // Intrinsic width/height come from the file itself so the browser can
            // reserve the box before it loads. `sizes` matches the article column
            // (max-w-3xl = 48rem) so phones are not sent the desktop-width file.
            <figure className="mt-6">
              <Image
                src={section.image.src}
                alt={section.image.alt}
                width={section.image.width}
                height={section.image.height}
                sizes="(min-width: 768px) 48rem, 100vw"
                className="h-auto w-full rounded-xl"
                style={{ border: "1px solid rgba(232,165,82,0.18)" }}
              />
              {section.image.caption ? (
                <figcaption className="mt-2 text-xs leading-relaxed text-brand-muted">
                  {section.image.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {section.bullets ? (
            <ul className="mt-4 flex flex-col gap-2">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet.slice(0, 48)}
                  className="flex gap-3 text-sm leading-relaxed text-brand-muted sm:text-base"
                >
                  <span aria-hidden style={{ color: "#E8A552", flexShrink: 0 }}>
                    —
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {section.table ? (
            // Wide tables scroll inside their own box; the page itself must never
            // scroll sideways on a phone, which is where most of this traffic lands.
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    {section.table.head.map((cell) => (
                      <th
                        key={cell || "spacer"}
                        scope="col"
                        className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-muted"
                        style={{ borderBottom: "1px solid rgba(232,165,82,0.25)" }}
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row) => (
                    <tr key={row.join("|")}>
                      {row.map((cell, cellIdx) => (
                        <td
                          key={`${cell}-${cellIdx}`}
                          className={
                            cellIdx === 0
                              ? "px-3 py-3 font-medium text-brand-text"
                              : "px-3 py-3 text-brand-muted"
                          }
                          style={{ borderBottom: "1px solid rgba(232,165,82,0.10)" }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}
    </article>
  );
}
