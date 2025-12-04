export interface Size {
  name: string;
  priceModifier: number;
  available: boolean;
}

export interface Flavor {
  name: string;
  price: number;
  available: boolean;
}

export interface Topping {
  name: string;
  price: number;
  available: boolean;
  character?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  images: string[];
  featured: boolean;
  available: boolean;
  allergens: string[];
  sizes: Size[];
  flavors: Flavor[];
  toppings: Topping[];
  character?: string;
  story?: string;
  odooProductId?: number;
  odooTemplateId?: number;
  odooDefaultCode?: string | null;
  odooCategoryId?: number;
}

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  comingSoon: boolean;
  subCategories: SubCategory[];
}

export interface RecommendedItem {
  itemId: string;
  reason: string;
  packageOffer?: {
    name: string;
    description: string;
    discount: number;
  };
}

export interface CustomizationOptions {
  sizes: Size[];
  shots: Array<{ name: string; priceModifier: number; available: boolean }>;
  flavors: { name: string; price: number; available: boolean }[];
  toppings: Topping[];
  milkOptions: Array<{ name: string; priceModifier: number; available: boolean }>;
  sweetness: Array<{ name: string; priceModifier: number; available: boolean }>;
}
