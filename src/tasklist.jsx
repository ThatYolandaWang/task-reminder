import { motion } from "motion/react";
import { Reorder } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Plus, Info } from 'lucide-react';
import { Task } from './task';
import { invoke } from '@tauri-apps/api/core';
import Button from './components/button';
import { v4 as uuidv4 } from 'uuid';

const PERCENT_MODEL_ERROR = "总百分超过了100%, 请重新调整比例"

export function TaskList() {

  const [error, setError] = useState("");
  const debounceTimer = useRef(); // 防抖计时器

  const [items, setItems] = useState([])

  const isInitial = useRef(true)


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

  return (
    <>
      <div className='flex flex-col items-center justify-center gap-8 px-4 h-full'>
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full flex flex-col items-center justify-center gap-2 pt-4 h-20">
          <div className='font-bold text-2xl text-center'>HI,THERE</div>
          
        </motion.div>

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

          <div className="flex-1 flex flex-col justify-center items-center gap-8 w-full">

            {/* 事件列表 */}
            <Reorder.Group axis="y" values={items} onReorder={setItems} className="w-full space-y-2 ">
              {items.map((item, index) => (
                <Task key={item.id} item={item} onChangeValue={handleChange} index={index} handleFinish={handleFinish} />
              ))}
            </Reorder.Group>

            {/* 如果列表为空，显示提示 */}
            {items.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="text-sm text-gray-500 text-center">请你记下今天最重要的三件事，全力以赴，完成它</motion.div>
            )}
            {/* 添加任务按钮 */}
            <Button onClick={handleAddTask}>
              <Plus size={16} />添加任务
            </Button>

          </div>
        )}

        {/* 错误提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full flex justify-end items-center h-10 gap-2 sticky bottom-0">
          {error &&
            <>
              <Info className="animate-bounce" size={16} />
              <div className='text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap'>{error}</div>
            </>
          }
        </motion.div>
      </div>


    </>
  )
}

