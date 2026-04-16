import { Request, Response } from "express";
import { fail } from "../utils/http";

export const notFoundMiddleware = (_req: Request, res: Response) => {
  return res.status(404).json(fail("Route not found"));
};
