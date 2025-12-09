import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add an event listener for the connect event
prisma.$on("connect", () => {
  console.log("Connected to the database");
});

export default prisma;
