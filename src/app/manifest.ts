import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meza · Kenyan meals, planned",
    short_name: "Meza",
    description: "A weekly plan of Kenyan meals with weighed portions, calories and a market list.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe4",
    theme_color: "#1d4532",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
