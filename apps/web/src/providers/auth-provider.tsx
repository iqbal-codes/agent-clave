import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

interface AuthContextValue {
	session: Record<string, unknown> | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signIn: typeof authClient.signIn;
	signUp: typeof authClient.signUp;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();

	const handleSignOut = useCallback(async () => {
		await authClient.signOut();
		navigate("/auth/sign-in");
	}, [navigate]);

	const value = useMemo(
		() => ({
			session: session ?? null,
			isLoading: isPending,
			isAuthenticated: !!session,
			signIn: authClient.signIn,
			signUp: authClient.signUp,
			signOut: handleSignOut,
		}),
		[session, isPending, handleSignOut],
	);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
