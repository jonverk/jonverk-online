import { Hono } from "hono";
import { ListTasks, CreateTask } from "./endpoints";
import { fromHono } from "chanfana";

const app = new Hono<{ Bindings: Env }>();

export const tasksRouter = fromHono(app);

tasksRouter.get("/", ListTasks);
tasksRouter.post("/", CreateTask);
