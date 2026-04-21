import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "../src/lib/db/prisma";

async function upsertUser(input: {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });
}

async function main() {
  await upsertUser({
    email: "admin@local",
    name: "控制台管理员",
    role: UserRole.admin,
    password: "Console#2026",
  });

  await upsertUser({
    email: "maintainer@local",
    name: "执行维护者",
    role: UserRole.maintainer,
    password: "Console#2026",
  });

  await upsertUser({
    email: "viewer@local",
    name: "只读观察者",
    role: UserRole.viewer,
    password: "Console#2026",
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
