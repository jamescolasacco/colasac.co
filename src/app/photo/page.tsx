// src/app/photo/page.tsx
import fs from "node:fs/promises";
import path from "node:path";
import PhotoGallery from "@/components/photo-gallery";

export const dynamic = "force-static";

const exts = /\.(jpe?g|png|webp|avif)$/i;

async function takenMs(absPath: string): Promise<number> {
  // try EXIF date first
  try {
    const { parse } = (await import("exifr")) as {
      parse: (buf: Buffer, opts?: { pick?: ("DateTimeOriginal" | "CreateDate")[] }) => Promise<unknown>;
    };
    const buf = await fs.readFile(absPath);
    const raw = (await parse(buf, { pick: ["DateTimeOriginal", "CreateDate"] })) as Record<string, unknown>;
    const dt =
      (raw.DateTimeOriginal instanceof Date ? raw.DateTimeOriginal : undefined) ||
      (raw.CreateDate instanceof Date ? raw.CreateDate : undefined);
    if (dt) return dt.getTime();
  } catch {
    // ignore and fall back below
  }
  // fallback: filesystem mtime
  try {
    const st = await fs.stat(absPath);
    return st.mtimeMs;
  } catch {
    return 0;
  }
}

export default async function PhotographyPage() {
  const photosDir = path.join(process.cwd(), "public", "photos");
  const thumbsDir = path.join(photosDir, "thumbs");

  let files = await fs.readdir(photosDir);
  files = files.filter((f) => !f.startsWith("thumbs") && exts.test(f));

  const withDates = await Promise.all(
    files.map(async (file) => ({
      file,
      when: await takenMs(path.join(photosDir, file)),
    }))
  );

  // newest first
  withDates.sort((a, b) => b.when - a.when);

  const images = await Promise.all(
    withDates.map(async ({ file }) => {
      const full = `/photos/${file}`;
      const thumbPath = path.join(thumbsDir, file);
      let thumb = full;
      try {
        await fs.stat(thumbPath);
        thumb = `/photos/thumbs/${file}`;
      } catch {}
      return { thumb, full };
    })
  );

  return (
    <main className="page-pad">
      <PhotoGallery images={images} />
    </main>
  );
}
