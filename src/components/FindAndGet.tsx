"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import type { MenuCategory } from "@/types/menu";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface CategoryCardProps {
  href: string;
  imageSrc?: string;
  altText: string;
  title: string;
  emoji?: string;
}

const CategoryCard = ({
  href,
  imageSrc,
  altText,
  title,
  emoji,
}: CategoryCardProps) => (
  <Link href={href} className="flex flex-col items-center group cursor-pointer">
    <div
      className="category-card w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={altText}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
          <span className="text-6xl">{emoji}</span>
        </div>
      )}
    </div>
    <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
      {title}
    </h3>
  </Link>
);

interface FindAndGetProps {
  categories: MenuCategory[];
}

export default function FindAndGet({ categories }: FindAndGetProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Filter to show only first 3 non-comingSoon categories
  const displayCategories = categories.filter(cat => !cat.comingSoon).slice(0, 3);

  useEffect(() => {
    if (!sectionRef.current) return;
    
    const cards = sectionRef.current.querySelectorAll('.category-card');
    if (cards.length === 0) return;

    // Set initial state - scale down to 0
    gsap.set(cards, {
      scale: 0,
      opacity: 0,
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: cards[0],
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none",
      },
    });

    // Animate circles in sequence with zoom effect
    cards.forEach((card, index) => {
      tl.to(
        card,
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        index === 0 ? 0 : "-=0.6",
      );
    });

    // Cleanup function
    return () => {
      tl.kill();
    };
  }, [displayCategories.length]);

  // Fallback for empty categories
  if (displayCategories.length === 0) {
    return null;
  }

  // Helper to get first item image from category
  const getCategoryImage = (category: MenuCategory): string | undefined => {
    for (const sub of category.subCategories) {
      if (sub.items.length > 0 && sub.items[0].images[0]) {
        return sub.items[0].images[0];
      }
    }
    return undefined;
  };

  return (
    <section ref={sectionRef} className="bg-elite-cream py-20 xl:py-36 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-5xl md:text-6xl lg:text-7xl mb-16">
          Find and Get
          <br />
          What You Love
        </h2>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              href={`/menu/${category.id}`}
              imageSrc={getCategoryImage(category)}
              altText={category.name}
              title={category.name}
              emoji="☕"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
