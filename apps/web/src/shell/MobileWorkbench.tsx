import {
	RiChat1Line as Chat,
	RiCloseLine as Close,
	RiFolderLine as Folder,
	RiChatNewLine as NewChat,
} from "@remixicon/react";
import { useT } from "@thinkrail/locales/react";
import { Button, IconButton } from "@thinkrail/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@thinkrail/ui/dialog";
import { type ReactNode, useEffect, useState } from "react";
import { QuietScrollArea } from "../components/QuietScrollArea";
import { chatLabel, type LayoutAttention, readLayoutSelection } from "../lib";
import { ProjectTree } from "../panels/ProjectTree";
import {
	collectCenterGroups,
	type LayoutCenterTab,
	selectTab,
	type WorkspaceLayoutDocument,
} from "./layout";
import { WorkspaceChatHistory } from "./WorkspaceChatHistory";

export function MobileWorkbench({
	workspaceId,
	document,
	attention,
	chatFirstPrompts,
	renderTabBody,
	renderEmptyCenter,
	onAttentionChange,
	onNewChat,
	onCloseChat,
	onRenameChat,
}: {
	workspaceId: string;
	document: WorkspaceLayoutDocument;
	attention: LayoutAttention;
	chatFirstPrompts: Record<string, string | undefined>;
	renderTabBody: (tab: LayoutCenterTab) => ReactNode;
	renderEmptyCenter: (groupId: string) => ReactNode;
	onAttentionChange: (attention: LayoutAttention) => void;
	onNewChat: (groupId: string) => void;
	onCloseChat: (sessionId: string) => void;
	onRenameChat?: (sessionId: string, titleInput: string, currentTitle: string) => void;
}) {
	const t = useT();
	const [drawer, setDrawer] = useState<"projects" | "sessions" | null>(null);
	useEffect(() => setDrawer(null), [workspaceId]);
	const groups = collectCenterGroups(document.center);
	const group = groups.find((item) => item.id === attention.lastFocusedCenterGroupId) ?? groups[0];
	if (!group) return null;
	const selected =
		group.tabs.find((tab) => tab.id === readLayoutSelection(attention, group.id)) ?? group.tabs[0];
	const sessions = groups.flatMap((item) =>
		item.tabs.flatMap((tab) => (tab.kind === "chat" ? [{ tab, groupId: item.id }] : [])),
	);

	return (
		<div data-testid="mobile-workbench" className="flex h-full min-h-0 min-w-0 flex-col">
			<div className="flex h-40 shrink-0 items-center gap-4 border-b border-border-default bg-container-header-bg px-8">
				<IconButton
					variant="ghost"
					size="l"
					icon={Folder}
					label={t("shell.projectHome.projects")}
					data-testid="mobile-projects"
					onClick={() => setDrawer("projects")}
				/>
				<IconButton
					variant="ghost"
					size="l"
					icon={Chat}
					label={t("shell.mobile.sessions")}
					data-testid="mobile-sessions"
					onClick={() => setDrawer("sessions")}
				/>
				<span className="min-w-0 flex-1 truncate tr-text-ui text-text-muted">
					{selected?.kind === "chat"
						? chatLabel(t, selected.name, chatFirstPrompts[selected.sessionId]).text
						: selected?.name}
				</span>
				<IconButton
					variant="ghost"
					size="l"
					icon={NewChat}
					label={t("workbench.center.newChat")}
					data-testid="mobile-new-chat"
					onClick={() => onNewChat(group.id)}
				/>
			</div>
			<div data-testid="editor-pane" className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
				{selected ? renderTabBody(selected) : renderEmptyCenter(group.id)}
			</div>
			<Dialog open={drawer !== null} onOpenChange={(open) => !open && setDrawer(null)}>
				<DialogContent
					data-testid="mobile-drawer"
					aria-describedby={undefined}
					className="top-0 left-0 h-full w-[min(320px,90vw)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none p-0"
				>
					<DialogTitle className="border-b border-border-default px-16 py-12">
						{drawer === "projects" ? t("shell.projectHome.projects") : t("shell.mobile.sessions")}
					</DialogTitle>
					{drawer === "projects" ? (
						<QuietScrollArea
							data-testid="left-nav"
							className="min-h-0 flex-1"
							viewportClassName="p-panel-inset"
							onClick={(event) => {
								const target = event.target;
								if (!(target instanceof Element)) return;
								const button = target.closest("button");
								if (
									button?.closest('[data-testid="workspace-item"]') &&
									button.querySelector('[data-testid="workspace-name"]')
								) {
									setDrawer(null);
								}
							}}
						>
							<ProjectTree />
						</QuietScrollArea>
					) : (
						<div className="flex min-h-0 flex-1 flex-col p-8">
							<div className="flex items-center justify-between">
								<Button
									variant="ghost"
									size="l"
									iconLeft={NewChat}
									onClick={() => {
										setDrawer(null);
										onNewChat(group.id);
									}}
								>
									{t("workbench.center.newChat")}
								</Button>
								<WorkspaceChatHistory
									workspaceId={workspaceId}
									targetGroupId={group.id}
									{...(onRenameChat ? { onRenameChat } : {})}
								/>
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto">
								{sessions.map(({ tab, groupId }) => (
									<div key={tab.id} className="flex items-center">
										<Button
											variant="ghost"
											size="l"
											selected={selected?.id === tab.id}
											data-testid="mobile-session"
											className="min-w-0 flex-1 justify-start"
											onClick={() => {
												onAttentionChange(
													selectTab(attention, { area: "center", groupId }, tab.id),
												);
												setDrawer(null);
											}}
										>
											<span className="truncate">
												{chatLabel(t, tab.name, chatFirstPrompts[tab.sessionId]).text}
											</span>
										</Button>
										<IconButton
											variant="ghost"
											size="l"
											icon={Close}
											label={t("common.close")}
											data-testid="mobile-close-session"
											onClick={() => onCloseChat(tab.sessionId)}
										/>
									</div>
								))}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
