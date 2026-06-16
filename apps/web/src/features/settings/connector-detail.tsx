import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { Button } from "@agentclave/ui/components/button";
import { rpcClient } from "../../runtime";
import { ArrowLeft } from "lucide-react";
import { WebhookEndpointForm } from "./webhook-endpoint-form";

export function ConnectorDetailPage() {
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const [showNewEndpoint, setShowNewEndpoint] = useState(false);

	const { data: connector, isLoading } = useQuery({
		queryKey: ["connector", id],
		queryFn: async () => rpcClient.connectors.getById({ id: id! }),
		enabled: Boolean(id),
	});

	const { data: endpoints } = useQuery({
		queryKey: ["connector-endpoints", id],
		queryFn: async () =>
			rpcClient.connectors.listEndpoints({ connectorId: id!, page: 1, pageSize: 50 }),
		enabled: Boolean(id),
	});

	const { data: agents } = useQuery({
		queryKey: ["agents"],
		queryFn: async () => rpcClient.agents.list({ page: 1, pageSize: 100 }),
	});

	const deleteEndpointMutation = useMutation({
		mutationFn: (endpointId: string) => rpcClient.connectors.deleteEndpoint({ id: endpointId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connector-endpoints", id] }),
	});

	const createEndpointMutation = useMutation({
		mutationFn: (payload: Record<string, unknown>) =>
			rpcClient.connectors.createEndpoint(payload as never),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["connector-endpoints", id] });
			setShowNewEndpoint(false);
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-48" />
			</div>
		);
	}

	if (!connector) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold">Connector not found</h1>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<Link
					to="/settings/connectors"
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
				>
					<ArrowLeft className="h-4 w-4 mr-1" />
					Back to Connectors
				</Link>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">{connector.name}</h1>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="outline">{connector.provider}</Badge>
							<Badge variant="outline">{connector.type}</Badge>
							<Badge variant={connector.status === "active" ? "default" : "secondary"}>
								{connector.status}
							</Badge>
						</div>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Configuration</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="text-xs text-muted-foreground overflow-x-auto">
						{JSON.stringify(connector.config, null, 2)}
					</pre>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-medium">
						Endpoints ({endpoints?.items?.length ?? 0})
					</CardTitle>
					<Button size="sm" onClick={() => setShowNewEndpoint(!showNewEndpoint)}>
						{showNewEndpoint ? "Cancel" : "New endpoint"}
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					{showNewEndpoint && (
						<div className="border rounded-md p-4">
							<WebhookEndpointForm
								connectorId={id!}
								agents={agents?.items ?? []}
								submitLabel="Create endpoint"
								onSubmit={async (payload) => {
									await createEndpointMutation.mutateAsync(payload);
								}}
							/>
						</div>
					)}
					{endpoints?.items?.map((ep) => (
						<div key={ep.id} className="flex items-center justify-between rounded-md border p-3">
							<div className="space-y-1">
								<div className="text-sm font-medium">{ep.name}</div>
								<div className="text-xs text-muted-foreground">
									/api/webhooks/custom/{ep.publicToken}
								</div>
							</div>
							<Button
								size="sm"
								variant="destructive"
								onClick={() => deleteEndpointMutation.mutate(ep.id)}
							>
								Delete
							</Button>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
