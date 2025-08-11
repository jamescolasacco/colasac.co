import path from "path";
import fs from "fs/promises";
import { listPublic } from "@/lib/fs-public";
import PhotoGallery from "@/components/photo-gallery";

export const dynamic = "force-static";

async function thumbExists(file: string) {
  try {
    const p = path.join(process.cwd(), "public", "photos", "thumbs", file);
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export default async function PhotographyPage() {
  // list originals in /public/photos (not the thumbs dir)
  const files = (await listPublic("photos", [".jpg", ".jpeg", ".png", ".webp", ".avif"]))
    .filter((f) => !f.startsWith("thumbs/"));

  // build { thumb, full } pairs, fallback to full if thumb missing
  const images = await Promise.all(
    files.map(async (f) => {
      const hasThumb = await thumbExists(f);
      return {
        thumb: hasThumb ? `/photos/thumbs/${f}` : `/photos/${f}`,
        full: `/photos/${f}`,
      };
    })
  );

  return (
    <main className="page-pad">
      <PhotoGallery images={images} />
    </main>
  );
}
