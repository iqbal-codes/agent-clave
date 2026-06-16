import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { Button } from "@agentclave/ui/components/button";
import { Textarea } from "@agentclave/ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@agentclave/ui/components/tabs";
import { rpcClient } from "../../runtime";
import { AgentEditSheet } from "./agent-edit-sheet";

export function AgentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [testMessage, setTestMessage] = useState("");
	const [editSheetOpen, setEditSheetOpen] = useState(false);

	const { data: agent, isLoading } = useQuery({
		queryKey: ["agent", id],
		queryFn: async () => rpcClient.agents.getById({ id: id! }),
		enabled: Boolean(id),
	});

	const { data: agentTools } = useQuery({
		queryKey: ["agent-tools", id],
		queryFn: async () => rpcClient.agents.listTools({ agentId: id! }),
		enabled: Boolean(id),
	});

	const { data: policies } = useQuery({
		queryKey: ["agent-policies", id],
		queryFn: async () => rpcClient.policy.list({ page: 1, pageSize: 100 }),
		enabled: Boolean(id),
	});

	const activateMutation = useMutation({
		mutationFn: () => rpcClient.agents.activate({ id: id! }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agent", id] });
			queryClient.invalidateQueries({ queryKey: ["agents"] });
		},
	});

	const pauseMutation = useMutation({
		mutationFn: () => rpcClient.agents.pause({ id: id! }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agent", id] });
			queryClient.invalidateQueries({ queryKey: ["agents"] });
		},
	});

	const testRunMutation = useMutation({
		mutationFn: (message: string) => rpcClient.agents.testRun({ agentId: id!, message }),
		onSuccess: (data) => {
			navigate(`/runs/${data.runId}`);
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

	if (!agent) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold">Agent not found</h1>
			</div>
		);
	}

	const isAgentActive = agent.status === "active";

	const filteredPolicies = (policies?.items ?? []).filter((p) => {
		if (p.agentId === id) return true;
		if (p.toolId && agentTools?.some((t) => t.id === p.toolId)) return true;
		if (p.toolName && agentTools?.some((t) => t.name === p.toolName)) return true;
		return false;
	});

	return (
		<>
			<div className="space-y-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">{agent.name}</h1>
						{agent.description && <p className="text-muted-foreground">{agent.description}</p>}
					</div>
					<div className="flex items-center gap-2">
						{isAgentActive ? (
							<Button
								variant="outline"
								onClick={() => pauseMutation.mutate()}
								disabled={pauseMutation.isPending}
							>
								Pause
							</Button>
						) : (
							<Button
								onClick={() => activateMutation.mutate()}
								disabled={activateMutation.isPending}
							>
								Activate
							</Button>
						)}
						<Button variant="outline" onClick={() => setEditSheetOpen(true)}>
							Edit
						</Button>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Status</CardTitle>
						</CardHeader>
						<CardContent>
							<Badge variant={isAgentActive ? "default" : "secondary"}>{agent.status}</Badge>
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

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Test Run</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Textarea
							value={testMessage}
							onChange={(e) => setTestMessage(e.target.value)}
							placeholder="Stok Bakso Solo beda. Hasil opname hari ini 120 pack, di sistem masih 80. Ada 10 pack rusak karena freezer mati semalam. Tolong beresin."
							rows={3}
						/>
						{!isAgentActive && (
							<p className="text-xs text-muted-foreground">
								Activate the agent before running a test.
							</p>
						)}
						<Button
							onClick={() => testRunMutation.mutate(testMessage)}
							disabled={!isAgentActive || testRunMutation.isPending || !testMessage.trim()}
						>
							{testRunMutation.isPending ? "Running..." : "Run"}
						</Button>
					</CardContent>
				</Card>

				{agent.systemPrompt && (
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">System Prompt</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="text-sm text-muted-foreground whitespace-pre-wrap">
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
							<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
								{agent.guardrails.map((g, i) => (
									<li key={i}>{g}</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}

				<Tabs defaultValue="tools">
					<TabsList>
						<TabsTrigger value="tools">Tools</TabsTrigger>
						<TabsTrigger value="policies">Policies</TabsTrigger>
					</TabsList>
					<TabsContent value="tools" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">
									Bound Tools ({agentTools?.length ?? 0})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{agentTools?.map((tool) => (
										<div
											key={tool.id}
											className="flex items-center justify-between rounded-md border p-3"
										>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">{tool.name}</span>
												<Badge variant="outline" className="text-xs">
													{tool.riskLevel}
												</Badge>
												<Badge
													variant={tool.status === "active" ? "default" : "secondary"}
													className="text-xs"
												>
													{tool.status}
												</Badge>
											</div>
										</div>
									))}
									{(!agentTools || agentTools.length === 0) && (
										<p className="text-sm text-muted-foreground">No tools bound to this agent.</p>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="policies" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">
									Active Policies ({filteredPolicies.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{filteredPolicies.map((policy) => (
										<div
											key={policy.id}
											className="flex items-center gap-3 text-sm rounded-md border p-3"
										>
											<span className="font-medium">{policy.toolName ?? "Global"}</span>
											<Badge
												variant={
													policy.effect === "allow"
														? "default"
														: policy.effect === "deny"
															? "destructive"
															: "outline"
												}
											>
												{policy.effect}
											</Badge>
											{policy.approverRole && (
												<span className="text-muted-foreground">
													approver: {policy.approverRole}
												</span>
											)}
											<span className="text-muted-foreground ml-auto">
												priority: {policy.priority}
											</span>
										</div>
									))}
									{filteredPolicies.length === 0 && (
										<p className="text-sm text-muted-foreground">
											No policies apply to this agent's tools.
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
			<AgentEditSheet
				agentId={id!}
				open={editSheetOpen}
				onOpenChange={setEditSheetOpen}
				defaultValues={agent}
			/>
		</>
	);
}
