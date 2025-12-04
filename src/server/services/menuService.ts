import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import type {
  MenuCategory,
  MenuItem,
  RecommendedItem,
  SubCategory,
} from "@/types/menu";

interface MenuCacheEntry {
  expiresAt: number;
  categories: MenuCategory[];
}

interface OdooCategoryRecord {
  id: number;
  name: string;
  parent_id: [number, string] | false;
  complete_name?: string;
}

interface OdooProductRecord {
  id: number;
  name: string;
  default_code?: string | false;
  list_price?: number;
  description_sale?: string | false;
  categ_id?: [number, string] | false;
  active?: boolean;
  sale_ok?: boolean;
  image_128?: string | false;
  image_512?: string | false;
  image_1024?: string | false;
  image_1920?: string | false;
  product_tmpl_id?: [number, string] | false;
}

const CACHE_TTL_MS = (() => {
  const raw = process.env.ODOO_MENU_CACHE_TTL_MS;
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(
      "Invalid ODOO_MENU_CACHE_TTL_MS value. Falling back to no menu caching.",
    );
    return 0;
  }
  return parsed;
})();
const FALLBACK_IMAGE = "/images/menu/drinks/american.png";

let cache: MenuCacheEntry | null = null;

function slugify(input: string, fallback: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
  return slug.length > 0 ? slug : fallback;
}

function pickIcon(name: string): string {
  const lower = name.toLowerCase();
  if (/(food|sandwich|cake|cookie|pastry|snack)/.test(lower)) {
    return "utensils";
  }
  if (/(home|retail|beans|merch)/.test(lower)) {
    return "home";
  }
  if (/(tea|matcha|herbal)/.test(lower)) {
    return "sparkles";
  }
  return "coffee";
}

function extractImage(product: OdooProductRecord): string {
  const base64 =
    product.image_512 ||
    product.image_1920 ||
    product.image_1024 ||
    product.image_128 ||
    "";
  if (typeof base64 === "string" && base64.trim().length > 0) {
    // Odoo stores base64 without mimetype; assume PNG for compatibility
    return `data:image/png;base64,${base64}`;
  }
  return FALLBACK_IMAGE;
}

function ensureSizes(): MenuItem["sizes"] {
  return [];
}

async function fetchCategories(
  client: NonNullable<ReturnType<typeof createOdooClient>>,
  initialIds: Iterable<number>,
): Promise<Map<number, OdooCategoryRecord>> {
  const result = new Map<number, OdooCategoryRecord>();
  const queue = new Set<number>(initialIds);

  while (queue.size > 0) {
    const ids = Array.from(queue);
    queue.clear();

    if (!ids.length) break;

    const chunk = await client.searchRead<OdooCategoryRecord>(
      "product.category",
      [["id", "in", ids]],
      ["id", "name", "parent_id", "complete_name"],
      { limit: ids.length },
    );

    for (const record of chunk) {
      if (!result.has(record.id)) {
        result.set(record.id, record);
        const parent = Array.isArray(record.parent_id)
          ? record.parent_id[0]
          : null;
        if (parent && !result.has(parent)) {
          queue.add(parent);
        }
      }
    }
  }

  return result;
}

