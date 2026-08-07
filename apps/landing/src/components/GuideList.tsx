import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Guide } from "@/lib/guides";
import { guidePath } from "@/lib/guides";

type GuideListProps = {
  locale: Locale;
  guides: Guide[];
  readMore: string;
  updatedLabel: string;
};

export default function GuideList({
  locale,
  guides,
  readMore,
  updatedLabel,
}: GuideListProps) {
  return (
    <ul className="mt-10 flex flex-col gap-4">
      {guides.map((guide) => (
        <li key={guide.slug} className="card-glass px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-xs uppercase tracking-widest text-brand-muted">
            {updatedLabel} <time dateTime={guide.updated}>{guide.updated}</time>
          </p>

          <h2 className="mt-2 text-lg font-semibold tracking-tight text-brand-text sm:text-xl">
            <Link
              href={guidePath(locale, guide.slug)}
              className="transition-colors hover:text-brand-accent"
            >
              {guide.h1}
            </Link>
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            {guide.description}
          </p>

          <Link
            href={guidePath(locale, guide.slug)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent"
          >
            {readMore}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
