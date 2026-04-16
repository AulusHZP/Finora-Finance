import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { signAuthToken } from "../utils/jwt";

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
};

export const registerUser = async ({ name, email, password }: RegisterInput) => {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    const err = new Error("Email already in use");
    (err as Error & { statusCode?: number }).statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword
    }
  });

  const token = signAuthToken({
    sub: user.id,
    email: user.email
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    token
  };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    const err = new Error("Invalid credentials");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const err = new Error("Invalid credentials");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  const token = signAuthToken({
    sub: user.id,
    email: user.email
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    token
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    const err = new Error("User not found");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }

  return user;
};

export const updateUserProfile = async ({ userId, name, email }: UpdateProfileInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    const err = new Error("User not found");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }

  let normalizedEmail: string | undefined;

  if (email) {
    normalizedEmail = email.toLowerCase();

    const emailOwner = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (emailOwner && emailOwner.id !== userId) {
      const err = new Error("Email already in use");
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name ? { name } : {}),
      ...(normalizedEmail ? { email: normalizedEmail } : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return updatedUser;
};
