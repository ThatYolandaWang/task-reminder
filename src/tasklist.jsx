"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotionContext } from '@/context/NotionContext';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import NotionCalender from '@/components/notion-calender';
import NotionTaskDetail from '@/components/notion-taskdetail';
import NotionPage from '@/components/notion-page';
import NotionLoginButton from '@/components/notion';
import Loading from '@/components/ui/loading';

import { Plus, AlarmClock, CalendarDays, Bell } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { info } from '@tauri-apps/plugin-log';
import { toast } from "sonner";
import { startOfDay, startOfWeek, endOfDay, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { open as openShell } from "@tauri-apps/plugin-shell";

import MenuView from '@/components/menu-view'


const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL;
const tabOptions = [
    { label: "今日", id: "today" },
    { label: "本周", id: "week" },
    { label: "日历", id: "calendar", icon: <CalendarDays /> }
]

const remindHoursOptions = [
    { label: '1小时', value: 1 },
    { label: '2小时', value: 2 },
    { label: '3小时', value: 3 }
]



export default function TaskList() {
    const {state, authInfo, latestVersion, updateVersion } = useNotionContext();  // 获取Notion状态
    const [selectedTab, setSelectedTab] = useState(tabOptions[0]);  // 当前选中的标签
    const [filterFinished, setFilterFinished] = useState(true);     // 是否过滤已完成任务
    const [isLoading, setIsLoading] = useState(false);

    const [remindLaterHours, setRemindLaterHours] = useState(1);

    // 用于控制自动获取焦点
    const taskRefs = useRef({});
    const [focusTaskId, setFocusTaskId] = useState(null);
    const processedFocusId = useRef(null); // 新增一个ref来记录已处理的ID

    const [items, setItems] = useState([]);



    // 添加任务
    const handleAddTask = useCallback(async () => {
        if (selectedTab.id !== "today") {
            changeTab(tabOptions[0])
        }

        setFilterFinished(true)

        const newTask = {
            localId: "new-" + uuidv4(),
            text: "",
            status: "未开始",
            percent: 0,
            id: "",
            time: {
                start: getLocalISOStringWithTZ(),
                end: null,
            },
            tags: []
        }

        console.log("newTask", newTask)
        // 使用函数式更新，避免依赖外部的 items
        setItems(prevItems => {
            const finalTask = { ...newTask, percent: prevItems.length === 0 ? 50 : 0 };
            return [...prevItems, finalTask];
        })

        setFocusTaskId(newTask.localId);

    }, [selectedTab])


    // 修改任务 - 最终简化版
    const handleChangeTask = useCallback(async (localId, updatedTask) => {
        const itemToSave = { ...updatedTask }; // 创建一个副本进行操作

        // 乐观更新UI，让用户立即看到变化
        setItems(prevItems => prevItems.map(item =>
            item.localId === localId ? itemToSave : item
        ));

        // 决定是新增还是更新
        try {
            if (itemToSave.id === "") { // ID为空，说明是新任务
                if (itemToSave.status === "完成") {
                    itemToSave.time.end = getLocalISOStringWithTZ();
                }
                const res = await invoke("add_task", { task: itemToSave });
                if (res.success) {
                    // 保存成功后，用后端返回的真实ID更新我们的状态
                    setItems(prev => prev.map(item =>
                        item.localId === localId ? { ...itemToSave, id: res.id } : item
                    ));
                } else {
                    toast.error(`创建失败: ${res.message}`);
                    // 创建失败，从UI上移除这个临时任务
                    setItems(prev => prev.filter(item => item.localId !== localId));
                }
            } else { // ID存在，说明是更新现有任务
                if (itemToSave.status === "完成" && !items.find(i => i.localId === localId)?.time.end) {
                    itemToSave.time.end = getLocalISOStringWithTZ();
                }
                const res = await invoke("update_task", { task: itemToSave });
                if (!res.success) {
                    toast.error(`更新失败: ${res.message}`);
                    // 更新失败，回滚到更新前的状态
                    const oldItem = items.find(i => i.localId === localId);
                    setItems(prev => prev.map(item => item.localId === localId ? oldItem : item));
                }
            }
        } catch (err) {
            toast.error(`操作失败: ${err}`);
            const oldItem = items.find(i => i.localId === localId);
            setItems(prev => prev.map(item => item.localId === localId ? oldItem : item));
        }

        orderItems();

    }, [items]);

    const orderItems = () => {
        if (items.length > 0) {

            function isSortedByPercentDesc(arr) {
                for (let i = 1; i < arr.length; i++) {
                    if (Number(arr[i - 1].percent) < Number(arr[i].percent)) {
                        return false;
                    }
                }
                return true;
            }

            if (isSortedByPercentDesc(items)) {
                return
            }
            setItems(prevItems => [...prevItems].sort((a, b) => Number(b.percent) - Number(a.percent)))
        }
    }

    async function remindLater() {
        try {
            await invoke("set_remind_later", {
                hours: Number(remindLaterHours)
            })
        } catch (err) {
            toast.error(err.message)
        }
    }


    // 初始化，登录成功时加载任务列表
    useEffect(() => {
        if (state === "success" && authInfo?.duplicated_template_id) {
            changeTab(tabOptions[0]);

        } else if (items.length > 0) {
            setItems([])
        }
    }, [state, authInfo]);


    // 添加任务，自动聚焦
    useEffect(() => {

        if (focusTaskId && taskRefs.current[focusTaskId] && focusTaskId !== processedFocusId.current) {
            taskRefs.current[focusTaskId].focusTextarea?.();
            processedFocusId.current = focusTaskId; // 记录下来，防止重复聚焦
        }
    }, [focusTaskId, items]);


    const loadTasks = useCallback(async (id, date = new Date()) => {

        try {
            if (state != "success" || !authInfo?.duplicated_template_id) {
                return
            }

            setIsLoading(true)
            info("loadTasks")

            //根据tab拼接搜索条件
            const start =
                id === "today" ? startOfDay(date).toISOString() :
                    id === "week" ? startOfWeek(date).toISOString() :
                        startOfMonth(date).toISOString()

            const end =
                id === "today" ? endOfDay(date).toISOString() :
                    id === "week" ? endOfWeek(date).toISOString() :
                        endOfMonth(date).toISOString()

            const status = "0"

            const res = await invoke("load_tasks", {
                params: {
                    start: start,
                    end: end,
                    status: status
                }
            })


            if (res.success) {
                setItems(res.tasks.tasks.map(item => ({ ...item, localId: item.id, day: new Date(item.time.start).getDate() })));
                orderItems()
            } else {
                if (res.status == "unauthorized") {
                    toast.error("请重新登陆, unauthorized")
                } else if (res.status == "validation_error") {
                    toast.error("数据库格式错误，请重新登陆并选择以模板创建的数据库")
                } else {
                    toast.error("加载失败！")
                }
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [selectedTab, state])

    const changeTab = async (tab) => {
        setSelectedTab(tab);
        await loadTasks(tab.id);
    }

    return (
        <MenuView loadTasks={() => loadTasks(selectedTab.id)}>
            <div className="flex flex-col h-screen">
                <Header
                    selectedTab={selectedTab}
                    setSelectedTab={changeTab}
                    filterFinished={filterFinished}
                    setFilterFinished={setFilterFinished} />
                {state === "success" ?
                    <SuccessView
                        selectedTab={selectedTab}
                        items={items}
                        handleChangeTask={handleChangeTask}
                        loadTasks={loadTasks}
                        filterFinished={filterFinished}
                        setItems={setItems}
                        taskRefs={taskRefs}
                        isLoading={isLoading}
                    /> :
                    <UnLoginView />
                }

                <Footer
                    handleAddTask={handleAddTask}
                    remindLaterHours={remindLaterHours}
                    setRemindLaterHours={setRemindLaterHours}
                    remindLater={remindLater}
                    latestVersion={latestVersion}
                    updateVersion={updateVersion}
                />

            </div>
        </MenuView>
    )
}
const SuccessView = ({ selectedTab, items, handleChangeTask, loadTasks, filterFinished, setItems, taskRefs, isLoading }) => {
    return (
        <AnimatePresence mode="wait" className='flex-1 '>
            <motion.div
                key={selectedTab.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center flex-1 gap-2 relative">


                {/* 日历模式避免重新加载，loading在组件内部展示 */}
                {selectedTab.id === "calendar" ? (
                    <NotionCalender
                        items={items}
                        handleChangeTask={handleChangeTask}
                        loadTasks={loadTasks}
                    />
                ) : (
                    <NotionTaskDetail
                        items={items}
                        filterFinished={filterFinished}
                        setItems={setItems}
                        handleChangeTask={handleChangeTask}
                        taskRefs={taskRefs}
                    />
                )}

                {isLoading && <Loading className="absolute top-0 left-0" />}

            </motion.div>
        </AnimatePresence>
    )
}
const UnLoginView = () => {
    useEffect(() => {
        console.log("UnLoginView")
    }, [])
    return (
        <div className="flex justify-center items-center h-screen">
            <NotionLoginButton />
        </div>
    )
}

const Header = ({ selectedTab, setSelectedTab, filterFinished, setFilterFinished }) => {

    const handleJumpToPortal = async () => {
        const url = `${NOTION_SERVER_URL}`
        await openShell(url)
    }
    return (
        <div className="grid grid-cols-3 justify-between items-center h-10">
            <div className='flex flex-row justify-start items-center'>
                <NotionPage />
            </div>


            <div className='flex flex-row justify-center items-center'>
                {tabOptions.map((item, idx) => (
                    <Button key={idx} size="sm" variant={selectedTab.label === item.label ? "default" : "ghost"} onClick={() => {
                        setSelectedTab(item)
                        //loadTasks(item.id)
                    }}>
                        {item.icon ? item.icon : item.label}
                    </Button>
                ))}
            </div>



            <div className='flex flex-row justify-end items-center'>
                <img src="/icon.png" alt="notion" width={20} height={20} className='cursor-pointer' onClick={handleJumpToPortal} />
                <NotionLoginButton compact={true} />
                <div className='flex flex-row items-center justify-end gap-2 px-2'>
                    <Label htmlFor="filterFinished" className='text-sm text-gray-500'>{filterFinished ? "进行中" : "已完成"}</Label>
                    <Switch id="filterFinished" checked={filterFinished} onCheckedChange={setFilterFinished} />
                </div>
            </div>
        </div>
    )
}

const Footer = ({ handleAddTask, remindLaterHours, setRemindLaterHours, remindLater, latestVersion, updateVersion }) => {
    
    return (
        <div className="flex flex-row justify-between items-center h-10 sticky bottom-0 bg-white">

            <div className='flex flex-row items-center justify-end gap-2 px-2'>
                <Button variant="ghost" onClick={remindLater}>
                    <AlarmClock className="flex-shrink-0" size={16} /> <span className="text-ellipsis whitespace-nowrap">稍后提醒</span>
                </Button>

                <Select value={remindLaterHours} onValueChange={setRemindLaterHours}>
                    <SelectTrigger>
                        <SelectValue placeholder="稍后提醒" />
                    </SelectTrigger>
                    <SelectContent>
                        {remindHoursOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className='flex flex-row items-center justify-end gap-2 px-2'>

                {/* 添加任务 */}
                <Button variant="ghost" onClick={handleAddTask}>
                    <Plus size={16} /> 添加任务
                </Button>
                {latestVersion &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className='text-sm flex flex-row items-center gap-1 cursor-pointer' onClick={updateVersion} autoFocus><Bell size={12} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className='text-sm'>立刻升级到{latestVersion.version}</p>
                            <p className='text-sm'>{latestVersion.body}</p>
                        </TooltipContent>
                    </Tooltip>
                }

            </div>
        </div>
    )
}



function getLocalISOStringWithTZ() {
    const date = new Date();
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = n => `${Math.floor(Math.abs(n))}`.padStart(2, '0');
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
}