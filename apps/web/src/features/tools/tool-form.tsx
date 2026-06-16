import { z } from "zod";
import { useAppForm, useFormFields } from "@agentclave/ui/components/forms/tanstack-form";
import { stringifyJson, parseJsonObject } from "../../lib/json-form";

const toolFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string(),
	connectorId: z.string().min(1, "Connector is required"),
	inputSchemaText: z.string(),
	outputSchemaText: z.string(),
	riskLevel: z.enum(["low", "medium", "high", "critical"]),
	executorType: z.enum(["http"]),
	executorConfigText: z.string(),
	defaultPolicy: z.enum(["allow", "require_approval", "deny"]),
	status: z.enum(["active", "paused"]),
});

export type ToolFormValues = z.infer<typeof toolFormSchema>;

interface ToolFormProps {
	defaultValues?: Partial<ToolFormValues>;
	submitLabel?: string;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onSuccess?: () => void;
}

const defaultFormValues: ToolFormValues = {
	name: "",
	description: "",
	connectorId: "",
	inputSchemaText: JSON.stringify({ type: "object", properties: {}, required: [] }, null, 2),
	outputSchemaText: JSON.stringify({ type: "object", properties: {} }, null, 2),
	riskLevel: "medium",
	executorType: "http",
	executorConfigText: "{}",
	defaultPolicy: "deny",
	status: "active",
};

export function ToolForm({
	defaultValues,
	submitLabel = "Create tool",
	onSubmit,
	onSuccess,
}: ToolFormProps) {
	const form = useAppForm({
		defaultValues: { ...defaultFormValues, ...defaultValues } as ToolFormValues,
		validators: { onSubmit: toolFormSchema },
		onSubmit: async ({ value }) => {
			const payload = prepareToolPayload(value);
			await onSubmit(payload);
			onSuccess?.();
		},
	});

	const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<ToolFormValues>();

	return (
		<form.AppForm>
			<form.Form>
				<div className="space-y-4">
					<FormTextField name="name" label="Name" placeholder="inventory.search_product" required />
					<FormTextField
						name="description"
						label="Description"
						placeholder="What does this tool do?"
					/>
					<FormTextField
						name="connectorId"
						label="Connector ID"
						placeholder="UUID of the connector"
						required
					/>
					<FormTextareaField name="inputSchemaText" label="Input Schema (JSON)" rows={4} />
					<FormTextareaField name="outputSchemaText" label="Output Schema (JSON)" rows={3} />
					<FormSelectField
						name="riskLevel"
						label="Risk Level"
						options={[
							{ value: "low", label: "Low" },
							{ value: "medium", label: "Medium" },
							{ value: "high", label: "High" },
							{ value: "critical", label: "Critical" },
						]}
					/>
					<FormSelectField
						name="defaultPolicy"
						label="Default Policy"
						options={[
							{ value: "allow", label: "Allow" },
							{ value: "require_approval", label: "Require Approval" },
							{ value: "deny", label: "Deny" },
						]}
					/>
					<FormSelectField
						name="status"
						label="Status"
						options={[
							{ value: "active", label: "Active" },
							{ value: "paused", label: "Paused" },
						]}
					/>
					<FormTextareaField name="executorConfigText" label="Executor Config (JSON)" rows={4} />
					<form.SubmitButton className="w-full">{submitLabel}</form.SubmitButton>
				</div>
			</form.Form>
		</form.AppForm>
	);
}

export function prepareToolPayload(values: ToolFormValues) {
	return {
		name: values.name,
		description: values.description || undefined,
		connectorId: values.connectorId || undefined,
		inputSchema: parseJsonObject(values.inputSchemaText, "Input Schema"),
		outputSchema: parseJsonObject(values.outputSchemaText, "Output Schema"),
		riskLevel: values.riskLevel,
		executorType: values.executorType,
		executorConfig: parseJsonObject(values.executorConfigText, "Executor Config"),
		defaultPolicy: values.defaultPolicy,
		status: values.status,
	};
}
