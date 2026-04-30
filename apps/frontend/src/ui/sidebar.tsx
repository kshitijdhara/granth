import {
	ArchiveBoxIcon,
	ArrowRightStartOnRectangleIcon,
	Bars3Icon,
	BookOpenIcon,
	InboxIcon,
	MoonIcon,
	SparklesIcon,
	SunIcon,
	UserCircleIcon,
	UsersIcon,
	XMarkIcon,
} from "@heroicons/react/24/solid";
import type React from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import WorkspaceSelector from "@/features/workspaces/workspace-selector";
import { useTheme } from "@/theme.context";
import "./sidebar.scss";

interface SidebarProps {
	isOpen: boolean;
	onToggle: () => void;
}

const NAV_ITEMS = [
	{ key: "inbox", path: "/inbox", label: "Inbox", Icon: InboxIcon },
	{ key: "truth", path: "/truth", label: "Truth", Icon: BookOpenIcon },
	{ key: "motion", path: "/motion", label: "In Motion", Icon: SparklesIcon },
	{ key: "archive", path: "/archive", label: "Archive", Icon: ArchiveBoxIcon },
	{ key: "group", path: "/group", label: "Group", Icon: UsersIcon },
] as const;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, logout } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const [isCollapsing, setIsCollapsing] = useState(false);

	const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";
	if (isAuthRoute) return null;

	const isActive = (path: string) =>
		path === "/inbox"
			? location.pathname === "/inbox" || location.pathname === "/"
			: location.pathname.startsWith(path);

	const handleToggle = () => {
		if (isOpen) {
			setIsCollapsing(true);
			setTimeout(() => setIsCollapsing(false), 220);
		}
		onToggle();
	};

	return (
		<nav
			className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--closed"}`}
			aria-label="Main navigation"
		>
			<div className="sidebar__inner">
				<div className="sidebar__header">
					<button
						type="button"
						className="sidebar__toggle"
						onClick={handleToggle}
						aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
					>
						{isOpen ? (
							<XMarkIcon className="sidebar__icon" />
						) : (
							<Bars3Icon className="sidebar__icon" />
						)}
					</button>
					{isOpen && !isCollapsing && (
						<button type="button" className="sidebar__brand" onClick={() => navigate("/inbox")}>
							Granth
						</button>
					)}
				</div>

				{isAuthenticated && isOpen && (
					<div className="sidebar__workspace">
						<WorkspaceSelector isOpen={isOpen} />
					</div>
				)}

				<nav className="sidebar__nav" aria-label="Primary navigation">
					{NAV_ITEMS.map(({ key, path, label, Icon }) => (
						<button
							type="button"
							key={key}
							className={`sidebar__nav-item ${isActive(path) ? "sidebar__nav-item--active" : ""}`}
							onClick={() => navigate(path)}
							title={label}
						>
							<Icon className="sidebar__icon" />
							{isOpen && !isCollapsing && <span className="sidebar__nav-label">{label}</span>}
						</button>
					))}
				</nav>

				<div className="sidebar__footer">
					<button
						type="button"
						className="sidebar__nav-item sidebar__nav-item--theme"
						onClick={toggleTheme}
						title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
						aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
					>
						{theme === "light" ? (
							<MoonIcon className="sidebar__icon" />
						) : (
							<SunIcon className="sidebar__icon" />
						)}
						{isOpen && !isCollapsing && (
							<span className="sidebar__nav-label">
								{theme === "light" ? "Dark mode" : "Light mode"}
							</span>
						)}
					</button>

					{isAuthenticated ? (
						<>
							<button
								type="button"
								className={`sidebar__nav-item ${isActive("/profile") ? "sidebar__nav-item--active" : ""}`}
								onClick={() => navigate("/profile")}
								title="Profile"
							>
								<UserCircleIcon className="sidebar__icon" />
								{isOpen && !isCollapsing && <span className="sidebar__nav-label">Profile</span>}
							</button>
							<button
								type="button"
								className="sidebar__nav-item sidebar__nav-item--logout"
								onClick={() => void logout()}
								title="Sign out"
							>
								<ArrowRightStartOnRectangleIcon className="sidebar__icon" />
								{isOpen && !isCollapsing && <span className="sidebar__nav-label">Sign out</span>}
							</button>
						</>
					) : (
						<button
							type="button"
							className="sidebar__nav-item sidebar__nav-item--active"
							onClick={() => navigate("/login")}
							title="Sign in"
						>
							<ArrowRightStartOnRectangleIcon className="sidebar__icon" />
							{isOpen && !isCollapsing && <span className="sidebar__nav-label">Sign in</span>}
						</button>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Sidebar;
