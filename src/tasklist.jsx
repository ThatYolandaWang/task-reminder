import { motion } from "motion/react";
import { Reorder } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Plus, Info, AlarmClock } from 'lucide-react';
import { Task } from './task';
import { invoke } from '@tauri-apps/api/core';
import Button from './components/button';
import Select from './components/select';
import { v4 as uuidv4 } from 'uuid';

const PERCENT_MODEL_ERROR = "总百分超过了100%, 请重新调整比例"


const remindHoursOptions = [
  { label: '1小时', value: 1 },
  { label: '2小时', value: 2 },
  { label: '3小时', value: 3 }
]

export function TaskList() {

  const [error, setError] = useState("");
  const debounceTimer = useRef(); // 防抖计时器
  const [items, setItems] = useState([]);
  const isInitial = useRef(true);
  const [remindLaterHours, setRemindLaterHours] = useState(1);

  const debounceError = useRef(); // 防抖错误提示


  // 加载本地任务
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await invoke("load_tasks")
        setError(res ? "" : "加载失败！")
        if (res) {
          setItems(res.tasks)
        }
      } catch (err) {
        setError(err)
      } finally {
        isInitial.current = false
      }
    }
    loadTasks()
  }, [])


  //修改任务和百分比
  const handleChange = (id, newText, newPercent) => {
    setItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, text: newText, percent: Number(newPercent) }
          : item
      )
    );
  };

  // 添加任务
  async function handleAddTask() {
    const newTask = { id: uuidv4(), text: '', percent: 0 }
    setItems(items => [...items, newTask])
  }

  // 完成任务
  async function handleFinish(id) {
    setItems(items => items.filter(item => item.id !== id))
  }


  // 判断 items 是否已经按 percent 降序排好
  function isSortedDesc(arr) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1].percent < arr[i].percent) return false;
    }
    return true;
  }

  // 定时器重新计算排序, 保存，2s延时
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {

      const totalPercent = items.reduce((acc, item) => acc + item.percent, 0);
      console.log(totalPercent)
      setError(totalPercent > 100 ? PERCENT_MODEL_ERROR : "");

      if (!isSortedDesc(items)) {
        setItems(prevItems => {
          // 需要排序
          const sorted = [...prevItems].sort((a, b) => b.percent - a.percent);

          return sorted;
        });
      }
      saveTasks(items);
    }, 2000);

    return () => clearTimeout(debounceTimer.current);
  }, [items]);

  useEffect(() => {
    if (debounceError.current) clearTimeout(debounceError.current);
    debounceError.current = setTimeout(() => {
      setError("")
    }, 10000);
  }, [error])


  // 保存tasks到本地
  async function saveTasks(tasks) {
    try {
      await invoke("save_tasks", {
        tasks: { tasks: tasks }
      })
    } catch (err) {
      setError(err)
    }
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

  return (
    <>
      <div className='flex flex-col items-center justify-center px-4 h-full'>

        {isInitial.current ? (
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
            {items.length > 0 ? (
              <Reorder.Group axis="y" values={items} onReorder={setItems} className="w-full space-y-2 flex-1 flex flex-col items-center justify-center">
                {items.map((item, index) => (
                  <Task key={item.id} item={item} onChangeValue={handleChange} index={index} handleFinish={handleFinish} />
                ))}
              </Reorder.Group>
            ) :
              (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="text-sm text-gray-500 text-center flex-1 flex items-center justify-center">请你记下今天最重要的三件事，全力以赴，完成它</motion.div>
              )}

            {/* 错误提示 */}
            {error &&
              <div className="w-full flex justify-end items-center gap-2 sticky bottom-0">
                <Info className="animate-bounce" size={16} />
                <div className='text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap'>{error}</div>
              </div>
            }
            <div className="w-full flex justify-between items-center p-2 sticky bottom-0">

              {items.length > 0 && <div className="flex flex-row items-center gap-2">
                <Button onClick={remindLater}>
                  <AlarmClock className="flex-shrink-0" size={16} /> <span className="text-ellipsis whitespace-nowrap">稍后提醒</span>
                </Button>

                <Select options={remindHoursOptions} value={remindLaterHours} onChange={e => setRemindLaterHours(e.target.value)} />
              </div>
              }

              {/* 添加任务按钮 */}
              <Button onClick={handleAddTask}>
                <Plus size={16} />添加任务
              </Button>


            </div>

          </div>
        )}
      </div>
    </>
  )
}

