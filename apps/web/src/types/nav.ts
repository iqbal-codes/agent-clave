export interface NavItem {
	title: string;
	url: string;
	disabled?: boolean;
	external?: boolean;
	shortcut?: [string, string];
	icon?: string;
	label?: string;
	description?: string;
	isActive?: boolean;
	items?: NavItem[];
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}
