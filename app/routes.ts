import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/portal.tsx"),
	route("portal", "routes/portal-page.tsx"),
	route("projects", "routes/projects.tsx"),
	route("projects/:projectId", "routes/project.tsx"),
	route("communications", "routes/communications.tsx"),
	route("activity", "routes/activity.tsx"),
	route("cli", "routes/cli.tsx"),
	route(":roomId", "routes/room.tsx"),
] satisfies RouteConfig;
