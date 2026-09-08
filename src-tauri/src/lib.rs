//! 应用入口模块。
//!
//! 初始化 Tauri 应用：注册插件（文件对话框）与全部前端可调用的命令，
//! 命令的具体实现分别位于 [`commands`]、[`filesystem`]、[`config`] 模块。

mod commands;
mod config;
mod filesystem;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_directory,
            commands::read_file,
            commands::write_file,
            commands::create_file,
            commands::rename_file,
            commands::delete_file,
            commands::save_image,
            commands::get_file_meta,
            commands::get_config,
            commands::set_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
