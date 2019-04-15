
module.exports = {
    name: 'Attention Budget',
    version: '1.0.0',
    description: 'Budget times for website use.',
    author: 'pgenho',
    manifest_version: 2,
    icons: {
        16: "icons/img16.png",
        32: "icons/img32.png",
        48: "icons/img48.png",
        128: "icons/img128.png"
    },
    permissions: [
        '<all_urls>',
        '*://*/*',
        'activeTab',
        'tabs',
        'background',
        'contextMenus',
        'unlimitedStorage',
        'storage',
        'notifications',
    ],
    browser_action: {
        default_title: 'Attention Budget',
        default_popup: 'pages/options.html'
    },
    background: {
        persistent: true,
        page: 'pages/background.html'
    },
    devtools_page: 'pages/devtools.html',
    // options_page: 'pages/options.html',
    options_ui: {
        page: 'pages/options.html',
        open_in_tab: true
    },
    content_scripts: [{
        js: [ 'js/inject.js' ],
        run_at: 'document_end',
        matches: ['<all_urls>'],
        all_frames: true
    }],
    content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'",
    web_accessible_resources: [ 'panel.html', 'js/content.js', 'icons/img48.png']
}
