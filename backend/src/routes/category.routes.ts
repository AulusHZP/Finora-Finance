import { Router, type Request, type Response } from "express";
import { DEV_USER_ID } from "../config/constants";
import {
  getCategoriesByUserId,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

export const categoryRoutes = Router();

/** GET /categories */
categoryRoutes.get("/", async (_req: Request, res: Response) => {
  const categories = await getCategoriesByUserId(DEV_USER_ID);
  return res.json(categories);
});

/** POST /categories */
categoryRoutes.post("/", async (req: Request, res: Response) => {
  const { name, icon, color } = req.body;

  if (!name || !icon || !color) {
    return res.status(400).json({ error: "Campos obrigatórios: name, icon, color" });
  }

  const cat = await createCategory({ userId: DEV_USER_ID, name, icon, color });
  return res.status(201).json(cat);
});

/** PATCH /categories/:id */
categoryRoutes.patch("/:id", async (req: Request, res: Response) => {
  const { name, icon, color } = req.body;

  const cat = await updateCategory(req.params.id as string, DEV_USER_ID, {
    ...(name ? { name } : {}),
    ...(icon ? { icon } : {}),
    ...(color ? { color } : {}),
  });
  return res.json(cat);
});

/** DELETE /categories/:id */
categoryRoutes.delete("/:id", async (req: Request, res: Response) => {
  const result = await deleteCategory(req.params.id as string, DEV_USER_ID);
  return res.json(result);
});
