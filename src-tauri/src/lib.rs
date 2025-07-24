// #[cfg_attr(mobile, tauri::mobile_entry_point)]

mod notion;
mod setting;
mod task_manager;
mod window_manager; // 声明模块
use tauri_plugin_autostart::MacosLauncher;

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent};

use std::env;
use std::path::PathBuf;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["com.task-reminder"]),
        ))
        .setup(|app| {

            // 初始化环境变量
            // 1. 开发环境：.env 在项目根目录
            // 2. 打包后：.env 在资源目录
            let env_path = if cfg!(debug_assertions) {
                // 开发环境：.env 在项目根目录
                PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap())
                .parent().unwrap()
                .join(".env")
            } else {
                // 生产环境
                let resource_dir = app
                    .path()
                    .resource_dir()
                    .expect("Failed to get resource dir");
                resource_dir.join(".env")
            };

            log::info!("env_path: {:?}", env_path);
            dotenv::from_path(env_path).ok();

            log::info!("setup");

            // 初始化菜单
            let toggle = MenuItemBuilder::new("Show/Hide").id("toggle").build(app)?;
            let quit = MenuItemBuilder::new("Quit").id("quit").build(app)?;
            let settings = MenuItemBuilder::new("Settings").id("settings").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&toggle)
                .item(&settings)
                .separator()
                .item(&quit)
                .build()
                .unwrap();

            TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                //.menu_on_left_click(true)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "toggle" => {
                        let win = app.get_webview_window("main").unwrap();
                        //window_manager::move_to_top_right(&win).unwrap();
                        if win.is_visible().unwrap_or(false) {
                            win.hide().unwrap();
                        } else {
                            win.show().unwrap();
                            win.set_focus().unwrap();
                        }
                    }
                    "settings" => {
                        // 检查是否已存在 settings 窗口
                        if let Some(win) = app.get_webview_window("settings") {
                            win.show().unwrap();
                            win.set_focus().unwrap();
                        } else {
                            // 不存在则新建
                            tauri::WebviewWindowBuilder::new(
                            app,
                            "settings", // 窗口唯一标识
                            tauri::WebviewUrl::App("#/settings".into()),
                            )
                            .inner_size(300.0, 600.0)
                            .title("设置")
                            .visible(true)
                            .build()
                            .expect("failed to create settings window");
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray_handle, event: TrayIconEvent| match event {
                    TrayIconEvent::DoubleClick { .. } => {
                        if let Some(win) = tray_handle.app_handle().get_webview_window("main") {
                            win.show().ok();
                            win.set_focus().ok();
                        }
                    }
                    _ => {}
                })
                .build(app)
                .unwrap();

            // 初始化main窗口
            tauri::WebviewWindowBuilder::new(
                app,
                "main", // 窗口唯一标识
                tauri::WebviewUrl::App("#/main".into()),
                )
                .inner_size(600.0, 400.0)
                .title("PUT FIRST THINGS FIRST")
                .visible(true)
                .build()
                .expect("failed to create main window");
            
            
            // 启动定时弹窗
            window_manager::start_periodic_popup(app.handle().clone(), "main");

            notion::init_auth_info(app.handle());

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            setting::save_setting,
            setting::load_setting,
            setting::set_remind_later,
            notion::load_auth_info,
            notion::save_auth_info,
            notion::clear_auth_info,
            notion::select_page,

            task_manager::save_tasks,
            task_manager::load_tasks,
            task_manager::add_task,
            task_manager::update_task,
            task_manager::load_pages,
            
            task_manager::load_tags,
            task_manager::update_tags,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
