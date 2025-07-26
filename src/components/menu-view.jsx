import { useState } from "react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { RefreshCw, Settings, Tag } from "lucide-react"
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import NotionTag from "@/components/notion-tag";

export default function MenuView({ children, loadTasks }) {

    const [open, setOpen] = useState(false);

    const handleRefresh = async () => {

        await loadTasks()
    }

    const handleOpenSettings = async () => {
        try {
            await invoke("open_settings_window")
        } catch (err) {
            toast.error(err.toString())
        }
    }

    const forceRefresh = async () => {
        try {
            window.location.reload();
        } catch (err) {
            toast.error(err.toString())
        }
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>{children}</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={handleRefresh}>
                        <RefreshCw />刷新
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpen(true)}>
                        <Tag />管理标签
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleOpenSettings}>
                        <Settings />设置
                    </ContextMenuItem>
                    <ContextMenuItem onClick={forceRefresh}>
                        <RefreshCw />强制刷新
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <NotionTag open={open} setOpen={setOpen} />
        </>
    )
}