import type { NavItem } from "../types/nav";

export const baseNav: NavItem[] = [
	{ title: "Dashboard", url: "/", icon: "LayoutDashboard" },
	{ title: "Agents", url: "/agents", icon: "Bot" },
	{ title: "Tools", url: "/tools", icon: "Wrench" },
	{ title: "Connectors", url: "/connectors", icon: "Plug" },
	{ title: "Runs", url: "/runs", icon: "Play" },
	{ title: "Approvals", url: "/approvals", icon: "CheckCircle" },
	{ title: "Audit Log", url: "/audit", icon: "ScrollText" },
	{ title: "Settings", url: "/settings/organization", icon: "Settings" },
];
