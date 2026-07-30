type FaqListProps = {
  title: string;
  items: Array<{ q: string; a: string }>;
  /** `h2` on a guide page (the H1 is the article title), `h2` under the /faq H1 too. */
  headingLevel?: "h2" | "h3";
};

/**
 * Always-expanded FAQ list — no accordion.
 *
 * Why not reuse the homepage `FAQ` component: that one is a client component that
 * keeps all but one answer unmounted. For the pages whose entire purpose is to be
 * the answer (`/faq`, the per-guide FAQ), the answer text has to be in the HTML,
 * visible, and matching the FAQPage markup one-for-one.
 */
export default function FaqList({ title, items, headingLevel = "h3" }: FaqListProps) {
  const QuestionHeading = headingLevel;

  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold tracking-tight text-brand-text sm:text-2xl">
        {title}
      </h2>

      <dl className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.q} className="card-glass px-5 py-4">
            <dt>
              <QuestionHeading className="text-base font-medium text-brand-text">
                {item.q}
              </QuestionHeading>
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-brand-muted">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
