import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/auth-provider";
import { ProtectedRoute } from "./components/protected-route";
import { SignInPage } from "./features/auth/sign-in";
import { SignUpPage } from "./features/auth/sign-up";
import { DashboardPage } from "./features/dashboard/dashboard";
import { AgentsPage } from "./features/agents/agents";
import { AgentCreatePage } from "./features/agents/agent-create";
import { AgentDetailPage } from "./features/agents/agent-detail";
import { ToolsPage } from "./features/tools/tools";
import { ToolCreatePage } from "./features/tools/tool-create";
import { ToolDetailPage } from "./features/tools/tool-detail";
import { RunsPage } from "./features/runs/runs";
import { RunDetailPage } from "./features/runs/run-detail";
import { SettingsOrganizationPage } from "./features/settings/organization";
import { ConnectorsPage } from "./features/settings/connectors";
import { ConnectorCreatePage } from "./features/settings/connector-create";
import { ConnectorDetailPage } from "./features/settings/connector-detail";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { SettingsLayout } from "./components/layout/settings-layout";

export function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route path="/auth/sign-in" element={<SignInPage />} />
				<Route path="/auth/sign-up" element={<SignUpPage />} />
				<Route element={<ProtectedRoute />}>
					<Route element={<DashboardLayout />}>
						<Route path="/" element={<DashboardPage />} />
						<Route path="/agents" element={<AgentsPage />} />
						<Route path="/agents/new" element={<AgentCreatePage />} />
						<Route path="/agents/:id" element={<AgentDetailPage />} />
						<Route path="/tools" element={<ToolsPage />} />
						<Route path="/tools/new" element={<ToolCreatePage />} />
						<Route path="/tools/:id" element={<ToolDetailPage />} />
						<Route path="/runs" element={<RunsPage />} />
						<Route path="/runs/:id" element={<RunDetailPage />} />
						<Route path="/settings" element={<SettingsLayout />}>
							<Route index element={<Navigate to="/settings/organization" replace />} />
							<Route path="organization" element={<SettingsOrganizationPage />} />
							<Route path="connectors" element={<ConnectorsPage />} />
							<Route path="connectors/new" element={<ConnectorCreatePage />} />
							<Route path="connectors/:id" element={<ConnectorDetailPage />} />
						</Route>
					</Route>
				</Route>
			</Routes>
		</AuthProvider>
	);
}
