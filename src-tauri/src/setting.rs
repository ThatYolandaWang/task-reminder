use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct Setting {
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

pub fn save_setting_impl(setting: &Setting, app: &tauri::AppHandle) -> Result<SaveResult, String> {
    let config_dir = app.path().app_config_dir().unwrap();

    let file_path = config_dir.join("setting.json");

    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&setting).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json).map_err(|e| e.to_string())?;
    Ok(SaveResult { success: true })
}

pub fn load_setting_impl(app: &tauri::AppHandle) -> Result<Setting, String> {
    let config_dir = app.path().app_config_dir().unwrap();

    let file_path = config_dir.join("setting.json");

    // 文件不存在时，
    if !file_path.exists() {
        return Ok(Setting {
            remind_time: 60,
            task_type: 0,
            path: app.path().app_config_dir().unwrap().to_str().unwrap().to_string()
        });
    }

    let json = std::fs::read_to_string(file_path).unwrap();
    let setting: Setting = serde_json::from_str(&json).unwrap();
    Ok(setting)
}
