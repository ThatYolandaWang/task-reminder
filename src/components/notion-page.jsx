import { useEffect, useState } from "react";
import { useNotionContext } from "@/context/NotionContext";
import { info, error, } from '@tauri-apps/plugin-log';
import { invoke } from '@tauri-apps/api/core';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { ListChecks } from "lucide-react";
import { check } from '@tauri-apps/plugin-updater';

export default function NotionPage() {

    const { state, authInfo, selectPage } = useNotionContext();

    const [pages, setPages] = useState([]);

    useEffect(() => {
        checkVersion()
    }, [])

    async function checkVersion() {
        try {

            const update = await check()
            if (update) {
                toast.info(`检查到有新版本: v${update.version}，可以前往 设置 中更新`)
            }
        } catch (error) {
            toast.error(error)
        }
    }

    useEffect(() => {
        if (state === "success") {
            loadPages()
        }
    }, [state])

    const loadPages = async () => {
        info("loadPages")

        try {
            const res = await invoke("load_pages")
            if (res.success) {
                info("loadPages success:" + JSON.stringify(res.pages.length))
                setPages(res.pages)
            } else {
                error("loadPages failed:" + JSON.stringify(res))
                if (res.status === "unauthorized") {
                    toast.error("获取认证信息失败，请尝试重新打开app")
                } else {
                    toast.error(res.status)
                }
            }
        } catch (err) {
            toast.error(err.toString())
        }
    }


    return (
        <Select value={authInfo?.duplicated_template_id} onValueChange={selectPage}>
            <SelectTrigger className="border-none shadow-none">
                <ListChecks className="flex-shrink-0" size={16} />
                <SelectValue placeholder="选择页面" />
            </SelectTrigger>
            <SelectContent>
                {pages.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}