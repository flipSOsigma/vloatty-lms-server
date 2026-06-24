import fs from "fs";

const diffPath = "D:/Workspace/Projects/vloatty/client/diff.txt";
const content = fs.readFileSync(diffPath, "utf-16le");
console.log(content);
