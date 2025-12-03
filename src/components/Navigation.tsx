"use client";

import { useState, useEffect } from "react";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
  const [showPromo, setShowPromo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const mobileMenuId = "mobile-nav-menu";

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle hash navigation when page loads
  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#location") {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        const locationElement = document.getElementById("location");
        if (locationElement) {
          locationElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Handle location navigation
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (pathname === "/") {
      // If already on home page, just scroll to location
      const locationElement = document.getElementById("location");
      if (locationElement) {
        locationElement.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If on another page, navigate to home and then scroll to location
      router.push("/#location");
    }
  };

  const isRouteActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/menu") return pathname.startsWith("/menu");
    if (href === "/orders") return pathname.startsWith("/orders");
    if (href === "/shop") return pathname.startsWith("/shop");
    if (href === "/rewards") return pathname.startsWith("/rewards");
    if (href === "/suggest") return pathname.startsWith("/suggest");
    return pathname === href;
  };

  const baseDesktopLink =
    "px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:bg-elite-burgundy hover:text-elite-cream hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-elite-burgundy";
  const activeDesktopLink =
    "bg-elite-burgundy text-elite-cream border-elite-burgundy/40 shadow-xl";
  const inactiveDesktopLink = "text-elite-black";

  const baseMobileLink =
    "bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-elite-burgundy";
  const activeMobileLink =
    "bg-elite-burgundy text-elite-cream shadow-lg";

  return (
    <>
      {/* Promotion Banner */}
      {showPromo && (
        <div className="bg-elite-cream text-elite-black text-center py-4 px-6 relative animate-in slide-in-from-top duration-500">
          <p className="font-cabin text-base font-semibold tracking-wide">
            Buy one coffee, get one free — this week only (April 14-20)
          </p>
          <button
            onClick={() => setShowPromo(false)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-elite-black hover:opacity-70 transition-all duration-300 hover:scale-110"
            aria-label="Dismiss promotion"
            title="Dismiss promotion"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? "" : ""
        }`}
        aria-label="Primary"
      >
        {/* Desktop Navigation */}
        <div className="hidden md:block transition-all duration-500 ease-in-out">
          <div
            className={`max-w-7xl mx-auto flex items-center justify-center transition-all duration-500 ease-in-out ${
              isScrolled ? "py-3 px-6" : "py-8 px-8"
            }`}
          >
            {/* Pilled Navigation Container */}
            <div
              className={`bg-elite-cream rounded-full flex items-center space-x-10 shadow-2xl transition-all duration-500 ease-in-out ${
                isScrolled ? "px-10 py-4" : "px-16 py-6"
              }`}
            >
              <Link
                href="/menu"
                className={`${baseDesktopLink} ${
                  isRouteActive("/menu")
                    ? activeDesktopLink
                    : inactiveDesktopLink
                }`}
                aria-current={isRouteActive("/menu") ? "page" : undefined}
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Menu
                </span>
              </Link>
              <a
                href="#location"
                onClick={handleLocationClick}
                className={`${baseDesktopLink} ${inactiveDesktopLink}`}
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Location
                </span>
              </a>

              {/* Center Logo */}
              <Link
                href="/"
                className={`rounded-lg flex items-center justify-center px-10 transition-all duration-500 ease-in-out hover:scale-105 ${
                  isScrolled ? "h-20 -my-3" : "h-32 -my-8"
                }`}
              >
                <img
                  src="/images/logo_noBG.png"
                  alt="Elite Coffee Logo - Navigate to Home"
                  className={`w-auto object-contain transition-all duration-500 ease-in-out ${
                    isScrolled ? "h-16" : "h-24"
                  }`}
                />
              </Link>

              <Link
                href="/order"
                className={`${baseDesktopLink} ${
                  isRouteActive("/order")
                    ? activeDesktopLink
                    : inactiveDesktopLink
                }`}
                aria-current={isRouteActive("/order") ? "page" : undefined}
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Order
                </span>
              </Link>
              <Link
                href="/orders"
                className={`${baseDesktopLink} ${
                  isRouteActive("/orders")
                    ? activeDesktopLink
                    : inactiveDesktopLink
                }`}
                aria-current={isRouteActive("/orders") ? "page" : undefined}
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Orders
                </span>
              </Link>
              <Link
                href="/rewards"
                className={`${baseDesktopLink} ${
                  isRouteActive("/rewards")
                    ? activeDesktopLink
                    : inactiveDesktopLink
                }`}
                aria-current={
                  isRouteActive("/rewards") ? "page" : undefined
                }
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Rewards
                </span>
              </Link>
              <Link
                href="/suggest"
                className={`${baseDesktopLink} ${
                  isRouteActive("/suggest")
                    ? activeDesktopLink
                    : inactiveDesktopLink
                } relative`}
                aria-current={
                  isRouteActive("/suggest") ? "page" : undefined
                }
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  AI Suggest
                </span>
              </Link>
              <Link
                href="/shop"
                className={`${baseDesktopLink} ${
                  isRouteActive("/shop")
                    ? activeDesktopLink
                    : inactiveDesktopLink
                } relative`}
                aria-current={isRouteActive("/shop") ? "page" : undefined}
              >
                <span
                  className={`transition-all duration-300 uppercase ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Shop
                </span>
                <span className="absolute -top-2 -right-2 bg-elite-burgundy text-elite-cream text-xs px-2 py-1 rounded-full font-bold">
                  Soon
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden bg-elite-cream transition-all duration-500 ease-in-out ${
            isScrolled ? "py-3 px-4" : "py-6 px-6"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className={`rounded-lg flex items-center justify-center px-4 transition-all duration-500 ease-in-out hover:scale-105 ${
                isScrolled ? "h-16 -my-2" : "h-20 -my-3"
              }`}
            >
              <img
                src="/images/logo_noBG.png"
                alt="Elite Coffee Logo - Navigate to Home"
                className={`w-auto object-contain transition-all duration-500 ease-in-out ${
                  isScrolled ? "h-12" : "h-16"
                }`}
              />
            </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`bg-elite-cream rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 border-2 border-elite-burgundy/20 ${
                isScrolled ? "w-10 h-10" : "w-12 h-12"
              }`}
              type="button"
              aria-controls={mobileMenuId}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileMenuOpen ? (
                <X
                  size={isScrolled ? 20 : 24}
                  className="text-elite-black transition-all duration-300"
                  aria-hidden="true"
                />
              ) : (
                <Menu
                  size={isScrolled ? 20 : 24}
                  className="text-elite-black transition-all duration-300"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-4 py-6 border-t border-elite-burgundy/20 bg-elite-cream rounded-lg mx-2">
              <div
                className="flex flex-col space-y-3 px-4"
                id={mobileMenuId}
                role="menu"
                aria-label="Mobile navigation"
              >
                <Link
                  href="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${baseMobileLink} ${
                    isRouteActive("/menu") ? activeMobileLink : ""
                  }`}
                  aria-current={
                    isRouteActive("/menu") ? "page" : undefined
                  }
                  role="menuitem"
                >
                  Menu
                </Link>
                <a
                  href="#location"
                  onClick={(e) => {
                    handleLocationClick(e);
                    setMobileMenuOpen(false);
                  }}
                  className={baseMobileLink}
                  role="menuitem"
                >
                  Location
                </a>
                <Link
                  href="/order"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${baseMobileLink} ${
                    isRouteActive("/order") ? activeMobileLink : ""
                  } relative`}
                  aria-current={
                    isRouteActive("/order") ? "page" : undefined
                  }
                  role="menuitem"
                >
                  Order
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${baseMobileLink} ${
                    isRouteActive("/orders") ? activeMobileLink : ""
                  } relative`}
                  aria-current={
                    isRouteActive("/orders") ? "page" : undefined
                  }
                  role="menuitem"
                >
                  Orders
                </Link>
                <Link
                  href="/rewards"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${baseMobileLink} ${
                    isRouteActive("/rewards") ? activeMobileLink : ""
                  } relative`}
                  aria-current={
                    isRouteActive("/rewards") ? "page" : undefined
                  }
                  role="menuitem"
                >
                  Rewards
                </Link>
                <Link
                  href="/suggest"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${baseMobileLink} ${
                    isRouteActive("/suggest") ? activeMobileLink : ""
                  } relative`}
                  aria-current={
                    isRouteActive("/suggest") ? "page" : undefined
                  }
                  role="menuitem"
                >
                  AI Suggest
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${baseMobileLink} ${
                    isRouteActive("/shop") ? activeMobileLink : ""
                  } relative`}
                  aria-current={
                    isRouteActive("/shop") ? "page" : undefined
                  }
                  role="menuitem"
                >
                  Shop
                  <span className="absolute -top-2 -right-2 bg-elite-burgundy text-elite-cream text-xs px-2 py-1 rounded-full font-bold">
                    Soon
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
