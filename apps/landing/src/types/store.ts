export type FeaturedStore = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
};
