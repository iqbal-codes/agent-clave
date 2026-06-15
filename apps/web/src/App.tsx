import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./providers/auth-provider";
import { ProtectedRoute } from "./components/protected-route";
import { SignInPage } from "./pages/auth/sign-in";
import { SignUpPage } from "./pages/auth/sign-up";
import { DashboardPage } from "./pages/dashboard";
import { AgentsPage } from "./pages/agents";
import { AgentDetailPage } from "./pages/agent-detail";
import { ToolsPage } from "./pages/tools";
import { ConnectorsPage } from "./pages/connectors";
import { RunsPage } from "./pages/runs";
import { RunDetailPage } from "./pages/run-detail";
import { ApprovalsPage } from "./pages/approvals";
import { AuditPage } from "./pages/audit";
import { SettingsOrganizationPage } from "./pages/settings/organization";
import { DashboardLayout } from "./components/layout/dashboard-layout";

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
						<Route path="/agents/:id" element={<AgentDetailPage />} />
						<Route path="/tools" element={<ToolsPage />} />
						<Route path="/connectors" element={<ConnectorsPage />} />
						<Route path="/runs" element={<RunsPage />} />
						<Route path="/runs/:id" element={<RunDetailPage />} />
						<Route path="/approvals" element={<ApprovalsPage />} />
						<Route path="/audit" element={<AuditPage />} />
						<Route path="/settings/organization" element={<SettingsOrganizationPage />} />
					</Route>
				</Route>
			</Routes>
		</AuthProvider>
	);
}
