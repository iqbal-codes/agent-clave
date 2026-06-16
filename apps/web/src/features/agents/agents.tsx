import { useQuery } from "@tanstack/react-query";
import { rpcClient } from "../../runtime";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { Bot, ArrowRight } from "lucide-react";
import { Button } from "@agentclave/ui/components/button";

export function AgentsPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["agents"],
		queryFn: async () => {
			return rpcClient.agents.list({ page: 1, pageSize: 100 });
		},
	});
	const agents = data?.items;

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Agents</h1>
					<p className="text-muted-foreground">Manage your governed AI agents.</p>
				</div>
				<Link to="/agents/new">
					<Button>New Agent</Button>
				</Link>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			) : agents && agents.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{agents.map((agent) => (
						<Link key={agent.id} to={`/agents/${agent.id}`}>
							<Card className="transition-colors hover:bg-muted/50">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
									<Bot className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground line-clamp-2">
										{agent.description ?? "No description"}
									</p>
									<div className="mt-4 flex items-center gap-2">
										<Badge variant={agent.status === "active" ? "default" : "secondary"}>
											{agent.status}
										</Badge>
										<Badge variant="outline">{agent.riskLevel}</Badge>
										{agent.role && <Badge variant="outline">{agent.role}</Badge>}
									</div>
									<div className="mt-4 flex items-center text-sm text-muted-foreground">
										Model: {agent.model}
										<ArrowRight className="ml-auto h-4 w-4" />
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Bot className="h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium">No agents configured</p>
						<p className="text-sm text-muted-foreground">
							Agents will appear here once they are set up.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
