import { Router, type Request, type Response } from "express";
import { requireUserId } from "../utils/request";
import {
  getCategoriesByUserId,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

export const categoryRoutes = Router();

/** GET /categories */
categoryRoutes.get("/", async (req: Request, res: Response) => {
  const categories = await getCategoriesByUserId(requireUserId(req));
  return res.json(categories);
});

/** POST /categories */
categoryRoutes.post("/", async (req: Request, res: Response) => {
  const { name, icon, color } = req.body;

  if (!name || !icon || !color) {
    return res.status(400).json({ error: "Campos obrigatórios: name, icon, color" });
  }

  const cat = await createCategory({ userId: requireUserId(req), name, icon, color });
  return res.status(201).json(cat);
});

/** PATCH /categories/:id */
categoryRoutes.patch("/:id", async (req: Request, res: Response) => {
  const { name, icon, color } = req.body;

  const cat = await updateCategory(req.params.id as string, requireUserId(req), {
    ...(name ? { name } : {}),
    ...(icon ? { icon } : {}),
    ...(color ? { color } : {}),
  });
  return res.json(cat);
});

/** DELETE /categories/:id */
categoryRoutes.delete("/:id", async (req: Request, res: Response) => {
  const result = await deleteCategory(req.params.id as string, requireUserId(req));
  return res.json(result);
});
