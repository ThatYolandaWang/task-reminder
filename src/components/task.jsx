import React, { useEffect, useState } from "react";
import { useMotionValue, Reorder, useDragControls } from "framer-motion";
import { useRaisedShadow } from "@/components/use-raised-shadow";
import { Grip, ChartPie, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TextareaCommand } from "@/components/textarea-command";

export const Task = React.memo(function Task({ item, onChangeValue, index }, ref) {

    const [taskItem, setTaskItem] = useState(item);
    const y = useMotionValue(0);
    const boxShadow = useRaisedShadow(y);
    const dragControls = useDragControls();

    useEffect(() => {
        setTaskItem(item);
    }, [item]);



    return (
        <>

            <Reorder.Item
                // id={item.localId}
                // key={item}
                value={item}
                style={{ boxShadow, y }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                dragListener={false}
                dragControls={dragControls}
                className={`flex flex-row w-full py-2 justify-between items-center gap-2 min-h-10 border-b border-gray-200 rounded-md bg-muted  select-none
            relative p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full
            ${index === 0 ? item.status !== "完成" ? 'after:bg-amber-500/70' : 'after:bg-primary/70'
                        : index === 1 ? item.status !== "完成" ? 'after:bg-amber-500/50' : 'after:bg-primary/50'
                            : index === 2 ? item.status !== "完成" ? 'after:bg-amber-500/30' : 'after:bg-primary/30'
                                : item.status !== "完成" ? 'after:bg-amber-500/10' : 'after:bg-primary/10'}
            `}
            >
                {/* 任务内容 */}
                <TextareaCommand ref={ref}  value={taskItem.text} tags={taskItem.tags}
                    onChange={(text, tags) => {
                        const newTask = { ...taskItem, text: text, tags: tags }
                        setTaskItem(newTask)
                        if (newTask.tags !== item.tags) {
                            onChangeValue(taskItem.localId, newTask)
                        }
                    
                    }}
                    onBlur={() => {
                        if (taskItem.text !== item.text || taskItem.tags !== item.tags) {
                            
                            const newTask = { ...taskItem, text: taskItem.text, tags: taskItem.tags }
                            setTaskItem(newTask)
                            onChangeValue(taskItem.localId, newTask)
                        }
                    }}
                    disabled={item.status === "完成"}
                />



                {/* 任务时间占比 */}
                <div className="flex flex-row items-center gap-2">
                    <ChartPie size={16} />
                    <input className="w-6 focus:outline-none focus:ring-0"
                        type="text"
                        inputMode="decimal"
                        pattern="\d*"
                        disabled={item.status === "完成"}
                        value={taskItem.percent} onChange={e => {
                            let v = e.target.value.replace(/\D/g, "");
                            setTaskItem({ ...taskItem, percent: v })
                        }}
                        onBlur={() => {
                            let v = String(taskItem.percent).replace(/^0+(?=\d)/, 0);
                            if (v === "") {
                                v = 0;
                            }
                            if (Number(v) !== taskItem.percent) {
                                const newTask = { ...taskItem, percent: Number(v) }
                                setTaskItem(newTask)
                                onChangeValue(taskItem.localId, newTask)
                            }
                        }} />
                </div>

                {/* 拖拽 */}
                {item.status === "完成" ? null : (
                    <div className="flex flex-row items-center gap-2 h-4">
                        <div className="reorder-handle cursor-grab" onPointerDown={(e) => dragControls.start(e)}>
                            <Grip size={12} />
                        </div>
                        {/* 完成按钮 */}
                        <Button className="cursor-pointer" size="icon" variant="ghost" onClick={() => {
                            const newTask = { ...taskItem, status: "完成" }
                            setTaskItem(newTask)
                            onChangeValue(taskItem.localId, newTask)
                        }}>
                            <Check size={12} />
                        </Button >
                    </div>
                )}


            </Reorder.Item >
        </>
    );
});

