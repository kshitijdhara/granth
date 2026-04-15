import {
	BuildingOffice2Icon,
	ChevronUpDownIcon,
	Cog6ToothIcon,
	PlusIcon,
} from "@heroicons/react/24/solid";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "./workspace.context";
import "./workspace-selector.scss";

interface WorkspaceSelectorProps {
	isOpen: boolean; // sidebar expanded/collapsed
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ isOpen }) => {
	const navigate = useNavigate();
	const { workspaces, current, setCurrent } = useWorkspace();
	const [expanded, setExpanded] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Close dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setExpanded(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	if (!isOpen) {
		// Collapsed sidebar: show icon only, click opens workspace list
		return (
			<button
				type="button"
				className="ws-selector ws-selector--collapsed"
				onClick={() => navigate("/workspaces")}
				title={current?.name ?? "Workspaces"}
				aria-label="Workspaces"
			>
				<BuildingOffice2Icon className="ws-selector__icon" />
			</button>
		);
	}

	return (
		<div className="ws-selector" ref={ref}>
			<button
				type="button"
				className="ws-selector__trigger"
				onClick={() => setExpanded((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={expanded}
			>
				<BuildingOffice2Icon className="ws-selector__trigger-icon" />
				<span className="ws-selector__trigger-name">
					{current?.name ?? "Select workspace"}
				</span>
				<ChevronUpDownIcon className="ws-selector__chevron" />
			</button>

			{expanded && (
				<div className="ws-selector__dropdown" role="listbox">
					{workspaces.map((ws) => (
						<button
							key={ws.id}
							type="button"
							role="option"
							aria-selected={ws.id === current?.id}
							className={`ws-selector__option ${ws.id === current?.id ? "ws-selector__option--active" : ""}`}
							onClick={() => {
								setCurrent(ws.id);
								setExpanded(false);
							}}
						>
							<span className="ws-selector__option-name">{ws.name}</span>
							{ws.id === current?.id && (
								<button
									type="button"
									className="ws-selector__settings-btn"
									onClick={(e) => {
										e.stopPropagation();
										setExpanded(false);
										navigate(`/workspaces/${ws.id}/settings`);
									}}
									title={`Settings for ${ws.name}`}
									aria-label={`Settings for ${ws.name}`}
								>
									<Cog6ToothIcon style={{ width: 13, height: 13 }} />
								</button>
							)}
						</button>
					))}

					<div className="ws-selector__divider" />

					<button
						type="button"
						className="ws-selector__new"
						onClick={() => {
							setExpanded(false);
							navigate("/workspaces");
						}}
					>
						<PlusIcon style={{ width: 13, height: 13 }} />
						New workspace
					</button>
				</div>
			)}
		</div>
	);
};

export default WorkspaceSelector;
