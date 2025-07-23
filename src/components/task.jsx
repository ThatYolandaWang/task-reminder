import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useMotionValue, Reorder, useDragControls } from "framer-motion";
import { useRaisedShadow } from "@/components/use-raised-shadow";
import { Grip, ChartPie, Target, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";


export const Task = React.memo(forwardRef(function Task({ item, onChangeValue, index }, ref) {

    const [taskItem, setTaskItem] = useState(item);
    const y = useMotionValue(0);
    const boxShadow = useRaisedShadow(y);
    const dragControls = useDragControls();
    const textareaRef = useRef(null);

    useEffect(() => {
        setTaskItem(item);
    }, [item]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [taskItem.text]);

    // 暴露 focus 方法给父组件
    useImperativeHandle(ref, () => ({
        focusTextarea: () => {
            textareaRef.current?.focus();
        }
    }));

    return (
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
            <textarea rows={1} ref={textareaRef} className="flex-1 focus:outline-none focus:ring-0 resize-none" type="textarea" value={taskItem.text}
                onChange={e => {
                    setTaskItem({ ...taskItem, text: e.target.value })
                    // // 动态高度自适应
                    // const el = e.target;
                    // el.style.height = 'auto'; // 先重置
                    // el.style.height = el.scrollHeight + 'px'; // 设置为内容高度
                }}
                onBlur={() => {
                    if (taskItem.text !== item.text) {
                        const newTask = { ...taskItem, text: taskItem.text }
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
    );
}));

