import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("channels", "routes/channels/index.tsx"),
  route("channels/:id", "routes/channels/channel.tsx"),
  route("tasks", "routes/tasks/index.tsx"),
  route("wiki", "routes/wiki/index.tsx"),
  route("wiki/:id", "routes/wiki/page.tsx")
] satisfies RouteConfig;
