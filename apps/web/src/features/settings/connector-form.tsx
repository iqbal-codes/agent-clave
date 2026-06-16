import { z } from "zod";
import { useAppForm, useFormFields } from "@agentclave/ui/components/forms/tanstack-form";
import { parseJsonObject } from "../../lib/json-form";

const connectorFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	type: z.enum(["telegram", "http"]),
	provider: z.enum(["telegram", "demo_inventory"]),
	configText: z.string(),
	credentialsText: z.string(),
	status: z.enum(["active", "paused"]),
});

export type ConnectorFormValues = z.infer<typeof connectorFormSchema>;

interface ConnectorFormProps {
	defaultValues?: Partial<ConnectorFormValues>;
	submitLabel?: string;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onSuccess?: () => void;
}

const defaultFormValues: ConnectorFormValues = {
	name: "",
	type: "http",
	provider: "demo_inventory",
	configText: JSON.stringify({ baseUrl: "http://localhost:4301" }, null, 2),
	credentialsText: JSON.stringify({ apiKey: "demo-inventory-key" }, null, 2),
	status: "paused",
};

export function ConnectorForm({
	defaultValues,
	submitLabel = "Create connector",
	onSubmit,
	onSuccess,
}: ConnectorFormProps) {
	const form = useAppForm({
		defaultValues: { ...defaultFormValues, ...defaultValues } as ConnectorFormValues,
		validators: { onSubmit: connectorFormSchema },
		onSubmit: async ({ value }) => {
			const payload = prepareConnectorPayload(value);
			await onSubmit(payload);
			onSuccess?.();
		},
	});

	const { FormTextField, FormSelectField, FormTextareaField } =
		useFormFields<ConnectorFormValues>();

	return (
		<form.AppForm>
			<form.Form>
				<div className="space-y-4">
					<FormTextField name="name" label="Name" placeholder="My Connector" required />
					<FormSelectField
						name="type"
						label="Type"
						options={[
							{ value: "http", label: "HTTP" },
							{ value: "telegram", label: "Telegram" },
						]}
					/>
					<FormSelectField
						name="provider"
						label="Provider"
						options={[
							{ value: "demo_inventory", label: "Demo Inventory" },
							{ value: "telegram", label: "Telegram" },
						]}
					/>
					<FormTextareaField name="configText" label="Config (JSON)" rows={3} />
					<FormTextareaField name="credentialsText" label="Credentials (JSON)" rows={3} />
					<FormSelectField
						name="status"
						label="Status"
						options={[
							{ value: "active", label: "Active" },
							{ value: "paused", label: "Paused" },
						]}
					/>
					<form.SubmitButton className="w-full">{submitLabel}</form.SubmitButton>
				</div>
			</form.Form>
		</form.AppForm>
	);
}

export function prepareConnectorPayload(values: ConnectorFormValues) {
	return {
		name: values.name,
		type: values.type,
		provider: values.provider,
		config: parseJsonObject(values.configText, "Config"),
		credentials: parseJsonObject(values.credentialsText, "Credentials"),
		status: values.status,
	};
}
