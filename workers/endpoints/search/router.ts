import { Hono } from "hono";
import { getSearch } from "./getSearch";

export const searchRouter = new Hono<{ Bindings: Env }>();

searchRouter.get("/", getSearch);