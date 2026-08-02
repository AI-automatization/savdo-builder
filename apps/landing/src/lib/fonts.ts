import { Inter } from "next/font/google";

// Shared between the two root layouts ((uz) and (ru)) so both render the same
// font class name and next/font emits a single preload.
export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});
