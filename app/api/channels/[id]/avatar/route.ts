import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 2_500_000; // 2.5 MB after decoding

function looksLikeAllowedImage(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png") {
    return (
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
    );
  }
  if (mime === "image/webp") {
    return (
      buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

/** Serves the uploaded avatar image for a channel owned by the signed-in user. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const channel = await prisma.channel.findFirst({
    where: { id, userId: user.id },
    select: { avatarImage: true, avatarImageMime: true, updatedAt: true },
  });

  if (!channel?.avatarImage || !channel.avatarImageMime) {
    return NextResponse.json({ error: "No avatar uploaded." }, { status: 404 });
  }

  const bytes = new Uint8Array(channel.avatarImage);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": channel.avatarImageMime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Stores one uploaded avatar image, reused for every future video. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const mime = typeof body.mime === "string" ? body.mime.toLowerCase() : "";

  if (!imageBase64 || !mime) {
    return NextResponse.json({ error: "imageBase64 and mime are required." }, { status: 400 });
  }
  if (!ALLOWED_MIME[mime]) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
      { status: 400 }
    );
  }

  // Strip an optional data-URL prefix before decoding.
  const base64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return NextResponse.json({ error: "The image data is not valid." }, { status: 400 });
  }

  if (buffer.length === 0) {
    return NextResponse.json({ error: "The image data is empty." }, { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Please use one under 2.5 MB." },
      { status: 400 }
    );
  }
  if (!looksLikeAllowedImage(buffer, mime)) {
    return NextResponse.json(
      { error: "The file content does not match its image type." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const channel = await prisma.channel.findFirst({
    where: { id, userId: user.id },
    select: { id: true, title: true },
  });
  if (!channel) {
    return NextResponse.json(
      { error: "Channel not found or does not belong to your account." },
      { status: 404 }
    );
  }

  await prisma.channel.update({
    where: { id: channel.id },
    data: {
      avatarImage: buffer,
      avatarImageMime: mime,
      requiresAvatar: true,
    },
  });

  await writeAuditLog({
    action: "channel.avatar_uploaded",
    actorId: user.id,
    targetUserId: user.id,
    metadata: { channelId: channel.id, mime, bytes: buffer.length },
  }).catch(() => {});

  return NextResponse.json({ ok: true, hasAvatar: true });
}
