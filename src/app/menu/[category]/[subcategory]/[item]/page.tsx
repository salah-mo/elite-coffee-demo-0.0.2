import type { MenuItem } from "@/types";
import {
  getCategoryById,
  getSubCategoryById,
  getItemById,
  getRecommendedItems,
  getMenuCategories,
} from "@/server/services/menuService";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ItemDetailClient from "@/components/ItemDetailClient";

export const dynamic = "force-dynamic";

/**
 * Generate static params for all menu items
 * This ensures all item detail pages are pre-built at build time
 * Following Next.js best practices for static exports
 */
export async function generateStaticParams() {
  try {
    const categories = await getMenuCategories();
    const params: Array<{ category: string; subcategory: string; item: string }> = [];
    for (const category of categories) {
      for (const subCategory of category.subCategories) {
        for (const item of subCategory.items) {
          params.push({
            category: category.id,
            subcategory: subCategory.id,
            item: item.id,
          });
        }
      }
    }
    return params;
  } catch (error) {
    console.warn(
      "Failed to generate static params for menu items:",
      error,
    );
    return [];
  }
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string; item: string }>;
}) {
  const {
    category: categoryId,
    subcategory: subCategoryId,
    item: itemId,
  } = await params;

  const category = await getCategoryById(categoryId);
  const subCategory = await getSubCategoryById(categoryId, subCategoryId);
  const item = await getItemById(itemId);
  const allCategories = await getMenuCategories();

  if (!category || !subCategory || !item) {
    notFound();
  }

  const recommendedItems = await getRecommendedItems(item);

  const recommendedItemsData = (
    await Promise.all(recommendedItems.map((rec) => getItemById(rec.itemId)))
  ).filter((candidate): candidate is MenuItem => Boolean(candidate));

  return (
    <main className="page-transition loaded">
      <Navigation />
      <ItemDetailClient
        item={item}
        category={category}
        subCategory={subCategory}
        allCategories={allCategories}
        recommendedItems={recommendedItems}
        recommendedItemsData={recommendedItemsData}
      />
      <Footer categories={allCategories} />
    </main>
  );
}
