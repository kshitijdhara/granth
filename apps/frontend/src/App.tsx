import type React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ArchivePage from "@/features/archive/archive.page";
import LoginPage from "@/features/auth/login.page";
import RegisterPage from "@/features/auth/register.page";
import ComposerPage from "@/features/composer/composer.page";
import DecisionRoomPage from "@/features/decision/decision-room.page";
import InboxPage from "@/features/inbox/inbox.page";
import MotionPage from "@/features/motion/motion.page";
import TruthPage from "@/features/truth/truth.page";
import ProfilePage from "@/features/user/profile.page";
import WorkspaceListPage from "@/features/workspaces/workspace-list.page";
import WorkspaceSettingsPage from "@/features/workspaces/workspace-settings.page";
import MainLayout from "@/layouts/main.layout";
import "@/styles/global.scss";

const App: React.FC = () => (
	<Routes>
		<Route path="/" element={<Navigate to="/inbox" replace />} />

		<Route path="/inbox" element={<MainLayout />}>
			<Route index element={<InboxPage />} />
		</Route>

		<Route path="/truth" element={<MainLayout />}>
			<Route index element={<TruthPage />} />
			<Route path=":id" element={<TruthPage />} />
		</Route>

		<Route path="/truth/:id/compose" element={<MainLayout />}>
			<Route index element={<ComposerPage />} />
		</Route>

		<Route path="/motion" element={<MainLayout />}>
			<Route index element={<MotionPage />} />
		</Route>

		<Route path="/proposals/:id" element={<MainLayout />}>
			<Route index element={<DecisionRoomPage />} />
		</Route>

		<Route path="/archive" element={<MainLayout />}>
			<Route index element={<ArchivePage />} />
		</Route>

		<Route path="/group" element={<MainLayout />}>
			<Route index element={<WorkspaceListPage />} />
			<Route path=":id/settings" element={<WorkspaceSettingsPage />} />
		</Route>

		<Route path="/profile" element={<MainLayout />}>
			<Route index element={<ProfilePage />} />
		</Route>

		<Route path="/login" element={<LoginPage />} />
		<Route path="/register" element={<RegisterPage />} />

		{/* Legacy redirects so old links still work */}
		<Route path="/home" element={<Navigate to="/inbox" replace />} />
		<Route path="/documents" element={<Navigate to="/truth" replace />} />
		<Route path="/documents/:id" element={<Navigate to="/truth" replace />} />
		<Route path="/workspaces" element={<Navigate to="/group" replace />} />
		<Route path="/workspaces/:id/settings" element={<Navigate to="/group" replace />} />
	</Routes>
);

export default App;