function resolveTopCategory(
  record: OdooCategoryRecord | undefined,
  categories: Map<number, OdooCategoryRecord>,
): OdooCategoryRecord | undefined {
  if (!record) return undefined;
  let current: OdooCategoryRecord | undefined = record;
  const visited = new Set<number>();
  while (current?.parent_id) {
    const parentId = Array.isArray(current.parent_id)
      ? current.parent_id[0]
      : null;
    if (!parentId || visited.has(parentId)) break;
    visited.add(parentId);
    const parent = categories.get(parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

function resolveSubCategoryName(
  record: OdooCategoryRecord | undefined,
  top: OdooCategoryRecord | undefined,
): { id: string; name: string; description: string } {
  if (!record) {
    const name = "General";
    return {
      id: slugify(name, "general"),
      name,
      description: "Assorted items",
    };
  }
  if (top && record.id === top.id) {
    const name = record.name || "General";
    return {
      id: slugify(`${name}-${record.id}`, `category-${record.id}`),
      name,
      description:
        record.complete_name ||
        `All ${record.name || "items"}`,
    };
  }
  const name = record.name || "General";
  return {
    id: slugify(`${name}-${record.id}`, `subcategory-${record.id}`),
    name,
    description:
      record.complete_name || `Assorted ${name.toLowerCase()}`,
  };
}

async function loadMenuCategoriesFromOdoo(): Promise<MenuCategory[]> {
  if (!isOdooConfigured()) {
    return [];
  }

  const client = createOdooClient();
  if (!client) {
    throw new Error("Failed to initialize Odoo client");
  }

  const products = await client.searchRead<OdooProductRecord>(
    "product.product",
    [
      ["type", "in", ["product", "consu"]],
    ],
    [
      "id",
      "name",
      "default_code",
      "list_price",
      "description_sale",
      "categ_id",
      "active",
      "sale_ok",
      "image_128",
      "image_512",
      "image_1024",
      "image_1920",
      "product_tmpl_id",
    ],
  );

  const categoryIds = new Set<number>();
  for (const product of products) {
    const cat = product.categ_id;
    if (Array.isArray(cat) && cat[0]) {
      categoryIds.add(cat[0]);
    }
  }

  const categoriesMap = await fetchCategories(client, categoryIds);

  const builders = new Map<
    string,
    {
      category: MenuCategory;
      subCategories: Map<string, SubCategory>;
    }
  >();

  for (const product of products) {
    const categoryRef = Array.isArray(product.categ_id)
      ? categoriesMap.get(product.categ_id[0])
      : undefined;
    const topCategory = resolveTopCategory(categoryRef, categoriesMap);

    const categoryName = topCategory?.name || categoryRef?.name || "Menu";
    const categoryId = slugify(
      `${categoryName}-${topCategory?.id ?? categoryRef?.id ?? "root"}`,
      "menu",
    );

    let builder = builders.get(categoryId);
    if (!builder) {
      builder = {
        category: {
          id: categoryId,
          name: categoryName,
          description:
            topCategory?.complete_name ||
            `Items from ${categoryName}`,
          icon: pickIcon(categoryName),
          comingSoon: false,
          subCategories: [],
        },
        subCategories: new Map(),
      };
      builders.set(categoryId, builder);
    }

    const subMeta = resolveSubCategoryName(categoryRef, topCategory);
    let subCategory = builder.subCategories.get(subMeta.id);
    if (!subCategory) {
      subCategory = {
        id: subMeta.id,
        name: subMeta.name,
        description: subMeta.description,
        items: [],
      };
      builder.subCategories.set(subMeta.id, subCategory);
      builder.category.subCategories.push(subCategory);
    }

    const idSource =
      typeof product.default_code === "string" &&
      product.default_code.trim().length > 0
        ? product.default_code.trim()
        : `odoo-${product.id}`;

    const item: MenuItem = {
      id: idSource,
      name: product.name,
      description:
        (typeof product.description_sale === "string"
          ? product.description_sale
          : undefined) || product.name,
      price: Number(product.list_price ?? 0),
      category: builder.category.id,
      subCategory: subCategory.id,
      images: [extractImage(product)],
      featured: Boolean(product.sale_ok && product.active !== false),
      available: Boolean(product.active ?? true),
      allergens: [],
      sizes: ensureSizes(),
      flavors: [],
      toppings: [],
      story: undefined,
      character: undefined,
      odooProductId: product.id,
      odooTemplateId: Array.isArray(product.product_tmpl_id)
        ? product.product_tmpl_id[0]
        : undefined,
      odooDefaultCode:
        typeof product.default_code === "string"
          ? product.default_code
          : null,
      odooCategoryId: Array.isArray(product.categ_id)
        ? product.categ_id[0]
        : undefined,
    };

    subCategory.items.push(item);
  }

  const categories = Array.from(builders.values()).map(({ category }) => ({
    ...category,
    subCategories: category.subCategories.map((sub) => ({
      ...sub,
      items: sub.items.sort((a, b) => a.name.localeCompare(b.name)),
    })).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

export async function getMenuCategories(options?: {
  forceRefresh?: boolean;
}): Promise<MenuCategory[]> {
  const cacheEnabled = CACHE_TTL_MS > 0;

  if (
    cacheEnabled &&
    !options?.forceRefresh &&
    cache &&
    Date.now() < cache.expiresAt
  ) {
    return cache.categories;
  }

  const categories = await loadMenuCategoriesFromOdoo();
  if (cacheEnabled) {
    cache = {
      categories,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
  } else {
    cache = null;
  }
  return categories;
}

export function clearMenuCache(): void {
  cache = null;
}

export async function getCategoryById(
  id: string,
): Promise<MenuCategory | undefined> {
  const categories = await getMenuCategories();
  return categories.find((category) => category.id === id);
}

export async function getSubCategoryById(
  categoryId: string,
  subCategoryId: string,
): Promise<SubCategory | undefined> {
  const category = await getCategoryById(categoryId);
  return category?.subCategories.find((sub) => sub.id === subCategoryId);
}

export async function getItemById(id: string): Promise<MenuItem | undefined> {
  const categories = await getMenuCategories();
  for (const category of categories) {
    for (const subCategory of category.subCategories) {
      const found = subCategory.items.find((item) => item.id === id);
      if (found) return found;
    }
  }
  return undefined;
}

function buildRecommendations(
  item: MenuItem,
  categories: MenuCategory[],
): RecommendedItem[] {
  const recommendations: RecommendedItem[] = [];

  const category = categories.find((cat) => cat.id === item.category);
  if (category) {
    for (const sub of category.subCategories) {
      for (const candidate of sub.items) {
        if (candidate.id !== item.id && candidate.available) {
          recommendations.push({
            itemId: candidate.id,
            reason: `More from ${category.name}`,
            packageOffer: {
              name: `${item.name} + ${candidate.name}`,
              description: `Perfect pairing from ${category.name}`,
              discount: 10,
            },
          });
        }
      }
    }
  }

  for (const otherCategory of categories) {
    if (otherCategory.id === item.category) continue;
    for (const sub of otherCategory.subCategories) {
      for (const candidate of sub.items) {
        if (candidate.featured && candidate.available) {
          recommendations.push({
            itemId: candidate.id,
            reason: `Featured ${otherCategory.name}`,
            packageOffer: {
              name: `${item.name} + ${candidate.name}`,
              description: `Try something new from ${otherCategory.name}`,
              discount: 15,
            },
          });
        }
      }
    }
  }

  return recommendations.slice(0, 6);
}

export async function getRecommendedItems(
  item: MenuItem,
): Promise<RecommendedItem[]> {
  const categories = await getMenuCategories();
  return buildRecommendations(item, categories);
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const categories = await getMenuCategories();
  const items: MenuItem[] = [];
  for (const category of categories) {
    for (const sub of category.subCategories) {
      items.push(...sub.items);
    }
  }
  return items;
}
