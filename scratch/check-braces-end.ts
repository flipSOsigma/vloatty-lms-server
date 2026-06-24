import fs from "fs";

const fileContent = fs.readFileSync("D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx", "utf-8");
const lines = fileContent.split("\n");

let openBraces = 0;
let openParens = 0;

lines.forEach((line, idx) => {
  for (let char of line) {
    if (char === "{") openBraces++;
    if (char === "}") openBraces--;
    if (char === "(") openParens++;
    if (char === ")") openParens--;
  }
});

console.log("At the end of the file:");
console.log("openBraces:", openBraces);
console.log("openParens:", openParens);
