import { useQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { getSortingStateParser } from "@agentclave/ui/lib/parsers";
import { DataTable } from "@agentclave/ui/components/table/data-table";
import { DataTableToolbar } from "@agentclave/ui/components/table/data-table-toolbar";
import { DataTableSkeleton } from "@agentclave/ui/components/table/data-table-skeleton";
import { useDataTable } from "@agentclave/ui/hooks/use-data-table";
import { connectorsColumns, type Connector } from "./connectors-columns";
import { rpcClient } from "../../runtime";
import { Link } from "react-router-dom";
import { Button } from "@agentclave/ui/components/button";
const columnIds = connectorsColumns
	.map((col) => ("accessorKey" in col ? (col.accessorKey as string) : undefined))
	.filter(Boolean) as string[];

export function ConnectorsPage() {
	const [params] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		perPage: parseAsInteger.withDefault(10),
		sort: getSortingStateParser<Connector>(columnIds).withDefault([]),
		name: parseAsString.withDefault(""),
		type: parseAsArrayOf(parseAsString, ",").withDefault([]),
		provider: parseAsArrayOf(parseAsString, ",").withDefault([]),
		status: parseAsArrayOf(parseAsString, ",").withDefault([]),
	});

	const sort = params.sort[0];
	const body: Record<string, unknown> = {
		page: params.page,
		pageSize: params.perPage,
	};
	if (params.name) body.search = params.name;
	if (sort) {
		body.sort = sort.id;
		body.order = sort.desc ? "desc" : "asc";
	}
	if (params.type.length > 0) body.type = params.type;
	if (params.provider.length > 0) body.provider = params.provider;
	if (params.status.length > 0) body.status = params.status;

	const { data, isLoading } = useQuery({
		queryKey: ["connectors", body],
		queryFn: async () => {
			return rpcClient.connectors.list(
				body as unknown as Parameters<typeof rpcClient.connectors.list>[0],
			);
		},
	});

	const table = useDataTable({
		columns: connectorsColumns,
		data: data?.items ?? [],
		pageCount: data ? Math.ceil(data.total / params.perPage) : 0,
		getRowId: (row) => row.id,
		initialState: {
			pagination: {
				pageSize: params.perPage,
				pageIndex: params.page - 1,
			},
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Connectors</h1>
					<p className="text-muted-foreground">
						Manage integrations with external services and APIs.
					</p>
				</div>
				<Link to="/settings/connectors/new">
					<Button>New Connector</Button>
				</Link>
			</div>

			{isLoading ? (
				<DataTableSkeleton columnCount={4} filterCount={3} />
			) : (
				<DataTable table={table.table}>
					<DataTableToolbar table={table.table} />
				</DataTable>
			)}
		</div>
	);
}
