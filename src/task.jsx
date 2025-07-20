import React, { useRef,useEffect, useState } from "react";
import { useMotionValue, Reorder, useDragControls } from "framer-motion";
import { useRaisedShadow } from "./use-raised-shadow";
import { Grip, ChartPie, Target, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";


export const Task = React.memo(function Task({ item, onChangeValue, index }) {

    const [taskItem, setTaskItem] = useState(item);
    const y = useMotionValue(0);
    const boxShadow = useRaisedShadow(y);
    const dragControls = useDragControls();
    const textareaRef = useRef(null);

    useEffect(() => {
        console.log("task item", item)
        setTaskItem(item);
    }, [item]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [taskItem.text]);

    return (
        <Reorder.Item
            // id={item.localId}
            // key={item}
            value={item}
            style={{ boxShadow, y }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            dragListener={false}
            dragControls={dragControls}
            className="flex flex-row w-full py-2 justify-between items-center gap-2 min-h-10 border-b border-gray-200 rounded-md bg-white  select-none"
        >
            {/* logo. 根据index 显示不同的颜色 */}
            <div className={`${index === 0 ? 'text-red-500' : index === 1 ? 'text-amber-500' : 'text-green-500'} flex flex-row items-center gap-2 w-12`}>
                <Target className="flex-shrink-0" size={16} /> 
                <span className="text-sm text-gray-300">{index == 0 ? '1st' : index == 1 ? '2nd' : index == 2 ? '3rd' : `${index + 1}th`}</span>
            </div>

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
            />

            {/* 任务时间占比 */}
            <div className="flex flex-row items-center gap-2">
                <ChartPie size={16} />
                <input className="w-6 focus:outline-none focus:ring-0" type="text" inputMode="decimal" pattern="\d*" value={taskItem.percent} onChange={e => {
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
                    }}/>
            </div>

            {/* 拖拽 */}
            <div className="reorder-handle cursor-grab "
                onPointerDown={(e) => dragControls.start(e)}
            >
                <Grip size={16} />
            </div>

            {/* 完成按钮 */}
            <Button size="icon" variant="ghost" onClick={() => {

                const newTask = { ...taskItem, status: "完成" }
                setTaskItem(newTask)
                onChangeValue(taskItem.localId, newTask)
            }}>
                <Check size={16} />
            </Button>
        </Reorder.Item>
    );
});

