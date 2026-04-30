import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_SEED_PASSWORD;
  const username = process.env.ADMIN_SEED_USERNAME?.trim() || "admin";
  const firstName = process.env.ADMIN_SEED_FIRST_NAME?.trim() || "Admin";
  const lastName = process.env.ADMIN_SEED_LAST_NAME?.trim() || "User";

  if (!email || !password) {
    console.info("Skip seed: set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to create a dev admin user.");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("Refusing to run admin seed in production. Promote a user via SQL or a one-off script.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const usernameNormalized = normalizeUsername(username);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      username,
      usernameNormalized,
      firstName,
      lastName,
      role: UserRole.admin,
      isVerified: true,
    },
    update: {
      passwordHash,
      role: UserRole.admin,
    },
  });

  console.info(`Seeded admin user: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
