import { getAllCategories, type MenuItem } from "@/lib/menuData";
import type { PreferenceInput } from "@/server/validators/recommendationSchemas";

export interface SuggestionResult {
  item: MenuItem;
  score: number;
  reasons: string[];
  suggestedSize?: string;
  suggestedFlavors?: string[];
  suggestedToppings?: string[];
}

function flattenMenu(): MenuItem[] {
  const items: MenuItem[] = [];
  for (const cat of getAllCategories()) {
    for (const sub of cat.subCategories) {
      for (const item of sub.items) {
        if (item.available) items.push(item);
      }
    }
  }
  return items;
}

function contains(str: string, substr: string) {
  return str.toLowerCase().includes(substr.toLowerCase());
}

function deriveAttributes(item: MenuItem) {
  // Defensive normalization – avoid runtime errors if fields are missing
  const rawId: unknown = item.id;
  const rawName: unknown = item.name;
  const rawDesc: unknown = item.description;
  const id =
    typeof rawId === "string"
      ? rawId.toLowerCase()
      : String(rawId ?? "").toLowerCase();
  const name =
    typeof rawName === "string"
      ? rawName.toLowerCase()
      : String(rawName ?? "").toLowerCase();
  const desc = typeof rawDesc === "string" ? rawDesc.toLowerCase() : "";

  const isMilkBased =
    item.allergens?.includes("Milk") ||
    /(latte|cappuccino|frappuccino|macchiato|cortado|karak)/.test(id + name);
  const hasChocolate =
    item.allergens?.includes("Chocolate") ||
    /(mocha|chocolate)/.test(id + name);
  const isTea = /(matcha|tea|chai)/.test(id + name);
  const isEspresso = /(espresso)/.test(id) || contains(name, "espresso");
  const isTurkish = /(turkish)/.test(id + name);
  const isAmericano = /(americano)/.test(id + name);

  // Temperature support inferred from description
  const supportsIced =
    desc.indexOf("hot & iced") !== -1 || /(iced|frappuccino)/.test(id + name);
  const hotOnly = desc.indexOf("hot only") !== -1;

  // Caffeine rough levels
  const caffeineLevel = ((): "none" | "low" | "medium" | "high" => {
    if (hasChocolate && !isEspresso) return "low";
    if (isTea) return "medium";
    if (isTurkish || isEspresso || isAmericano) return "high";
    if (contains(id + name, "chocolate")) return "none";
    return "medium";
  })();

  // Sweetness rough levels
  const sweetnessLevel = ((): "low" | "medium" | "high" => {
    if (/(spanish-latte|mocha|chocolate|frappuccino)/.test(id)) return "high";
    if (isAmericano || isEspresso || isTurkish) return "low";
    return "medium";
  })();

  return {
    isMilkBased,
    hasChocolate,
    isTea,
    isEspresso,
    isTurkish,
    isAmericano,
    supportsIced,
    hotOnly,
    caffeineLevel,
    sweetnessLevel,
  };
}

function levelDistance<T extends string>(
  actual: T,
  desired: T,
  order: T[],
): number {
  const ai = order.indexOf(actual);
  const di = order.indexOf(desired);
  if (ai === -1 || di === -1) return 2; // neutral penalty if unknown
  return Math.abs(ai - di);
}

