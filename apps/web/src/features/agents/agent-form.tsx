import { z } from "zod";
import { useAppForm, useFormFields } from "@agentclave/ui/components/forms/tanstack-form";

const agentFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string(),
	role: z.string(),
	purpose: z.string(),
	model: z.string().min(1, "Model is required"),
	systemPrompt: z.string(),
	guardrailsText: z.string(),
	riskLevel: z.enum(["low", "medium", "high", "critical"]),
	dailyBudgetText: z.string(),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
	defaultValues?: Partial<AgentFormValues>;
	submitLabel?: string;
	onSubmit: (values: AgentFormValues) => Promise<void>;
	onSuccess?: () => void;
}

const defaultFormValues: AgentFormValues = {
	name: "",
	description: "",
	role: "",
	purpose: "",
	model: "xiaomi/mimo-v2.5",
	systemPrompt: "",
	guardrailsText: "",
	riskLevel: "medium",
	dailyBudgetText: "",
};

export function AgentForm({
	defaultValues,
	submitLabel = "Create agent",
	onSubmit,
	onSuccess,
}: AgentFormProps) {
	const form = useAppForm({
		defaultValues: { ...defaultFormValues, ...defaultValues } as AgentFormValues,
		validators: { onSubmit: agentFormSchema },
		onSubmit: async ({ value }) => {
			await onSubmit(value);
			onSuccess?.();
		},
	});

	const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<AgentFormValues>();

	return (
		<form.AppForm>
			<form.Form>
				<div className="space-y-4">
					<FormTextField name="name" label="Name" placeholder="My Agent" required />
					<FormTextField
						name="description"
						label="Description"
						placeholder="What does this agent do?"
					/>
					<FormTextField name="role" label="Role" placeholder="e.g. inventory_ops" />
					<FormTextField
						name="purpose"
						label="Purpose"
						placeholder="What is this agent's purpose?"
					/>
					<FormTextField name="model" label="Model" placeholder="xiaomi/mimo-v2.5" required />
					<FormTextareaField
						name="systemPrompt"
						label="System Prompt"
						placeholder="You are a helpful assistant..."
						rows={4}
					/>
					<FormTextareaField
						name="guardrailsText"
						label="Guardrails (one per line)"
						placeholder="never guess SKU"
						rows={3}
					/>
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
					<FormTextField
						name="dailyBudgetText"
						label="Daily Budget ($)"
						placeholder="Leave blank for no limit"
					/>
					<form.SubmitButton className="w-full">{submitLabel}</form.SubmitButton>
				</div>
			</form.Form>
		</form.AppForm>
	);
}

export function prepareAgentPayload(values: AgentFormValues) {
	const guardrails = values.guardrailsText
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);
	const dailyBudget = values.dailyBudgetText.trim() ? Number(values.dailyBudgetText) : undefined;

	return {
		name: values.name,
		description: values.description || undefined,
		role: values.role || undefined,
		purpose: values.purpose || undefined,
		model: values.model,
		systemPrompt: values.systemPrompt || undefined,
		guardrails: guardrails.length > 0 ? guardrails : undefined,
		riskLevel: values.riskLevel,
		dailyBudget,
	};
}
