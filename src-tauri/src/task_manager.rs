use crate::setting::load_setting_impl;
use chrono::{Local, NaiveTime, TimeZone};
use serde_json::json;

use crate::notion::get_auth_info_from_global;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use tauri_plugin_http::reqwest;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Time {
    pub start: String,
    pub end: Option<String>,
    pub time_zone: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub text: String,
    pub percent: u32,
    pub status: String,
    pub time: Time,
    pub tags: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize)]
pub struct TaskList {
    pub tasks: Vec<Task>,
}

#[derive(Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub object: String, // page or database
    pub title: String,
    pub parent_type: String,
    pub parent_id: String,
    pub url: String,
}

#[derive(Serialize, Default)]
pub struct SaveResult {
    success: bool,

    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub error: Option<String>, // 错误信息

    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub id: Option<String>, // 添加任务时，返回任务id

    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub tasks: Option<TaskList>, // 查询任务时获取列表

    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub status: Option<String>, // 查询任务时获取状态, "unauthorized" 未登录, "success" 成功, "failed" 失败

    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub pages: Option<Vec<Page>>, // 查询页面时获取列表

    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub tags: Option<Vec<String>>, // 查询标签时获取列表
}

#[derive(Serialize, Deserialize)]
pub struct TaskParams{
    pub start: Option<String>, // 开始日期
    pub end: Option<String>,   // 结束日期
    pub status: Option<String>,     // 状态 0:所有, 1:未开始, 2:完成
}

#[tauri::command]
pub fn save_tasks(tasks: TaskList, app: tauri::AppHandle) -> Result<SaveResult, String> {
    save_tasks_impl(&tasks, &app)
}

#[tauri::command]
pub async fn add_task(task: Task, app: tauri::AppHandle) -> Result<SaveResult, String> {
    add_task_to_notion_impl(&task, &app).await
}

#[tauri::command]
pub async fn update_task(task: Task, app: tauri::AppHandle) -> Result<SaveResult, String> {
    update_task_in_notion_impl(&task, &app).await
}

#[tauri::command]
pub async fn load_tasks(params: Option<TaskParams>, app: tauri::AppHandle) -> Result<SaveResult, String> {
    load_tasks_impl(&params, &app).await
}

pub async fn load_tasks_impl(params: &Option<TaskParams>, app: &tauri::AppHandle) -> Result<SaveResult, String> {
    // let auth_info = get_auth_info_from_global();
    // if let Some(_auth) = auth_info {
    //     return load_tasks_from_notion_impl(&app).await;
    // } else {
    //     return load_tasks_from_local_impl(&app).await;
    // }
    let auth_info = get_auth_info_from_global();
    if let Some(_auth) = auth_info {
        return load_tasks_from_notion_impl(params, &app).await;
    } else {
        return Ok(SaveResult {
            success: false,
            status: Some("unauthorized".to_string()),
            ..Default::default()
        });
    }
}

fn save_tasks_impl(tasks: &TaskList, app: &tauri::AppHandle) -> Result<SaveResult, String> {
    let config_dir = load_setting_impl(app).unwrap().path;
    let file_path = std::path::Path::new(&config_dir).join("tasks.json");
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json).map_err(|e| e.to_string())?;
    Ok(SaveResult {
        success: true,
        ..Default::default()
    })
}

