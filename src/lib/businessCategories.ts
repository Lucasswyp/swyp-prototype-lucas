import type { Category } from "@/types";

// Wat een ondernemer ziet, en welke categorie daarachter wordt bewaard. De bewaarde waarden blijven
// hetzelfde (de feed, interesses en zoeken gebruiken ze); alleen de namen zijn gewoon Nederlands.
export const BUSINESS_CATEGORY_OPTIONS: { label: string; value: Category }[] = [
  { label: "Horeca: restaurant, café, lunchroom", value: "Restaurants" },
  { label: "Koffie, bakker, slager en winkel met eten", value: "Food" },
  { label: "Kapper, barbershop, salon en beauty", value: "Beauty" },
  { label: "Fitness, sportschool en sport", value: "Fitness" },
  { label: "Kleding, schoenen en accessoires", value: "Fashion" },
  { label: "Gezondheid en wellness", value: "Wellness" },
  { label: "Dagje uit en vrije tijd", value: "Days Out" },
  { label: "Evenementen", value: "Events" },
  { label: "Reizen", value: "Travel" },
  { label: "Elektronica en techniek", value: "Tech" },
  { label: "Wonen en tuin", value: "Home" },
  { label: "Auto en fiets", value: "Cars" },
  { label: "Games en entertainment", value: "Gaming" },
];
