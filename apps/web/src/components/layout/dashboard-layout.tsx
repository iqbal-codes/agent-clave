import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@agentclave/ui/components/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";

export function DashboardLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Header />
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
