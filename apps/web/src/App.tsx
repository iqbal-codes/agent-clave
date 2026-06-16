import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./providers/auth-provider";
import { ProtectedRoute } from "./components/protected-route";
import { SignInPage } from "./features/auth/sign-in";
import { SignUpPage } from "./features/auth/sign-up";
import { DashboardPage } from "./features/dashboard/dashboard";
import { AgentsPage } from "./features/agents/agents";
import { AgentDetailPage } from "./features/agents/agent-detail";
import { ToolsPage } from "./features/tools/tools";
import { ToolDetailPage } from "./features/tools/tool-detail";
import { ConnectorsPage } from "./features/connectors/connectors";
import { RunsPage } from "./features/runs/runs";
import { RunDetailPage } from "./features/runs/run-detail";
import { ApprovalsPage } from "./features/approvals/approvals";
import { AuditPage } from "./features/audit/audit";
import { SettingsOrganizationPage } from "./features/settings/organization";
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
						<Route path="/tools/:id" element={<ToolDetailPage />} />
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
