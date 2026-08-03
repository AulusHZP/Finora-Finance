import crypto from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";
import { signAuthToken } from "../utils/jwt";

const DAY_MS = 24 * 60 * 60 * 1000;

// Only the sha256 hash is persisted — a database leak doesn't leak usable tokens.
const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const issueRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(48).toString("base64url");

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS)
    }
  });

  return token;
};

/**
 * Validates a refresh token and rotates it: the old token is revoked and a new
 * access + refresh pair is issued. Reuse of an already-revoked token is treated
 * as theft and revokes every active session of that user.
 */
export const rotateRefreshToken = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) }
  });

  if (!stored) {
    throw new HttpError(401, "Invalid refresh token");
  }

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    throw new HttpError(401, "Invalid refresh token");
  }

  if (stored.expiresAt < new Date()) {
    throw new HttpError(401, "Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });

  if (!user) {
    throw new HttpError(401, "Invalid refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() }
  });

  // Opportunistic cleanup of dead tokens so the table doesn't grow unbounded.
  await prisma.refreshToken.deleteMany({
    where: {
      userId: stored.userId,
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { lt: new Date(Date.now() - 7 * DAY_MS) } }
      ]
    }
  });

  const refreshToken = await issueRefreshToken(user.id);
  const accessToken = signAuthToken({ sub: user.id, email: user.email });

  return { token: accessToken, refreshToken };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() }
  });
};
