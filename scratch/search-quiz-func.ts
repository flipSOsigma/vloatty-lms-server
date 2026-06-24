import fs from "fs";
import path from "path";

const targetFile = "D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx";

const fileContent = fs.readFileSync(targetFile, "utf-8");
const lines = fileContent.split("\n");

let startIdx = 0;
lines.forEach((line, idx) => {
  if (line.includes("handleAutoCreateQuiz =") || line.includes("function handleAutoCreateQuiz")) {
    startIdx = idx;
  }
});

console.log("Lines around handleAutoCreateQuiz definition (starting at line " + (startIdx - 5) + "):");
for (let i = startIdx - 5; i <= startIdx + 50; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
