import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class ListTasks extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "List Tasks",
		response: {
			"200": {
				description: "Returns a list of tasks",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: z.array(
								z.object({
									id: z.string(),
									title: z.string(),
									description: z.string().nullable(),
									status: z.string(),
									assignee: z.string().nullable(),
									created_at: z.string(),
									updated_at: z.string(),
								})
							),
						}),
					},
				},
			},
		},
	};

	async handle(c: any) {
		const db = c.env.DB as D1Database;
		const result = await db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();

		return c.json({
			success: true,
			result: result.results,
		});
	}
}

export class CreateTask extends OpenAPIRoute {
    schema = {
        tags: ["Tasks"],
        summary: "Create a Task",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string(),
                            description: z.string().optional(),
                            status: z.string().optional().default("backlog"),
                            assignee: z.string().optional()
                        })
                    }
                }
            }
        },
        response: {
            "200": {
                description: "Returns the created task",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.object({
                                id: z.string(),
                                title: z.string()
                            })
                        })
                    }
                }
            }
        }
    }

    async handle(c: any) {
        const db = c.env.DB as D1Database;
        const body = await this.getValidatedData<typeof this.schema>();
        const id = crypto.randomUUID();

        const data = await c.req.json();

        await db.prepare("INSERT INTO tasks (id, title, description, status, assignee) VALUES (?, ?, ?, ?, ?)")
            .bind(id, data.title, data.description || null, data.status || "backlog", data.assignee || null)
            .run();

        return c.json({
            success: true,
            result: {
                id,
                title: data.title
            }
        })
    }
}
