import { Request, Response, NextFunction } from "express";
import { ZodEffects, ZodError, ZodObject } from "zod";

export function validateData(
  schema: ZodEffects<ZodObject<any, any>> | ZodObject<any, any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${
            issue.path.join(".").charAt(0).toUpperCase() +
            issue.path.join(".").slice(1)
          } ${issue.message}`,
        }));
        res.status(400).json({ error: "Invalid data", details: errorMessages });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };
}
