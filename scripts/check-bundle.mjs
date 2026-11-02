import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbidden = [
  "mockServiceWorker",
  "example-password",
  "setupWorker",
  "Example Admin",
  "example-project",
];

function listFiles(folder) {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const offenders = listFiles("dist").filter((file) => {
  if (file.endsWith(".png") || file.endsWith(".woff2") || file.endsWith(".woff")) return false;
  const text = readFileSync(file, "utf8");
  return file.includes("mockServiceWorker") || forbidden.some((word) => text.includes(word));
});

if (offenders.length > 0) {
  console.error("Mock code found in the production bundle:\n" + offenders.join("\n"));
  process.exit(1);
}
console.log("Bundle check passed: no mock code in dist/");
