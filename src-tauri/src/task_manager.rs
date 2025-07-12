use serde::{Deserialize, Serialize};
use crate::setting::load_setting_impl;

#[derive(Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub text: String,
    pub percent: u32,
}

#[derive(Serialize, Deserialize)]
pub struct TaskList {
    pub tasks: Vec<Task>,
}

#[derive(Serialize)]
pub struct SaveResult {
    success: bool,
}

#[tauri::command]
pub fn save_tasks(tasks: TaskList, app: tauri::AppHandle) -> Result<SaveResult, String> {
    save_tasks_impl(&tasks, &app)
}

#[tauri::command]
pub fn load_tasks(app: tauri::AppHandle) -> Result<TaskList, String> {
    load_tasks_impl(&app)
}

pub fn save_tasks_impl(tasks: &TaskList, app: &tauri::AppHandle) -> Result<SaveResult, String> {
    let config_dir = load_setting_impl(app).unwrap().path;
    let file_path = std::path::Path::new(&config_dir).join("tasks.json");
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json).map_err(|e| e.to_string())?;
    Ok(SaveResult { success: true })
}

pub fn load_tasks_impl(app: &tauri::AppHandle) -> Result<TaskList, String> {
    let config_dir = load_setting_impl(app).unwrap().path;
    let file_path = std::path::Path::new(&config_dir).join("tasks.json");

    // 文件不存在时，返回空任务列表
    if !file_path.exists() {
        return Ok(TaskList { tasks: vec![] });
    }
    let content = std::fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;
    let task_list: TaskList = serde_json::from_str(&content).map_err(|e| format!("解析 JSON 失败: {}", e))?;
    Ok(task_list)
}
