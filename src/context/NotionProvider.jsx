import { useEffect, useState, useRef } from "react";
import { NotionContext } from './NotionContext';
import { invoke } from '@tauri-apps/api/core';
import {
    debug,
    info,
    error,

} from '@tauri-apps/plugin-log';

import { fetch as fetchApi } from '@tauri-apps/plugin-http';


const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL;
const MAX_POLL_COUNT = 60; // 轮询最大次数，2分钟

export default function NotionProvider({ children }) {


    // 登录信息
    const [authInfo, setAuthInfo] = useState(null);

    /* 状态: 
    not_start 未开始/没有Auth信息, 
    waiting 轮询中, 
    success 成功, 
    failed 有Auth但登录失败 
    */
    const [state, setState] = useState("not_start");


    // 轮询状态计时器
    const stateTimer = useRef();
    const pollCount = useRef(0); // 轮询计数


    useEffect(() => {
        info("初始化，获取本地auth信息 loadAuthInfo")
        loadAuthInfo();
    }, []);

    useEffect(() => {
        localStorage.setItem('notionState', state);
        localStorage.setItem('notionAuthInfo', JSON.stringify(authInfo));
    }, [state, authInfo]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'notionState' && e.newValue && e.newValue !== state) {
                setState(e.newValue);
            }
            if (e.key === 'notionAuthInfo' && e.newValue && e.newValue !== authInfo) {
                setAuthInfo(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, [state]);

    // 加载本地登录信息
    const loadAuthInfo = async () => {
        setState("waiting")

        try {
            const authInfo = await invoke("load_auth_info")
            if (authInfo) {
                // 增加token校验，如果校验失败，则设置状态为failed
                debug("loadAuthInfo", authInfo)
                setAuthInfo(authInfo)
                checkToken(authInfo)
            } else {
                error("loadAuthInfo failed")
                setState("not_start")
            }
        } catch (err) {
            error(err.toString())
            setState("failed")
        }
    }

    // 内部函数，检查token是否有效
    const checkToken = async (authInfo) => {

        try {
            const res = await fetchApi(`${NOTION_SERVER_URL}/api/notion/introspect`, {
                method: "POST",
                body: JSON.stringify({ token: authInfo.access_token })
            })
            const data = await res.json()
            debug("token校验:" + JSON.stringify(data))
            if (data.status === "success") {
                if (data.data.active) {
                    setState("success")
                    info("token校验成功")
                    return true
                } else {
                    setState("failed")
                    info("token校验失败，token已过期")
                    return false
                }
            }

            info("token校验失败")
            setState("failed")
            return false

        } catch (err) {
            error(err.toString())
            setState("failed")
            return false
        }
    }

    // 开始轮询，设置状态为waiting
    const startPolling = async (uuid) => {
        setState("waiting")

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
                    info("notion status success")
                    debug("pollStatus:" + JSON.stringify(data.data))

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
                    info("save_auth_info:" + JSON.stringify(res))
                    if (res.success) {
                        setAuthInfo(auth)
                        setState("success")
                    } else {
                        setState("failed")
                    }
                    clearInterval(stateTimer.current);
                } else {

                    info("pollStatus:" + JSON.stringify(data))
                }
                // 可根据需要处理其他状态
            } catch (err) {
                // 可以忽略，或者做重试
                error(err.toString())
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


    // 取消登录的轮询，设置状态为not_start
    const stopPolling = () => {
        if (stateTimer.current) {
            clearInterval(stateTimer.current);
            setState("not_start")
        }
    }

    // 退出登录，设置状态为not_start
    const logout = async () => {
        try {

            info("logout")
            const resp = await fetchApi(`${NOTION_SERVER_URL}/api/notion/revoke`, {
                method: "POST",
                body: JSON.stringify({
                    token: authInfo.access_token,
                })
            });
            const data = await resp.json();

            debug("revoke data:" + JSON.stringify(data))

            // 这里根据你的后端接口返回格式判断是否绑定成功
            if (data.status === "success") {
                const res = await invoke("clear_auth_info")

                debug("clear_auth_info res:" + JSON.stringify(res))

                if (res.success) {
                    setState("not_start")
                    setAuthInfo(null)
                } else {
                    setState("failed")
                }
            }
        } catch (error) {
            console.error(error.toString())
        }
    }

    const selectPage = async (id) => {
        info("selectPage:" + id)

        try {
            const res = await invoke("select_page", { id })
            debug("selectPage res:" + JSON.stringify(res))
            if (res.success) {
                info("selectPage success")
                setAuthInfo(prev => ({ ...prev, duplicated_template_id: id }))
            }
        } catch (err) {
            error(err.toString())
        }
    }

    const contextValue = {
        authInfo,
        state,
        startPolling,
        stopPolling,
        logout,
        selectPage,
    };


    return (
        <NotionContext.Provider value={contextValue}>
            {children}
        </NotionContext.Provider>
    );
}