// 从notion加载任务
pub async fn load_tasks_from_notion_impl(params: &Option<TaskParams>, _app: &tauri::AppHandle) -> Result<SaveResult, String> {
    let auth_info = get_auth_info_from_global();
    if let Some(auth) = auth_info {
        let url = format!(
            "{}/v1/databases/{}/query",
            std::env::var("VITE_NOTION_API_URL").unwrap_or_default(),
            auth.duplicated_template_id
        );

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", auth.access_token)).unwrap(),
        );
        headers.insert("Notion-Version", HeaderValue::from_static("2022-06-28"));
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));


        let search_condition = get_search_condition(params);
        
        let res = reqwest::Client::new()
            .post(url)
            .headers(headers)
            .body(serde_json::to_string(&search_condition).unwrap())
            .send()
            .await;

        match res {
            Ok(res) => {
                let text = res.text().await.unwrap();
                //println!("res text: {:?}", text);
                let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                let results = match json.get("results").and_then(|v| v.as_array()) {
                    Some(arr) => arr,
                    None => {
                        println!("解析Notion返回结果失败: {:?}", json);
                        return Ok(SaveResult {
                            success: false,
                            status: Some(json["code"].as_str().unwrap_or_default().to_string()),
                            ..Default::default()
                        });
                    }
                };
                let tasks: Vec<Task> = results
                    .iter()
                    .map(|result| {
                        let id = result["id"].as_str().unwrap_or_default();
                        let text = result["properties"]["task"]["title"]
                            .as_array()
                            .and_then(|arr| arr.get(0))
                            .and_then(|item| item["plain_text"].as_str())
                            .unwrap_or_default();

                        let percent = result["properties"]["percent"]["number"]
                            .as_u64()
                            .unwrap_or(0) as u32;

                        let status = result["properties"]["status"]["status"]["name"]
                            .as_str()
                            .unwrap_or_default();

                        let time = Time {
                            start: result["properties"]["time"]["date"]["start"]
                                .as_str()
                                .unwrap_or_default()
                                .to_string(),
                            end: result["properties"]["time"]["date"]["end"]
                                .as_str()
                                .map(|s| s.to_string()),
                            time_zone: result["properties"]["time"]["date"]["time_zone"]
                                .as_str()
                                .map(|s| s.to_string()),
                        };

                        let tags = match result.get("properties").and_then(|v| v.get("tags")) {
                            Some(v) => v.get("multi_select").and_then(|v| v.as_array()).map(|v| v.iter().map(|v| v["name"].as_str().unwrap_or_default().to_string()).collect::<Vec<_>>()),
                            None => None,
                        };
                        
                        Task {
                            id: id.to_string(),
                            text: text.to_string(),
                            percent: percent as u32,
                            status: status.to_string(),
                            time: time,
                            tags: tags,
                        }
                    })
                    .collect();

                return Ok(SaveResult {
                    success: true,
                    tasks: Some(TaskList { tasks: tasks }),
                    ..Default::default()
                });
            }
            Err(e) => {
                println!("error: {:?}", e);
            }
        }

        //let body = res.json::<TaskList>().await?;
    }
    return Ok(SaveResult {
        success: true,
        tasks: Some(TaskList { tasks: vec![] }),
        ..Default::default()
    });
}

// 修改notion中的某条任务
async fn update_task_in_notion_impl(
    task: &Task,
    _app: &tauri::AppHandle,
) -> Result<SaveResult, String> {
    log::info!("update_task_in_notion_impl");
    let auth_info = get_auth_info_from_global();
    if let Some(auth) = auth_info {
        // 使用 auth
        let url = format!(
            "{}/v1/pages/{}",
            std::env::var("VITE_NOTION_API_URL").unwrap_or_default(),
            task.id
        );

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", auth.access_token)).unwrap(),
        );
        headers.insert("Notion-Version", HeaderValue::from_static("2022-06-28"));
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let mut body = json!({
            "properties": {
                "task": {
                    "type": "title",
                    "title": [
                        {
                            "type": "text",
                            "text": {
                                "content": task.text
                            }
                        }
                    ]
                },
                "percent": {
                    "type": "number",
                    "number": task.percent
                },
                "status": {
                    "type": "status",
                    "status": {
                        "name": task.status
                    }
                },
                "time": {
                    "type": "date",
                    "date": {
                        "start": task.time.start,
                        "end": task.time.end,
                        "time_zone": task.time.time_zone
                    }
                }
            }
        });

        
        if task.tags.is_some() {
            log::info!("update_task_in_notion_impl task.tags: {:?}", task.tags);
            body["properties"]["tags"] = json!({
                "multi_select":  task.tags.as_ref().unwrap().iter().map(|v| json!({
                        "name": v
                    })).collect::<Vec<_>>()
                
            });
        }

        log::info!("update_task_in_notion_impl body: {:?}", body);

        let res = reqwest::Client::new()
            .patch(url)
            .headers(headers)
            .body(serde_json::to_string(&body).unwrap())
            .send()
            .await;

        match res {
            Ok(_res) => {
                // let text = res.text().await.unwrap();
                // //println!("res text: {:?}", text);
                // let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                return Ok(SaveResult {
                    success: true,
                    ..Default::default()
                });
            }
            Err(e) => {
                println!("error: {:?}", e);
            }
        }
    }

    return Ok(SaveResult {
        success: false,
        ..Default::default()
    });
}

