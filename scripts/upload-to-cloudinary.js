const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env.local") });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PUBLIC_DIR = path.join(__dirname, "../public");
const MAP_FILE = path.join(__dirname, "../src/data/cloudinary-map.json");

let urlMap = {};
if (fs.existsSync(MAP_FILE)) {
  urlMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkDir(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function toPublicPath(absPath) {
  return "/" + path.relative(PUBLIC_DIR, absPath).replace(/\\/g, "/");
}

function resourceType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".mp4", ".webm", ".mov", ".avi"].includes(ext)) return "video";
  return "image";
}

const INCLUDE_DIRS = ["images", "videos", "local-products", "reviews"];
const INCLUDE_ROOT_EXTS = [".png", ".jpg", ".jpeg", ".mp4", ".webp"];

async function main() {
  const allFiles = [];
  for (const dir of INCLUDE_DIRS) {
    const dirPath = path.join(PUBLIC_DIR, dir);
    if (fs.existsSync(dirPath)) allFiles.push(...walkDir(dirPath));
  }
  for (const f of fs.readdirSync(PUBLIC_DIR)) {
    const ext = path.extname(f).toLowerCase();
    if (INCLUDE_ROOT_EXTS.includes(ext)) allFiles.push(path.join(PUBLIC_DIR, f));
  }

  console.log("Found " + allFiles.length + " files to upload.");
  let uploaded = 0, skipped = 0, failed = 0;

  for (const filePath of allFiles) {
    const publicPath = toPublicPath(filePath);
    if (urlMap[publicPath]) {
      console.log("SKIP: " + publicPath);
      skipped++;
      continue;
    }
    const withoutLeadingSlash = publicPath.replace(/^\//, "");
    const withoutExt = withoutLeadingSlash.replace(/\.[^/.]+$/, "");
    const publicId = "houseofginija/" + withoutExt;

    try {
      const type = resourceType(filePath);
      console.log("UPLOADING [" + type + "]: " + publicPath);
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        resource_type: type,
        overwrite: true,
        use_filename: false,
        unique_filename: false,
      });
      urlMap[publicPath] = result.secure_url;
      console.log("OK: " + result.secure_url);
      uploaded++;
      fs.writeFileSync(MAP_FILE, JSON.stringify(urlMap, null, 2));
    } catch (err) {
      console.error("FAIL: " + publicPath + " -- " + err.message);
      failed++;
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(urlMap, null, 2));
  console.log("\nDone. Uploaded:" + uploaded + " Skipped:" + skipped + " Failed:" + failed);
  console.log("Map saved to: " + MAP_FILE);
}

main().catch(console.error);
