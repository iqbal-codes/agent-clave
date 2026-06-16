import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@agentclave/ui/components/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@agentclave/ui/components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@agentclave/ui/components/avatar";
import {
	LayoutDashboard,
	Bot,
	Wrench,
	Settings,
	ChevronsUpDown,
	LogOut,
	User,
	Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebarNav } from "../../hooks/use-nav";
import { useOrganization } from "../../hooks/use-organization";
import { useAuth } from "../../providers/auth-provider";

const iconMap: Record<string, LucideIcon> = {
	LayoutDashboard,
	Bot,
	Wrench,
	Settings,
	Play,
};

export function AppSidebar() {
	const navigate = useNavigate();
	const { session, signOut } = useAuth();
	const navItems = useSidebarNav();
	const { organization } = useOrganization();
	const user =
		(session as { user?: { name?: string; email?: string; image?: string } } | null)?.user ?? null;

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={<Link to="/" />}
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="bg-primary/10 flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold data-[state=open]:size-8">
								AC
							</div>
							<div className="grid flex-1 text-left text-base leading-tight">
								<span className="truncate font-semibold">AgentClave</span>
								<span className="text-muted-foreground truncate text-sm">
									{organization?.name ?? "your workspace"}
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="overflow-x-hidden">
				<SidebarGroup className="py-0">
					<SidebarMenu>
						{navItems.map((item) => {
							const Icon = item.icon ? (iconMap[item.icon] ?? LayoutDashboard) : LayoutDashboard;
							const isActive =
								location.pathname === item.url ||
								(item.url !== "/" && location.pathname.startsWith(item.url));

							return (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={<Link to={item.url} />}
										tooltip={item.title}
										isActive={isActive}
									>
										<Icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									/>
								}
							>
								<Avatar className="size-8 rounded-lg">
									<AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
									<AvatarFallback className="rounded-lg">
										{user?.name?.charAt(0)?.toUpperCase() ?? "U"}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-base leading-tight">
									<span className="truncate font-semibold">{user?.name ?? "User"}</span>
									<span className="text-muted-foreground truncate text-sm">
										{user?.email ?? ""}
									</span>
								</div>
								<ChevronsUpDown className="ml-auto size-5" />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
								side="bottom"
								align="end"
								sideOffset={4}
							>
								<DropdownMenuGroup>
									<DropdownMenuLabel className="p-0 font-normal">
										<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
											<Avatar className="h-10 w-10 rounded-lg">
												<AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
												<AvatarFallback className="rounded-lg">
													{user?.name?.charAt(0)?.toUpperCase() ?? "U"}
												</AvatarFallback>
											</Avatar>
											<div className="grid flex-1 text-left text-base leading-tight">
												<span className="truncate font-semibold">{user?.name ?? "User"}</span>
												<span className="text-muted-foreground truncate text-sm">
													{user?.email ?? ""}
												</span>
											</div>
										</div>
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem onClick={() => navigate("/settings/organization")}>
										<User className="mr-2 h-4 w-4" />
										Profile
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => signOut()}>
									<LogOut className="mr-2 h-4 w-4" />
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
