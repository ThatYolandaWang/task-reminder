use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

pub static GLOBAL_REMIND_TIME: Lazy<Mutex<u64>> = Lazy::new(|| Mutex::new(0));

#[derive(Serialize, Deserialize)]
pub struct Setting {
    pub position: u32,    // 0 左上角 1 左下角 2 右上角 3 右下角
    pub remind_time: u64, // 定期提醒时间（分钟）
    pub task_type: u32,   // 0: 按时间划分, 1: 按任务划分
    pub path: String,     // 配置路径
}

#[derive(Serialize)]
pub struct SaveResult {
    success: bool,
}

#[tauri::command]
pub fn save_setting(setting: Setting, app: tauri::AppHandle) -> Result<SaveResult, String> {
    save_setting_impl(&setting, &app)
}

#[tauri::command]
pub fn load_setting(app: tauri::AppHandle) -> Result<Setting, String> {
    load_setting_impl(&app)
}

// 保存配置
pub fn save_setting_impl(setting: &Setting, app: &tauri::AppHandle) -> Result<SaveResult, String> {
    let config_dir = app.path().app_config_dir().unwrap();

    let file_path = config_dir.join("setting.json");

    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&setting).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json).map_err(|e| e.to_string())?;
    Ok(SaveResult { success: true })
}

// 加载配置
pub fn load_setting_impl(app: &tauri::AppHandle) -> Result<Setting, String> {
    let config_dir = app.path().app_config_dir().unwrap();

    let file_path = config_dir.join("setting.json");

    // 文件不存在时，
    if !file_path.exists() {
        return Ok(Setting {
            position: 3,
            remind_time: 60,
            task_type: 0,
            path: app
                .path()
                .app_config_dir()
                .unwrap()
                .to_str()
                .unwrap()
                .to_string(),
        });
    }

    let json = std::fs::read_to_string(file_path).unwrap();
    let setting: Setting = serde_json::from_str(&json).unwrap();
    Ok(setting)
}

#[tauri::command]
pub fn set_remind_later(hours: u64, app: tauri::AppHandle) -> Result<(), String> {
    set_remind_later_impl(hours, &app);
    Ok(())
}

pub fn set_remind_later_impl(hours: u64, app: &tauri::AppHandle) {
    println!("set_remind_later: {}", hours);
    *GLOBAL_REMIND_TIME.lock().unwrap() = hours;
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    window.hide();
}

pub fn get_remind_later_impl(app: &tauri::AppHandle) -> u64 {
    if *GLOBAL_REMIND_TIME.lock().unwrap() == 0 {
        let setting = load_setting_impl(app).unwrap();
        return setting.remind_time;
    } else {
        return *GLOBAL_REMIND_TIME.lock().unwrap() * 60;
    }
}
