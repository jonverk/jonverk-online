import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("api/stream", "routes/api.stream.ts"),
	route("swarm", "routes/swarm.tsx"),
	route("wiki/:pageId?", "routes/wiki.tsx"),
	route(":roomId", "routes/room.tsx"),
] satisfies RouteConfig;
