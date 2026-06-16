import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Badge } from "@agentclave/ui/components/badge";
import { DataTableColumnHeader } from "@agentclave/ui/components/table/data-table-column-header";

export interface Tool {
	id: string;
	name: string;
	description: string | null;
	riskLevel: string;
	executorType: string;
	defaultPolicy: string;
	status: string;
}

const riskLevelOptions = [
	{ label: "Low", value: "low" },
	{ label: "Medium", value: "medium" },
	{ label: "High", value: "high" },
	{ label: "Critical", value: "critical" },
];

const statusOptions = [
	{ label: "Active", value: "active" },
	{ label: "Paused", value: "paused" },
];

const defaultPolicyOptions = [
	{ label: "Allow", value: "allow" },
	{ label: "Require Approval", value: "require_approval" },
	{ label: "Deny", value: "deny" },
];

export const toolsColumns: ColumnDef<Tool>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		meta: {
			label: "Name",
			placeholder: "Search tools...",
			variant: "text",
		},
		enableHiding: false,
		cell: ({ row }) => (
			<Link to={`/tools/${row.original.id}`} className="font-medium hover:underline">
				{row.getValue("name")}
			</Link>
		),
	},
	{
		accessorKey: "description",
		header: "Description",
		enableHiding: false,
		cell: ({ row }) => {
			const description = row.getValue("description") as string | null;
			return (
				<span className="text-muted-foreground text-sm truncate max-w-[300px] block">
					{description ?? "No description"}
				</span>
			);
		},
	},
	{
		accessorKey: "riskLevel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Risk Level" />,
		meta: {
			label: "Risk Level",
			options: riskLevelOptions,
		},
		cell: ({ row }) => {
			const level = row.getValue("riskLevel") as string;
			const variant =
				level === "critical"
					? "destructive"
					: level === "high"
						? "destructive"
						: level === "medium"
							? "outline"
							: "secondary";
			return <Badge variant={variant}>{level}</Badge>;
		},
	},
	{
		accessorKey: "executorType",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Executor Type" />,
		meta: {
			label: "Executor Type",
		},
		cell: ({ row }) => <span className="text-sm">{row.getValue("executorType")}</span>,
	},
	{
		accessorKey: "defaultPolicy",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Default Policy" />,
		meta: {
			label: "Default Policy",
			options: defaultPolicyOptions,
		},
		cell: ({ row }) => {
			const policy = row.getValue("defaultPolicy") as string;
			return <Badge variant="outline">{policy}</Badge>;
		},
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
