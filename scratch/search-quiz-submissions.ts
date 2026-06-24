import fs from "fs";
import path from "path";

const targetFile = "D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx";

const fileContent = fs.readFileSync(targetFile, "utf-8");
const lines = fileContent.split("\n");

console.log("Lines 2550 to 2712:");
for (let i = 2550; i <= 2712; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
