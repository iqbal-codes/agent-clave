import { z } from "zod";
import { useAppForm, useFormFields } from "@agentclave/ui/components/forms/tanstack-form";
import { parseJsonObject } from "../../lib/json-form";

const webhookEndpointFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	agentId: z.string().min(1, "Agent is required"),
	verificationType: z.enum(["none", "header_secret", "hmac_sha256"]),
	secretHeaderName: z.string(),
	secret: z.string(),
	responseStatusText: z.string(),
	responseBodyText: z.string(),
	status: z.enum(["active", "paused"]),
});

export type WebhookEndpointFormValues = z.infer<typeof webhookEndpointFormSchema>;

interface WebhookEndpointFormProps {
	connectorId: string;
	defaultValues?: Partial<WebhookEndpointFormValues>;
	submitLabel?: string;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onSuccess?: () => void;
	agents?: Array<{ id: string; name: string }>;
}

const defaultFormValues: WebhookEndpointFormValues = {
	name: "",
	agentId: "",
	verificationType: "header_secret",
	secretHeaderName: "X-Telegram-Bot-Api-Secret-Token",
	secret: "",
	responseStatusText: "202",
	responseBodyText: JSON.stringify({ ok: true }, null, 2),
	status: "paused",
};

export function WebhookEndpointForm({
	connectorId,
	defaultValues,
	submitLabel = "Create endpoint",
	onSubmit,
	onSuccess,
	agents = [],
}: WebhookEndpointFormProps) {
	const form = useAppForm({
		defaultValues: { ...defaultFormValues, ...defaultValues } as WebhookEndpointFormValues,
		validators: { onSubmit: webhookEndpointFormSchema },
		onSubmit: async ({ value }) => {
			const payload = prepareEndpointPayload(value, connectorId);
			await onSubmit(payload);
			onSuccess?.();
		},
	});

	const { FormTextField, FormSelectField, FormTextareaField } =
		useFormFields<WebhookEndpointFormValues>();

	return (
		<form.AppForm>
			<form.Form>
				<div className="space-y-4">
					<FormTextField name="name" label="Name" placeholder="Telegram inbound" required />
					<FormSelectField
						name="agentId"
						label="Agent"
						options={agents.map((a) => ({ value: a.id, label: a.name }))}
					/>
					<FormSelectField
						name="verificationType"
						label="Verification Type"
						options={[
							{ value: "none", label: "None" },
							{ value: "header_secret", label: "Header Secret" },
							{ value: "hmac_sha256", label: "HMAC SHA256" },
						]}
					/>
					<FormTextField
						name="secretHeaderName"
						label="Secret Header Name"
						placeholder="X-Webhook-Secret"
					/>
					<FormTextField name="secret" label="Secret" placeholder="your-secret" type="password" />
					<FormTextField name="responseStatusText" label="Response Status" placeholder="202" />
					<FormTextareaField name="responseBodyText" label="Response Body (JSON)" rows={2} />
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

export function prepareEndpointPayload(values: WebhookEndpointFormValues, connectorId: string) {
	const payload: Record<string, unknown> = {
		name: values.name,
		connectorId,
		agentId: values.agentId,
		verificationType: values.verificationType,
		responseStatus: Number(values.responseStatusText) || 200,
		responseBody: parseJsonObject(values.responseBodyText, "Response Body"),
		status: values.status,
	};

	if (values.verificationType !== "none") {
		payload.secretHeaderName = values.secretHeaderName;
		payload.secret = values.secret;
	}

	return payload;
}
