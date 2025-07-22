use once_cell::sync::OnceCell;

use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::Manager;

pub static GLOBAL_AUTH_INFO: OnceCell<Mutex<Option<AuthInfo>>> = OnceCell::new();

// 初始化程序时读取授权信息
pub fn init_auth_info(app: &tauri::AppHandle) {
    let auth_info = load_auth_info_impl(app).unwrap_or(None);
    GLOBAL_AUTH_INFO.set(Mutex::new(auth_info)).ok();
}

#[derive(Serialize,Deserialize, Default)]
pub struct SaveResult {
    success: bool,

    #[serde(skip_serializing_if = "Option::is_none", default)]
    error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Person {
    pub email: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub object: String,
    pub name: Option<String>,
    pub r#type: Option<String>,
    pub avatar_url: Option<String>,
    pub person: Option<Person>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AuthInfo {
    pub access_token: String,
    pub bot_id: String,
    pub duplicated_template_id: String,

    pub user: User,

    pub refresh_token: Option<String>,
    pub request_id: String,
    pub token_type: String,

    pub workspace_icon: Option<String>,
    pub workspace_id: String,
    pub workspace_name: String,
}

// 前端保存授权信息
#[tauri::command]
pub fn save_auth_info(auth: AuthInfo, app: tauri::AppHandle) -> Result<SaveResult, String> {
    save_auth_info_impl(&auth, &app)
}

// 前端加载授权信息
#[tauri::command]
pub fn load_auth_info(app: tauri::AppHandle) -> Result<Option<AuthInfo>, String> {
    log::info!("load_auth_info");
    let auth_info = GLOBAL_AUTH_INFO
        .get()
        .ok_or_else(|| "AuthInfo 未初始化".to_string())
        .and_then(|mutex| {
            mutex
                .lock()
                .map_err(|e| format!("Mutex 加锁失败: {}", e))
                .map(|guard| guard.clone())
        });
    if let Ok(Some(auth)) = auth_info {
        log::info!("load_auth_info auth from GLOBAL_AUTH_INFO");
        return Ok(Some(auth));
    }
    let auth = load_auth_info_impl(&app).unwrap_or(None);
    log::info!("load_auth_info auth from file");
    if let Some(auth_val) = &auth {
        if let Some(mutex) = GLOBAL_AUTH_INFO.get() {
            let mut guard = mutex.lock().unwrap();
            *guard = Some(auth_val.clone());
            log::info!("load_auth_info update to GLOBAL_AUTH_INFO");
        }
    }
    Ok(auth)
}

// 退出登陆
#[tauri::command]
pub fn clear_auth_info(app: tauri::AppHandle) -> Result<SaveResult, String> {
    log::info!("clear_auth_info");
    // 清空内存
    if let Some(mutex) = GLOBAL_AUTH_INFO.get() {
        let mut guard = mutex.lock().unwrap();
        *guard = None; // 这样即可清空全局内容
    }

    // 清空本地文件
    let config_dir = app.path().app_config_dir().unwrap();
    let file_path = config_dir.join("auth_info.json");
    if file_path.exists() {
        println!("remove_file");
        std::fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    Ok(SaveResult {
        success: true,
        ..Default::default()
    })
}

// 前端保存授权信息
pub fn save_auth_info_impl(auth: &AuthInfo, app: &tauri::AppHandle) -> Result<SaveResult, String> {
    log::info!("save_auth_info_impl");
    log::info!("user: {:?}", auth.user.name);
    let config_dir = app.path().app_config_dir().unwrap();

    let file_path = config_dir.join("auth_info.json");

    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&auth).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json).map_err(|e| e.to_string())?;

    // 需要更新内容时
    if let Some(mutex) = GLOBAL_AUTH_INFO.get() {
        let mut guard = mutex.lock().unwrap();
        *guard = Some(auth.clone()); // 或 None 以清除
    }

    Ok(SaveResult {
        success: true,
        ..Default::default()
    })
}

// 从文件中加载授权信息
pub fn load_auth_info_impl(app: &tauri::AppHandle) -> Result<Option<AuthInfo>, String> {
    let config_dir = app.path().app_config_dir().unwrap();
    let file_path = config_dir.join("auth_info.json");

    if !file_path.exists() {
        return Ok(None);
    }
    let content =
        std::fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;
    let auth: AuthInfo =
        serde_json::from_str(&content).map_err(|e| format!("解析 JSON 失败: {}", e))?;
    log::info!("load_auth_info_impl: {:?}", auth.user.name);
    Ok(Some(auth))
}

// 供程序内部使用
pub fn get_auth_info_from_global() -> Option<AuthInfo> {
    GLOBAL_AUTH_INFO
        .get()
        .and_then(|mutex| mutex.lock().ok())
        .and_then(|guard| guard.clone())
}

#[tauri::command]
pub async fn select_page(id: String, app: tauri::AppHandle) -> Result<SaveResult, String> {
    log::info!("select_page");
    let cloned_auth;
    if let Some(mutex) = GLOBAL_AUTH_INFO.get() {
        let mut guard = mutex.lock().map_err(|e| e.to_string())?;
        if let Some(auth_info) = guard.as_mut() {
            auth_info.duplicated_template_id = id;
            cloned_auth = Some(auth_info.clone());
        } else {
            return Ok(SaveResult {
                success: false,
                error: Some("AuthInfo 为空，无法更新".to_string()),
            });
        }
    } else {
        return Ok(SaveResult {
            success: false,
            error: Some("GLOBAL_AUTH_INFO 未初始化".to_string()),
        });
    }
    // 锁已释放
    if let Some(auth) = cloned_auth {
        save_auth_info_impl(&auth, &app)?;
    }
    Ok(SaveResult {
        success: true,
        ..Default::default()
    })
}
