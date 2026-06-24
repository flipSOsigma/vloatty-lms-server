import fs from "fs";
import path from "path";

const targetFile = "D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx";

const fileContent = fs.readFileSync(targetFile, "utf-8");
const lines = fileContent.split("\n");

console.log("Lines containing quizTab:");
lines.forEach((line, idx) => {
  if (line.includes("quizTab")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
