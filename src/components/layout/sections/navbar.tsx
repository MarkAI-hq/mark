"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Link from "next/link";

import {
  Sheet, SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "../theme-toggle";

interface RouteProps {
  href: string;
  label: string;
}

interface FeatureProps {
  title: string;
  description: string;
  href: string;
}

const routeList: RouteProps[] = [
  {
    href: "mailto:info@xrefracted.com ?subject=Mark%20AI",
    label: "Demo",
  },
  {
    href: "/signup",
    label: "Start for free",
  },
  {
    href: "/login",
    label: "Login",
  },
   {
    href: "#faq",
    label: "FAQ",
  },
];

const featureList: FeatureProps[] = [];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="shadow-inner bg-opacity-15  w-[90%] md:w-[70%] lg:w-[75%] lg:max-w-screen-xl top-5 mx-auto sticky border border-secondary z-40 rounded-2xl flex justify-between items-center p-2 bg-card mx-auto">
      <Link href="/" className="font-bold text-lg flex items-center">
        <Image
          src="/assets/images/markWhiteBg.png"
          alt="Mark AI Logo"
          width={150}
          height={50}
          priority
          className="dark:invert"
        />
      </Link>

      {/* Mobile */}
      <div className="flex items-center lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Menu
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer lg:hidden"
            />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-secondary "
          >
            <div>
              <SheetHeader className="mb-4 ml-4">
                <SheetTitle className="flex items-center">
                  <Image
                    src="/assets/images/markWhiteBg.png"
                    alt="Mark AI Logo"
                    width={150}
                    height={50}
                    priority
                    className="dark:invert"
                  />
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {routeList.map(({ href, label }) => (
                  <Button
                    key={href}
                    onClick={() => setIsOpen(false)}
                    asChild
                    variant="ghost"
                    className="justify-start text-base hover:bg-[#926C15] hover:text-white"
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-col justify-start items-start">
              <Separator className="mb-2" />
              <ThemeToggle />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <NavigationMenu className="hidden lg:block mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuContent>
              <div className="grid w-[600px] grid-cols-2 gap-5 p-4">
                <ul className="flex flex-col gap-2">
                  {featureList.map(({ title, description }) => (
                    <li
                      key={title}
                      className="rounded-md p-3 text-sm hover:bg-muted"
                    >
                      <p className="mb-1 font-semibold leading-none text-foreground">
                        {title}
                      </p>
                      <p className="line-clamp-2 text-muted-foreground">
                        {description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            {routeList.map(({ href, label }) => (
              <NavigationMenuLink key={href} asChild>
                <Link href={href} className="text-base px-2 hover:bg-[#926C15] hover:text-white hover:rounded-md py-1">
                  {label}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="hidden lg:flex">
        <ThemeToggle />
      </div>
    </header>
  );
};