import { useNotionContext } from '@/context/NotionContext';
import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { Task } from "@/components/task";
import ProgressCircle from "@/components/ui/progress-circle";
import { Button } from "@/components/ui/button";
import { open as openShell } from "@tauri-apps/plugin-shell";


const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL;
export default function NotionTaskDetail({ items, filterFinished, setItems, handleChangeTask, taskRefs }) {

    const [total, setTotal] = useState(0)
    const [finished, setFinished] = useState(0)

    useEffect(() => {
        setTotal(items.length)
        setFinished(items.filter(item => item.status === "完成").length)
    }, [items])

    return (
        <div className="flex flex-col gap-2 w-full flex-1 relative">


            {items.filter(item => filterFinished ? item.status !== "完成" : item.status === "完成").length === 0 ? (
                <NoTaskView total={total} finished={finished} />
            ) : (
                <>
                    <div className="text-xs text-gray-500 px-2 absolute top-0 left-0 bg-white">{total - finished} / {total}</div>
                    <Reorder.Group
                        values={items}
                        onReorder={setItems}
                        className='flex-1 overflow-y-scroll ps-2 w-full space-y-1 flex flex-col items-center justify-center'>
                        {items.filter(item => filterFinished ? item.status !== "完成" : item.status === "完成").map((item, idx) => (
                            <Task key={item.localId} item={item} onChangeValue={handleChangeTask} index={idx}
                                ref={el => taskRefs.current[item.localId] = el} />
                        ))}
                    </Reorder.Group>
                </>
            )}
        </div>
    )
}

const NoTaskView = ({ total, finished }) => {
    const {state, authInfo } = useNotionContext(); 


    const handleJumpToHelp = async () => {
        const url = `${NOTION_SERVER_URL}/help`
        await openShell(url)
    }

    return (
        <div className="flex flex-col gap-2 justify-center items-center flex-1">
            {state === "success" && (!authInfo?.duplicated_template_id || authInfo?.duplicated_template_id === "") ? (
                <div className="flex flex-col gap-2 items-center">
                    <div>请在左上方选择任务存放页面</div>
                    <div className="text-sm text-gray-500">若还未创建，请参考指导文档手动创建</div>
                    <Button variant="outline" size="sm" onClick={() => {
                        handleJumpToHelp()
                    }}>帮助</Button>
                </div>
            ) : total === 0 ? (
                <div className="flex flex-row gap-4 items-center">
                    <p>你今天还没有添加任务，想想今天最重要的事是什么？</p>
                </div>
            ) : total > finished ? (
                <p>共 {total} 个任务，已完成 {finished} 个</p>
            ) : (
                <>
                    <div className="flex flex-row gap-2 items-center text-sm text-gray-500 px-2 absolute bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white">
                        <ProgressCircle percent={finished / total * 100} size={50} stroke={4} >
                            {finished} / {total}
                        </ProgressCircle>
                    </div>
                    <p>好棒，你已经完成最重要的{finished}件事，继续加油！</p>
                </>
            )}
        </div>
    )
}