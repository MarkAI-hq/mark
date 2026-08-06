"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
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

type RouteItem = { href: string; label: string; cal?: boolean; external?: boolean };
const baseRouteList: RouteItem[] = [
  // { href: "", label: "Demo", cal: true },
  { href: "/program", label: "The Program" },
  { href: "/schools", label: "Explore Schools" },
  { href: "/schools/register", label: "Start for free" },
  { href: "/student/login", label: "Student Portal" },
  { href: "/login", label: "Login" },
];

const calAttrs = {
  "data-cal-link": "tusii-mirror/30min",
  "data-cal-namespace": "30min",
  "data-cal-config": '{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}',
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
          .map((route) => (route.href === "/login" ? { href: "/schools", label: "Apply" } : route)),
        { href: WHATSAPP_GROUP_URL, label: "Contact Us", external: true },
      ]
    : baseRouteList;

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
        "w-[92%] md:w-[88%] lg:w-[76%] lg:max-w-screen-xl",
        "rounded-2xl",
        scrolled
          ? "border border-[#926C15]/20 bg-background/90 shadow-md shadow-black/5 backdrop-blur-xl"
          : "border border-border bg-card/80 backdrop-blur-sm"
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
                {routeList.map(({ href, label, cal, external }) =>
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
        {routeList.map(({ href, label, cal, external }) =>
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

      <div className="hidden md:flex">
        <ThemeToggle />
      </div>
    </header>
  );
};
