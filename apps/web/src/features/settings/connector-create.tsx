import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rpcClient } from "../../runtime";
import { ConnectorForm, prepareConnectorPayload } from "./connector-form";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";

export function ConnectorCreatePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (payload: Record<string, unknown>) => rpcClient.connectors.create(payload as never),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["connectors"] });
			navigate("/settings/connectors");
		},
	});

	return (
		<div className="space-y-6 p-6 max-w-2xl">
			<div>
				<h1 className="text-2xl font-bold">Create Connector</h1>
				<p className="text-muted-foreground">Configure a new integration connector.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Connector Configuration</CardTitle>
				</CardHeader>
				<CardContent>
					<ConnectorForm
						submitLabel="Create connector"
						onSubmit={async (values) => {
							const payload = prepareConnectorPayload(
								values as unknown as Parameters<typeof prepareConnectorPayload>[0],
							);
							await createMutation.mutateAsync(payload);
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
