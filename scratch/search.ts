import fs from "fs";
import path from "path";

const targetFile = "D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx";

const fileContent = fs.readFileSync(targetFile, "utf-8");
const lines = fileContent.split("\n");

console.log("Total lines:", lines.length);

const queries = ["submission", "question", "quizzes", "settings", "tab", "Quiz", "Leaderboard"];

queries.forEach((q) => {
  console.log(`--- Query: "${q}" ---`);
  let count = 0;
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(q.toLowerCase())) {
      count++;
      if (count <= 15) {
        console.log(`${idx + 1}: ${line.trim()}`);
      }
    }
  });
  console.log(`Total occurrences: ${count}`);
});
