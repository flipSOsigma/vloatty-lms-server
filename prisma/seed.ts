import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL || "mysql://root:mysqldb@localhost:3306/lms_db";
const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = dbUrl.match(urlPattern);

let adapterConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "mysqldb",
  database: "lms_db"
};

if (match) {
  adapterConfig = {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
}

const adapter = new PrismaMariaDb(adapterConfig);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing records
  await prisma.lmsEvent.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.subjectSchedule.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();

  // Hash default password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 2. Read user.json
  const userPath = path.resolve(__dirname, "../../client/public/data/user.json");
  const userData = JSON.parse(fs.readFileSync(userPath, "utf-8"));
  
  const mainUser = await prisma.user.create({
    data: {
      id: userData.user.id,
      name: userData.user.name,
      email: userData.user.email,
      password: hashedPassword,
      premiumStatus: userData.user.premiumStatus,
      institution: userData.user.institution || "",
      avatar: userData.user.avatar || "",
    }
  });
  console.log(`Created main user: ${mainUser.name}`);

  // Create mock lecturer users as well to satisfy foreign keys / database completeness
  const lecturersMock = {
    "u_olivia_123": { name: "Dr. Olivia", email: "olivia@vloatty.edu" },
    "u_feynman_123": { name: "Prof. Richard Feynman", email: "feynman@vloatty.edu" },
    "u_curie_123": { name: "Dr. Marie Curie", email: "curie@vloatty.edu" },
    "u_pasteur_123": { name: "Dr. Louis Pasteur", email: "pasteur@vloatty.edu" },
    "u_shakespeare_123": { name: "Prof. William Shakespeare", email: "shakespeare@vloatty.edu" },
    "u_herodotus_123": { name: "Prof. Herodotus", email: "herodotus@vloatty.edu" },
    "u_galileo_123": { name: "Prof. Galileo Galilei", email: "galileo@vloatty.edu" },
    "u_turing_123": { name: "Dr. Alan Turing", email: "turing@vloatty.edu" }
  };

  for (const [id, value] of Object.entries(lecturersMock)) {
    await prisma.user.create({
      data: {
        id,
        name: value.name,
        email: value.email,
        password: hashedPassword,
        premiumStatus: "free",
        institution: "Vloatty University",
        avatar: ""
      }
    });
  }
  console.log("Seeded mock faculty users.");

  // 3. Read subjects.json
  const subjectsPath = path.resolve(__dirname, "../../client/public/data/subjects.json");
  const subjectsData = JSON.parse(fs.readFileSync(subjectsPath, "utf-8"));

  for (const sub of subjectsData) {
    const creatorId = sub.createdBy === mainUser.id ? mainUser.id : mainUser.id;

    const subject = await prisma.subject.create({
      data: {
        id: sub.id,
        name: sub.name,
        room: sub.room,
        color: sub.color,
        description: sub.description,
        creatorId: creatorId,
        createdAt: new Date(sub.createdAt),
        updatedAt: new Date(sub.updatedAt),
        deletedAt: sub.deletedAt ? new Date(sub.deletedAt) : null,
        lecturers: sub.lecturers ? {
          create: sub.lecturers.map((lec: any) => ({ userId: lec.userId }))
        } : undefined
      }
    });

    console.log(`Creating subject: ${subject.name}`);

    // Create schedules
    if (sub.schedules) {
      for (const sch of sub.schedules) {
        await prisma.subjectSchedule.create({
          data: {
            day: sch.day,
            startTime: sch.startTime,
            endTime: sch.endTime,
            room: sch.room,
            subjectId: subject.id
          }
        });
      }
    }

    // Create modules and lessons
    if (sub.modules) {
      for (const mod of sub.modules) {
        const module = await prisma.module.create({
          data: {
            id: mod.id,
            title: mod.title,
            desc: mod.desc,
            date: new Date(mod.date),
            subjectId: subject.id,
            createdAt: new Date(mod.createdAt || sub.createdAt),
            updatedAt: new Date(mod.updatedAt || sub.updatedAt),
            deletedAt: mod.deletedAt ? new Date(mod.deletedAt) : null,
          }
        });

        if (mod.lessons) {
          for (const les of mod.lessons) {
            await prisma.lesson.create({
              data: {
                id: les.id,
                title: les.title,
                desc: les.desc,
                homeworkFile: les.homeworkFile,
                openDate: new Date(les.openDate),
                closeDate: new Date(les.closeDate),
                closeType: les.closeType || "open",
                moduleId: module.id,
                createdAt: new Date(les.createdAt || mod.createdAt || sub.createdAt),
                updatedAt: new Date(les.updatedAt || mod.updatedAt || sub.updatedAt),
                deletedAt: les.deletedAt ? new Date(les.deletedAt) : null,
              }
            });
          }
        }
      }
    }
  }

  // 4. Derive/Seed LmsEvents from schedules
  const dayMap: { [key: string]: number } = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6
  };

  for (const sub of subjectsData) {
    if (sub.schedules) {
      for (let idx = 0; idx < sub.schedules.length; idx++) {
        const sch = sub.schedules[idx];
        await prisma.lmsEvent.create({
          data: {
            id: `${sub.id}-${sch.day}-${idx}`,
            title: sub.name,
            subtitle: sch.room || sub.room || "",
            timeStart: sch.startTime,
            timeEnd: sch.endTime,
            dayIndex: dayMap[sch.day] !== undefined ? dayMap[sch.day] : 0,
            color: sub.color || "cream",
            subjectId: sub.id,
            createdAt: new Date(sub.createdAt),
            updatedAt: new Date(sub.updatedAt),
            deletedAt: null
          }
        });
      }
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
