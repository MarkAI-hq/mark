"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const defaultImageUrl = "/assets/images/dashWhite.jpg";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const imageUrl =
    theme === "light"
      ? "/assets/images/dashWhite.jpg"
      : theme === "dark"
      ? "/assets/images/dashDark.jpg"
      : defaultImageUrl; // Use default if theme is neither light nor dark
      
  const placeholderSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // Tiny transparent placeholder

  return (
    <section className="container w-full mx-auto">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8 px-3">
          <Badge variant="outline" className="text-sm py-2 px-3">
            <span className="mr-2 text-primary">
              <Badge>Mark AI</Badge>
            </span>
            <span className="text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text"> The future of learning is here! </span>
          </Badge>
          <div className="max-w-4xl mx-auto text-center text-2xl md:text-5xl sm:text-4xl font-bold px-2">
            <h1>
              Unlock teaching potential with
              <span className="text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text">
                the world&apos;s most complete AI platform
              </span>
              for personalized learning.
            </h1>
          </div>
          <p className="max-w-4xl mx-auto text-base sm:text-lg md:text-2xl text-muted-foreground px-4 leading-tight text-balance">
            MarkAI uniquely combines advanced AI with educational psychology and teacher expertise to deliver instant personalized learning intelligence for students and real-time actionable teaching insights helping schools improve test scores by 10% annually at scale.
          </p>
          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Button className="font-bold group/arrow">
              <Link href="/register">
                Start for free
              </Link>
              <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
            </Button>

            <Button
              asChild
              variant="secondary"
              className="w-4/6 md:w-1/4 font-bold hover:bg-[#926C15] hover:text-white"
            >
              <Link
                href="mailto:info@xrefracted.com?subject=Mark AI"
                target="_blank"
              >
                Get a demo
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative group mt-14 px-2">
          <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-[#926C15]/50 rounded-full blur-3xl"></div>

          <Image
            src={imageUrl}
            alt="dashboard"
            width={isMobile ? 383 : 767}
            height={isMobile ? 600 : 1200}
            className="w-full md:w-[1000px] mx-auto rounded-lg relative rounded-lg leading-none flex items-center border border-t-2 border-secondary border-t-[#926C15]/30"
            placeholder={placeholderSrc}
          />

          <div className="absolute bottom-0 left-0 w-full h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg"></div>
        </div>
      </div>
    </section>
  );
};