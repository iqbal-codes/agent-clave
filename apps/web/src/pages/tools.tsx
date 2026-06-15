import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { Wrench, ArrowRight } from "lucide-react";

export function ToolsPage() {
	const { data: tools, isLoading } = useQuery({
		queryKey: ["tools"],
		queryFn: async () => {
			const res = await fetch("/api/tools.list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ page: 1, pageSize: 100 }),
			});
			return res.json() as Promise<Array<{
				id: string;
				name: string;
				description: string | null;
				riskLevel: string;
				executorType: string;
				defaultPolicy: string;
				status: string;
			}>>;
		},
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Tools</h1>
				<p className="text-muted-foreground">
					Configure tools that agents can invoke with governed execution.
				</p>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			) : tools && tools.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{tools.map((tool) => (
						<Link key={tool.id} to={`/tools/${tool.id}`}>
							<Card className="transition-colors hover:bg-muted/50">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										{tool.name}
									</CardTitle>
									<Wrench className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground line-clamp-2">
										{tool.description ?? "No description"}
									</p>
									<div className="mt-4 flex items-center gap-2">
										<Badge variant={tool.status === "active" ? "default" : "secondary"}>
											{tool.status}
										</Badge>
										<Badge variant="outline">{tool.riskLevel}</Badge>
										<Badge variant="outline">{tool.executorType}</Badge>
									</div>
									<div className="mt-4 flex items-center text-sm text-muted-foreground">
										Policy: {tool.defaultPolicy}
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
						<Wrench className="h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium">No tools configured</p>
						<p className="text-sm text-muted-foreground">
							Tools will appear here once agents have them bound.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
