import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@agentclave/ui/components/badge";
import { DataTableColumnHeader } from "@agentclave/ui/components/table/data-table-column-header";

export interface Connector {
	id: string;
	name: string;
	type: string;
	provider: string;
	status: string;
}

const statusOptions = [
	{ label: "Active", value: "active" },
	{ label: "Paused", value: "paused" },
];

export const connectorsColumns: ColumnDef<Connector>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		meta: {
			label: "Name",
			placeholder: "Search connectors...",
			variant: "text",
		},
		enableHiding: false,
		cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
	},
	{
		accessorKey: "type",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
		meta: {
			label: "Type",
		},
		cell: ({ row }) => <span className="text-sm">{row.getValue("type")}</span>,
	},
	{
		accessorKey: "provider",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
		meta: {
			label: "Provider",
		},
		cell: ({ row }) => <span className="text-sm">{row.getValue("provider")}</span>,
	},
	{
		accessorKey: "status",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		meta: {
			label: "Status",
			options: statusOptions,
		},
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>;
		},
	},
];