async fn add_task_to_notion_impl(
    task: &Task,
    _app: &tauri::AppHandle,
) -> Result<SaveResult, String> {
    let auth_info = get_auth_info_from_global();
    if let Some(auth) = auth_info {
        let url = format!(
            "{}/v1/pages",
            std::env::var("VITE_NOTION_API_URL").unwrap_or_default()
        );

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", auth.access_token)).unwrap(),
        );
        headers.insert("Notion-Version", HeaderValue::from_static("2022-06-28"));
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let mut body = json!({
            "parent": {
                "type": "database_id",
                "database_id": auth.duplicated_template_id
            },
            "properties": {
                "task": {
                    "type": "title",
                    "title": [
                        {
                            "type": "text",
                            "text": {
                                "content": task.text
                            }
                        }
                    ]
                },
                "percent": {
                    "type": "number",
                    "number": task.percent
                },
                "status": {
                    "type": "status",
                    "status": {
                        "name": task.status
                    }
                },
                "time": {
                    "type": "date",
                    "date": {
                        "start": task.time.start,
                        "end": task.time.end,
                        "time_zone": task.time.time_zone
                    }
                },
            }
        });

        if task.tags.is_some() {
            body["properties"]["tags"] = json!({
                "multi_select":  task.tags.as_ref().unwrap().iter().map(|v| json!({
                        "name": v
                    })).collect::<Vec<_>>()
                
            });
        }


        log::debug!("add_task_to_notion_impl body: {:?}", body);

        let res = reqwest::Client::new()
            .post(url)
            .headers(headers)
            .body(serde_json::to_string(&body).unwrap())
            .send()
            .await;

        match res {
            Ok(res) => {
                let text = res.text().await.unwrap();
                let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                return Ok(SaveResult {
                    success: true,
                    id: Some(json.get("id").unwrap().as_str().unwrap().to_string()),
                    ..Default::default()
                });
            }
            Err(e) => {
                println!("error: {:?}", e);
            }
        }
    }

    return Ok(SaveResult {
        success: false,
        ..Default::default()
    });
}

// 获取今天0点的时间
fn get_today_begin_time() -> String {
    // 1. 获取今天本地日期
    let today = Local::now().date_naive();

    // 2. 构建 00:00:00 的 NaiveDateTime
    let midnight_naive = today.and_time(NaiveTime::from_hms_opt(0, 0, 0).unwrap());

    // 3. 转换为本地时区的 DateTime<Local>
    let midnight_local = Local.from_local_datetime(&midnight_naive).unwrap();

    // 4. 输出 ISO8601 格式字符串
    let iso8601_str = midnight_local.to_rfc3339();

    return iso8601_str;
}

// 获取今天0点的时间
fn get_today_end_time() -> String {
    // 1. 获取今天本地日期
    let today = Local::now().date_naive();

    // 2. 构建 00:00:00 的 NaiveDateTime
    let midnight_naive = today.and_time(NaiveTime::from_hms_opt(23, 59, 59).unwrap());

    // 3. 转换为本地时区的 DateTime<Local>
    let midnight_local = Local.from_local_datetime(&midnight_naive).unwrap();

    // 4. 输出 ISO8601 格式字符串
    let iso8601_str = midnight_local.to_rfc3339();

    return iso8601_str;
}


