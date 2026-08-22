import { Hono } from "hono";
import { ListWikiPages, GetWikiPage } from "./endpoints";
import { fromHono } from "chanfana";

const app = new Hono<{ Bindings: Env }>();

export const wikiRouter = fromHono(app);

wikiRouter.get("/", ListWikiPages);
wikiRouter.get("/:id", GetWikiPage);
