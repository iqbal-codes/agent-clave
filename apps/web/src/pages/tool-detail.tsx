import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";

interface ToolDetail {
	id: string;
	organizationId: string;
	connectorId: string | null;
	name: string;
	description: string | null;
	inputSchema: Record<string, unknown>;
	outputSchema: Record<string, unknown>;
	riskLevel: string;
	executorType: string;
	executorConfig: Record<string, unknown>;
	defaultPolicy: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export function ToolDetailPage() {
	const { id } = useParams<{ id: string }>();

	const { data: tool, isLoading, error } = useQuery({
		queryKey: ["tool", id],
		queryFn: async (): Promise<ToolDetail | null> => {
			const res = await fetch("/api/tools/getById", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			if (res.status === 404) {
				return null;
			}
			if (!res.ok) {
				let message = `Request failed with status ${res.status}`;
				try {
					const body = (await res.json()) as { message?: unknown };
					if (typeof body?.message === "string") {
						message = body.message;
					}
				} catch {
					// Ignore JSON parse errors and keep the status-based message.
				}
				throw new Error(message);
			}
			return (await res.json()) as ToolDetail;
		},
		enabled: Boolean(id),
	});

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-48" />
			</div>
		);
	}

	if (!tool) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold">Tool not found</h1>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{error && (
				<Card>
					<CardHeader>
						<CardTitle>Failed to load tool</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-destructive">
							{error instanceof Error ? error.message : "Unknown error"}
						</p>
					</CardContent>
				</Card>
			)}

			<div>
				<h1 className="text-2xl font-bold">{tool.name}</h1>
				<p className="text-muted-foreground">{tool.description ?? "No description"}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader>
						<CardTitle>Status</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant={tool.status === "active" ? "default" : "secondary"}>
							{tool.status}
						</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Risk level</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant="outline">{tool.riskLevel}</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Executor</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{tool.executorType}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Default policy</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant="outline">{tool.defaultPolicy}</Badge>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-sm">
						<span className="font-medium">Connector ID:</span>{" "}
						{tool.connectorId ?? "No connector"}
					</p>
					<p className="text-sm">
						<span className="font-medium">Created:</span>{" "}
						{new Date(tool.createdAt).toLocaleString()}
					</p>
					<p className="text-sm">
						<span className="font-medium">Updated:</span>{" "}
						{new Date(tool.updatedAt).toLocaleString()}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Input schema</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md">
						{JSON.stringify(tool.inputSchema, null, 2)}
					</pre>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Output schema</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md">
						{JSON.stringify(tool.outputSchema, null, 2)}
					</pre>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Executor config</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md">
						{JSON.stringify(tool.executorConfig, null, 2)}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}
