const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "src", "renderer");
const dest = path.join(__dirname, "dist", "renderer");

fs.mkdirSync(dest, { recursive: true });

const entries = fs.readdirSync(src, { withFileTypes: true });

for (const entry of entries) {
  // Ignora los .ts y los .map (esos los genera tsc)
  if (entry.name.endsWith(".ts") || entry.name.endsWith(".map")) continue;

  const srcPath = path.join(src, entry.name);
  const destPath = path.join(dest, entry.name);

  if (entry.isDirectory()) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

console.log("✅ Assets copiados a dist/renderer (sin borrar los .js)");
