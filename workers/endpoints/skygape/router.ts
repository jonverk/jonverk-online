import { Hono } from "hono";
import { getVaultDocuments } from "./getVaultDocuments";
import { postVaultDocument } from "./postVaultDocument";
import { getTasks } from "./getTasks";
import { postTask } from "./postTask";
import { getBoards } from "./getBoards";
import { postBoard } from "./postBoard";
import { getAuditStream } from "./getAuditStream";
import { postAuditStream } from "./postAuditStream";
import { agentChatRouter } from "./agentChatRouter";

export const skygapeRouter = new Hono<{ Bindings: Env }>();

skygapeRouter.get("/vault", getVaultDocuments);
skygapeRouter.post("/vault", postVaultDocument);

skygapeRouter.get("/tasks", getTasks);
skygapeRouter.post("/tasks", postTask);

skygapeRouter.get("/boards", getBoards);
skygapeRouter.post("/boards", postBoard);

skygapeRouter.get("/audit", getAuditStream);
skygapeRouter.post("/audit", postAuditStream);

skygapeRouter.route("/agent-chat", agentChatRouter);
