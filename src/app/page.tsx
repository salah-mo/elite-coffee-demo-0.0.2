import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import GoodVibesSection from "@/components/GoodVibesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import NearbyCafesSection from "@/components/NearbyCafesSection";
import FindAndGet from "@/components/FindAndGet";
import LovedByLocals from "@/components/LovedByLocals";
import Footer from "@/components/Footer";
import { getMenuCategories } from "@/server/services/menuService";

export default async function Home() {
  const categories = await getMenuCategories();
  
  return (
    <main>
      <Navigation />
      <Hero />
      <FindAndGet categories={categories} />
      <LovedByLocals categories={categories} />
      <GoodVibesSection />
      <TestimonialsSection />
      <NearbyCafesSection />
      <Footer categories={categories} />
    </main>
  );
}
