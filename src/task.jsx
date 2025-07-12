import { useRef,useEffect } from "react";
import { useMotionValue, Reorder, useDragControls } from "framer-motion";
import { useRaisedShadow } from "./use-raised-shadow";
import { Grip, ChartPie, Target, Check } from 'lucide-react';


export const Task = ({ item, onChangeValue, index, handleFinish }) => {
    const y = useMotionValue(0);
    const boxShadow = useRaisedShadow(y);
    const dragControls = useDragControls();
    const textareaRef = useRef(null);

    useEffect(() => {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }, []);

    return (
        <Reorder.Item
            value={item}
            id={item}
            style={{ boxShadow, y }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
            dragListener={false}
            dragControls={dragControls}
            className="flex flex-row justify-between items-center gap-4 min-h-10 border-b border-gray-200 p-2 rounded-md bg-white  select-none"
        >
            {/* logo. 根据index 显示不同的颜色 */}
            <div className={`${index === 0 ? 'text-red-500' : index === 1 ? 'text-amber-500' : 'text-green-500'}`}>
                <Target size={16} />
            </div>

            {/* 任务内容 */}
            <textarea rows={1} ref={el => { textareaRef.current = el }} className="flex-1 focus:outline-none focus:ring-0 resize-none" type="textarea" value={item.text} onChange={e => {
                onChangeValue(item.id, e.target.value, item.percent)
                // 动态高度自适应
                const el = e.target;
                el.style.height = 'auto'; // 先重置
                el.style.height = el.scrollHeight + 'px'; // 设置为内容高度
            }} />

            {/* 任务时间占比 */}
            <div className="flex flex-row items-center gap-2">
                <ChartPie size={16} />
                <input className="w-12 focus:outline-none focus:ring-0" type="number" value={item.percent} onChange={e => onChangeValue(item.id, item.text, e.target.value)} />
            </div>

            {/* 拖拽 */}
            <div className="reorder-handle cursor-grab "
                onPointerDown={(e) => dragControls.start(e)}
            >
                <Grip size={16} />
            </div>

            {/* 完成按钮 */}
            <button className="text-sm text-gray-500" onClick={() => handleFinish(item.id)}>
                <Check size={16} />
            </button>
        </Reorder.Item>
    );
}