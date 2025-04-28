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
        <div className="text-center space-y-8">
          <Badge variant="outline" className="text-sm py-2">
            <span className="mr-2 text-primary">
              <Badge>New</Badge>
            </span>
            <span> The Teachers evaluation companion! </span>
          </Badge>

          <div className="max-w-screen-sm mx-auto text-center text-3xl md:text-5xl font-bold">
            <h1>
              Accelerated Assessments.
              <span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                Personalized Learning
              </span>
              In Minutes.
            </h1>
          </div>
          <p className="max-w-screen-sm mx-auto text-base sm:text-lg md:text-xl text-muted-foreground px-6">
            Mark AI helps teachers create and grade assignments in minutes and provide personalized feedback helping student&#39;s perform at their best.
          </p>
          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Button className="font-bold group/arrow">
              <Link href="/login">
                Start Grading Now
              </Link>
              <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
            </Button>

            <Button
              asChild
              variant="secondary"
              className="w-5/6 md:w-1/4 font-bold"
            >
              <Link
                href="mailto:info@xrefracted.com?subject=Mark AI"
                target="_blank"
              >
                Talk to Us
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative group mt-14">
          <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/50 rounded-full blur-3xl"></div>

          <Image
            src={imageUrl}
            alt="dashboard"
            width={isMobile ? 383 : 767}
            height={isMobile ? 600 : 1200}
            className="w-full md:w-[1000px] mx-auto rounded-lg relative rouded-lg leading-none flex items-center border border-t-2 border-secondary border-t-primary/30"
            placeholder={placeholderSrc}
          />

          <div className="absolute bottom-0 left-0 w-full h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg"></div>
        </div>
      </div>
    </section>
  );
};