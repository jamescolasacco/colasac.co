import fs from "node:fs/promises";
import path from "node:path";
import PhotoGallery from "@/components/photo-gallery";

export const dynamic = "force-static";

export default async function PhotographyPage() {
  const photosDir = path.join(process.cwd(), "public", "photos");
  const thumbsDir = path.join(photosDir, "thumbs");

  let files = await fs.readdir(photosDir);
  // keep only images, drop thumbs folder
  files = files.filter((f) => !f.startsWith("thumbs/") && /\.(jpe?g|png|webp|avif)$/i.test(f));

  // get mtimes then sort desc (newest first)
  const withTimes = await Promise.all(
    files.map(async (f) => {
      const stat = await fs.stat(path.join(photosDir, f));
      return { file: f, mtime: stat.mtimeMs };
    })
  );
  withTimes.sort((a, b) => b.mtime - a.mtime);

  // build { thumb, full } with fallback
  const images = await Promise.all(
    withTimes.map(async ({ file }) => {
      try {
        await fs.stat(path.join(thumbsDir, file));
        return { thumb: `/photos/thumbs/${file}`, full: `/photos/${file}` };
      } catch {
        return { thumb: `/photos/${file}`, full: `/photos/${file}` };
      }
    })
  );

  return (
    <main className="page-pad">
      <PhotoGallery images={images} />
    </main>
  );
}
