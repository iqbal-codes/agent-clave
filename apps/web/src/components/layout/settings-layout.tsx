import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@agentclave/ui/components/tabs";

export function SettingsLayout() {
	const location = useLocation();
	const navigate = useNavigate();

	const activeTab = location.pathname.includes("/connectors") ? "connectors" : "organization";

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Settings</h1>
			</div>
			<Tabs
				value={activeTab}
				onValueChange={(value) => {
					navigate(`/settings/${value}`);
				}}
			>
				<TabsList>
					<TabsTrigger value="organization">Organization</TabsTrigger>
					<TabsTrigger value="connectors">Connectors</TabsTrigger>
				</TabsList>
			</Tabs>

			<Outlet />
		</div>
	);
}
