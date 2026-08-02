/**
 * category.service.ts
 *
 * CRUD for user categories.
 * System categories (isSystem=true) can be renamed/recolored but NEVER deleted.
 */

import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getCategoriesByUserId = async (userId: string) => {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
};

export const getCategoryById = async (id: string, userId: string) => {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) throw new HttpError(404, "Category not found");
  return cat;
};

// ─── Mutations ────────────────────────────────────────────────────────────────

type CreateCategoryInput = {
  userId: string;
  name: string;
  icon: string;
  color: string;
};

export const createCategory = async (input: CreateCategoryInput) => {
  // Check uniqueness manually for a clean error message
  const existing = await prisma.category.findFirst({
    where: { userId: input.userId, name: input.name },
  });
  if (existing) {
    throw new HttpError(409, `Já existe uma categoria com o nome "${input.name}"`);
  }

  return prisma.category.create({
    data: {
      userId: input.userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      isSystem: false,
      isIncome: false,
    },
  });
};

type UpdateCategoryInput = {
  name?: string;
  icon?: string;
  color?: string;
};

export const updateCategory = async (id: string, userId: string, input: UpdateCategoryInput) => {
  const cat = await getCategoryById(id, userId);

  // Prevent renaming to an existing name
  if (input.name && input.name !== cat.name) {
    const conflict = await prisma.category.findFirst({
      where: { userId, name: input.name, id: { not: id } },
    });
    if (conflict) {
      throw new HttpError(409, `Já existe uma categoria com o nome "${input.name}"`);
    }
  }

  return prisma.category.update({
    where: { id },
    data: input,
  });
};

export const deleteCategory = async (id: string, userId: string) => {
  const cat = await getCategoryById(id, userId);

  if (cat.isSystem) {
    throw new HttpError(403, "Categorias do sistema não podem ser excluídas");
  }

  // Check if there are transactions using this category
  const txCount = await prisma.transaction.count({ where: { categoryId: id } });
  if (txCount > 0) {
    throw new HttpError(
      409,
      `Esta categoria tem ${txCount} transação(ões) vinculada(s). Reatribua-as antes de excluir.`
    );
  }

  await prisma.category.delete({ where: { id } });
  return { success: true };
};
