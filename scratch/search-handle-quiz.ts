import fs from "fs";
const content = fs.readFileSync("D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx", "utf-8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("handleAutoCreateQuiz") || line.includes("generate-quiz")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
