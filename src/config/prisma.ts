import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const dbUrl = process.env.DATABASE_URL || "mysql://root:mysqldb@127.0.0.1:3306/lms_db?allowPublicKeyRetrieval=true";
const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = dbUrl.match(urlPattern);

let adapterConfig = {
  host: "127.0.0.1",
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
    database: match[5].split("?")[0]
  };
}

const adapter = new PrismaMariaDb({
  ...adapterConfig,
  allowPublicKeyRetrieval: true
});
const prisma = new PrismaClient({ adapter });

export default prisma;
