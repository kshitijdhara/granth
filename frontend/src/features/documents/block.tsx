import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { Block } from "./types";
import "./block.scss";

interface BlockProps {
	block: Block;
	isEditing: boolean;
	onContentChange?: (id: string, content: string) => void;
	onSave?: (block: Block) => void;
	onAddBlock?: (parentId: string | null, type: string) => void;
	onDeleteBlock?: (id: string) => void;
	isAdding?: boolean;
}

const BlockView: React.FC<BlockProps> = ({
	block,
	isEditing,
	onContentChange,
	onSave,
	onAddBlock,
	onDeleteBlock,
	isAdding,
}) => {
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!showMenu) return;
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [showMenu]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		onContentChange?.(block.id, e.target.value);
	};

	const handleBlur = () => onSave?.({ ...block });

	const indent = { marginLeft: `${(block.order_path?.length ?? 1) * 20 - 20}px` };

	if (isEditing) {
		return (
			<div className="block block--editing" style={indent}>
				{block.block_type === "heading" ? (
					<input
						type="text"
						value={block.content}
						onChange={handleChange}
						onBlur={handleBlur}
						className="block__input block__input--heading"
						placeholder="Heading"
					/>
				) : block.block_type === "code" ? (
					<textarea
						value={block.content}
						onChange={handleChange}
						onBlur={handleBlur}
						className="block__textarea block__textarea--code"
						rows={8}
						placeholder="Code"
					/>
				) : (
					<textarea
						value={block.content}
						onChange={handleChange}
						onBlur={handleBlur}
						className="block__textarea block__textarea--text"
						rows={4}
						placeholder="Text"
					/>
				)}

				<div className="block__add-container">
					<button
						type="button"
						className="block__add-btn"
						onClick={() => setShowMenu(!showMenu)}
						disabled={isAdding}
					>
						<PlusIcon className="block__icon" />
					</button>
					<button
						type="button"
						className="block__delete-btn"
						onClick={() => onDeleteBlock?.(block.id)}
						disabled={isAdding}
					>
						<TrashIcon className="block__icon" />
					</button>
					{showMenu && (
						<div className="block__add-menu" ref={menuRef}>
							<div>
								<strong>Add Below:</strong>
								{(["text", "heading", "code"] as const).map((type) => (
									<button
										type="button"
										key={type}
										onClick={() => {
											onAddBlock?.(null, type);
											setShowMenu(false);
										}}
										disabled={isAdding}
									>
										{type.charAt(0).toUpperCase() + type.slice(1)}
									</button>
								))}
							</div>
							<div>
								<strong>Add Child:</strong>
								{(["text", "heading", "code"] as const).map((type) => (
									<button
										type="button"
										key={type}
										onClick={() => {
											onAddBlock?.(block.id, type);
											setShowMenu(false);
										}}
										disabled={isAdding}
									>
										{type.charAt(0).toUpperCase() + type.slice(1)}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={`block block--${block.block_type}`} style={indent}>
			{block.block_type === "heading" && <h2>{block.content}</h2>}
			{block.block_type === "code" && (
				<pre>
					<code>{block.content}</code>
				</pre>
			)}
			{block.block_type === "text" && <p>{block.content}</p>}
			{block.block_type !== "heading" &&
				block.block_type !== "code" &&
				block.block_type !== "text" && <div>{block.content}</div>}
		</div>
	);
};

export default BlockView;
