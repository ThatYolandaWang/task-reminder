import { useNotionContext } from '@/context/NotionContext';
import {Button} from '@/components/ui/button';
import { open as openShell } from "@tauri-apps/plugin-shell";
import { v4 as uuidv4 } from 'uuid';

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID;
const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL;
const NOTION_REDIRECT_URI = `${NOTION_SERVER_URL}/api/notion/callback`

export default function NotionLoginButton({compact = false}) {

    const { state, authInfo, startPolling, stopPolling } = useNotionContext();

    const handleClick = async () => {

        // 没有auth，或者token 过期，则跳转到notion登录页面，然后启动轮询，轮询成功后，再跳转到tasklist页面
        if (state === "not_start" || state === "failed") {
            const uuid = uuidv4()
            const url = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${NOTION_REDIRECT_URI}&state=${uuid}`
            await openShell(url)

            startPolling(uuid)
        }
        // 如果token 有效，则跳转到tasklist页面
        else if (state == "success") {
            let url = "https://www.notion.so"
            if (authInfo && authInfo.workspace_id) {
                url += "/" + authInfo.workspace_id
            }
            if (authInfo && authInfo.duplicated_template_id) {
                url += "/" + authInfo.duplicated_template_id
            }
            await openShell(url)
        }
    }

    if (compact) {
        return (
            <Button variant="ghost" onClick={handleClick} disabled={state === "waiting"}>
                <img src="/notionlogo.png" alt="notion" className={`w-5 h-5 flex-shrink-0 ${state == "waiting" && "animate-pulse"}`} />
            </Button>
        )
    }

    return (
        <div className='flex flex-col justify-center items-center'>
            <div className='flex flex-row items-center gap-2'>
                <Button variant="ghost" onClick={handleClick} disabled={state === "waiting"}>
                    <img src="/notionlogo.png" alt="notion" className={`w-5 h-5 flex-shrink-0 ${state == "waiting" && "animate-pulse"}`} />
                    {(state === "not_start" || state === "failed") && <span className="text-sm">登陆</span>}
                    {state === "waiting" && <span className="text-sm">登陆中 </span>}
                </Button>

                {state === "waiting" && 
                <Button variant="outline" onClick={stopPolling}>
                    <span className="text-sm">取消</span>
                </Button>}
            </div>
            {state === "failed" && <span className="text-sm text-gray-500">Token过期，请重新登陆 </span>}
        </div >
    )
}