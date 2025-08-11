import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = "public/photos";
const outputDir = "public/photos/thumbs";

fs.mkdirSync(outputDir, { recursive: true });

for (const file of fs.readdirSync(inputDir)) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file);

  sharp(inputPath)
    .resize({ width: 800 })
    .toFile(outputPath)
    .then(() => console.log(`thumbnail created for ${file}`))
    .catch(console.error);
}