#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri::plugin::Builder::<_, ()>::new("navigation")
                .on_navigation(|_, url| {
                    matches!(
                        (url.scheme(), url.host_str()),
                        ("tauri", Some("localhost")) | ("https", Some("tauri.localhost"))
                    )
                })
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("failed to start Kraken Habits");
}
