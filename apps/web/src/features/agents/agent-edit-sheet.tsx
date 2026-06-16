import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rpcClient } from "../../runtime";
import { AgentForm, prepareAgentPayload } from "./agent-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@agentclave/ui/components/sheet";

interface AgentEditSheetProps {
	agentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultValues?: Record<string, unknown>;
}

export function AgentEditSheet({
	agentId,
	open,
	onOpenChange,
	defaultValues,
}: AgentEditSheetProps) {
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: (payload: Record<string, unknown>) =>
			rpcClient.agents.update({ id: agentId, ...payload } as never),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
			queryClient.invalidateQueries({ queryKey: ["agents"] });
			onOpenChange(false);
		},
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Edit Agent</SheetTitle>
				</SheetHeader>
				<div className="mt-4">
					<AgentForm
						defaultValues={defaultValues as never}
						submitLabel="Save changes"
						onSubmit={async (values) => {
							const payload = prepareAgentPayload(values);
							await updateMutation.mutateAsync(payload);
						}}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
