import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@agentclave/ui/components/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";
import { RealtimeProvider } from "../realtime/realtime-provider";

export function DashboardLayout() {
	return (
		<RealtimeProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<Header />
					<Outlet />
				</SidebarInset>
			</SidebarProvider>
		</RealtimeProvider>
	);
}
