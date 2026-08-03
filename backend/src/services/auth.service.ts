import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { env } from "../config/env";
import { signAuthToken } from "../utils/jwt";
import { issueRefreshToken } from "./refresh-token.service";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateProfileInput = {
  userId: string;
  name?: string;
  email?: string;
  creditCardClosingDay?: number | null;
};

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  creditCardClosingDay: true,
  createdAt: true,
  updatedAt: true
} as const;

const buildAuthSession = async (user: { id: string; name: string; email: string; creditCardClosingDay: number | null; createdAt: Date; updatedAt: Date }) => {
  const token = signAuthToken({
    sub: user.id,
    email: user.email
  });

  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      creditCardClosingDay: user.creditCardClosingDay,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    token,
    refreshToken
  };
};

export const registerUser = async ({ name, email, password }: RegisterInput) => {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new HttpError(409, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword
    }
  });

  return buildAuthSession(user);
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid credentials");
  }

  return buildAuthSession(user);
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};

export const updateUserProfile = async ({ userId, name, email, creditCardClosingDay }: UpdateProfileInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    throw new HttpError(404, "User not found");
  }

  let normalizedEmail: string | undefined;

  if (email) {
    normalizedEmail = email.toLowerCase();

    const emailOwner = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (emailOwner && emailOwner.id !== userId) {
      throw new HttpError(409, "Email already in use");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name ? { name } : {}),
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(creditCardClosingDay !== undefined ? { creditCardClosingDay } : {})
    },
    select: PUBLIC_USER_SELECT
  });

  return updatedUser;
};

export const getBalanceOffset = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceOffset: true }
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user.balanceOffset;
};

export const setBalanceOffset = async (userId: string, offset: number): Promise<number> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { balanceOffset: offset },
    select: { balanceOffset: true }
  });

  return user.balanceOffset;
};
