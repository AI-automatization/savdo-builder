"use client";

import { useEffect } from "react";
import { pushRecentStore } from "@/lib/recent-stores";

interface Props {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export function RegisterRecentStore({ slug, name, logoUrl }: Props) {
  useEffect(() => {
    pushRecentStore({ slug, name, logoUrl });
  }, [slug, name, logoUrl]);
  return null;
}
