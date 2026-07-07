import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { nextMonthlyOccurrence } from "../utils/dates";
import { resolveCategoryId } from "./transaction.service";

type CreateRecurringInput = {
  userId: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  isFixed?: boolean;
  category: string;
  method: string;
  /** First occurrence date; also defines the target day of month. */
  firstDate: Date;
  endDate?: Date;
};

const withCategoryName = <T extends { category: { name: string } | null }>(rec: T) => ({
  ...rec,
  category: rec.category?.name || ""
});

export const createRecurringTransaction = async (input: CreateRecurringInput) => {
  const categoryId = input.category ? await resolveCategoryId(input.category) : null;

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId: input.userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      isFixed: input.isFixed ?? true,
      categoryId,
      method: input.method,
      dayOfMonth: input.firstDate.getUTCDate(),
      nextRunDate: input.firstDate,
      endDate: input.endDate ?? null
    },
    include: { category: true }
  });

  return withCategoryName(recurring);
};

export const getRecurringByUserId = async (userId: string) => {
  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  return recurrences.map(withCategoryName);
};

export const setRecurringActive = async (id: string, userId: string, active: boolean) => {
  const recurring = await prisma.recurringTransaction.findFirst({ where: { id, userId } });

  if (!recurring) {
    throw new HttpError(404, "Recurring transaction not found");
  }

  // Reactivating skips periods missed while paused instead of backfilling them.
  const data: { active: boolean; nextRunDate?: Date } = { active };
  if (active && recurring.nextRunDate < new Date()) {
    let nextRun = recurring.nextRunDate;
    while (nextRun < new Date()) {
      nextRun = nextMonthlyOccurrence(nextRun, recurring.dayOfMonth);
    }
    data.nextRunDate = nextRun;
  }

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data,
    include: { category: true }
  });

  return withCategoryName(updated);
};

export const deleteRecurringTransaction = async (id: string, userId: string) => {
  const recurring = await prisma.recurringTransaction.findFirst({ where: { id, userId } });

  if (!recurring) {
    throw new HttpError(404, "Recurring transaction not found");
  }

  // Materialized transactions keep existing (recurringTransactionId is set null by the FK).
  await prisma.recurringTransaction.delete({ where: { id } });
};

/**
 * Creates the transactions for every occurrence that is due (nextRunDate <= now).
 * Each occurrence is claimed with a conditional update on nextRunDate before
 * inserting, so two concurrent requests can't materialize the same period twice.
 * Returns how many transactions were created.
 */
export const materializeDueRecurringTransactions = async (userId: string): Promise<number> => {
  const now = new Date();
  const due = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, nextRunDate: { lte: now } }
  });

  let created = 0;

  for (const recurring of due) {
    let occurrence = recurring.nextRunDate;

    while (occurrence <= now) {
      if (recurring.endDate && occurrence > recurring.endDate) {
        await prisma.recurringTransaction.updateMany({
          where: { id: recurring.id, active: true },
          data: { active: false }
        });
        break;
      }

      const following = nextMonthlyOccurrence(occurrence, recurring.dayOfMonth);
      const claimed = await prisma.recurringTransaction.updateMany({
        where: { id: recurring.id, nextRunDate: occurrence },
        data: { nextRunDate: following }
      });

      if (claimed.count === 0) {
        // Another request claimed this occurrence concurrently.
        break;
      }

      await prisma.transaction.create({
        data: {
          userId,
          title: recurring.title,
          amount: recurring.amount,
          type: recurring.type,
          isFixed: recurring.isFixed,
          categoryId: recurring.categoryId,
          method: recurring.method,
          date: occurrence,
          recurringTransactionId: recurring.id
        }
      });

      created += 1;
      occurrence = following;
    }
  }

  return created;
};

/** Cheap indexed check used to skip materialization work on cached reads. */
export const hasDueRecurrences = async (userId: string): Promise<boolean> => {
  const count = await prisma.recurringTransaction.count({
    where: { userId, active: true, nextRunDate: { lte: new Date() } }
  });

  return count > 0;
};
