import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Ensures API routes always return valid JSON, even for unexpected errors,
// and surfaces specific, actionable reasons for common Prisma failures
// (e.g. migration not run yet) instead of a generic message.
export function handleApiError(err: unknown) {
  console.error("API error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") {
      return NextResponse.json(
        { error: "Database tables not found. Run: npx prisma migrate dev --name init" },
        { status: 500 }
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "That record already exists." }, { status: 400 });
    }
    if (err.code === "P2003") {
      return NextResponse.json(
        { error: "Your session is out of date (the database may have been reset). Please log out and log back in." },
        { status: 401 }
      );
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: "Could not connect to the database. Check DATABASE_URL in your .env file." },
      { status: 500 }
    );
  }

  const message = err instanceof Error ? err.message : "Unknown error.";
  return NextResponse.json({ error: `Something went wrong: ${message}` }, { status: 500 });
}
