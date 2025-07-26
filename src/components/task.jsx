import { useEffect, useState, forwardRef, memo } from "react";
import { useMotionValue, Reorder, useDragControls } from "framer-motion";
import { useRaisedShadow } from "@/components/use-raised-shadow";
import { Grip, ChartPie, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TextareaCommand } from "@/components/textarea-command";

export const Task = memo(forwardRef(function Task({ item, onChangeValue, index }, ref) {

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
                // key={item}
                value={item.localId}
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
                <TextareaCommand ref={ref} value={taskItem.text} tags={taskItem.tags}
                    onChange={(text, tags) => {
                        // 只更新自己的内部状态，不通知父组件
                        setTaskItem(prev => ({ ...prev, text, tags }));
                    }}
                    onBlur={() => {
                        // 当失焦时，如果内容有变，则通知父组件保存
                        if (taskItem.text !== item.text || JSON.stringify(taskItem.tags) !== JSON.stringify(item.tags)) {
                            onChangeValue(item.localId, taskItem);
                        }
                    }}
                    disabled={item.status === "完成"}
                />



                {/* 任务时间占比 */}
                <div className="flex flex-row items-center gap-2">
                    <ChartPie size={16} />
                    <input className="w-6 focus:outline-none focus:ring-0"
                        // ...
                        value={taskItem.percent}
                        onChange={e => {
                            // 只更新自己的内部状态
                            setTaskItem(prev => ({ ...prev, percent: Number(e.target.value.replace(/\D/g, "")) }))
                        }}
                        onBlur={() => {
                            // 失焦时，如果内容有变，通知父组件保存
                            const finalPercent = Number(taskItem.percent) || 0;
                            if (finalPercent !== item.percent) {
                                onChangeValue(item.localId, { ...taskItem, percent: finalPercent });
                            }
                        }} />
                </div>

                {/* 拖拽 */}
                {item.status === "完成" ? null : (
                    <div className="flex flex-row items-center gap-2 h-4">
                        <div className="reorder-handle" onPointerDown={(e) => dragControls.start(e)}>
                            <Grip size={12} />
                        </div>
                        {/* 完成按钮 */}
                        <Button className="cursor-pointer" size="icon" variant="ghost" onMouseDown={(e) => {
                            e.preventDefault(); // 关键：阻止输入框失焦
                            // 直接带着所有最新状态通知父组件
                            onChangeValue(item.localId, { ...taskItem, status: "完成" });
                        }}>
                            <Check size={12} />
                        </Button >
                    </div>
                )}


            </Reorder.Item >
        </>
    );
}));

