import { motion } from "motion/react";
import { Reorder } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Info, AlarmClock } from 'lucide-react';
import { Task } from './task';
import { invoke } from '@tauri-apps/api/core';
import Button from './components/button';
import Select from './components/select';
import { v4 as uuidv4 } from 'uuid';
import NotionLoginButton from './notion';

import { emit, listen } from '@tauri-apps/api/event';

const PERCENT_MODEL_ERROR = "总百分超过了100%, 请重新调整比例"


const remindHoursOptions = [
  { label: '1小时', value: 1 },
  { label: '2小时', value: 2 },
  { label: '3小时', value: 3 }
]

export function TaskList() {
  const isInitial = useRef(false);
  const [error, setError] = useState("");
  const debounceTimer = useRef(); // 防抖计时器
  const [items, setItems] = useState([]);
  const [remindLaterHours, setRemindLaterHours] = useState(1);
  const debounceError = useRef(); // 防抖错误提示
  const [modifyTaskIds, setModifyTaskIds] = useState([]);
  const [isLogin, setIsLogin] = useState(true);

  // 加载本地任务
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await invoke("load_tasks")

        if (res.success) {
          setItems(res.tasks.tasks.map(item => ({ ...item, localId: item.id })))
        } else {
          if (res.status == "unauthorized") {
            console.log("get task list unauthorized send 'login false'")
            emit("login", false)
          } else {
            setError("加载失败！")
          }
        }
      } catch (err) {
        setError(err)
      }
    }
    if (!isInitial.current) {
      loadTasks()
      isInitial.current = true
    }
  }, [])

  useEffect(() => {
    
    const unlistenPromise = listen('login', (event) => {
      console.log("task login", event.payload)
      // 这里只做登录状态更新，不再 emit
      setIsLogin(event.payload);
    });
    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [])

  //修改任务和百分比
  const handleChange = (localId, newText, newPercent) => {
    setItems(items =>
      items.map(item =>
        item.localId === localId
          ? { ...item, text: newText, percent: Number(newPercent) }
          : item
      )
    );
    setModifyTaskIds(prevIds => [...prevIds, localId]);
  };

  // 添加任务
  async function handleAddTask() {

    const newTask = { id: "", localId: "new-" + uuidv4(), text: '', percent: getTaskList().length == 0 ? 50 : 0, status: '未开始', createtime: '' }
    setItems(items => [...items, newTask])
    setModifyTaskIds(prevIds => [...prevIds, newTask.localId])
  }

  // 完成任务
  async function handleFinish(localId) {
    setItems(items => items.map(item => item.localId === localId ? { ...item, status: '完成' } : item))
    setModifyTaskIds(prevIds => [...prevIds, localId])
  }


  // 定时器重新计算排序, 保存，2s延时
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {

      const totalPercent = items.reduce((acc, item) => acc + item.percent, 0);
      setError(totalPercent > 100 ? PERCENT_MODEL_ERROR : "");
      // saveTasks(items);

      syncTasksToNotion();
    }, 2000);

    return () => clearTimeout(debounceTimer.current);
  }, [items]);


  // 定时清空错误的提示（显示10s）
  useEffect(() => {
    if (debounceError.current) clearTimeout(debounceError.current);
    debounceError.current = setTimeout(() => {
      setError("")
    }, 10000);
  }, [error])


  // 保存tasks到本地
  // async function saveTasks(tasks) {
  //   try {
  //     await invoke("save_tasks", {
  //       tasks: { tasks: tasks }
  //     })
  //   } catch (err) {
  //     setError(err)
  //   }
  // }

  async function syncTasksToNotion() {
    modifyTaskIds.forEach(async (localId) => {
      try {

        console.log("localId", localId)
        // 如果id为空，则添加任务
        if (items.find(item => item.localId === localId).id === "") {
          const res = await invoke("add_task", {
            task: items.find(item => item.localId === localId)
          })

          console.log(res)
          if (res.success) {
            // 更新id
            setItems(items => items.map(item => item.localId === localId ? { ...item, id: res.id } : item))
            setModifyTaskIds(prevIds => prevIds.filter(localId => localId !== localId))
          } else {
            setError("同步失败")
          }
        } else { // 如果id不为空，则更新任务
          const res = await invoke("update_task", {
            task: items.find(item => item.localId === localId)
          })
          console.log(res)
          if (res.success) {
            setModifyTaskIds(prevIds => prevIds.filter(id => id !== id))
            if (items.find(item => item.localId === localId).status === "完成") {
              setItems(items => items.filter(item => item.localId !== localId))
            }
          } else {
            setError("同步失败")
          }
        }
      } catch (err) {
        console.log(err)
      }
    })
  }

  async function remindLater() {
    try {
      await invoke("set_remind_later", {
        hours: Number(remindLaterHours)
      })
    } catch (err) {
      setError(err)
    }
  }

  // 获取未开始任务列表, 按 percent 降序排序，缓存，提高性能，之后定时同步更新
  const getTaskList = useCallback(() => {
    return items.filter(item => item.status === '未开始').sort((a, b) => b.percent - a.percent)
  }, [items])



  return (
    <>
      <div className='flex flex-col items-center justify-center h-full'>

        {!isInitial.current ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex-1 w-full flex flex-col items-center justify-center gap-2 pt-4 h-20">
            <div className='text-sm text-gray-500 text-center animate-pulse'>请你记下今天最重要的三件事，全力以赴，完成它</div>
          </motion.div>
        ) : (

          <div className="flex flex-col justify-center items-center w-full relative h-full">

            {/* 事件列表 */}
            {getTaskList().length > 0 ? (
              <div className="overflow-y-auto h-[calc(100vh-60px)] w-full mt-4 ">
                <Reorder.Group axis="y" values={getTaskList()} onReorder={setItems} className="w-full px-4 space-y-2 flex flex-col items-center justify-center">
                  {getTaskList().map((item, index) => (
                    <Task key={item.localId} item={item} onChangeValue={handleChange} index={index} handleFinish={handleFinish} />
                  ))}
                </Reorder.Group>
              </div>
            ) :
              (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="text-sm text-gray-500 text-center flex items-center justify-center">请你记下今天最重要的三件事，全力以赴，完成它</motion.div>
              )}


            <div className="w-full flex justify-between items-center p-2 sticky bottom-0 bg-white">
              {getTaskList().length > 0 && <div className="flex flex-row items-center gap-2">
                <Button onClick={remindLater}>
                  <AlarmClock className="flex-shrink-0" size={16} /> <span className="text-ellipsis whitespace-nowrap">稍后提醒</span>
                </Button>

                <Select options={remindHoursOptions} value={remindLaterHours} onChange={e => setRemindLaterHours(e.target.value)} />
              </div>
              }

              <div className={`flex-1 flex flex-row ${getTaskList().length == 0 ? "justify-center" : "justify-end"}`}>
                {/* 错误提示 */}
                {error &&
                  <div className="w-full flex justify-end items-center gap-2 animate-pulse">
                    <Info size={16} />
                    <div className='text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap'>{error}</div>
                  </div>
                }

                {/* 添加任务按钮 */}
                {isLogin && <Button onClick={handleAddTask}>
                  <Plus size={16} /> <span className="flex-shrink-0">添加任务</span>
                </Button>
                }

                <NotionLoginButton icon={true} onLogin={() => setIsLogin(true)} />
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}

