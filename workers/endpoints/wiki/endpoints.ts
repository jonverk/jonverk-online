import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class ListWikiPages extends OpenAPIRoute {
	schema = {
		tags: ["Wiki"],
		summary: "List Wiki Pages",
		response: {
			"200": {
				description: "Returns a list of wiki pages",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: z.array(
								z.object({
									id: z.string(),
									title: z.string(),
									type: z.string(),
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
		const result = await db.prepare("SELECT id, title, type, created_at, updated_at FROM wiki_pages ORDER BY title ASC").all();

		return c.json({
			success: true,
			result: result.results,
		});
	}
}

export class GetWikiPage extends OpenAPIRoute {
    schema = {
        tags: ["Wiki"],
        summary: "Get a Wiki Page",
        request: {
            params: z.object({
                id: z.string()
            })
        },
        response: {
            "200": {
                description: "Returns the wiki page",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.object({
                                id: z.string(),
                                title: z.string(),
                                content: z.string(),
                                type: z.string(),
                                created_at: z.string(),
                                updated_at: z.string()
                            }).nullable()
                        })
                    }
                }
            }
        }
    }

    async handle(c: any) {
        const db = c.env.DB as D1Database;
        const id = c.req.param("id");

        const result = await db.prepare("SELECT * FROM wiki_pages WHERE id = ?").bind(id).first();

        return c.json({
            success: true,
            result: result
        })
    }
}
