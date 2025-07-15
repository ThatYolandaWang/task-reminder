

import { useRef, useState, useEffect } from "react";
import { open as openShell } from "@tauri-apps/plugin-shell";
import Button from "./components/button"
import { LoaderCircle } from "lucide-react"
import { v4 as uuidv4 } from 'uuid';

import { fetch as fetchApi } from '@tauri-apps/plugin-http';


const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID;
const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL;

const NOTION_REDIRECT_URI = `${NOTION_SERVER_URL}/api/notion/callback`



export default function NotionLoginButton() {
    const [user, setUser] = useState(null)
    const stateTimer = useRef(); // 防抖计时器

    const [state, setState] = useState("not_start") // 状态: not_start, waiting, success, failed
    const pollCount = useRef(0); // 轮询计数

    async function handleLinkToNotion() {

        setState("waiting")

        const uuid = uuidv4()

        const url = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${NOTION_REDIRECT_URI}&state=${uuid}`
        await openShell(url)

        pollCount.current = 0

        // 轮询函数
        async function pollStatus() {

            pollCount.current += 1
            try {
                const resp = await fetchApi(`${NOTION_SERVER_URL}/api/notion/status?state=${uuid}`, {
                    method: "GET",
                });
                const data = await resp.json();
                // 这里根据你的后端接口返回格式判断是否绑定成功
                if (data.status === "success") {
                    clearInterval(stateTimer.current);
                    // 成功后的处理，如弹窗、跳转、刷新页面等
                    setUser(data.data)
                    setState("success")
                } else {
                    console.log(data)
                }
                // 可根据需要处理其他状态
            } catch (err) {
                // 可以忽略，或者做重试
                console.error(err)
            }

            if (pollCount.current > 10) {
                clearInterval(stateTimer.current);
                setState("failed")
            }
        }

        // 清除已有定时器，防止多次开启
        if (stateTimer.current) clearInterval(stateTimer.current);
        // 2秒轮询一次
        stateTimer.current = setInterval(pollStatus, 2000);
    }

    useEffect(() => {
        console.log(pollCount.current)
    }, [])

    return (
        <div className="flex flex-row items-center justify-center gap-4">
            <Button onClick={handleLinkToNotion}>链接到我的Notion</Button>
            {state === "waiting" && <LoaderCircle className="animate-spin" />}
            {state === "failed" && <div>轮询超时</div>}
            {user && <div>
                {user}
            </div>}
        </div>
    )
}