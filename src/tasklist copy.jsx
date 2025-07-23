import { useNotionContext } from '@/context/NotionContext';
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from 'react';
import { toast } from "sonner";
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { debug, info } from '@tauri-apps/plugin-log';
import { Task } from '@/components/task';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlarmClock, Loader, Plus } from 'lucide-react';
import NotionLoginButton from '@/components/notion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NotionCalender from '@/components/notion-calender';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import NotionTaskDetail from '@/components/notion-taskdetail';


import NotionPage from '@/components/notion-page';


const remindHoursOptions = [
    { label: '1小时', value: 1 },
    { label: '2小时', value: 2 },
    { label: '3小时', value: 3 }
]

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

const tabOptions = [
    { label: "今日", id: "today" },
    { label: "本周", id: "week" },
    { label: "日历", id: "calendar" }
]
export default function TaskList() {
    const { state, authInfo } = useNotionContext();
    const [items, setItems] = useState([]);
    const [remindLaterHours, setRemindLaterHours] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [filterFinished, setFilterFinished] = useState(true);
    const [selectedTab, setSelectedTab] = useState(tabOptions[2]);


    // 用于控制自动获取焦点
    const taskRefs = useRef([]);
    const [focusTaskId, setFocusTaskId] = useState(null);

    // 加载本地任务
    useEffect(() => {

        if (state === "success" && authInfo?.duplicated_template_id) {
            info("tasklist state:" + state)
            loadTasks(selectedTab.id)
        } else if (state === "failed") {
            setIsLoading(false)
            toast.error("token 已过期，请重新登陆")
        }
    }, [state, authInfo])

    useEffect(() => {
        if (focusTaskId && taskRefs.current[focusTaskId]) {
            taskRefs.current[focusTaskId].focusTextarea?.();
            setFocusTaskId(null); // 聚焦后重置
        }
    }, [items, focusTaskId]);

    const loadTasks = async (id) => {

        if (id === "calendar") {
            return
        }

        try {
            setIsLoading(true)
            info("loadTasks")
            const res = await invoke("load_tasks", {
                params: {
                    start: id === "today" ? startOfDay(new Date()).toISOString() : startOfWeek(new Date()).toISOString(),
                    end: id === "today" ? endOfDay(new Date()).toISOString() : endOfWeek(new Date()).toISOString(),
                    status: "0"
                }
            })

            if (res.success) {
                setItems(res.tasks.tasks.map(item => ({ ...item, localId: item.id })));

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
                }
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

    const taskView = () => {
        return (
            <>
                <div className='w-full flex flex-row items-center justify-between h-4 '>
                    <div className='flex flex-row items-center justify-start w-full gap-2 px-2'>
                        {selectedTab.id === "today" ? (
                            <div className='text-sm text-gray-500'>今日</div>
                        ) : selectedTab.id === "week" ? (
                            <div className='text-sm text-gray-500'>本周</div>
                        ) : null}

                        <div className='text-sm text-gray-500'>
                            已添加：{items.length}
                        </div>
                        <div className='text-sm text-gray-500'>
                            已完成：{items.filter(item => item.status === "完成").length}
                        </div>
                    </div>
                    <div className='flex flex-row items-center justify-end w-full gap-2 px-2'>
                        <Label htmlFor="filterFinished" className='text-sm text-gray-500'>{filterFinished ? "进行中" : "已完成"}</Label>
                        <Switch id="filterFinished" checked={filterFinished} onCheckedChange={setFilterFinished} />
                    </div>
                </div>
                {items.length > 0 ? (
                    <>
                        <Reorder.Group
                            values={items}
                            onReorder={setItems}
                            className='flex-1 overflow-y-scroll ps-2 w-full space-y-1'>
                            {items.filter(item => filterFinished ? item.status !== "完成" : item.status === "完成").map((item, idx) => (
                                <Task key={item.localId} item={item} onChangeValue={handleChangeTask} index={idx}
                                    ref={el => taskRefs.current[item.localId] = el} />
                            ))}
                        </Reorder.Group>
                    </>
                ) : (
                    <div className='flex flex-col items-center justify-center flex-1'>
                        <div className="text-sm text-gray-500 text-center animate-pulse">请你记下今天最重要的三件事，全力以赴，完成它</div>
                        {isLoading ? (
                            <div className="text-sm text-gray-500 text-center animate-pulse flex flex-row items-center gap-2"><Loader className="animate-spin" size={16} /> 加载中...</div>
                        ) : state === "failed" ? (
                            <div className="text-sm text-gray-500 text-center animate-pulse">加载失败，请重新登陆</div>
                        ) : state === "success" && !authInfo?.duplicated_template_id ? (
                            <div className="text-sm text-gray-500 text-center animate-pulse">请先选择一个任务的页面</div>
                        ) : state === "not_start" ? (
                            <NotionLoginButton />
                        ) : (
                            <div className='h-5'>
                            </div>
                        )}
                    </div>
                )
                }
            </>
        )
    }
    return (
        <div className="flex flex-col relative h-full p-2">
            {/* 正文内容 */}
            <AnimatePresence mode="wait" className='flex-1 '>
                <motion.div
                    key={selectedTab.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center flex-1 gap-2">

                    {selectedTab.id !== "calendar" ? (
                        taskView()
                    ) : (
                        <NotionCalender />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 底部 */}
            {state === "success" ? (
                <div className="w-full flex flex-row sticky bottom-0 bg-white justify-between">
                    <div className="flex flex-row gap-1">
                        <NotionPage />
                        {items.length > 0 &&
                            <>
                                <Button variant="ghost" onClick={remindLater}>
                                    <AlarmClock className="flex-shrink-0" size={16} /> <span className="text-ellipsis whitespace-nowrap">稍后提醒</span>
                                </Button>


                                {/*  options={remindHoursOptions} value={remindLaterHours} onChange={e => setRemindLaterHours(e.target.value)} */}
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
                            </>
                        }
                    </div>

                    <div className="flex flex-row">

                        {/* 添加任务 */}
                        <Button variant="ghost" onClick={handleAddTask}>
                            <Plus size={16} />
                        </Button>

                        {/* 查看notion表 */}
                        <NotionLoginButton />

                        <div className='flex flex-row'>
                            {tabOptions.map((item, idx) => (
                                <Button key={idx} size="sm" variant={selectedTab.label === item.label ? "default" : "ghost"} onClick={() => {
                                    setSelectedTab(item)
                                    loadTasks(item.id)
                                }}>
                                    {item.label}
                                </Button>
                            ))}
                        </div>

                    </div>
                </div>
            ) : (
                <div className="w-full flex flex-row sticky bottom-0 bg-white justify-between">
                    <div className="flex flex-row gap-1">
                        <NotionLoginButton />
                    </div>
                </div>
            )}
        </div >
    )
}