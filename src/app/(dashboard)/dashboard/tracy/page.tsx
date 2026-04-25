import TracyPage from "@/components/tracy/tracy-page";

// Place this file at:
// src/app/(dashboard)/tracy/page.tsx
//
// Tracy will then be accessible at /tracy inside the existing
// Mirror dashboard layout. No layout changes needed — Tracy
// renders its own full-height UI.

export const metadata = {
  title: "Tracy — Mirror Teaching Intelligence",
  description: "Your AI teaching assistant powered by Mirror",
};

export default function Tracy() {
  return <TracyPage />;
}