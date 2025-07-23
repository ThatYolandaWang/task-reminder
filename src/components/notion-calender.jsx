import { useState, useEffect } from "react"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Task } from "@/components/task";
import {  subMonths } from 'date-fns'
import Loading from "@/components/ui/loading"

export default function NotionCalender({ items, loadTasks, handleChangeTask, isLoading }) {

    const [date, setDate] = useState(new Date())
    const [taskStatus, setTaskStatus] = useState([])

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
        console.log(taskStatus)


        setTaskStatus(taskStatus)
    }, [items])

    return (
        <div className="w-full flex flex-row">
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

            <AnimatePresence mode="wait" className='flex-1'>
                {isLoading ? (
                    <Loading />
                ) : items.filter(item => item.day === date.getDate()).length == 0 ? (
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
            </AnimatePresence>
        </div>
    )
}

function DayButton({ day, modifiers, children, task, ...props }) {
    return (
        <CalendarDayButton day={day} modifiers={modifiers} {...props}>
            {/* {children} */}

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