#[tauri::command]
pub async fn load_pages(app: tauri::AppHandle) -> Result<SaveResult, String> {
    load_pages_from_notion_impl(&app).await
}

// 从notion加载任务
pub async fn load_pages_from_notion_impl(_app: &tauri::AppHandle) -> Result<SaveResult, String> {
    log::info!("load_pages_from_notion_impl");
    let auth_info = get_auth_info_from_global();
    log::debug!(
        "load_pages_from_notion_impl auth_info: {:?}",
        auth_info.is_some()
    );
    if let Some(auth) = auth_info {
        log::debug!(
            "load_pages_from_notion_impl access_token: {:?}",
            auth.access_token
        );

        let url = format!(
            "{}/v1/search",
            std::env::var("VITE_NOTION_API_URL").unwrap_or_default()
        );

        log::debug!("VITE_NOTION_API_URL: {:?}", url);

        let mut headers = HeaderMap::new();

        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", auth.access_token)).unwrap(),
        );
        headers.insert("Notion-Version", HeaderValue::from_static("2022-06-28"));
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let body = json!({
            "filter": {
                "value": "database",
                "property": "object"
            },
            "sort": {
                "direction": "ascending",
                "timestamp": "last_edited_time"
            }
        });

        let res = reqwest::Client::new()
            .post(url)
            .headers(headers)
            .body(serde_json::to_string(&body).unwrap())
            .send()
            .await;

        match res {
            Ok(res) => {
                let text = res.text().await.unwrap();
                let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                let results = match json.get("results").and_then(|v| v.as_array()) {
                    Some(arr) => arr,
                    None => {
                        log::error!("解析Notion返回结果失败: {:?}", json);
                        return Ok(SaveResult {
                            success: false,
                            status: Some(json["code"].as_str().unwrap_or_default().to_string()),
                            ..Default::default()
                        });
                    }
                };

                log::debug!("load_pages_from_notion_impl results: {:?}", results.len());
                let pages: Vec<Page> = results
                    .iter()
                    .map(|result| {
                        let id = result["id"].as_str().unwrap_or_default().replace("-", "");
                        let object = result["object"].as_str().unwrap_or_default();

                        let title;

                        if object == "page" {
                            title = result["properties"]["title"]["title"]
                                .as_array()
                                .and_then(|arr| arr.get(0))
                                .and_then(|item| item["plain_text"].as_str())
                                .unwrap_or_default();
                        } else {
                            title = result["title"]
                                .as_array()
                                .and_then(|arr| arr.get(0))
                                .and_then(|item| item["plain_text"].as_str())
                                .unwrap_or_default();
                        }

                        let parent_type = result["parent"]["type"].as_str().unwrap_or_default();
                        let parent_id = result["parent"][parent_type]
                            .as_str()
                            .unwrap_or_default()
                            .replace("-", "");
                        let url = result["url"].as_str().unwrap_or_default();

                        Page {
                            id: id.to_string(),
                            object: object.to_string(),
                            title: title.to_string(),
                            parent_type: parent_type.to_string(),
                            parent_id: parent_id.to_string(),
                            url: url.to_string(),
                        }
                    })
                    .collect();

                log::info!(
                    "load_pages_from_notion_impl pages number: {:?}",
                    pages.len()
                );
                return Ok(SaveResult {
                    success: true,
                    pages: Some(pages),
                    ..Default::default()
                });
            }
            Err(e) => {
                log::error!("load_pages_from_notion_impl error: {:?}", e);
            }
        }

        //let body = res.json::<TaskList>().await?;
    }

    log::error!("load_pages_from_notion_impl get_auth_info_from_global failed");
    return Ok(SaveResult {
        success: false,
        status: Some("unauthorized".to_string()),
        ..Default::default()
    });
}


