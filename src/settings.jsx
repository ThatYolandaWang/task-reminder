import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react"

import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import NotionLoginButton from "./notion"
import NotionPage from "./notion-page"
import { invoke } from '@tauri-apps/api/core';
import { useNotionContext } from "./context/NotionContext";
import { toast } from "sonner";

import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export default function Settings() {

  const { state, authInfo, logout } = useNotionContext();

  const [isOn, setIsOn] = useState(false)


  const [setting, setSetting] = useState({
    remind_time: 10,
  })

  const debounceTimer = useRef(); // 防抖计时器

  const [version, setVersion] = useState("")


  useEffect(() => {

    loadSetting()
    getAutostart()
  }, [])

  async function loadSetting() {

    try {

      const version = await getVersion()
      setVersion(version)

      const setting = await invoke('load_setting');
      setSetting(setting)
    } catch (error) {
      toast.error(error)
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
    } catch (error) {
      toast.error(error)
    }
  }

  const checkUpdate = async () => {

    try {


      const update = await check()
      if (update) {
        toast.info(
          `发现新版本 ${update.version}，更新内容：${update.body}`
        )
        let downloaded = 0;
        let contentLength = 0;
        // alternatively we could also call update.download() and update.install() separately
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength;
              console.log(`started downloading ${event.data.contentLength} bytes`);
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case 'Finished':
              console.log('download finished');
              break;
          }
        });

        toast.success('更新已安装，正在重启应用');
        await relaunch();
      }
      else {
        toast.info('当前已是最新版本')
      }
    } catch (error) {
      toast.error("检查更新失败:" + error)
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
        <div className='font-bold text-center'>配置</div>
      </motion.div>

      <div className="flex-1 flex flex-col gap-4 w-full">
        <div className="flex flex-row justify-between items-center gap-2">
          {state === "success" &&
            <div className="flex flex-row items-center gap-2">
              <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center">
                <span className="text-gray-500 text-xs">{authInfo.user.name.slice(0, 1).toUpperCase() || "U"}</span>
              </div>
              <div className="text-sm text-ellipsis whitespace-nowrap">{authInfo.user.name}</div>
            </div>
          }
          <NotionLoginButton />
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
          <Label htmlFor="autostart">开启自动启动</Label>
          <Switch id="autostart" checked={isOn} onCheckedChange={setAutostart} />
        </div>

        <div className="flex flex-row items-center justify-between gap-2">
          <Label htmlFor="remind_time" className="text-ellipsis whitespace-nowrap">提醒频率(min)</Label>
          <Input id="remind_time" value={setting.remind_time} type="text" inputMode="decimal" pattern="\d*" onChange={
            (e) => {
              let v = e.target.value.replace(/\D/g, "");
              setSetting({ ...setting, remind_time: Number(v) })
            }}
          />
        </div>

        {state === "success" && (
          <>
            <div className="flex flex-row items-center justify-between gap-2">
              <Label htmlFor="notion_page" className="text-ellipsis whitespace-nowrap">任务列表</Label>
              <NotionPage />
            </div>

            <Button variant="ghost" onClick={logout}>退出登录</Button>
          </>
        )}


      </div>
      <div className="flex flex-col items-center justify-between p-2">

        <div className="text-sm text-ellipsis whitespace-nowrap text-gray-500">版本: {version}</div>
        <Button variant="ghost" onClick={checkUpdate}>检查更新</Button>
      </div>
    </div>
  );
}