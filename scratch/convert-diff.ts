import fs from "fs";

const diffPath = "D:/Workspace/Projects/vloatty/client/diff.txt";
const outputPath = "D:/Workspace/Projects/vloatty/client/diff-utf8.patch";

const content = fs.readFileSync(diffPath, "utf-16le");
// Remove any UTF-16 BOM if present
const cleanContent = content.replace(/^\uFEFF/, "");
fs.writeFileSync(outputPath, cleanContent, "utf-8");
console.log("Converted diff.txt to UTF-8 patch file.");
