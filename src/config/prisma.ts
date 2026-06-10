import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

export default prisma;
