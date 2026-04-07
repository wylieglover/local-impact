import { type RequestHandler } from "express";
import { z } from "zod";

export const validate = ({
  body,
  params,
  query,
}: {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}): RequestHandler => {
  return (req, res, next) => {
    try {
      if (body) {
        res.locals.body = body.parse(req.body);
      }

      if (params) {
        res.locals.params = params.parse(req.params);
      }

      if (query) {
        res.locals.query = query.parse(req.query);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