fn get_search_condition(params: &Option<TaskParams>) -> serde_json::Value {
    let start;
    let end;
    let status;

    
    if params.is_none() {
        start = get_today_begin_time();
        end = get_today_end_time();
        status = "1".to_string();
    }else{
        start = params.as_ref().unwrap().start.clone().unwrap_or_default();
        end = params.as_ref().unwrap().end.clone().unwrap_or_default();
        status = params.as_ref().unwrap().status.clone().unwrap_or_default();
    }

    log::info!("get_search_condition params: {:?}, {:?}, {:?}", start, end, status);

    


    let mut body = json!({
        "filter": {
            "and": [
            ]
        },
        "sorts": [
            {
                "property": "percent",
                "direction": "descending"
            },
            {
                "property": "time",
                "direction": "ascending"
            }
        ]
    });

    if params.is_some() {
        if let Some(arr) = body
        .get_mut("filter")
        .and_then(|f| f.get_mut("and"))
        .and_then(|v| v.as_array_mut()) 
        {

            arr.push(json!(
                {
                    "property": "time",
                    "date":{
                        "on_or_after": start,
                    }
                }
            ));  

            arr.push(json!(
                {
                    "property": "time",
                    "date":{
                        "on_or_before": end,
                    }
                }
            ));


            if status == "1" {
                arr.push(json!(
                    {
                        "or": [
                            {
                                "property": "status",
                                "status": {
                                    "equals": "未开始"
                                }
                            },
                            {
                                "property": "status",
                                "status": {
                                    "equals": "Not started"
                                }
                            }
                        ]
                    }
                ));
            }else if status == "2" {
                arr.push(json!(
                    {
                        "or": [
                            {
                                "property": "status",
                                "status": {
                                    "equals": "完成"
                                }
                            },
                            {
                                "property": "status",
                                "status": {
                                    "equals": "Done"
                                }
                            }
                        ]
                    }
                ));
            }
        
        }
    }

    return body

}


#[tauri::command]
pub async fn load_tags() -> Result<SaveResult, String> {
    log::info!("load_tags");
    load_tags_impl().await
}

#[tauri::command]
pub async fn update_tags(tags: Vec<String>) -> Result<SaveResult, String> {
    log::info!("update_tags");
    update_tags_impl(&tags ).await
}
async fn load_tags_impl() -> Result<SaveResult, String> {
    log::info!("load_tags_impl");
    let auth_info = get_auth_info_from_global();

    if let Some(auth) = auth_info {
        let url = format!(
            "{}/v1/databases/{}",
            std::env::var("VITE_NOTION_API_URL").unwrap_or_default(),
            auth.duplicated_template_id
        );

        log::debug!("VITE_NOTION_API_URL: {:?}", url);

        let mut headers = HeaderMap::new();

        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", auth.access_token)).unwrap(),
        );
        headers.insert("Notion-Version", HeaderValue::from_static("2022-06-28"));
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));



        let res = reqwest::Client::new()
            .get(url)
            .headers(headers)
            .send()
            .await;

        match res {
            Ok(res) => {
                let text = res.text().await.unwrap();
                let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                let properties = match json.get("properties").and_then(|v| v.as_object()) {
                    Some(obj) => obj,
                    None => {
                        log::error!("解析Notion数据库properties字段失败: {:?}", json);
                        return Ok(SaveResult {
                            success: false,
                            tags: Some(vec![]),
                            ..Default::default()
                        });
                    }
                };
                
                let tags_obj = match properties.get("tags").and_then(|v| v.as_object()) {
                    Some(arr) => arr,
                    None => {
                        log::info!("未创建标签: {:?}", json);
                        return Ok(SaveResult {
                            success: true,
                            tags: Some(vec![]),
                            ..Default::default()
                        });
                    }
                };

                let tags_arr = match tags_obj.get("multi_select").and_then(|v| v.as_object()).and_then(|v| v.get("options").and_then(|v| v.as_array())) {
                    Some(arr) => arr,
                    None => {
                        log::info!("未创建标签: {:?}", json);
                        return Ok(SaveResult {
                            success: true,
                            tags: Some(vec![]),
                            ..Default::default()
                        });
                    }
                };

                let tags: Vec<String> = tags_arr
                    .iter()
                    .map(|v| v["name"].as_str().unwrap_or_default().to_string())
                    .collect();
                
                log::info!("load_tags_impl tags: {:?}", tags);
                return Ok(SaveResult {
                    success: true,
                    tags: Some(tags),
                    ..Default::default()
                });
            }
            Err(e) => {
                log::error!("load_pages_from_notion_impl error: {:?}", e);
            }
        }

        //let body = res.json::<TaskList>().await?;
    }

    log::error!("load_pages_from_notion_impl get_auth_info_from_global failed");

    return Ok(SaveResult {
        success: false,
        tags: Some(vec![]),
        ..Default::default()
    });
}

