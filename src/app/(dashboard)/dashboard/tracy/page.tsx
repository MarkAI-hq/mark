// src/app/(dashboard)/tracy/page.tsx


import TracyPage from "@/components/tracy/tracy-page";

export const metadata = {
  title: "Tracy — Mirror Teaching Intelligence",
  description: "Your AI teaching assistant powered by Mirror",
};

interface Props {
  searchParams: Promise<{ prompt?: string }>;
}

export default async function Tracy({ searchParams }: Props) {
  const { prompt } = await searchParams;
  return <TracyPage initialPrompt={prompt} />;
}