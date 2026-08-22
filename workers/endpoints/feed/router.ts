import { Hono } from "hono";
import { getFeed } from "./getFeed";
import { postFeed } from "./postFeed";

export const feedRouter = new Hono<{ Bindings: Env }>();

feedRouter.get("/", getFeed);
feedRouter.post("/", postFeed);
