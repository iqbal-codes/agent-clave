import { useState } from "react";
import { useOrganization } from "../../hooks/use-organization";
import { orpc } from "../../runtime";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@agentclave/ui/components/button";
import { Input } from "@agentclave/ui/components/input";
import { Label } from "@agentclave/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { toast } from "sonner";

export function SettingsOrganizationPage() {
	const { organization, activeOrganization } = useOrganization();
	const queryClient = useQueryClient();
	const [name, setName] = useState(organization?.name ?? "");

	const updateProfile = useMutation(
		orpc.organization.updateProfile.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: orpc.organization.getContext.queryKey() });
				toast.success("Organization updated");
			},
		}),
	);

	return (
		<div className="space-y-6 p-6">
			<h1 className="text-2xl font-bold">Organization Settings</h1>
			<Card className="max-w-lg">
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Update your organization details</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="org-name">Organization Name</Label>
						<Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<p className="text-xs text-muted-foreground">
						{activeOrganization?.id ? `Org ID: ${activeOrganization.id}` : "No organization selected"}
					</p>
					<Button onClick={() => updateProfile.mutate({ name })} disabled={updateProfile.isPending || !name}>
						{updateProfile.isPending ? "Saving..." : "Save changes"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
