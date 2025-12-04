import { getMenuCategories } from "@/server/services/menuService";
import MenuPageClient from "@/components/MenuPageClient";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const categories = await getMenuCategories();
  return <MenuPageClient categories={categories} />;
}
