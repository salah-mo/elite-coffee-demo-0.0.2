"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import type { MenuCategory } from "@/types/menu";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface LovedByLocalsProps {
  categories: MenuCategory[];
}

export default function LovedByLocals({ categories }: LovedByLocalsProps) {
  const productRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get featured items from categories
  const getFeaturedItems = () => {
    const featured: Array<{
      name: string;
      image: string;
      link: string;
    }> = [];

    for (const category of categories) {
      if (category.comingSoon) continue;
      
      for (const sub of category.subCategories) {
        for (const item of sub.items) {
          if (item.featured && item.available && featured.length < 4) {
            featured.push({
              name: item.name,
              image: item.images[0] || "/images/menu/drinks/american.png",
              link: `/menu/${category.id}/${sub.id}/${item.id}`,
            });
          }
        }
        if (featured.length >= 4) break;
      }
      if (featured.length >= 4) break;
    }

    // Fallback to first 4 available items if not enough featured
    if (featured.length < 4) {
      for (const category of categories) {
        if (category.comingSoon) continue;
        
        for (const sub of category.subCategories) {
          for (const item of sub.items) {
            if (item.available && !featured.some(f => f.link.includes(item.id))) {
              featured.push({
                name: item.name,
                image: item.images[0] || "/images/menu/drinks/american.png",
                link: `/menu/${category.id}/${sub.id}/${item.id}`,
              });
              if (featured.length >= 4) break;
            }
          }
          if (featured.length >= 4) break;
        }
        if (featured.length >= 4) break;
      }
    }

    return featured;
  };

  const products = getFeaturedItems();

  useEffect(() => {
    if (products.length === 0) return;

    // Set initial state - scale down to 0
    gsap.set([...productRefs.current, buttonRef.current], {
      scale: 0,
      opacity: 0,
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: productRefs.current[0],
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none",
      },
    });

    // Animate products in sequence
    tl.to(productRefs.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)",
      stagger: 0.2,
    })
      // Animate button last
      .to(
        buttonRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.4",
      );
  }, [products.length]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-elite-cream py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-5xl md:text-6xl lg:text-7xl mb-6">
          Loved by Locals
        </h2>

        {/* Subtext */}
        <p className="text-elite-black font-cabin text-xl md:text-2xl mb-16 max-w-2xl mx-auto">
          Local go-to's everyone loves — handpicked and always fresh.
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {products.map((product, index) => (
            <Link
              key={index}
              href={product.link}
              className="group cursor-pointer flex flex-col items-center"
              ref={(el) => {
                productRefs.current[index] = el;
              }}
            >
              <div className="bg-elite-burgundy rounded-3xl  transition-transform group-hover:scale-105 mb-4 relative overflow-hidden">
                <div className="aspect-square overflow-hidden rounded-2xl flex items-end">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-bottom"
                  />
                </div>
              </div>
              <div className="text-center w-full">
                <h3 className="font-calistoga text-elite-black text-2xl">
                  {product.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Explore Menu Button */}
        <Link href="/menu">
          <button
            ref={buttonRef}
            className="bg-elite-burgundy text-elite-white px-6 py-3 rounded-full font-cabin text-base font-semibold hover:opacity-90 transition-opacity"
          >
            Explore Menu
          </button>
        </Link>
      </div>
    </section>
  );
}
