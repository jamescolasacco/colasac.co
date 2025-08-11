import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC = path.join(process.cwd(), "public");

export async function listPublic(dir: string, exts: string[]) {
  const folder = path.join(PUBLIC, dir);
  try {
    const items = await fs.readdir(folder);
    return items
      .filter((f) => exts.some((ext) => f.toLowerCase().endsWith(ext)))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    // folder might not exist yet; return empty list
    return [];
  }
}
