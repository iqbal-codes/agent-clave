import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { Plug } from "lucide-react";

export function ConnectorsPage() {
	const { data: connectors, isLoading } = useQuery({
		queryKey: ["connectors"],
		queryFn: async () => {
			const res = await fetch("/api/connectors/list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ page: 1, pageSize: 100 }),
			});
			return res.json() as Promise<
				Array<{
					id: string;
					name: string;
					type: string;
					provider: string;
					status: string;
				}>
			>;
		},
	});

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Connectors</h1>
				<p className="text-muted-foreground">
					Manage integrations with external services and APIs.
				</p>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			) : connectors && connectors.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{connectors.map((connector) => (
						<Card key={connector.id}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">{connector.name}</CardTitle>
								<Plug className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Badge variant={connector.status === "active" ? "default" : "secondary"}>
										{connector.status}
									</Badge>
									<Badge variant="outline">{connector.type}</Badge>
									<Badge variant="outline">{connector.provider}</Badge>
								</div>
								<div className="mt-4 text-sm text-muted-foreground">
									Webhook endpoints and deliveries will be shown here.
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Plug className="h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium">No connectors configured</p>
						<p className="text-sm text-muted-foreground">
							Connectors will appear here once they are set up.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
