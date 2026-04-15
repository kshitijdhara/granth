import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth.context";
import type { Workspace } from "./types";
import { workspacesApi } from "./workspaces.api";

interface WorkspaceContextValue {
	workspaces: Workspace[];
	current: Workspace | null;
	setCurrent: (id: string) => void;
	loading: boolean;
	refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = "granth:workspace";

function readStoredId(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

function writeStoredId(id: string | null) {
	try {
		if (id) localStorage.setItem(STORAGE_KEY, id);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {}
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isAuthenticated } = useAuth();
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [currentId, setCurrentId] = useState<string | null>(readStoredId);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (!isAuthenticated) return;
		setLoading(true);
		try {
			const list = await workspacesApi.getAll();
			setWorkspaces(list ?? []);

			// Validate stored id is still valid; if not, pick first workspace
			const storedId = readStoredId();
			const valid = list?.find((w) => w.id === storedId);
			if (!valid) {
				const first = list?.[0]?.id ?? null;
				setCurrentId(first);
				writeStoredId(first);
			}
		} catch {
			setWorkspaces([]);
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		if (isAuthenticated) {
			void refresh();
		} else {
			setWorkspaces([]);
			setCurrentId(null);
		}
	}, [isAuthenticated, refresh]);

	const setCurrent = (id: string) => {
		setCurrentId(id);
		writeStoredId(id);
	};

	const current = workspaces.find((w) => w.id === currentId) ?? null;

	return (
		<WorkspaceContext.Provider value={{ workspaces, current, setCurrent, loading, refresh }}>
			{children}
		</WorkspaceContext.Provider>
	);
};

export const useWorkspace = (): WorkspaceContextValue => {
	const ctx = useContext(WorkspaceContext);
	if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
	return ctx;
};
