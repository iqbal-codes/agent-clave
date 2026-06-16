import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rpcClient } from "../../runtime";
import { AgentForm, prepareAgentPayload } from "./agent-form";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";

export function AgentCreatePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (payload: Record<string, unknown>) => rpcClient.agents.create(payload as never),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents"] });
			navigate("/agents");
		},
	});

	return (
		<div className="space-y-6 p-6 max-w-2xl">
			<div>
				<h1 className="text-2xl font-bold">Create Agent</h1>
				<p className="text-muted-foreground">Configure a new governed AI agent.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Agent Configuration</CardTitle>
				</CardHeader>
				<CardContent>
					<AgentForm
						submitLabel="Create agent"
						onSubmit={async (values) => {
							const payload = prepareAgentPayload(values);
							await createMutation.mutateAsync(payload);
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
