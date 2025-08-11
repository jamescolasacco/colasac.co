import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC = path.join(process.cwd(), "public");

export async function listPublic(dir: string, exts: string[]) {
  const folder = path.join(PUBLIC, dir);
  try {
    const items = await fs.readdir(folder);
    return items
      .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
      .sort((a, b) => a.localeCompare(b));
  } catch (e) {
    // folder might not exist yet; return empty list
    return [] as string[];
  }
}