import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useOrganization } from "../hooks/use-organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Bot, Play, CheckCircle, Wrench, AlertCircle, Clock } from "lucide-react";

interface DashboardData {
	totalRunsToday: number;
	pendingApprovals: number;
	activeAgents: number;
	completedRunsToday: number;
	failedRunsToday: number;
	averageLatencyMs: number;
	recentRuns: Array<{
		id: string;
		status: string;
		inputMessage: string | null;
		createdAt: string;
	}>;
}

export function DashboardPage() {
	const { organization, activeOrganization } = useOrganization();

	const { data: dashboard } = useQuery({
		queryKey: ["dashboard", activeOrganization?.id],
		queryFn: async () => {
			const res = await fetch("/api/organization.getDashboard", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			return res.json() as Promise<DashboardData>;
		},
		enabled: Boolean(activeOrganization?.id),
	});

	return (
		<div className="space-y-8 p-6">
			<div>
				{organization ? (
					<>
						<h1 className="text-2xl font-bold">
							Welcome to {organization.name ?? "your workspace"}
						</h1>
						<p className="text-muted-foreground">AgentClave governed agent runtime overview.</p>
					</>
				) : (
					<>
						<h1 className="text-2xl font-bold">No workspace</h1>
						<p className="text-muted-foreground">
							Contact an administrator to be added to a workspace.
						</p>
					</>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<Play className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-sm font-medium">Runs Today</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{dashboard?.totalRunsToday ?? 0}</div>
						<p className="text-xs text-muted-foreground">
							{dashboard?.completedRunsToday ?? 0} completed, {dashboard?.failedRunsToday ?? 0} failed
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<Clock className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{dashboard?.pendingApprovals ?? 0}</div>
						<p className="text-xs text-muted-foreground">Awaiting review</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<Bot className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-sm font-medium">Active Agents</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{dashboard?.activeAgents ?? 0}</div>
						<p className="text-xs text-muted-foreground">Running</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<Wrench className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{dashboard?.averageLatencyMs ? `${(dashboard.averageLatencyMs / 1000).toFixed(1)}s` : "--"}
						</div>
						<p className="text-xs text-muted-foreground">Per run</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Link to="/agents">
					<Card className="transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-3">
							<Bot className="h-5 w-5 text-muted-foreground" />
							<div>
								<CardTitle className="text-base">Agents</CardTitle>
								<CardDescription>Manage your AI agents</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Configure and monitor agent behavior</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/tools">
					<Card className="transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-3">
							<Wrench className="h-5 w-5 text-muted-foreground" />
							<div>
								<CardTitle className="text-base">Tools</CardTitle>
								<CardDescription>Configure governed tools</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Set up tool schemas and execution policies</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/runs">
					<Card className="transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-3">
							<Play className="h-5 w-5 text-muted-foreground" />
							<div>
								<CardTitle className="text-base">Runs</CardTitle>
								<CardDescription>View recent agent runs</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Track execution history and status</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/approvals">
					<Card className="transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-3">
							<CheckCircle className="h-5 w-5 text-muted-foreground" />
							<div>
								<CardTitle className="text-base">Approvals</CardTitle>
								<CardDescription>Pending approval requests</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Review and approve agent actions</p>
						</CardContent>
					</Card>
				</Link>

				{dashboard?.failedRunsToday ? (
					<Link to="/runs">
						<Card className="transition-colors hover:bg-muted/50 border-destructive/50">
							<CardHeader className="flex flex-row items-center gap-3">
								<AlertCircle className="h-5 w-5 text-destructive" />
								<div>
									<CardTitle className="text-base">Failed Runs</CardTitle>
									<CardDescription>Requires attention</CardDescription>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{dashboard.failedRunsToday} runs failed today</p>
							</CardContent>
						</Card>
					</Link>
				) : null}
			</div>
		</div>
	);
}
