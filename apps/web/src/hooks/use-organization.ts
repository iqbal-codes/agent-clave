import { useQuery } from "@tanstack/react-query";
import { orpc } from "../runtime";

export function useOrganization() {
	const { data: context, isLoading } = useQuery(orpc.organization.getContext.queryOptions());

	return {
		organization: {
			name: context?.session?.user?.name ?? null,
		},
		activeOrganization: context?.activeOrganization ?? null,
		isLoading,
	};
}
