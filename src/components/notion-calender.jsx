import { useState, useEffect, useMemo } from "react"
import { useNotionContext } from "@/context/NotionContext"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Task } from "@/components/task";
import { subMonths, getDaysInMonth } from 'date-fns'
import Loading from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { ListTodo, ChartBar, Tag } from "lucide-react"
import NotionDashboard from "@/components/notion-dashboard"

const tabOptions = [
    { label: "详情", id: "detail", icon: <ListTodo /> },
    { label: "统计", id: "dashboard", icon: <ChartBar /> },
    { label: "标签", id: "tag", icon: <Tag /> }
]
export default function NotionCalender({ items, loadTasks, handleChangeTask }) {
    const { tagOptions } = useNotionContext()

    const [date, setDate] = useState(new Date())
    const [taskStatus, setTaskStatus] = useState([])
    const [selectedTab, setSelectedTab] = useState(tabOptions[0])


    useEffect(() => {
        if (items.length === 0) {
            return setTaskStatus([])
        }
        let taskStatus = []
        items.map(item => {
            if (!taskStatus.find(task => task.day === item.day)) {
                taskStatus.push({
                    day: item.day,
                    finish: 0,
                    unfinish: 0
                })
            }
            if (item.status === "完成") {
                taskStatus.find(task => task.day === item.day).finish++
            } else {
                taskStatus.find(task => task.day === item.day).unfinish++
            }
        })

        setTaskStatus(taskStatus)
    }, [items])

    const taskFinish = useMemo(() => {
        const taskFinish = Array.from({ length: getDaysInMonth(date) }, (_, index) => {
            return {
                label: String(index + 1),
                option1: taskStatus.find(item => item.day === index + 1)?.finish || 0,
                option2: taskStatus.find(item => item.day === index + 1)?.unfinish || 0,
            }
        })
        return {
            option1: "完成",
            option2: "未完成",
            data: taskFinish
        }
    }, [taskStatus])

    const tagList = useMemo(() => {

        if (tagOptions.length === 0) {
            return []
        }

        const tagStatus = tagOptions.map(tag => {
            return {
                label: tag || "未分类",
                option1: items.filter(item => item.tags.includes(tag) && item.status === "完成").length,
                option2: items.filter(item => item.tags.includes(tag) && item.status !== "完成").length,
            }
        }).filter(item => item.option1 + item.option2 > 0)

        console.log(tagOptions)

        return {
            option1: "完成",
            option2: "未完成",
            data: tagStatus
        }
    }, [items, tagOptions])

    return (
        <div className="w-full flex flex-row flex-1">
            <Calendar
                mode="single"
                showOutsideDays={false}
                selected={date}
                onSelect={setDate}
                buttonVariant="ghost"
                onNextClick={() => {
                    const newDate = subMonths(date, -1)
                    setDate(newDate)
                    setTaskStatus([])
                    loadTasks("calendar", newDate)
                }}
                onPrevClick={() => {
                    const newDate = subMonths(date, 1)
                    setDate(newDate)
                    setTaskStatus([])
                    loadTasks("calendar", newDate)
                }}
                className="px-2 py-0"
                components={{
                    DayButton: ({ day, modifiers, children, ...props }) => {
                        return <DayButton day={day} modifiers={modifiers} children={children} {...props} task={taskStatus.find(item => item.day === day.date.getDate())} />
                    }
                }}
                required
            />

            <AnimatePresence mode="wait">

                <div className="flex flex-col gap-2 flex-1">
                    <TabView selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

                    <div className="flex-1 overflow-y-auto max-h-[calc(100dvh-120px)]">

                        {selectedTab.id === "detail" ? (
                            <TaskList items={items} date={date} handleChangeTask={handleChangeTask} />
                        ) : (
                            <NotionDashboard data={selectedTab.id === "dashboard" ? taskFinish : tagList} />
                        )}
                    </div>

                </div>

            </AnimatePresence>
        </div>
    )
}

function DayButton({ day, modifiers, children, task, ...props }) {
    return (
        <CalendarDayButton day={day} modifiers={modifiers} {...props}>
            <div className="w-full h-full flex flex-col gap-1 justify-center items-center pt-1">
                {day.date.getDate()}
                {task ? (
                    <div className="flex flex-row gap-1">

                        {[...Array(Math.min(task.finish + task.unfinish, 3))].map((_, i) => (
                            <div className={`w-1 h-1 rounded-full ${i < task.unfinish ? 'bg-amber-500' : 'bg-gray-500'}`} key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="w-1 h-1 rounded-full" />
                )}

            </div>
        </CalendarDayButton>
    )
}



const TabView = ({ selectedTab, setSelectedTab }) => {
    return (
        <div className="flex flex-row h-8">
            {tabOptions.map((item, idx) => (
                <Button key={idx} size="icon" variant={selectedTab.label === item.label ? "outline" : "ghost"} onClick={() => {
                    setSelectedTab(item)
                    //loadTasks(item.id)
                }}>
                    {item.icon}
                </Button>
            ))}
        </div>
    )
}

const TaskList = ({ items, date, handleChangeTask }) => {
    return (
        <>
            {items.filter(item => item.day === date.getDate()).length == 0 ? (
                <>
                    <div className="flex flex-col items-center justify-center flex-1 w-full px-4">
                        <div className="text-sm text-gray-500">暂无任务</div>
                    </div>
                </>
            ) : (
                <>
                    {date && <motion.div
                        key={date.getDate()}
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                        exit={{ y: 0 }}
                        transition={{ duration: 0.1 }}
                        className="flex flex-col items-center justify-center flex-1 w-full px-4">

                        <Reorder.Group values={items} onReorder={() => { }} className="w-full flex flex-col gap-1">
                            {items.filter(item => item.day === date.getDate()).map((item, idx) => (
                                <Task key={item.localId} item={item} onChangeValue={handleChangeTask} index={idx} />
                            ))}
                        </Reorder.Group>
                    </motion.div>}
                </>
            )}
        </>
    )
}