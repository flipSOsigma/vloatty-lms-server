import fs from "fs";

const diffPath = "D:/Workspace/Projects/vloatty/client/diff.txt";
const content = fs.readFileSync(diffPath, "utf-16le");
const lines = content.split("\n");

let currentFile = "";
lines.forEach((line) => {
  if (line.startsWith("diff --git")) {
    currentFile = line;
  }
  if (line.startsWith("@@")) {
    console.log(line);
  }
  // Print modified lines in the quiz tab range
  if (line.startsWith("+") || line.startsWith("-")) {
    if (!line.startsWith("+++") && !line.startsWith("---")) {
      console.log(line);
    }
  }
});
