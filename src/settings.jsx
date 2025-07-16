import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react"

import Slider from "./components/slider"
import Input from "./components/input"
import NotionLoginButton from "./notion"
import { invoke } from '@tauri-apps/api/core';

import { Info } from "lucide-react"

export default function Settings() {

  const [error, setError] = useState("")
  const [isOn, setIsOn] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  const [setting, setSetting] = useState({
    remind_time: 10,
  })

  const debounceTimer = useRef(); // 防抖计时器


  useEffect(() => {
    loadSetting()
    getAutostart()
  }, [isLogin])

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

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      saveSetting()
    }, 1000)
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

        <NotionLoginButton onLogin={() => setIsLogin(true)} />

        <Slider label="开启自动启动" isOn={isOn} setIsOn={setAutostart} />

        <Input label="定期提醒时间（分钟）" value={setting.remind_time} type="text" inputMode="decimal" pattern="\d*" onChange={
          (e)=>{
            let v = e.target.value.replace(/\D/g, "");
            setSetting({ ...setting, remind_time: Number(v) })
          }}
        />

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