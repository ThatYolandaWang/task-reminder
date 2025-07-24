"use client"

import { useState, useEffect, useRef } from 'react';
import { useNotionContext } from '@/context/NotionContext';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import NotionCalender from '@/components/notion-calender';
import NotionTaskDetail from '@/components/notion-taskdetail';
import NotionPage from '@/components/notion-page';
import NotionLoginButton from '@/components/notion';
import Loading from '@/components/ui/loading';

import { Plus, AlarmClock, CalendarDays } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { info } from '@tauri-apps/plugin-log';
import { toast } from "sonner";
import { startOfDay, startOfWeek, endOfDay, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { open as openShell } from "@tauri-apps/plugin-shell";

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
    const { state, authInfo } = useNotionContext();  // 获取Notion状态
    const [selectedTab, setSelectedTab] = useState(tabOptions[0]);  // 当前选中的标签
    const [filterFinished, setFilterFinished] = useState(true);     // 是否过滤已完成任务
    const [isLoading, setIsLoading] = useState(false);

    const [remindLaterHours, setRemindLaterHours] = useState(1);

    // 用于控制自动获取焦点
    const taskRefs = useRef([]);
    const [focusTaskId, setFocusTaskId] = useState(null);

    // 任务列表
    const [items, setItems] = useState([]);

    // 标签项
    const [tags, setTags] = useState([]);


    // 添加任务
    const handleAddTask = async () => {
        if (selectedTab.id !== "today") {
            setSelectedTab(tabOptions[0])
            await loadTasks(tabOptions[0].id)

        }
        setFilterFinished(true)

        try {

            const newTask = {
                localId: "new-" + uuidv4(),
                text: "",
                status: "未开始",
                percent: items.length == 0 ? 50 : 0,
                id: "",
                time: {
                    start: getLocalISOStringWithTZ(),
                    end: null,
                    // time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                tags: []
            }

            console.log("newTask", newTask)
            setItems(prevItems => [...prevItems, newTask])

            const res = await invoke("add_task", {
                task: newTask
            })
            if (res.success) {
                newTask.id = res.id

                setFocusTaskId(newTask.localId);
            } else {
                toast.error(res.message)
                setItems(prevItems => prevItems.filter(item => item.localId == newTask.localId))
            }
        } catch (err) {
            toast.error("添加失败：" + err.message)
        }
    }

    // 修改任务
    const handleChangeTask = async (localId, newTask) => {

        try {
            
            const oldItem = items.find(item => item.localId === localId)

            if (newTask.status === "完成") {
                newTask.time.end = getLocalISOStringWithTZ()
            }

            setItems(prevItems => prevItems.map(item => item.localId === localId ? newTask : item))


            if (oldItem.id === "") {
                const res = await invoke("add_task", {
                    task: newTask
                })
                if (res.success) {
                    newTask.id = res.id
                    setItems(prevItems => prevItems.map(item => item.localId === localId ? newTask : item))

                } else {
                    // 如果失败，则恢复原来的任务
                    toast.error(res.message)
                    setItems(prevItems => [...prevItems, oldItem])
                }

            } else {
                const res = await invoke("update_task", {
                    task: newTask
                })
                if (!res.success) {

                    // 如果失败，则恢复原来的任务
                    toast.error(res.message)
                    setItems(prevItems => [...prevItems, oldItem])
                }
            }

        } catch (err) {
            toast.error("更新失败：" + err.message)
        }

        orderItems()
    }

    const orderItems = () => {
        setItems(prevItems => [...prevItems].sort((a, b) => Number(b.percent) - Number(a.percent)))
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
        } else {
            setItems([])
        }
    }, [state, authInfo]);


    // 添加任务，自动聚焦
    useEffect(() => {
        if (focusTaskId && taskRefs.current[focusTaskId]) {
            taskRefs.current[focusTaskId].focusTextarea?.();
            setFocusTaskId(null); // 聚焦后重置
        }
    }, [items, focusTaskId]);


    const loadTasks = async (id, date = new Date()) => {
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
    }

    const changeTab = (tab) => {
        setSelectedTab(tab);
        loadTasks(tab.id);
    }

    if (state === "failed" || state === "not_start" || state === "waiting") {
        return (
            <div className="flex justify-center items-center h-screen">
                <NotionLoginButton />
            </div>
        )
    }

    if (state === "success") {
        return (
            <div className="flex flex-col h-screen">

                <Header
                    selectedTab={selectedTab}
                    setSelectedTab={changeTab}
                    filterFinished={filterFinished}
                    setFilterFinished={setFilterFinished} />

                <AnimatePresence mode="wait" className='flex-1 '>
                    <motion.div
                        key={selectedTab.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center flex-1 gap-2">


                        {/* 日历模式避免重新加载，loading在组件内部展示 */}
                        {selectedTab.id === "calendar" ? (
                            <NotionCalender
                                items={items}
                                handleChangeTask={handleChangeTask}
                                loadTasks={loadTasks}
                                isLoading={isLoading}
                            />
                        ) : (isLoading) ? (
                            <Loading />
                        ) : (
                            <NotionTaskDetail
                                items={items}
                                filterFinished={filterFinished}
                                setItems={setItems}
                                handleChangeTask={handleChangeTask}
                                taskRefs={taskRefs}
                            />
                        )}


                    </motion.div>
                </AnimatePresence>

                <Footer
                    handleAddTask={handleAddTask}
                    remindLaterHours={remindLaterHours}
                    setRemindLaterHours={setRemindLaterHours}
                    remindLater={remindLater} />

            </div>
        )
    }
    return (
        <div className="flex flex-col h-screen">
            <div className="flex flex-col items-center justify-center flex-1">
                <p>Error</p>
            </div>
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
                <img src="/icon.png" alt="notion" width={20} height={20} className='cursor-pointer' onClick={handleJumpToPortal}/>
                <NotionLoginButton />
                <div className='flex flex-row items-center justify-end gap-2 px-2'>
                    <Label htmlFor="filterFinished" className='text-sm text-gray-500'>{filterFinished ? "进行中" : "已完成"}</Label>
                    <Switch id="filterFinished" checked={filterFinished} onCheckedChange={setFilterFinished} />
                </div>
            </div>
        </div>
    )
}

const Footer = ({ handleAddTask, remindLaterHours, setRemindLaterHours, remindLater }) => {
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


            {/* 添加任务 */}
            <Button variant="ghost" onClick={handleAddTask}>
                <Plus size={16} /> 添加任务
            </Button>
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