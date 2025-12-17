import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const snapshot = await prisma.snapshot.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        httpStatus: true,
        contentType: true,
        html: true,
        textExtract: true,
        sourceType: true,
        fetchedAt: true,
        candidateId: true,
        candidateName: true,
        headers: true,
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("[API /api/snapshots/[id]] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
