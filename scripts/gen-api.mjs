import { existsSync, readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";
import openapiTS, { astToString } from "openapi-typescript";

const source = new URL("../../backend/openapi.json", import.meta.url);
const target = new URL("../src/shared/api/schema.d.ts", import.meta.url);
const prefix = "/api/v1";

if (!existsSync(source)) {
  console.error(
    "../backend/openapi.json not found. The backend writes it with scripts/to_openapi.py.",
  );
  process.exit(1);
}

const spec = JSON.parse(readFileSync(source, "utf8"));
const paths = Object.fromEntries(
  Object.entries(spec.paths).map(([path, item]) => [
    path.startsWith(prefix) ? path.slice(prefix.length) : path,
    item,
  ]),
);
const ast = await openapiTS(
  { ...spec, paths },
  {
    transform(schemaObject) {
      if (schemaObject.contentMediaType === "application/octet-stream")
        return ts.factory.createTypeReferenceNode("Blob");
      return undefined;
    },
  },
);
writeFileSync(target, astToString(ast));
console.log("Wrote src/shared/api/schema.d.ts");
