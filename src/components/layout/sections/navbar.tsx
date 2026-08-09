"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "../theme-toggle";
import { WHATSAPP_GROUP_URL } from "@/config/site-domains";

type RouteItem = {
  href: string;
  label: string;
  cal?: boolean;
  external?: boolean;
  // Content links render as plain nav text; cta links render as buttons,
  // weighted the way Login / Get a demo / Start free trial usually are —
  // ghost (quietest) < outline < solid (heaviest, one per nav).
  cta?: "ghost" | "outline" | "solid";
  icon?: typeof GraduationCap;
};

// Order matters: ghost Login goes first so the two actual buttons (outline,
// solid) land next to each other at the end, Clay-style — not sandwiched
// apart by a plain text link in between.
// "Partner Portal" on intel.mirror.education points at the main /login (this
// site pitches *schools*, so there's no separate student account to log
// into) — swapped below for "Student Portal" -> /student/login on
// mirror.education, where the audience actually is students.
const baseRouteList: RouteItem[] = [
  { href: "/program", label: "The Program" },
  { href: "/founders-academy", label: "Founders Academy" },
  { href: "/schools", label: "Explore Schools" },
  { href: "/login", label: "Login", cta: "ghost" },
  { href: "/login", label: "Partner Portal", cta: "outline", icon: GraduationCap },
  { href: "/schools/register", label: "Start for free", cta: "solid" },
];

const calAttrs = {
  "data-cal-link": "tusii-mirror/30min",
  "data-cal-namespace": "30min",
  "data-cal-config": '{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}',
};

// Clay's button language: the secondary action is a flat, borderless
// soft-fill (not an outline) — only the primary gets a strong solid fill.
const ctaClasses: Record<NonNullable<RouteItem["cta"]>, string> = {
  // Extra right margin so Login reads as its own thing, separate from the
  // outline+solid button pair that follows it directly (gap-1 between them).
  ghost:
    "mr-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-[#926C15] transition-colors",
  outline:
    "inline-flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-[#926C15]/10 hover:text-[#926C15]",
  solid:
    "inline-flex items-center gap-1.5 rounded-xl bg-[#926C15] px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-[#926C15]/30 transition-all duration-200 hover:bg-[#7A5A10] hover:-translate-y-0.5",
};

// On the flagship school's own site: "Start for free" pitches other schools to
// join the Mirror Intelligence platform, "The Program" is redundant with the
// homepage it already links to, and "Login" becomes "Apply" — the join wizard
// it points to already has its own "Already have an account? Sign in" fallback
// (src/app/student/join/_components/join-client.tsx), so a separate login link
// in the nav would just duplicate that.
export const Navbar = ({ isSchoolSite = false }: { isSchoolSite?: boolean }) => {
  // Apply goes to the school directory, not a hardcoded school code — mirror.education
  // isn't just the Uganda flagship, it'll host Kenya, Rwanda, etc. too, and students
  // need to pick their own country/school before applying to that one specifically.
  const routeList = isSchoolSite
    ? [
        ...baseRouteList
          .filter((route) => !["/schools/register", "/program", "/schools"].includes(route.href))
          .map((route) => {
            // Both the ghost Login link and the outline Partner Portal
            // button point at "/login" on the base list — distinguish by
            // `icon` (only Partner Portal has one), not href, now that
            // they share a destination on intel.mirror.education.
            if (route.icon) return { ...route, href: "/student/login", label: "Student Portal" };
            if (route.href === "/login") return { href: "/schools", label: "Apply", cta: "solid" as const };
            return route;
          }),
        { href: WHATSAPP_GROUP_URL, label: "Contact Us", external: true },
      ]
    : baseRouteList;

  const contentRoutes = routeList.filter((r) => !r.cta);
  const ctaRoutes = routeList.filter((r) => r.cta);

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-5 mx-auto z-40 flex items-center justify-between px-3 py-2 transition-all duration-300",
        // Same box every section below uses (max-w-6xl, 2rem of total side
        // margin) instead of a viewport-percentage width — otherwise the
        // pill's edges drift out of alignment with the content underneath
        // as the viewport resizes, since percentage and max-width+margin
        // don't scale the same way.
        "w-[calc(100%-2rem)] max-w-6xl",
        "rounded-2xl",
        // Clay's nav is a crisp, fully opaque bar — not a translucent/blurred
        // glass pill — so it reads the same whether it's sitting over a
        // photo hero or a plain background further down the page.
        scrolled
          ? "border border-[#926C15]/20 bg-card shadow-md shadow-black/5"
          : "border border-border bg-card shadow-sm"
      )}
    >
      <Link href="/" className="flex items-center">
        <Image
          src="/assets/images/markWhiteBg.png"
          alt="Mirror Intelligence"
          width={130}
          height={42}
          priority
          className="dark:invert"
        />
      </Link>

      {/* Mobile */}
      <div className="flex items-center md:!hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-border"
          >
            <div>
              <SheetHeader className="mb-6 ml-4">
                <SheetTitle className="flex items-center">
                  <Image
                    src="/assets/images/markWhiteBg.png"
                    alt="Mirror Intelligence"
                    width={130}
                    height={42}
                    priority
                    className="dark:invert"
                  />
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-1 px-1">
                {contentRoutes.map(({ href, label, cal, external }) =>
                  cal ? (
                    <button
                      key={label}
                      {...calAttrs}
                      onClick={() => setIsOpen(false)}
                      className="justify-start w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-[#926C15] hover:bg-[#926C15]/8"
                    >
                      {label}
                    </button>
                  ) : (
                    <Button
                      key={href}
                      onClick={() => setIsOpen(false)}
                      asChild
                      variant="ghost"
                      className="justify-start text-sm font-medium text-muted-foreground hover:text-[#926C15] hover:bg-[#926C15]/8"
                    >
                      {external ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                      ) : (
                        <Link href={href}>{label}</Link>
                      )}
                    </Button>
                  )
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-2 px-1">
                {ctaRoutes.map(({ href, label, cta, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={cn("justify-center", ctaClasses[cta!])}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-col justify-start items-start">
              <Separator className="mb-3" />
              <ThemeToggle />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <nav className="hidden md:flex items-center gap-0.5">
        {contentRoutes.map(({ href, label, cal, external }) =>
          cal ? (
            <button
              key={label}
              {...calAttrs}
              className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all duration-200 hover:bg-[#926C15]/8 hover:text-[#926C15] lg:px-3.5"
            >
              {label}
            </button>
          ) : external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all duration-200 hover:bg-[#926C15]/8 hover:text-[#926C15] lg:px-3.5"
            >
              {label}
            </a>
          ) : (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all duration-200 hover:bg-[#926C15]/8 hover:text-[#926C15] lg:px-3.5"
            >
              {label}
            </Link>
          )
        )}
      </nav>

      <div className="hidden md:flex items-center gap-1.5">
        {ctaRoutes.map(({ href, label, cta, icon: Icon }) => (
          <Link key={href} href={href} className={cn("whitespace-nowrap", ctaClasses[cta!])}>
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </Link>
        ))}
        <ThemeToggle />
      </div>
    </header>
  );
};
