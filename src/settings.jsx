import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react"

import Slider from "./components/slider"
import Input from "./components/input"
import Button from "./components/button"
import { TabSwitcher } from "./components/tab-switcher"

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Info, ArrowUpLeft, ArrowDownLeft, ArrowUpRight, ArrowDownRight } from "lucide-react"


const positionOptions = [
  {
    id: 0,
    label: "左上角",
    tip: "左上角",
    icon: <ArrowUpLeft />
  },
  {
    id: 1,
    label: "左下角",
    tip: "左下角",
    icon: <ArrowDownLeft />
  },
  {
    id: 2,
    label: "右上角",
    tip: "右上角",
    icon: <ArrowUpRight />
  },
  {
    id: 3,
    label: "右下角",
    tip: "右下角",
    icon: <ArrowDownRight />
  }
]
export default function Settings() {

  const [error, setError] = useState("1")
  const [isOn, setIsOn] = useState(false)


  const [setting, setSetting] = useState({
    position: 3, // 0 左上角 1 左下角 2 右上角 3 右下角
    remind_time: 10,
    task_type: 0,
    path: ""
  })

  const debounceTimer = useRef(); // 防抖计时器

  useEffect(() => {
    loadSetting()
    getAutostart()
  }, [])

  async function loadSetting() {

    try {
      const setting = await invoke('load_setting');
      setSetting(setting)
    } catch (error) {
      setError(error)
    }
  }

  async function getAutostart() {
    const enabled = await invoke('plugin:autostart|is_enabled');
    setIsOn(enabled)
  }

  async function setAutostart(enabled) {
    try {
      if (enabled) {
        await invoke('plugin:autostart|enable');
      } else {
        await invoke('plugin:autostart|disable');
      }
      setIsOn(enabled)
    } catch (error) {
      console.error(error)
    }
  }


  async function handleSelectFile() {
    const selected = await open({
      multiple: false,
      directory: true // 设为 true 可选文件夹
    });
    setSetting({ ...setting, path: selected })
  }

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      saveSetting()
    }, 5000)
  }, [setting])

  async function saveSetting() {
    try {
      console.log(setting)
      await invoke('save_setting', { setting })

      setError("")
    } catch (error) {
      setError(error)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center gap-8 px-4 h-full'>
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col items-center justify-center gap-2 pt-4">
        <div className='font-bold text-2xl text-center'>配置</div>
      </motion.div>

      <div className="flex-1 flex flex-col gap-4 w-full">

        <Slider label="开启自动启动" isOn={isOn} setIsOn={setAutostart} />
        <Slider label="任务划分（时间）" isOn={setting.task_type === 0} setIsOn={(e)=>{
          setSetting({ ...setting, task_type: e ? 0 : 1 })
        }} />

        <Input label="定期提醒时间（分钟）" value={setting.remind_time} type="number" onChange={(e)=>{
          setSetting({ ...setting, remind_time: Number(e.target.value) })
          }} />

        {/* 配置路径 */}
        <div className="flex flex-row items-end gap-2 justify-center">
          <Input label="配置路径" value={setting.path} type="text" onChange={(e)=>{
            setSetting({ ...setting, path: e.target.value })
          }} disabled={true} />
          <Button onClick={handleSelectFile}><FolderOpen size={16} /></Button>
        </div>

        {/* 窗口位置 */}
        <TabSwitcher label="窗口位置" active={setting.position} options={positionOptions}  onChange={(e)=>{
          setSetting({ ...setting, position: e })
        }} />

        <Button>退出</Button>



      </div>
      {/* 错误提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-end items-center h-10 gap-2 sticky bottom-0">
        {error &&
          <>
            <Info size={16} />
            <div className='text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap'>{error}</div>
          </>
        }
      </motion.div>


    </div>
  );
}