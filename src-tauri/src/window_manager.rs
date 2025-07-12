// src-tauri/src/window_manager.rs
use crate::setting::load_setting_impl;

use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, LogicalPosition, Manager, WebviewWindow};

/// 启动周期性弹窗任务
pub fn start_periodic_popup(app_handle: AppHandle, window_label: &str) {
    let label = window_label.to_string();
    thread::spawn(move || {
        loop {
            // 只有窗口不可见时才开始计时
            if let Some(window) = app_handle.get_webview_window(&label) {
                // 如果窗口可见，等待直到窗口不可见
                while window.is_visible().unwrap_or(true) {
                    thread::sleep(Duration::from_secs(1));
                }

                // 计时 interval_secs 秒
                let start = Instant::now();

                let setting_info = load_setting_impl(&app_handle).unwrap();
                let interval = setting_info.remind_time * 60;
                println!("interval: {}", interval);
                while start.elapsed().as_secs() < interval {
                    // 如果窗口在计时期间变为可见，重置计时
                    if window.is_visible().unwrap_or(true) {
                        break;
                    }
                    thread::sleep(Duration::from_millis(200));
                }

                // 如果窗口在计时期间变为可见，跳过本次弹窗
                if window.is_visible().unwrap_or(true) {
                    continue;
                }

                // 这里窗口不可见，弹窗
                // 你可以调用自定义定位函数
                move_to_top_right(&window).unwrap();
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                // 没找到窗口，稍后重试
                thread::sleep(Duration::from_secs(1));
            }
        }
    });
}

/// 将窗口移动到右上角
pub fn move_to_top_right(window: &WebviewWindow) -> tauri::Result<()> {
    let monitor = window.current_monitor()?.unwrap();
    let screen_size = monitor.size();
    let screen_width = screen_size.width;
    let window_size = window.outer_size()?;
    let window_width = window_size.width;

    let x_right = (screen_width - window_width) as f64;
    let y_top = 0.0;

    window.set_position(LogicalPosition {
        x: x_right,
        y: y_top,
    })
}

/// 将窗口移动到右下角
pub fn move_to_bottom_right(window: &WebviewWindow) -> tauri::Result<()> {
    let monitor = window.current_monitor()?.unwrap();
    let screen_size = monitor.size();
    let screen_width = screen_size.width;
    let screen_height = screen_size.height;
    let window_size = window.outer_size()?;
    let window_width = window_size.width;
    let window_height = window_size.height;

    let x_right = (screen_width - window_width) as f64;
    let y_bottom = (screen_height - window_height) as f64;

    window.set_position(LogicalPosition {
        x: x_right,
        y: y_bottom,
    })
}
