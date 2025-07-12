// #[cfg_attr(mobile, tauri::mobile_entry_point)]

mod setting;
mod task_manager;
mod window_manager; // 声明模块
use tauri_plugin_autostart::MacosLauncher;

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::{Manager, WindowEvent};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
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
                        window_manager::move_to_top_right(&win).unwrap();
                        if win.is_visible().unwrap_or(false) {
                            win.hide().unwrap();
                        } else {
                            win.show().unwrap();
                            win.set_focus().unwrap();
                        }
                    }
                    "settings" => {
                        // 显示设置窗口
                        let settings = app.get_webview_window("settings").unwrap();
                        settings.show().unwrap();
                        settings.set_focus().unwrap();
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray_handle, event: TrayIconEvent| {
                    match event {
                        TrayIconEvent::DoubleClick { .. } => {
                            if let Some(win) = tray_handle.app_handle().get_webview_window("main") {
                                win.show().ok();
                                win.set_focus().ok();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)
                .unwrap();

            window_manager::start_periodic_popup(app.handle().clone(), "main");

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["com.task-reminder.app"])
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            task_manager::save_tasks,
            task_manager::load_tasks,
            setting::save_setting,
            setting::load_setting
        ])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
