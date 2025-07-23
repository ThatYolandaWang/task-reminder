// src-tauri/src/window_manager.rs
use crate::setting::get_remind_later_impl;
use crate::task_manager::load_tasks_impl;

// use std::thread;
// use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use tokio::time::{sleep, Duration};

// use tauri::{LogicalPosition, WebviewWindow};

/// 启动周期性弹窗任务
pub fn start_periodic_popup(app_handle: AppHandle, window_label: &str) {
    let label = window_label.to_string();
    tauri::async_runtime::spawn(async move {
        loop {
            // 只有窗口不可见时才开始计时
            if let Some(window) = app_handle.get_webview_window(&label) {
                // [1]如果窗口可见，等待直到窗口不可见
                while window.is_visible().unwrap_or(true) {
                    sleep(Duration::from_secs(1)).await;
                }

                let tasks = load_tasks_impl(&None, &app_handle).await.unwrap();
                if tasks.tasks.as_ref().unwrap().tasks.len() == 0 {
                    println!("no tasks");
                    sleep(Duration::from_secs(60)).await;
                    continue;
                }

                // [2]记录不可见开始时间，等待到interval
                let start = tokio::time::Instant::now();

                let reminder_minutes = get_remind_later_impl(&app_handle);
                let interval = reminder_minutes * 60;
                println!("interval: {}", interval);
                while start.elapsed().as_secs() < interval {
                    // [3]如果窗口在计时期间变为可见，重置计时
                    if window.is_visible().unwrap_or(true) {
                        break;
                    }
                    sleep(Duration::from_millis(200)).await;
                }

                // [4]如果窗口在计时期间变为可见，跳过本次弹窗
                if window.is_visible().unwrap_or(true) {
                    continue;
                }

                // [5]这里窗口不可见，弹窗
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                // 没找到窗口，稍后重试
                sleep(Duration::from_secs(1)).await;
            }
        }
    });
}
/*
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
*/
