"use client";

import Link from "next/link";
import Image from "next/image";
import { getYear } from "date-fns";
import { TZDate } from '@date-fns/tz';

import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";



export const FooterSection = () => {
  const { theme } = useTheme();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const logoSrc = theme === "dark" ? "/assets/images/markBlackBg.png" : "/assets/images/markWhiteBg.png";

  return (
    <footer id="footer" className="container py-24 sm:py-32 center p-10 mx-auto">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <Link href="#" className="flex font-bold items-center">
              <Image
                src={logoSrc}
                alt="Mark AI Logo"
                width={120}
                height={50}
                priority
              />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Contact</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                info@xrefracted.com
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                +256-776-289-124
              </Link>
            </div>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Get a Demo
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Platforms</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                iOS
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Android
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Web
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Help</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Contact Us
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                FAQ
              </Link>
            </div>

            <div>
              <Link href="/assets/MarkPP.pdf" className="opacity-60 hover:opacity-100" target="_blank">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Socials</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Product Hunt
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Discord
              </Link>
            </div>

            <div>
              <Link href="www.linkedin.com/company/xrmark" className="opacity-60 hover:opacity-100" target="_blank">
                Linkedin
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <h3 className="text-center">&copy; {getYear(new TZDate(new Date(), tz))} xRefracted</h3>
      </div>
    </footer>
  );
};