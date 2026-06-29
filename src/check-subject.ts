import "dotenv/config";
import prisma from "./config/prisma";

async function main() {
  const subject = await prisma.subject.findUnique({
    where: { id: "4f448129-a235-41ea-a9ad-bd5aff7425f0" },
    include: { creator: true }
  });
  console.log("Subject:", subject);
}

main().catch(console.error);
