import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rpcClient } from "../../runtime";
import { ToolForm, prepareToolPayload } from "./tool-form";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";

export function ToolCreatePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (payload: Record<string, unknown>) => rpcClient.tools.create(payload as never),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tools"] });
			navigate("/tools");
		},
	});

	return (
		<div className="space-y-6 p-6 max-w-2xl">
			<div>
				<h1 className="text-2xl font-bold">Create Tool</h1>
				<p className="text-muted-foreground">Configure a new tool for agent execution.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Tool Configuration</CardTitle>
				</CardHeader>
				<CardContent>
					<ToolForm
						submitLabel="Create tool"
						onSubmit={async (values) => {
							const payload = prepareToolPayload(
								values as unknown as Parameters<typeof prepareToolPayload>[0],
							);
							await createMutation.mutateAsync(payload);
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