export function suggestDrinks(prefs: PreferenceInput): {
  top: SuggestionResult | null;
  alternatives: SuggestionResult[];
} {
  const items = flattenMenu();
  const results: SuggestionResult[] = [];

  for (const item of items) {
    const attr = deriveAttributes(item);
    let score = 0;
    const reasons: string[] = [];

    // Temperature match
    if (prefs.temperature === "iced") {
      if (attr.hotOnly) {
        score -= 100; // hard block
        reasons.push("Hot-only drink, not suitable for iced");
      } else if (attr.supportsIced) {
        score += 3;
        reasons.push("Works well iced");
      } else {
        score += 1; // neutral, many can be iced
      }
    } else if (prefs.temperature === "hot") {
      score += 2;
      reasons.push("Great as a hot drink");
    }

    // Caffeine preference
    const caffeineOrder: PreferenceInput["caffeine"][] = [
      "none",
      "low",
      "medium",
      "high",
    ];
    const caffeDist = levelDistance<PreferenceInput["caffeine"]>(
      attr.caffeineLevel as PreferenceInput["caffeine"],
      prefs.caffeine,
      caffeineOrder,
    );
    score += 3 - caffeDist; // closer is better
    if (caffeDist === 0) reasons.push(`Matches caffeine: ${prefs.caffeine}`);

    // Sweetness
    const sweetOrder: PreferenceInput["sweetness"][] = [
      "low",
      "medium",
      "high",
    ];
    const sweetDist = levelDistance<PreferenceInput["sweetness"]>(
      attr.sweetnessLevel as PreferenceInput["sweetness"],
      prefs.sweetness,
      sweetOrder,
    );
    score += 2 - sweetDist;
    if (sweetDist === 0) reasons.push(`Sweetness: ${prefs.sweetness}`);

    // Milk preference
    if (prefs.milk === "no-milk") {
      if (attr.isMilkBased) {
        score -= 3;
        reasons.push("Milk-based by default");
      } else {
        score += 2;
        reasons.push("Naturally dairy-free");
      }
    } else if (prefs.milk === "non-dairy") {
      if (attr.isMilkBased) {
        score += 1;
        reasons.push("Can be made with non-dairy milk");
      }
    } else if (prefs.milk === "dairy") {
      if (attr.isMilkBased) {
        score += 1;
        reasons.push("Creamy milk-based drink");
      }
    }

    // Flavor notes
    const wanted = (prefs.flavors || []).map((f) => f.toLowerCase());
    if (wanted.length > 0) {
      if (wanted.some((f) => f.includes("choc")) && attr.hasChocolate) {
        score += 3;
        reasons.push("Chocolate-forward");
      }
      if (
        wanted.some((f) => /(vanilla|caramel|hazelnut|pistachio)/.test(f)) &&
        /(latte|frappuccino)/.test(item.id)
      ) {
        score += 2;
        reasons.push("Pairs well with syrups");
      }
      if (
        wanted.some((f) => /(spice|cinnamon|cardamom|chai)/.test(f)) &&
        /karak|chai/.test(item.id)
      ) {
        score += 3;
        reasons.push("Spiced tea profile");
      }
      if (
        wanted.some((f) => /(matcha|green)/.test(f)) &&
        /matcha/.test(item.id)
      ) {
        score += 3;
        reasons.push("Matcha flavor");
      }
    }

    // Budget consideration (based on base price)
    if (typeof prefs.budget === "number") {
      const diff = item.price - prefs.budget;
      if (diff <= 0) {
        score += 2;
        reasons.push("Within budget");
      } else {
        score -= Math.min(3, Math.ceil(diff / 10));
        reasons.push("May exceed budget");
      }
    }

    // Featured boost
    if (prefs.featuredBoost && item.featured) {
      score += 1;
      reasons.push("Popular choice");
    }

    // Time of day: simple nudge
    if (prefs.timeOfDay === "morning") {
      if (attr.isEspresso || attr.isAmericano || attr.isTurkish) score += 1;
    } else if (prefs.timeOfDay === "evening") {
      if (attr.caffeineLevel === "low" || attr.caffeineLevel === "none")
        score += 1;
    }

    // Suggested size
    const availableSizes =
      item.sizes?.filter((s) => s.available).map((s) => s.name) || [];
    let suggestedSize: string | undefined =
      prefs.sizePreference && availableSizes.includes(prefs.sizePreference)
        ? prefs.sizePreference
        : undefined;
    if (!suggestedSize) {
      if (availableSizes.includes("Medium")) suggestedSize = "Medium";
      else if (availableSizes.length > 0) suggestedSize = availableSizes[0];
    }

    // Suggested flavors/toppings from preferences
    const suggestedFlavors = (prefs.flavors || []).slice(0, 2);

    results.push({ item, score, reasons, suggestedSize, suggestedFlavors });
  }

  results.sort((a, b) => b.score - a.score);
  const top = results[0] ?? null;
  const alternatives = results.slice(1, 4);
  return { top, alternatives };
}
