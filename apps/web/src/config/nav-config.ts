import type { NavItem } from "../types/nav";

export const baseNav: NavItem[] = [
	{ title: "Dashboard", url: "/", icon: "LayoutDashboard" },
	{ title: "Agents", url: "/agents", icon: "Bot" },
	{ title: "Tools", url: "/tools", icon: "Wrench" },
	{ title: "Runs", url: "/runs", icon: "Play" },
	{ title: "Settings", url: "/settings/organization", icon: "Settings" },
];
