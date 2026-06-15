import { useLocation } from "react-router-dom";
import { baseNav } from "../config/nav-config";
import type { NavItem } from "../types/nav";

export function useSidebarNav(): NavItem[] {
	const { pathname } = useLocation();

	return baseNav.map((item) => ({
		...item,
		isActive: item.url === "/" ? pathname === "/" : pathname.startsWith(item.url),
	}));
}
