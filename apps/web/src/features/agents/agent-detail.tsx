import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";

interface AgentDetail {
	id: string;
	name: string;
	description: string | null;
	role: string | null;
	purpose: string | null;
	model: string;
	systemPrompt: string | null;
	guardrails: string[] | null;
	riskLevel: string;
	status: string;
}

export function AgentDetailPage() {
	const { id } = useParams<{ id: string }>();

	const { data: agent, isLoading } = useQuery({
		queryKey: ["agent", id],
		queryFn: async () => {
			const res = await fetch("/api/agents/getById", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			return res.json() as Promise<AgentDetail>;
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

	if (!agent) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold">Agent not found</h1>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">{agent.name}</h1>
				<p className="text-muted-foreground">{agent.description}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Status</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant={agent.status === "active" ? "default" : "secondary"}>
							{agent.status}
						</Badge>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Model</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm">{agent.model}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Risk Level</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant="outline">{agent.riskLevel}</Badge>
					</CardContent>
				</Card>
			</div>

			{agent.role && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Role</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{agent.role}</p>
					</CardContent>
				</Card>
			)}

			{agent.purpose && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Purpose</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{agent.purpose}</p>
					</CardContent>
				</Card>
			)}

			{agent.systemPrompt && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">System Prompt</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md">
							{agent.systemPrompt}
						</pre>
					</CardContent>
				</Card>
			)}

			{agent.guardrails && agent.guardrails.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Guardrails</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="list-disc list-inside text-sm space-y-1">
							{agent.guardrails.map((g, i) => (
								<li key={i}>{g}</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
