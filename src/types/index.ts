export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string | null;
  color: string | null;
  season: Season | null;
  image_url: string | null;
  brand: string | null;
  ai_tags: string[];
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  occasion: string | null;
  items: string[];
  ai_reasoning: string | null;
  created_at: string;
}

export interface OutfitWithItems extends Outfit {
  clothing_items: ClothingItem[];
}

export interface OutfitLog {
  id: string;
  user_id: string;
  outfit_id: string | null;
  date_worn: string;
  notes: string | null;
  created_at: string;
}

export type ClothingCategory =
  | "tops"
  | "bottoms"
  | "shoes"
  | "outerwear"
  | "accessories"
  | "dresses";

export type Season = "spring" | "summer" | "fall" | "winter" | "all";

export const CATEGORIES: { value: ClothingCategory; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

export const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
  { value: "all", label: "All Seasons" },
];

export const OCCASIONS = [
  "Casual",
  "Work",
  "Date Night",
  "Formal",
  "Party",
  "Workout",
  "Travel",
  "Interview",
] as const;
