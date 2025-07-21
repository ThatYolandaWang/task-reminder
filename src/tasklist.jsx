import { useNotionContext } from './context/NotionContext';
import { motion, Reorder } from "framer-motion";
import { useEffect, useState } from 'react';
import { toast } from "sonner";
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { debug, info } from '@tauri-apps/plugin-log';
import { Task } from './task';
import { Button } from './components/ui/button';
import { AlarmClock, Loader, Plus } from 'lucide-react';
import NotionLoginButton from './notion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import NotionPage from './notion-page';

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

export default function TaskList() {
    const { state, authInfo } = useNotionContext();
    const [items, setItems] = useState([]);
    const [remindLaterHours, setRemindLaterHours] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    // 加载本地任务
    useEffect(() => {

        if (state === "success" && authInfo?.duplicated_template_id) {
            info("tasklist state:" + state)
            loadTasks()
        } else if (state === "failed") {
            setIsLoading(false)
            toast.error("token 已过期，请重新登陆")
        }
    }, [state, authInfo])

    const loadTasks = async () => {
        try {

            setIsLoading(true)
            info("loadTasks")
            const res = await invoke("load_tasks")

            debug("loadTasks res:" + JSON.stringify(res))

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
        } else {
            toast.error(res.message)
            setItems(prevItems => prevItems.filter(item => item.localId == newTask.localId))
        }
    }

    const handleChangeTask = async (localId, newTask) => {

        const oldItem = items.find(item => item.localId === localId)

        if (newTask.status === "完成") {
            newTask.time.end = getLocalISOStringWithTZ()
        }

        setItems(prevItems => prevItems.map(item => item.localId === localId ? newTask : item))

        const res = await invoke("update_task", {
            task: newTask
        })
        if (res.success) {
            if (newTask.status === "完成") {
                setItems(prevItems => prevItems.filter(item => item.localId !== localId))
            }
        } else {
            // 如果失败，则恢复原来的任务
            toast.error(res.message)
            setItems(prevItems => [...prevItems, oldItem])
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
    return (
        <div className="flex flex-col relative h-full p-2">

            {items.length > 0 ? (
                <>
                    <Reorder.Group
                        values={items}
                        onReorder={setItems}
                        className='flex-1 overflow-y-scroll ps-2'>
                        {items.filter(item => item.status === '未开始').map((item, idx) => (
                            <Task key={item.localId} item={item} onChangeValue={handleChangeTask} index={idx} />
                        ))}
                    </Reorder.Group>

                    <div className="w-full flex flex-row sticky bottom-0 bg-white justify-between">
                        <div className="flex flex-row gap-1">

                            {state == "success" && (
                                <>
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
                                </>
                            )}
                        </div>

                        <div className="flex flex-row">
                            <Button variant="ghost" onClick={handleAddTask}>
                                <Plus size={16} /> <span>添加任务</span>
                            </Button>
                            <NotionLoginButton />
                        </div>
                    </div>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center flex-1">
                    <div className="text-sm text-gray-500 text-center animate-pulse">请你记下今天最重要的三件事，全力以赴，完成它</div>

                    <div className="flex flex-row items-center h-10">

                        {isLoading ? (
                            <div className="text-sm text-gray-500 text-center flex flex-row items-center gap-2"><Loader className="animate-spin" size={16} /> 加载中...</div>
                        ) : (
                            <>
                                {state == "success" && (
                                    <Button variant="ghost" onClick={handleAddTask}>
                                        <Plus size={16} /> <span>添加任务</span>
                                    </Button>
                                )}
                                < NotionLoginButton />
                            </>
                        )}


                    </div>
                </motion.div>
            )}
        </div>
    )
}