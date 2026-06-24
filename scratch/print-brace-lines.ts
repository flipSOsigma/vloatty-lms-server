import fs from "fs";

const fileContent = fs.readFileSync("D:/Workspace/Projects/vloatty/client/app/dashboard/subject/[id]/lesson/[lessonId]/page.tsx", "utf-8");
const lines = fileContent.split("\n");

let openBraces = 0;
let openParens = 0;

lines.forEach((line, idx) => {
  const oldB = openBraces;
  const oldP = openParens;
  for (let char of line) {
    if (char === "{") openBraces++;
    if (char === "}") openBraces--;
    if (char === "(") openParens++;
    if (char === ")") openParens--;
  }
  
  if (idx >= 1950 && idx <= 2670) {
    if (openBraces !== oldB || openParens !== oldP) {
      console.log(`${idx + 1}: ${line.trim()} [Braces: ${openBraces}, Parens: ${openParens}]`);
    }
  }
});
