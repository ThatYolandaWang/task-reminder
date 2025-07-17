import { useRef, useState, useEffect, useMemo } from "react";
import { open as openShell } from "@tauri-apps/plugin-shell";
import Button from "./components/button"
import FileTree from "./components/pages"
import { LoaderCircle, LogOut } from "lucide-react"
import { v4 as uuidv4 } from 'uuid';
import { fetch as fetchApi } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';


const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID;
const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL;
const NOTION_REDIRECT_URI = `${NOTION_SERVER_URL}/api/notion/callback`

const MAX_POLL_COUNT = 30;

export default function NotionLoginButton({ icon = false, onLogin }) {
    const stateTimer = useRef(); // 防抖计时器
    const [state, setState] = useState("not_start") // 状态: not_start, waiting, success, failed
    const [userData, setUserData] = useState(null)
    const pollCount = useRef(0); // 轮询计数
    const [pages, setPages] = useState([])
    const [error, setError] = useState("")
    const isInitial = useRef(false)


    // 1. 提升 openMap 到父组件
    const [openMap, setOpenMap] = useState({});


    // 2. 提供 toggleOpen 方法
    const toggleOpen = (id) => {
        setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
    };



    // 跳转到Notion登录页面
    const handleLinkToNotion = async () => {

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
                    console.log(typeof data.data)
                    console.log(data.data)

                    const auth = {
                        access_token: data.data.access_token,
                        bot_id: data.data.bot_id,
                        duplicated_template_id: data.data.duplicated_template_id ? data.data.duplicated_template_id.replace(/-/g, '') : "",
                        user: data.data.owner.user,
                        refresh_token: data.data.refresh_token,
                        request_id: data.data.request_id,
                        token_type: data.data.token_type,
                        workspace_icon: data.data.workspace_icon,
                        workspace_id: data.data.workspace_id ? data.data.workspace_id.replace(/-/g, '') : "",
                        workspace_name: data.data.workspace_name,
                    }
                    const res = await invoke("save_auth_info", { auth })
                    console.log(res)
                    emit("login", res.success)
                    onLogin(res.success)
                    // if (res.success) {
                    //     setUserData(auth)
                    //     setState("success")
                    //     onLogin(true)
                    // } else {
                    //     setState("failed")
                    // }
                    clearInterval(stateTimer.current);
                } else {
                    console.log(data.status)
                }
                // 可根据需要处理其他状态
            } catch (err) {
                // 可以忽略，或者做重试
                console.error(err.toString())
            }

            if (pollCount.current > MAX_POLL_COUNT) {
                clearInterval(stateTimer.current);
                setState("failed")
            }
        }

        // 清除已有定时器，防止多次开启
        if (stateTimer.current) clearInterval(stateTimer.current);
        // 2秒轮询一次
        stateTimer.current = setInterval(pollStatus, 2000);
    }

    const handleSelect = async (id) => {
        try {
            const res = await invoke("select_page", { id })
            if (res.success) {
                setUserData(prev => ({ ...prev, duplicated_template_id: id }))
                emit("change_page", id)
            }
        } catch (err) {
            console.error(err.toString())
        }
    }

    // 加载本地登录信息
    const loadAuthInfo = async () => {
        try {
            const authInfo = await invoke("load_auth_info")
            if (authInfo) {
                setUserData(authInfo)
                setState("success")
            } else {
                setState("failed")
            }
        } catch (err) {
            console.error(err.toString())
        }
    }

    // 加载页面列表
    const loadPages = async () => {
        
        // 如果icon模式，不加载页面
        if (icon) return;

        console.log("loadPages")
        try {
            const res = await invoke("load_pages")
            if (res.success) {
                setPages(res.pages)
            } else {
                if (res.status === "unauthorized") {
                    setError("获取认证信息失败，请尝试重新打开app")
                }else{
                    setError(res.status)
                }
                setState("failed")
                setUserData(null)
                
            }
        } catch (err) {
            console.error(err.toString())
            setError(err.toString())
        }
    }

    // 初始化时加载数据，只执行一次
    useEffect(() => {
        if (!isInitial.current) {
            console.log("initial load")
            loadAuthInfo()
            loadPages();
            isInitial.current = true
        }
    }, [])


    // 根据选中界面，设置 openMap
    useEffect(() => {
        if (!pages.length || !userData?.duplicated_template_id) return;

        // 1. 构建 id -> parent_id 映射
        const idToParent = {};
        pages.forEach(item => {
            idToParent[item.id] = item.parent_id;
        });

        // 2. 递归查找所有父节点
        const openIds = {};
        let currentId = userData.duplicated_template_id;
        while (currentId && idToParent[currentId]) {
            openIds[idToParent[currentId]] = true;
            currentId = idToParent[currentId];
        }

        // 3. 设置 openMap
        setOpenMap(openIds);

    }, [pages, userData?.duplicated_template_id]);


    // 监听登录状态，处理由task list发过来的登录状态变更
    useEffect(() => {
        const unlistenPromise = listen("login", (event) => {
            console.log("notion login", event.payload)

            if (event.payload) {
                loadAuthInfo();
                loadPages();
            } else {
                setState("failed")
                setUserData(null)
                setPages([])
            }
        })
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [])

    // 打开notion database界面
    async function handleOpenNotion() {
        if (["failed"].includes(state)) {
            await handleLinkToNotion()
        } else if (state === "success") {
            let url = "https://www.notion.so"
            if (userData && userData.workspace_id) {
                url += "/" + userData.workspace_id
            }
            if (userData && userData.duplicated_template_id) {
                url += "/" + userData.duplicated_template_id
            }
            await openShell(url)
        }
    }

    // 退出登录，通过代理服务器调用Notion的revoke接口，再清空rust的auth缓存
    async function handleLogout() {
        try {
            console.log("clear_auth_info")

            const resp = await fetchApi(`${NOTION_SERVER_URL}/api/notion/revoke`, {
                method: "POST",
                body: JSON.stringify({
                    token: userData.access_token,
                })
            });
            const data = await resp.json();

            console.log("revoke data:", data)

            // 这里根据你的后端接口返回格式判断是否绑定成功
            if (data.status === "success") {
                const res = await invoke("clear_auth_info")
                console.log("clear_auth_info res:", res)
                emit("login", !res.success)
            }
        } catch (error) {
            console.error(error.toString())
        }
    }


    // 重新计算页面，根据父子关系排列
    const pageTree = useMemo(() => {

        if (!isInitial.current || pages.length == 0) return [];

        const map = {};
        const roots = [];
        pages.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });
        pages.forEach(item => {
            if (item.parent_id && map[item.parent_id]) {
                map[item.parent_id].children.push(map[item.id]);
            } else {
                roots.push(map[item.id]);
            }
        });

        console.log("roots", roots)
        return roots;
    }, [pages, isInitial.current])

    const NotStart = () => {
        return (
            <div className="w-full flex justify-start">
                <Button onClick={handleLinkToNotion}>
                    <img src="/notionlogo.png" alt="notion" className="w-6 h-6" />
                    <span>登录Notion</span>
                </Button>
            </div>
        )
    }

    const Waiting = () => {
        return (
            <div className="flex flex-row items-center gap-2">
                <LoaderCircle className="animate-spin" /> <span className="text-sm"> 登陆中 </span>
            </div>
        )
    }

    const Success = () => {
        return (
            <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row items-center justify-between gap-2">
                    <div className="flex flex-row items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm text-gray-500">{userData?.user?.name?.slice(0, 1)}</span>
                        </div>
                        <span className="text-ellipsis whitespace-nowrap text-sm">{userData?.user?.name}</span>

                        <Button onClick={handleLogout}>
                            <LogOut size={16} />
                        </Button>
                    </div>

                    <Button onClick={handleOpenNotion}>
                        <img src="/notionlogo.png" alt="notion" className={`w-5 h-5 ${state == "waiting" && "animate-pulse"}`} />
                    </Button>


                </div>
                <div className="w-full flex flex-col gap-2 bg-gray-100 rounded-lg py-1">
                    <FileTree
                        data={pageTree}
                        select={userData?.duplicated_template_id}
                        onSelect={handleSelect}
                        openMap={openMap}
                        toggleOpen={toggleOpen}
                    />
                </div>
            </div>
        )
    }

    if (!isInitial.current) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-row items-center justify-center gap-4">
            {icon ? (
                <Button onClick={handleOpenNotion}>
                    <img src="/notionlogo.png" alt="notion" className={`w-5 h-5 flex-shrink-0 ${state == "waiting" && "animate-pulse"}`} />
                    {["failed", "not_start"].includes(state) && <span className="text-sm">登陆 </span>}
                    {["waiting"].includes(state) && <span className="text-sm"> 登陆中 </span>}
                </Button>
            ) : (
                <div className="w-full flex flex-col items-center justify-center gap-2">
                    {state === "waiting" ? <Waiting />
                        : state === "success" ? <Success /> :
                            <NotStart />}

                    {error && <div className="text-red-500 text-sm">{error}</div>}
                </div>
            )}
        </div>
    )

}