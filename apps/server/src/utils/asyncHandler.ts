// apps/server/src/utils/asyncHandler.ts
import type { Request, Response, NextFunction } from "express";

export function asyncHandler<
  H extends (req: Request, res: Response, next?: NextFunction) => any,
>(handler: H) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