async fn update_tags_impl(tags: &Vec<String>) -> Result<SaveResult, String>  {
    log::info!("update_tags_impl");
    let auth_info = get_auth_info_from_global();

    if let Some(auth) = auth_info {
        let url = format!(
            "{}/v1/databases/{}",
            std::env::var("VITE_NOTION_API_URL").unwrap_or_default(),
            auth.duplicated_template_id
        );

        log::debug!("VITE_NOTION_API_URL: {:?}", url);

        let mut headers = HeaderMap::new();

        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", auth.access_token)).unwrap(),
        );
        headers.insert("Notion-Version", HeaderValue::from_static("2022-06-28"));
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let body = json!({
            "properties": {
                "tags": {
                    "multi_select": {
                        "options": tags.iter().map(|v| json!({
                            "name": v
                        })).collect::<Vec<_>>()
                    }
                }
            }
        });

        log::info!("update_tags_impl body: {:?}", body);


        let res = reqwest::Client::new()
            .patch(url)
            .body(serde_json::to_string(&body).unwrap())
            .headers(headers)
            .send()
            .await;

        match res {
            Ok(res) => {
                let text = res.text().await.unwrap();
                let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                let properties = match json.get("properties").and_then(|v| v.as_object()) {
                    Some(obj) => obj,
                    None => {
                        log::error!("解析Notion数据库properties字段失败: {:?}", json);
                        let error = json.get("message").and_then(|v| v.as_str()).map(|v| v.to_string());
                        return Ok(SaveResult {
                            success: false,
                            error: error,
                            ..Default::default()
                        });
                    }
                };
                
                let tags_obj = match properties.get("tags").and_then(|v| v.as_object()) {
                    Some(arr) => arr,
                    None => {
                        log::info!("未创建标签: {:?}", json);
                        return Ok(SaveResult {
                            success: true,
                            tags: Some(vec![]),
                            ..Default::default()
                        });
                    }
                };

                let tags_arr = match tags_obj.get("multi_select").and_then(|v| v.as_object()).and_then(|v| v.get("options").and_then(|v| v.as_array())) {
                    Some(arr) => arr,
                    None => {
                        log::info!("未创建标签: {:?}", json);
                        return Ok(SaveResult {
                            success: true,
                            tags: Some(vec![]),
                            ..Default::default()
                        });
                    }
                };

                let tags: Vec<String> = tags_arr
                    .iter()
                    .map(|v| v["name"].as_str().unwrap_or_default().to_string())
                    .collect();
                
                log::info!("load_tags_impl tags: {:?}", tags);
                return Ok(SaveResult {
                    success: true,
                    tags: Some(tags),
                    ..Default::default()
                });
            }
            Err(e) => {
                log::error!("load_pages_from_notion_impl error: {:?}", e);
            }
        }

        //let body = res.json::<TaskList>().await?;
    }

    log::error!("load_pages_from_notion_impl get_auth_info_from_global failed");

    return Ok(SaveResult {
        success: false,
        tags: Some(vec![]),
        ..Default::default()
    });
}