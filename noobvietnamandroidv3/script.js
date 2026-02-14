document.addEventListener('DOMContentLoaded', () => {
    /* --- Multiplayer: WebsimSocket realtime presence + People Online integration --- */
    (async function initMultiplayer() {
        // Ensure WebsimSocket is available; if not, try to dynamically import from the import map (guest82644.vercel.app)
        if (typeof WebsimSocket === 'undefined') {
            try {
                // Attempt dynamic import using the importmap alias we added in index.html
                const mod = await import('WebsimSocket');
                // support both default and named exports
                window.WebsimSocket = mod?.default || mod;
                console.info('WebsimSocket loaded via importmap (guest82644.vercel.app).');
            } catch (err) {
                console.warn('WebsimSocket not available and dynamic import failed.', err);
                return;
            }
        }

        try {
            const room = new WebsimSocket();
            await room.initialize();

            // publish brief presence (username & lastActive)
            function sendPresence() {
                const peer = room.peers && room.peers[room.clientId];
                const username = peer ? peer.username : ('user-' + (Math.random() * 1000 | 0));
                room.updatePresence({
                    username,
                    lastActive: Date.now()
                });
            }

            // send initial presence and refresh periodically
            sendPresence();
            setInterval(sendPresence, 5000);

            // update People Online view when presence changes
            const peopleListEl = document.querySelector('#peopleOnlineList');
            function renderPeople(presences) {
                if (!peopleListEl) return;
                peopleListEl.innerHTML = '';
                const entries = Object.entries(presences || {});
                if (!entries.length) {
                    peopleListEl.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No users online</div>';
                    return;
                }
                entries.forEach(([clientId, p]) => {
                    const ageSec = Math.floor((Date.now() - (p.lastActive || 0)) / 1000);
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '6px';
                    row.style.borderRadius = '6px';
                    row.style.background = 'transparent';
                    row.innerHTML = `
                        <div style="display:flex;flex-direction:column;">
                            <strong style="font-size:0.98em;">${p.username || clientId}</strong>
                            <span style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">last seen ${ageSec}s ago</span>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="people-message-btn" data-client="${clientId}" style="padding:6px 10px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Message</button>
                        </div>
                    `;
                    peopleListEl.appendChild(row);
                });

                // wire message buttons to send ephemeral event (room.send)
                peopleListEl.querySelectorAll('.people-message-btn').forEach(b => {
                    b.addEventListener('click', () => {
                        const toClient = b.dataset.client;
                        try {
                            room.send({ type: 'hello', echo: false, to: toClient, message: 'Hello from ' + (room.peers[room.clientId]?.username || 'someone') });
                            createNotification('Multiplayer', `Sent hello to ${toClient}`);
                        } catch (e) {
                            createNotification('Multiplayer', 'Failed to send message.');
                        }
                    });
                });
            }

            // initial render
            renderPeople(room.presence);

            // subscribe updates
            const unsubPresence = room.subscribePresence((current) => {
                renderPeople(current);
            });

            // show join/disconnect events in notification shade and handle cloudhawk_sync events (persist incoming syncs)
            room.onmessage = (event) => {
                const data = event.data;
                switch (data.type) {
                    case 'connected':
                        createNotification('Multiplayer', `${data.username || data.clientId} connected`);
                        break;
                    case 'disconnected':
                        createNotification('Multiplayer', `${data.username || data.clientId} disconnected`);
                        break;
                    case 'hello':
                        // show ephemeral hello message from peer
                        createNotification('Message', `${data.username || data.clientId}: ${data.message}`);
                        break;
                    case 'cloudhawk_sync':
                        // another peer announced a Cloud Hawk sync request/payload — persist it locally for review
                        try {
                            const key = 'cloudhawk_syncs';
                            const existing = JSON.parse(localStorage.getItem(key) || '[]');
                            existing.unshift({
                                path: data.path || '',
                                payload: data.payload || {},
                                ts: Date.now(),
                                source: data.clientId || 'peer',
                                username: data.username || '',
                                note: 'received_via_room'
                            });
                            localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
                        } catch (e) {
                            console.warn('Failed to persist incoming cloudhawk_sync event', e);
                        }
                        createNotification('CloudHawk', `Sync received from ${data.username || data.clientId}`);
                        break;
                    default:
                        // handle other custom events if needed
                        break;
                }
            };

            // expose room for debugging from console
            window._multiplayerRoom = room;
        } catch (err) {
            console.warn('Multiplayer initialization failed:', err);
        }
    })();
    const mainContent = document.querySelector('.main-content');
    const homeScreen = document.getElementById('homeScreen');
    const homeScreenAppGrid = homeScreen.querySelector('.app-grid'); 
    const homeButton = document.getElementById('homeButton');
    const backButton = document.getElementById('backButton'); 
    const recentAppsButton = document.getElementById('recentAppsButton'); 
    const notificationIcon = document.getElementById('notificationIcon'); 
    const notificationShade = document.getElementById('notificationShade'); 
    const notificationList = notificationShade.querySelector('.notification-list'); 
    const clearAllNotificationsBtn = document.getElementById('clearAllNotifications'); 
    const closeNotificationShadeBtn = document.getElementById('closeNotificationShade'); 

    const lockScreen = document.getElementById('lockScreen');
    const lockScreenTime = lockScreen.querySelector('.lock-screen-time');
    const lockScreenDate = lockScreen.querySelector('.lock-screen-date');
    const cameraButton = document.getElementById('cameraButton'); 
    const flashlightButton = document.getElementById('flashlightButton'); 
    const lockScreenNotificationPeek = document.getElementById('lockScreenNotificationPeek'); 
    const lockScreenDateWidget = document.getElementById('lockScreenDateWidget'); 
    const lockScreenWidgetsRow = document.getElementById('lockScreenWidgetsRow'); 
    const lockScreenEffectOverlay = document.getElementById('lockScreenEffectOverlay'); 

    const albumArtOverlay = document.getElementById('albumArtOverlay');
    const albumArtImage = document.getElementById('albumArtImage');
    const closeAlbumArtOverlayButton = document.getElementById('closeAlbumArtOverlay');

    const lockScreenCustomizeOverlay = document.getElementById('lockScreenCustomizeOverlay');
    const closeLockScreenCustomizeButton = lockScreenCustomizeOverlay.querySelector('#closeLockScreenCustomize');
    const fontColorPresetsContainer = lockScreenCustomizeOverlay.querySelector('#fontColorPresets');
    const backgroundEffectOptionsContainer = lockScreenCustomizeOverlay.querySelector('#backgroundEffectOptions');
    const lockScreenWidgetToggleOptionsContainer = lockScreenCustomizeOverlay.querySelector('#lockScreenWidgetToggleOptions');
    const applyLockScreenCustomizationButton = lockScreenCustomizeOverlay.querySelector('#applyLockScreenCustomization');
    const cancelLockScreenCustomizationButton = lockScreenCustomizeOverlay.querySelector('#cancelLockScreenCustomization');
    const saveLockScreenProfileButton = lockScreenCustomizeOverlay.querySelector('#saveLockScreenProfile');
    const loadLockScreenProfileSelect = lockScreenCustomizeOverlay.querySelector('#loadLockScreenProfileSelect');
    const deleteLockScreenProfileButton = lockScreenCustomizeOverlay.querySelector('#deleteLockScreenProfile');

    const bootScreen = document.getElementById('bootScreen');
    const powerButton = document.getElementById('powerButton');
    const volumeUpButton = document.getElementById('volumeUpButton');
    const volumeDownButton = document.getElementById('volumeDownButton');
    const powerMenu = document.getElementById('powerMenu');
    const restartButton = document.getElementById('restartButton');
    const shutdownButton = document.getElementById('shutdownButton');
    const unlockBootloaderPowerButton = document.getElementById('unlockBootloaderPowerButton');
    const cancelPowerMenuButton = document.getElementById('cancelPowerMenuButton');
    const volumeOverlay = document.getElementById('volumeOverlay');
    const volumeBarFill = volumeOverlay.querySelector('.volume-bar-fill');
    const volumeLevelText = volumeOverlay.querySelector('#volumeLevel');
    // Captions toggle button inside the volume overlay (re-added)
    const captionsToggleButton = volumeOverlay.querySelector('#captionsToggleButton');
    const systemMessageOverlay = document.getElementById('systemMessageOverlay');
    const systemMessageText = document.getElementById('systemMessageText');
    const screenOffOverlay = document.getElementById('screenOffOverlay');

    const screenElement = document.querySelector('.screen'); 
    const statusBar = document.querySelector('.status-bar');
    const navBar = document.querySelector('.nav-bar');

    // Device mode: Phone vs Computer (persisted)
    const deviceModeToggle = document.getElementById && document.getElementById('deviceModeToggle');
    const COMPUTER_CLASS = 'computer-mode';
    let deviceMode = localStorage.getItem('deviceMode') || 'phone'; // 'phone' or 'computer'

    // Create a small computer caret indicator element for visual cue (shown in computer mode)
    (function ensureComputerCaret() {
        if (document.querySelector('.computer-caret')) return;
        const caret = document.createElement('div');
        caret.className = 'computer-caret';
        caret.innerHTML = `<svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M2 0 L22 12 L13 14 L17 30 L7 16 L2 0 Z" fill="rgba(0,0,0,0.85)" /></svg>`;
        document.querySelector('.screen').appendChild(caret);
    })();

    function applyDeviceMode(mode) {
        deviceMode = mode === 'computer' ? 'computer' : 'phone';
        if (deviceMode === 'computer') {
            document.documentElement.classList.add(COMPUTER_CLASS);
            if (deviceModeToggle) {
                deviceModeToggle.setAttribute('aria-pressed', 'true');
                deviceModeToggle.textContent = '🖱️';
            }
        } else {
            document.documentElement.classList.remove(COMPUTER_CLASS);
            if (deviceModeToggle) {
                deviceModeToggle.setAttribute('aria-pressed', 'false');
                deviceModeToggle.textContent = '📱/🖱️';
            }
        }
        localStorage.setItem('deviceMode', deviceMode);
    }

    // Initialize mode on load
    applyDeviceMode(localStorage.getItem('deviceMode') || deviceMode);

    // Toggle handler wiring
    if (deviceModeToggle) {
        deviceModeToggle.addEventListener('click', (e) => {
            const next = deviceMode === 'computer' ? 'phone' : 'computer';
            applyDeviceMode(next);
            createNotification('Device Mode', `Switched to ${next === 'computer' ? 'Computer' : 'Phone'} mode`);
        });
    }

    // If in computer mode, show a small caret that follows mouse for visual cue (only on pointer devices)
    (function wireComputerCaret() {
        const caret = document.querySelector('.computer-caret');
        if (!caret) return;
        document.addEventListener('mousemove', (e) => {
            if (!document.documentElement.classList.contains(COMPUTER_CLASS)) {
                caret.style.display = 'none';
                return;
            }
            // show and position caret relative to screen element
            const rect = document.querySelector('.screen').getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            caret.style.left = (x + rect.left) + 'px';
            caret.style.top = (y + rect.top) + 'px';
            caret.style.display = 'block';
        });
        document.addEventListener('mouseleave', () => {
            if (caret) caret.style.display = 'none';
        });
    })();

    let appHistory = []; 
    let allAppsGridElement; 
    let flashlightOn = false; 

    let powerButtonPressTimer;
    let lockScreenHoldTimer; 
    const POWER_MENU_HOLD_DURATION = 1000; 
    const LOCK_SCREEN_HOLD_DURATION = 1200; 
    let isScreenOn = false; 
    let currentVolume = 50; 
    let volumeOverlayTimeoutId;
    const BOOT_SEQUENCE_DELAY = 3000; 
    const SHUTDOWN_RESTART_MESSAGE_DELAY = 2000; 
    let lockScreenTimeIntervalId; 
    let homeScreenClockWidgetIntervalId;

    // Bootloader menu state
    const bootMenuElement = document.getElementById && document.getElementById('bootMenu');
    const BOOT_MENU_ITEMS = [
        'FASTBOOT','RECOVERY','FACTORY RESET','SIMLOCK','INSTALL',
        'WIPE','BACKUP','RESTORE','MOUNT','SETTING','ADVANCED','REBOOT'
    ];
    let bootMenuIndex = 0;

    const accentColors = {
        blue: { primary: '#61dafb', onPrimary: '#1a1a1a' },
        green: { primary: '#8BC34A', onPrimary: '#1a1a1a' },
        purple: { primary: '#9C27B0', onPrimary: '#e0e0e0' },
        orange: { primary: '#FF9800', onPrimary: '#1a1a1a' },
        // New accents requested
        yaru: { primary: '#8DA7CC', onPrimary: '#111827' },    // yaru (soft blue)
        sky: { primary: '#5293E3', onPrimary: '#0f1720' },      // bright blue
        danger: { primary: '#F64D50', onPrimary: '#ffffff' },   // vivid red
        paleBlue: { primary: '#B8D9EC', onPrimary: '#0f1720' },// pale blue
        pink: { primary: '#F26997', onPrimary: '#ffffff' },    // soft pink
        coral: { primary: '#FE7E53', onPrimary: '#111827' },   // coral
        teal: { primary: '#44ACB3', onPrimary: '#0f1720' },    // teal
        neutral: { primary: '#ABABAB', onPrimary: '#0f1720' }, // neutral gray
        slate: { primary: '#666666', onPrimary: '#ffffff' }    // darker gray
    };

    const modeColors = {
        dark: {
            backgroundRGB: '26, 26, 26', 
            surfaceRGB: '58, 58, 58',    
            onBackground: '#e0e0e0',
            onSurface: '#e0e0e0',
            outline: '68, 68, 68' 
        },
        /* New: Expanded Dark mode to force apps that don't fully support dark to render in dark-friendly surfaces */
        darkExpanded: {
            backgroundRGB: '18, 18, 20',
            surfaceRGB: '34, 34, 36',
            onBackground: '#f2f7fb',
            onSurface: '#f2f7fb',
            outline: '56, 56, 58'
        },
        light: {
            backgroundRGB: '240, 240, 240', 
            surfaceRGB: '255, 255, 255',    
            onBackground: '#333333',
            onSurface: '#444444',
            outline: '204, 204, 204' 
        },
        liquidGlass: { 
            backgroundRGB: '255, 255, 255', 
            surfaceRGB: '255, 255, 255',    
            onBackground: '#333333',        
            onSurface: '#333333',           
            outline: '200, 200, 200'        
        },
        darkGlass: {
            backgroundRGB: '12, 12, 14',
            surfaceRGB: '28, 28, 32',
            onBackground: '#eef6ff',
            onSurface: '#eef6ff',
            outline: '36, 36, 40'
        },
        metro: {
            /* Metro: flat, bold tiles with higher contrast and bright accent-friendly surfaces */
            backgroundRGB: '245, 245, 247',
            surfaceRGB: '240, 240, 240',
            onBackground: '#111111',
            onSurface: '#111111',
            outline: '200, 200, 200'
        },
        // Android theme: Gingerbread (Android 2.3) — classic dark olive/green palette with contrast
        gingerbread: {
            backgroundRGB: '40, 48, 22',    // deep olive-y dark
            surfaceRGB: '76, 90, 36',
            onBackground: '#e6f2d9',
            onSurface: '#eef8df',
            outline: '110, 125, 70'
        },
        // Android theme: Eclair (Android 2.0) — teal/blue-green highlights with lighter surfaces
        eclair: {
            backgroundRGB: '29, 71, 68',    // tealish base
            surfaceRGB: '56, 122, 118',
            onBackground: '#f0fbfa',
            onSurface: '#eaf7f6',
            outline: '90, 140, 136'
        },
        aero: {
            /* Windows Aero - translucent glass, vibrant accent glows */
            backgroundRGB: '225, 235, 245',
            surfaceRGB: '245, 248, 252',
            onBackground: '#0f1720',
            onSurface: '#0f1720',
            outline: '190, 200, 210'
        }
    };

    let currentAccent = localStorage.getItem('currentAccent') || 'blue';
    let currentMode = localStorage.getItem('currentMode') || 'dark';
    let currentLanguage = localStorage.getItem('currentLanguage') || 'en'; 
    let currentIconSize = localStorage.getItem('currentIconSize') || 'medium'; // New: Default icon size

    const lockScreenPresets = [
        { name: 'Default', timeFont: 'Roboto, sans-serif', timeColor: '#e0e0e0', dateFont: 'Roboto, sans-serif', dateColor: '#e0e0e0' },
        { name: 'Modern', timeFont: 'Arial, sans-serif', timeColor: '#FFFFFF', dateFont: 'Arial, sans-serif', dateColor: '#DDDDDD' },
        { name: 'Classic', timeFont: 'Times New Roman, serif', timeColor: '#FFD700', dateFont: 'Times New Roman, serif', dateColor: '#FFC400' },
        { name: 'Digital', timeFont: 'Courier New, monospace', timeColor: '#32CD32', dateFont: 'Courier New, monospace', dateColor: '#22B022' },
        { name: 'Elegant', timeFont: 'Georgia, serif', timeColor: '#ADD8E6', dateFont: 'Georgia, serif', dateColor: '#9AC0CD' },
        { name: 'Bold', timeFont: 'Impact, sans-serif', timeColor: '#FF6347', dateFont: 'Impact, sans-serif', dateColor: '#E04E37' },
        { name: 'Light', timeFont: 'Verdana, sans-serif', timeColor: '#000000', dateFont: 'Verdana, sans-serif', dateColor: '#333333' },
        { name: 'Warm', timeFont: 'Palatino Linotype, serif', timeColor: '#F0E68C', dateFont: 'Palatino Linotype, serif', dateColor: '#DDA0DD' }
    ];

    const lockScreenWidgetsData = [
        { id: 'weatherWidget', name: 'Weather', icon: '', content: '22°C London' },
        { id: 'batteryWidget', name: 'Battery', icon: '', content: '75%' },
        { id: 'musicWidget', name: 'Music Player', icon: '', content: `
            <img src="placeholder_image.png" alt="Album Art" class="album-cover">
            <div class="track-info">
                <span class="track-title">Song Title</span>
                <span class="artist-name">Artist Name</span>
            </div>
            <div class="playback-controls">
                <button class="prev" title="Previous">◀</button>
                <button class="play" title="Play/Pause">▶▮▮</button>
                <button class="next" title="Next">▶</button>
            </div>
        ` },
        { id: 'calendarWidget', name: 'Calendar', icon: '', content: 'Today: Meeting' }
    ];

    let currentLockScreenConfig = JSON.parse(localStorage.getItem('lockScreenConfig')) || {
        presetIndex: 0,
        backgroundEffect: { type: 'none', color: '' },
        activeWidgets: {
            lockScreenDateWidget: true, 
            weatherWidget: false,
            batteryWidget: false,
            musicWidget: false,
            calendarWidget: false
        },
        orientation: 'portrait' 
    };

    let savedLockScreenProfiles = JSON.parse(localStorage.getItem('lockScreenProfiles')) || {};


    function applyTheme(newAccent, newMode) {
        currentAccent = newAccent;
        currentMode = newMode;

        const accent = accentColors[currentAccent];
        const mode = modeColors[currentMode];

        if (accent && mode) {
            document.documentElement.style.setProperty('--primary-color', accent.primary);
            document.documentElement.style.setProperty('--on-primary-color', accent.onPrimary);
            document.documentElement.style.setProperty('--on-background-color', mode.onBackground);
            document.documentElement.style.setProperty('--on-surface-color', mode.onSurface);

            let bgColor, surfaceColor, outlineColor;

            if (currentMode === 'liquidGlass') {
                bgColor = `rgba(${mode.backgroundRGB}, 0.1)`;
                surfaceColor = `rgba(${mode.surfaceRGB}, 0.2)`;
                outlineColor = `rgba(${mode.outline}, 0.3)`;
            } else { 
                const opacity = 0.85; 
                bgColor = `rgba(${mode.backgroundRGB}, ${opacity})`;
                surfaceColor = `rgba(${mode.surfaceRGB}, ${opacity})`;
                outlineColor = `rgb(${mode.outline})`; 
            }
            
            document.documentElement.style.setProperty('--background-color', bgColor);
            document.documentElement.style.setProperty('--surface-color', surfaceColor);
            document.documentElement.style.setProperty('--outline-color', outlineColor);

            document.documentElement.style.setProperty('--background-color-rgb', mode.backgroundRGB);
            document.documentElement.style.setProperty('--surface-color-rgb', mode.surfaceRGB);

            // ensure previous mode classes are cleared, then add the class matching the selected mode
            document.documentElement.classList.remove('light-mode', 'liquid-glass-mode', 'metro-mode', 'dark-glass-mode');
            if (currentMode === 'light') {
                document.documentElement.classList.add('light-mode');
            } else if (currentMode === 'liquidGlass') {
                document.documentElement.classList.add('liquid-glass-mode');
            } else if (currentMode === 'metro') {
                document.documentElement.classList.add('metro-mode');
            } else if (currentMode === 'darkGlass') {
                document.documentElement.classList.add('dark-glass-mode');
            }

            localStorage.setItem('currentAccent', currentAccent);
            localStorage.setItem('currentMode', currentMode);

            const settingsApp = document.getElementById('settingsApp');
            if (settingsApp && settingsApp.classList.contains('active')) {
                const currentSelectedSwatch = settingsApp.querySelector('.color-swatch.selected');
                if (currentSelectedSwatch) {
                    currentSelectedSwatch.classList.remove('selected');
                }
                const newSelectedSwatch = settingsApp.querySelector(`.color-swatch[data-theme="${currentAccent}"]`);
                if (newSelectedSwatch) {
                    newSelectedSwatch.classList.add('selected');
                }

                const currentSelectedMode = settingsApp.querySelector('.mode-switch.selected');
                if (currentSelectedMode) {
                    currentSelectedMode.classList.remove('selected');
                }
                const newSelectedMode = settingsApp.querySelector(`.mode-switch[data-mode="${currentMode}"]`);
                if (newSelectedMode) {
                    newSelectedMode.classList.add('selected');
                }
            }
        }
    }

    function applyLanguage(newLang) {
        currentLanguage = newLang;
        createNotification('Language', `Language set to ${newLang.toUpperCase()}`);
        localStorage.setItem('currentLanguage', currentLanguage);

        const settingsApp = document.getElementById('settingsApp');
        if (settingsApp && settingsApp.classList.contains('active')) {
            const currentSelectedLang = settingsApp.querySelector('.language-switch.selected');
            if (currentSelectedLang) {
                currentSelectedLang.classList.remove('selected');
            }
            const newSelectedLang = settingsApp.querySelector(`.language-switch[data-lang="${currentLanguage}"]`);
            if (newSelectedLang) {
                newSelectedLang.classList.add('selected');
            }
        }
    }

    function applyIconShape(shape) {
        const allAppIconImages = document.querySelectorAll('.app-icon img');
        allAppIconImages.forEach(img => {
            if (shape === 'rounded') {
                img.style.borderRadius = 'var(--app-icon-border-radius)'; 
            } else if (shape === 'square') {
                img.style.borderRadius = '8px'; 
            }
        });
        localStorage.setItem('iconShape', shape); 
    }

    // New: Function to apply icon size
    function applyIconSize(size) {
        currentIconSize = size;
        const root = document.documentElement;
        if (size === 'small') {
            root.style.setProperty('--app-icon-size', '50px'); 
            root.style.setProperty('--app-icon-font-size', '1.0em'); 
            root.style.setProperty('--app-icon-gap', '15px'); 
            root.style.setProperty('--app-icon-border-radius', '12px'); 
            root.style.setProperty('--app-grid-minmax', '60px'); 
        } else if (size === 'large') {
            root.style.setProperty('--app-icon-size', '90px'); 
            root.style.setProperty('--app-icon-font-size', '1.8em'); 
            root.style.setProperty('--app-icon-gap', '30px'); 
            root.style.setProperty('--app-icon-border-radius', '24px'); 
            root.style.setProperty('--app-grid-minmax', '100px'); 
        } else { // medium (default)
            root.style.setProperty('--app-icon-size', '77px'); 
            root.style.setProperty('--app-icon-font-size', '1.47em'); 
            root.style.setProperty('--app-icon-gap', '23px'); 
            root.style.setProperty('--app-icon-border-radius', '20px'); 
            root.style.setProperty('--app-grid-minmax', '77px'); 
        }
        localStorage.setItem('currentIconSize', currentIconSize);

        const settingsApp = document.getElementById('settingsApp');
        if (settingsApp && settingsApp.classList.contains('active')) {
            settingsApp.querySelectorAll('.icon-size-switch').forEach(btn => btn.classList.remove('selected'));
            const selectedButton = settingsApp.querySelector(`.icon-size-switch[data-size="${currentIconSize}"]`);
            if (selectedButton) {
                selectedButton.classList.add('selected');
            }
        }
    }

    function createNotification(title, message) {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
        `;
        notificationList.prepend(notificationItem); 

        if (lockScreen && lockScreen.classList.contains('active')) {
            lockScreenNotificationPeek.innerHTML = `
                <h4>${title}</h4>
                <p>${message}</p>
            `;
            lockScreenNotificationPeek.classList.add('active');
            lockScreen.classList.add('has-notification'); 

            setTimeout(() => {
                lockScreenNotificationPeek.classList.remove('active');
                lockScreenNotificationPeek.innerHTML = '';
                lockScreen.classList.remove('has-notification');
            }, 5000); 
        }
    }

    // Cloud Hawk sync helper: best-effort POST to guest82644.vercel.app and optional WebsimSocket room.send event
    async function syncToCloudHawk(path, payload = {}) {
        // Robust sync helper: broadcasts to room, persists local record, and performs a fetch with timeout,
        // returning true on success and false on failure while recording server replies or errors to local log.
        try {
            // send ephemeral room event if multiplayer room exists
            if (window._multiplayerRoom && typeof window._multiplayerRoom.send === 'function') {
                try {
                    window._multiplayerRoom.send({ type: 'cloudhawk_sync', echo: false, path, payload });
                } catch (e) { /* non-fatal */ }
            }

            // Persist a local record of the attempted sync for offline review / audit trail (timestamp now)
            try {
                const key = 'cloudhawk_syncs';
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.unshift({
                    path,
                    payload,
                    ts: Date.now(),
                    source: 'local-client',
                    status: 'queued'
                });
                localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
            } catch (e) {
                console.warn('Failed to persist CloudHawk sync locally', e);
            }

            // Build URL safely
            const safePath = path ? String(path) : '/cloudhawk-sync';
            const url = `https://guest82644.vercel.app${safePath.startsWith('/') ? safePath : '/' + safePath}`;

            // Use AbortController for timeout and better error handling
            const controller = new AbortController();
            const timeoutMs = 6000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            let resp;
            try {
                resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload, ts: Date.now() }),
                    mode: 'cors',
                    signal: controller.signal
                });
            } catch (fetchErr) {
                clearTimeout(timeoutId);
                console.warn('CloudHawk sync fetch failed', fetchErr);

                // record failure locally
                try {
                    const key = 'cloudhawk_syncs';
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    existing.unshift({
                        path: safePath,
                        payload,
                        ts: Date.now(),
                        source: 'local-client',
                        error: String(fetchErr),
                        status: 'failed'
                    });
                    localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
                } catch (e) { /* ignore persistence errors */ }

                return false;
            } finally {
                clearTimeout(timeoutId);
            }

            // Process response
            try {
                const text = await resp.text();
                const key = 'cloudhawk_syncs';
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.unshift({
                    path: safePath,
                    payload,
                    ts: Date.now(),
                    source: 'cloudhawk_server',
                    status: resp.status,
                    response: text
                });
                localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
            } catch (e) {
                console.warn('Failed to persist CloudHawk server response', e);
            }

            if (!resp.ok) {
                console.warn('CloudHawk sync responded with', resp.status, resp.statusText);
                return false;
            }

            return true;
        } catch (err) {
            console.warn('syncToCloudHawk internal error', err);
            try {
                const key = 'cloudhawk_syncs';
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.unshift({
                    path,
                    payload,
                    ts: Date.now(),
                    source: 'local-client',
                    error: String(err),
                    status: 'error'
                });
                localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
            } catch (e) {}
            return false;
        }
    }

    function clearNotifications() {
        notificationList.innerHTML = '';
        if (lockScreenNotificationPeek) {
            lockScreenNotificationPeek.classList.remove('active');
            lockScreenNotificationPeek.innerHTML = '';
            lockScreen.classList.remove('has-notification');
        }
    }

    function toggleNotificationShade() {
        if (!isScreenOn) return; 
        notificationShade.classList.toggle('active');
    }

    function populateRecentAppsView() {
        const recentAppsList = document.getElementById('recentAppsList');
        if (!recentAppsList) return; 

        recentAppsList.innerHTML = ''; 

        const uniqueHistory = [];
        for (let i = appHistory.length - 1; i >= 0; i--) {
            const appId = appHistory[i];
            if (appId !== 'recentAppsView' && appId !== 'allAppsView' && appId !== 'homeScreen' && !uniqueHistory.includes(appId)) {
                uniqueHistory.push(appId);
            }
        }
        
        if (uniqueHistory.length === 0) {
            recentAppsList.innerHTML = '<p class="no-recent-apps">No recent applications.</p>';
            return;
        }

        uniqueHistory.forEach(appId => {
            const appData = apps.find(app => app.id === appId);
            if (appData) {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <img src="${appData.icon}" alt="${appData.name} Icon" class="recent-app-icon">
                    <span>${appData.name}</span>
                    <button data-app-id="${appId}">Open</button>
                `;
                listItem.querySelector('button').addEventListener('click', () => {
                    showApp(appId);
                });
                recentAppsList.appendChild(listItem);
            }
        });
    }

    function updateLockScreenTime() {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false }; 
        const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };

        if (lockScreenTime) lockScreenTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
        if (lockScreenDate) lockScreenDate.textContent = now.toLocaleDateString('en-US', dateOptions);
    }

    // Lock-screen clock tap: play small animation when tapped
    if (lockScreenTime) {
        lockScreenTime.addEventListener('click', (e) => {
            // visual animation
            lockScreenTime.classList.remove('clock-tap-anim');
            // force reflow to restart animation
            void lockScreenTime.offsetWidth;
            lockScreenTime.classList.add('clock-tap-anim');
            // short auditory/notification feedback (non-intrusive)
            createNotification('Lock Screen', 'Clock tapped.');
        }, { passive: true });
    }

    function updateHomeScreenClockWidget(widgetElement) {
        if (!widgetElement) return;
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };

        widgetElement.querySelector('.widget-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
        widgetElement.querySelector('.widget-date').textContent = now.toLocaleDateString('en-US', dateOptions);
    }

    function applyLockScreenConfig(config) {
        currentLockScreenConfig = { ...currentLockScreenConfig, ...config }; 

        const preset = lockScreenPresets[currentLockScreenConfig.presetIndex];
        if (preset) {
            lockScreen.style.setProperty('--lock-screen-time-font', preset.timeFont);
            lockScreen.style.setProperty('--lock-screen-time-color', preset.timeColor);
            lockScreen.style.setProperty('--lock-screen-date-font', preset.dateFont);
            lockScreen.style.setProperty('--lock-screen-date-color', preset.dateColor);

            lockScreen.classList.remove(...Array.from({length: lockScreenPresets.length}, (_, i) => `preset-${i + 1}`));
            lockScreen.classList.add(`preset-${currentLockScreenConfig.presetIndex + 1}`);
        }

        lockScreenEffectOverlay.style.background = 'transparent';
        if (currentLockScreenConfig.backgroundEffect.type === 'tint') {
            lockScreenEffectOverlay.style.background = currentLockScreenConfig.backgroundEffect.color;
        } else if (currentLockScreenConfig.backgroundEffect.type === 'overlay') {
            lockScreenEffectOverlay.style.background = `rgba(0, 0, 0, 0.5)`; 
        }

        if (currentLockScreenConfig.orientation === 'landscape') {
            lockScreen.classList.add('landscape-mode');
        } else {
            lockScreen.classList.remove('landscape-mode');
        }

        renderLockScreenWidgets();

        localStorage.setItem('lockScreenConfig', JSON.stringify(currentLockScreenConfig));
    }

    function renderLockScreenWidgets() {
        lockScreenDateWidget.innerHTML = '';
        lockScreenWidgetsRow.innerHTML = '';

        if (currentLockScreenConfig.activeWidgets.lockScreenDateWidget) {
            lockScreenDateWidget.classList.add('active');
            lockScreenDateWidget.innerHTML = ' 22°C';
        } else {
            lockScreenDateWidget.classList.remove('active');
        }

        lockScreenWidgetsData.forEach(widgetData => {
            if (currentLockScreenConfig.activeWidgets[widgetData.id]) {
                const widgetDiv = document.createElement('div');
                widgetDiv.className = `lock-screen-widget ${widgetData.id === 'musicWidget' ? 'music-widget' : ''}`;
                widgetDiv.innerHTML = widgetData.content;
                widgetDiv.classList.add('active'); 

                if (widgetData.id === 'musicWidget') {
                    const albumCover = widgetDiv.querySelector('.album-cover');
                    if (albumCover) {
                        albumCover.src = 'placeholder_image.png'; 
                        albumCover.addEventListener('click', () => showAlbumArt(albumCover.src));
                    }
                    widgetDiv.querySelector('.playback-controls button:nth-child(2)').addEventListener('click', () => {
                        createNotification('Music', 'Playing/Pausing music...');
                    });
                }
                lockScreenWidgetsRow.appendChild(widgetDiv);
            }
        });
    }

    function showAlbumArt(imageUrl) {
        if (!isScreenOn) return; 
        hideAllOverlays(); 
        albumArtImage.src = imageUrl;
        albumArtOverlay.classList.add('active');

        albumArtOverlay.style.backgroundColor = `color-mix(in srgb, var(--primary-color), black 40%)`;
    }

    function hideAlbumArt() {
        albumArtOverlay.classList.remove('active');
        showLockScreen(); 
    }

    function showLockScreen() {
        hideAllOverlays();
        updateLockScreenTime();
        lockScreen.classList.add('active');
        homeScreen.classList.remove('active');
        statusBar.style.display = 'flex'; 
        navBar.style.display = 'none';
        mainContent.style.display = 'none';
        isScreenOn = true;
        screenOffOverlay.classList.remove('active'); 
        if (lockScreenNotificationPeek) {
            lockScreenNotificationPeek.classList.remove('active');
            lockScreenNotificationPeek.innerHTML = '';
            lockScreen.classList.remove('has-notification');
        }
        applyLockScreenConfig(currentLockScreenConfig); 
    }

    function hideLockScreen() {
        lockScreen.classList.remove('active');
        showApp('homeScreen'); 
        statusBar.style.display = 'flex'; 
        navBar.style.display = 'flex'; 
        mainContent.style.display = 'block'; 
        isScreenOn = true;
        screenOffOverlay.classList.remove('active');

        if (flashlightOn) {
            flashlightOn = false;
            document.body.classList.remove('flashlight-on');
        }
        if (lockScreenNotificationPeek) {
            lockScreenNotificationPeek.classList.remove('active');
            lockScreenNotificationPeek.innerHTML = '';
            lockScreen.classList.remove('has-notification');
        }
    }

    function toggleScreenOn() {
        hideAllOverlays(); 
        if (isScreenOn) {
            isScreenOn = false;
            screenOffOverlay.classList.add('active');
            statusBar.style.display = 'none';
            navBar.style.display = 'none';
            mainContent.style.display = 'none';
            lockScreen.classList.remove('active'); 
            if (flashlightOn) {
                flashlightOn = false;
                document.body.classList.remove('flashlight-on');
            }
        } else {
            isScreenOn = true;
            screenOffOverlay.classList.remove('active');
            showLockScreen(); 
        }
    }

    function startPowerButtonPress() {
        powerButtonPressTimer = setTimeout(() => {
            showPowerMenu();
        }, POWER_MENU_HOLD_DURATION);
    }

    function endPowerButtonPress() {
        clearTimeout(powerButtonPressTimer);
        if (powerMenu.classList.contains('active')) {
            return;
        } else {
            toggleScreenOn();
        }
    }

    function showPowerMenu() {
        hideAllOverlays(); 
        powerMenu.classList.add('active');
    }

    function hidePowerMenu() {
        powerMenu.classList.remove('active');
    }

    function hideAllOverlays() {
        notificationShade.classList.remove('active');
        powerMenu.classList.remove('active');
        volumeOverlay.classList.remove('active');
        systemMessageOverlay.classList.remove('active');
        bootScreen.classList.remove('active'); 
        screenOffOverlay.classList.remove('active'); 
        albumArtOverlay.classList.remove('active'); 
        lockScreenCustomizeOverlay.classList.remove('active'); 
    }

    function showSystemMessage(message, withSpinner = true) {
        hideAllOverlays();
        systemMessageText.textContent = message;
        systemMessageOverlay.classList.add('active');
        systemMessageOverlay.querySelector('.loading-spinner').style.display = withSpinner ? 'block' : 'none';
        statusBar.style.display = 'none';
        navBar.style.display = 'none';
        mainContent.style.display = 'none';
        lockScreen.classList.remove('active'); 
        isScreenOn = false; 
    }

    function hideSystemMessage() {
        systemMessageOverlay.classList.remove('active');
        systemMessageText.textContent = '';
    }

    function shutdownDevice() {
        hidePowerMenu();
        showSystemMessage('Shutting down...', false);
        clearInterval(lockScreenTimeIntervalId);
        clearInterval(homeScreenClockWidgetIntervalId); 
        setTimeout(() => {
            hideSystemMessage();
            screenOffOverlay.classList.add('active'); 
            isScreenOn = false;
            appHistory = []; 
        }, SHUTDOWN_RESTART_MESSAGE_DELAY);
    }

    function restartDevice() {
        // Ensure power menu closed and any overlays hidden
        hidePowerMenu();

        // If boot screen is active (we're in bootloader), remove it before showing restart message
        if (bootScreen && bootScreen.classList.contains('active')) {
            bootScreen.classList.remove('active');
        }

        showSystemMessage('Restarting...', true);
        clearInterval(lockScreenTimeIntervalId);
        clearInterval(homeScreenClockWidgetIntervalId);

        setTimeout(() => {
            hideSystemMessage();
            // Start normal boot sequence which will show the boot screen briefly then lock screen
            initiateBootSequence();
        }, SHUTDOWN_RESTART_MESSAGE_DELAY);
    }

    function initiateBootSequence() {
        // Hide app views and transient overlays, but keep the lock screen active (bootloader overlays on top)
        document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
        homeScreen.classList.remove('active');
        // keep lockScreen active instead of removing it so the device remains locked visually
        // lockScreen.classList.remove('active');
        statusBar.style.display = 'none';
        navBar.style.display = 'none';
        mainContent.style.display = 'none';

        powerMenu.classList.remove('active');
        volumeOverlay.classList.remove('active');
        systemMessageOverlay.classList.remove('active');
        notificationShade.classList.remove('active');
        albumArtOverlay.classList.remove('active');
        lockScreenCustomizeOverlay.classList.remove('active');

        screenOffOverlay.classList.remove('active'); 
        // show boot screen overlay above the lock screen
        bootScreen.classList.add('active'); 
        // preserve isScreenOn state as true so lock screen remains interactive state-wise
        isScreenOn = true;

        setTimeout(() => {
            // remove boot overlay and leave lock screen visible/locked
            bootScreen.classList.remove('active'); 
            // Ensure lock screen is visible and timers are running
            showLockScreen(); 
            isScreenOn = true; 
            clearInterval(lockScreenTimeIntervalId);
            lockScreenTimeIntervalId = setInterval(updateLockScreenTime, 1000); 
            const homeClockWidget = document.getElementById('homeClockWidget');
            if (homeClockWidget) {
                clearInterval(homeScreenClockWidgetIntervalId);
                homeScreenClockWidgetIntervalId = setInterval(() => updateHomeScreenClockWidget(homeClockWidget), 1000); 
            }
        }, BOOT_SEQUENCE_DELAY);
    }

    function updateVolumeDisplay() {
        const fillWidth = currentVolume + '%';
        volumeBarFill.style.width = fillWidth;
        volumeLevelText.textContent = currentVolume + '%';
        volumeOverlay.classList.add('active');
        
        clearTimeout(volumeOverlayTimeoutId);
        volumeOverlayTimeoutId = setTimeout(() => {
            volumeOverlay.classList.remove('active');
        }, 2000); 
    }

    // Captions toggle handler (button placed in the volume overlay)
    if (captionsToggleButton) {
        captionsToggleButton.addEventListener('click', () => {
            const pressed = captionsToggleButton.getAttribute('aria-pressed') === 'true';
            captionsToggleButton.setAttribute('aria-pressed', String(!pressed));
            captionsToggleButton.textContent = !pressed ? 'Captions: On' : 'Captions';
            createNotification('Accessibility', `Closed captions ${!pressed ? 'enabled' : 'disabled'}.`);
            // keep the volume overlay visible briefly to show the captions control
            volumeOverlay.classList.add('active');
            clearTimeout(volumeOverlayTimeoutId);
            volumeOverlayTimeoutId = setTimeout(() => {
                volumeOverlay.classList.remove('active');
            }, 1400);
        });
    }

    function increaseVolume() {
        // If boot screen active, treat volume as menu up
        if (bootScreen && bootScreen.classList.contains('active')) {
            navigateBootMenu(-1);
            return;
        }
        if (!isScreenOn) return; 
        currentVolume = Math.min(100, currentVolume + 10);
        updateVolumeDisplay();
    }

    function decreaseVolume() {
        // If boot screen active, treat volume as menu down
        if (bootScreen && bootScreen.classList.contains('active')) {
            navigateBootMenu(1);
            return;
        }
        if (!isScreenOn) return; 
        currentVolume = Math.max(0, currentVolume - 10);
        updateVolumeDisplay();
    }

    function navigateBootMenu(direction) {
        if (!bootMenuElement) return;
        // direction: -1 up, 1 down
        bootMenuIndex = (bootMenuIndex + BOOT_MENU_ITEMS.length + direction) % BOOT_MENU_ITEMS.length;
        // update visual selection
        const items = bootMenuElement.querySelectorAll('.boot-menu-item');
        items.forEach((it, i) => it.classList.toggle('selected', i === bootMenuIndex));
        // show dynamic island preview
        showDynamicIsland(BOOT_MENU_ITEMS[bootMenuIndex], 1600);
        // short haptic/feedback simulation (visual)
        window._spawnTapParticles && window._spawnTapParticles( (window.innerWidth/2) - document.querySelector('.screen').getBoundingClientRect().left, 220);
    }

    // Power select when boot screen active
    const originalEndPowerButtonPress = endPowerButtonPress;
    function handleBootPowerSelect() {
        if (bootScreen && bootScreen.classList.contains('active')) {
            const selection = BOOT_MENU_ITEMS[bootMenuIndex];
            // simple simulated action flows
            createNotification('Bootloader', `Selected: ${selection}`);
            if (selection === 'REBOOT') {
                restartDevice();
            } else if (selection === 'FACTORY RESET') {
                showSystemMessage('Factory resetting...', true);
                setTimeout(() => {
                    hideSystemMessage();
                    createNotification('Bootloader', 'Factory reset complete.');
                }, 1800);
            } else if (selection === 'RECOVERY') {
                showSystemMessage('Entering recovery...', true);
                setTimeout(() => {
                    hideSystemMessage();
                    createNotification('Bootloader', 'Recovery mode entered.');
                }, 1400);
            } else {
                // brief note for other items
                showDynamicIsland(`${selection} — processing`, 2000);
            }
            return true;
        }
        return false;
    }

    // override endPowerButtonPress to route selection if boot screen active
    function endPowerButtonPress() {
        clearTimeout(powerButtonPressTimer);
        if (powerMenu.classList.contains('active')) {
            return;
        } else {
            // If boot screen active, use power as select
            if (handleBootPowerSelect()) return;
            toggleScreenOn();
        }
    }
    
    lockScreen.addEventListener('click', (event) => {
        if (!event.target.closest('.lock-screen-action-icon') && 
            !event.target.closest('.lock-screen-notifications') &&
            !event.target.closest('.lock-screen-widget') &&
            !event.target.closest('#albumArtOverlay') &&
            !event.target.closest('#lockScreenCustomizeOverlay')) 
        {
            hideLockScreen();
        }
    });

    lockScreen.addEventListener('mousedown', (e) => {
        if (!isScreenOn || lockScreenCustomizeOverlay.classList.contains('active')) return; 
        if (e.target.closest('.lock-screen-action-icon') || e.target.closest('.lock-screen-notifications') || e.target.closest('.lock-screen-widget')) {
            return;
        }

        lockScreenHoldTimer = setTimeout(() => {
            showLockScreenCustomizeOverlay();
        }, LOCK_SCREEN_HOLD_DURATION);
    });

    // Touch equivalent for long-press on lock screen (mobile)
    lockScreen.addEventListener('touchstart', (e) => {
        if (!isScreenOn || lockScreenCustomizeOverlay.classList.contains('active')) return;
        if (e.target.closest('.lock-screen-action-icon') || e.target.closest('.lock-screen-notifications') || e.target.closest('.lock-screen-widget')) {
            return;
        }
        // Prevent default to avoid accidental gestures
        e.preventDefault();
        lockScreenHoldTimer = setTimeout(() => {
            showLockScreenCustomizeOverlay();
        }, LOCK_SCREEN_HOLD_DURATION);
    }, { passive: false });

    lockScreen.addEventListener('touchend', () => {
        clearTimeout(lockScreenHoldTimer);
    });

    lockScreen.addEventListener('touchcancel', () => {
        clearTimeout(lockScreenHoldTimer);
    });

    lockScreen.addEventListener('mouseup', () => {
        clearTimeout(lockScreenHoldTimer);
    });

    lockScreen.addEventListener('mouseleave', () => {
        clearTimeout(lockScreenHoldTimer);
    });

    function showLockScreenCustomizeOverlay() {
        hideAllOverlays();
        lockScreenCustomizeOverlay.classList.add('active');
        populateLockScreenCustomizeOptions();
        lockScreen.querySelector('.lock-screen-unlock-hint').style.display = 'none';
    }

    function hideLockScreenCustomizeOverlay() {
        lockScreenCustomizeOverlay.classList.remove('active');
        lockScreen.querySelector('.lock-screen-unlock-hint').style.display = ''; 
        showLockScreen(); 
    }

    function populateLockScreenCustomizeOptions() {
        fontColorPresetsContainer.innerHTML = '';
        lockScreenPresets.forEach((preset, index) => {
            const presetDiv = document.createElement('div');
            presetDiv.className = `preset-option ${currentLockScreenConfig.presetIndex === index ? 'selected' : ''}`;
            presetDiv.dataset.index = index;
            presetDiv.innerHTML = `
                <strong style="font-family: ${preset.timeFont}; color: ${preset.timeColor};">12:34</strong>
                <span style="font-family: ${preset.dateFont}; color: ${preset.dateColor};">Mon, Jan 1</span>
                <span>${preset.name}</span>
            `;
            presetDiv.addEventListener('click', () => {
                fontColorPresetsContainer.querySelectorAll('.preset-option').forEach(p => p.classList.remove('selected'));
                presetDiv.classList.add('selected');
                lockScreen.style.setProperty('--lock-screen-time-font', preset.timeFont);
                lockScreen.style.setProperty('--lock-screen-time-color', preset.timeColor);
                lockScreen.style.setProperty('--lock-screen-date-font', preset.dateFont);
                lockScreen.style.setProperty('--lock-screen-date-color', preset.dateColor);
                lockScreen.classList.remove(...Array.from({length: lockScreenPresets.length}, (_, i) => `preset-${i + 1}`));
                lockScreen.classList.add(`preset-${index + 1}`);
            });
            fontColorPresetsContainer.appendChild(presetDiv);
        });

        backgroundEffectOptionsContainer.innerHTML = '';
        const effectOptions = [
            { type: 'none', label: 'None', color: 'transparent' },
            // Use a stable tint color (falls back to a neutral accent) instead of referencing a non-existent property
            { type: 'tint', label: 'Tint', color: 'rgba(97, 218, 251, 0.25)' },
            { type: 'overlay', label: 'Dark Overlay', color: 'rgba(0, 0, 0, 0.5)' }
        ];
        effectOptions.forEach(effect => {
            const effectDiv = document.createElement('div');
            effectDiv.className = `effect-swatch ${currentLockScreenConfig.backgroundEffect.type === effect.type ? 'selected' : ''}`;
            effectDiv.dataset.effectType = effect.type;
            effectDiv.style.backgroundColor = effect.color;
            effectDiv.textContent = effect.label;
            effectDiv.addEventListener('click', () => {
                backgroundEffectOptionsContainer.querySelectorAll('.effect-swatch').forEach(s => s.classList.remove('selected'));
                effectDiv.classList.add('selected');
                lockScreenEffectOverlay.style.background = effect.color;
            });
            backgroundEffectOptionsContainer.appendChild(effectDiv);
        });

        lockScreenWidgetToggleOptionsContainer.innerHTML = `
            <label>
                <input type="checkbox" id="toggleDateWidget" ${currentLockScreenConfig.activeWidgets.lockScreenDateWidget ? 'checked' : ''}>
                Small Date Widget (Weather/Battery)
            </label>
        `;
        lockScreenWidgetsData.filter(w => w.id !== 'lockScreenDateWidget').forEach(widget => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" id="toggle${widget.id}" ${currentLockScreenConfig.activeWidgets[widget.id] ? 'checked' : ''}>
                ${widget.name}
            `;
            lockScreenWidgetToggleOptionsContainer.appendChild(label);
        });

        populateLockScreenProfilesDropdown();
    }

    function populateLockScreenProfilesDropdown() {
        loadLockScreenProfileSelect.innerHTML = '<option value="">Load Profile...</option>';
        for (const profileName in savedLockScreenProfiles) {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            loadLockScreenProfileSelect.appendChild(option);
        }
    }

    function saveLockScreenProfile() {
        let profileName = prompt("Enter a name for this lock screen profile:");
        if (profileName && profileName.trim() !== '') {
            profileName = profileName.trim();
            savedLockScreenProfiles[profileName] = currentLockScreenConfig;
            localStorage.setItem('lockScreenProfiles', JSON.stringify(savedLockScreenProfiles));
            populateLockScreenProfilesDropdown();
            createNotification('Lock Screen', `Profile "${profileName}" saved!`);
        } else if (profileName !== null) {
            createNotification('Lock Screen', 'Profile name cannot be empty.');
        }
    }

    function loadLockScreenProfile() {
        const profileName = loadLockScreenProfileSelect.value;
        if (profileName && savedLockScreenProfiles[profileName]) {
            applyLockScreenConfig(savedLockScreenProfiles[profileName]);
            populateLockScreenCustomizeOptions(); 
            createNotification('Lock Screen', `Profile "${profileName}" loaded!`);
        } else if (profileName) {
            createNotification('Lock Screen', 'Profile not found.');
        }
    }

    function deleteLockScreenProfile() {
        const profileName = loadLockScreenProfileSelect.value;
        if (profileName && savedLockScreenProfiles[profileName]) {
            if (confirm(`Are you sure you want to delete profile "${profileName}"?`)) {
                delete savedLockScreenProfiles[profileName];
                localStorage.setItem('lockScreenProfiles', JSON.stringify(savedLockScreenProfiles));
                populateLockScreenProfilesDropdown();
                loadLockScreenProfileSelect.value = ''; 
                createNotification('Lock Screen', `Profile "${profileName}" deleted.`);
            }
        } else {
            createNotification('Lock Screen', 'No profile selected to delete.');
        }
    }

    closeLockScreenCustomizeButton.addEventListener('click', hideLockScreenCustomizeOverlay);

    applyLockScreenCustomizationButton.addEventListener('click', () => {
        const selectedPreset = fontColorPresetsContainer.querySelector('.preset-option.selected');
        if (selectedPreset) {
            currentLockScreenConfig.presetIndex = parseInt(selectedPreset.dataset.index);
        }

        const selectedEffect = backgroundEffectOptionsContainer.querySelector('.effect-swatch.selected');
        if (selectedEffect) {
            currentLockScreenConfig.backgroundEffect.type = selectedEffect.dataset.effectType;
            currentLockScreenConfig.backgroundEffect.color = selectedEffect.style.backgroundColor;
        }

        currentLockScreenConfig.activeWidgets.lockScreenDateWidget = lockScreenWidgetToggleOptionsContainer.querySelector('#toggleDateWidget').checked;
        lockScreenWidgetsData.filter(w => w.id !== 'lockScreenDateWidget').forEach(widget => {
            const toggle = lockScreenWidgetToggleOptionsContainer.querySelector(`#toggle${widget.id}`);
            currentLockScreenConfig.activeWidgets[widget.id] = toggle ? toggle.checked : false;
        });
        
        applyLockScreenConfig(currentLockScreenConfig); 
        hideLockScreenCustomizeOverlay();
        createNotification('Lock Screen', 'Lock Screen customized!');
    });

    cancelLockScreenCustomizationButton.addEventListener('click', () => {
        applyLockScreenConfig(JSON.parse(localStorage.getItem('lockScreenConfig')) || {
            presetIndex: 0,
            backgroundEffect: { type: 'none', color: '' },
            activeWidgets: { lockScreenDateWidget: true },
            orientation: 'portrait'
        }); 
        hideLockScreenCustomizeOverlay();
        createNotification('Lock Screen', 'Customization cancelled.');
    });

    saveLockScreenProfileButton.addEventListener('click', saveLockScreenProfile);
    loadLockScreenProfileSelect.addEventListener('change', loadLockScreenProfile);
    deleteLockScreenProfileButton.addEventListener('click', deleteLockScreenProfile);

    const apps = [
        {
            id: 'word2010App',
            name: 'Microsoft Word 2010',
            icon: 'office2010_icon.png',
            header: 'Microsoft Word 2010',
            contentHTML: `
                <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>Microsoft Word 2010 — Demo</strong>
                        <div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Features: Templates · Spellcheck · Word count · Tables · Macros (simulated)</div>
                    </div>
                    <div id="wordTools" style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button id="wordApplyTemplate">Apply Template</button>
                        <button id="wordSaveTemplate">Save as Template</button>
                        <button id="wordWordCount">Word Count</button>
                        <button id="wordInsertTable">Insert Table</button>
                        <button id="wordToggleSpellcheck">Toggle Spellcheck</button>
                        <button id="wordRunMacro">Run Macro (Sim)</button>
                    </div>
                    <div id="wordEditorWrap" style="background:var(--surface-color);padding:12px;border-radius:12px;">
                        <div id="wordEditor" contenteditable="true" spellcheck="true" style="min-height:240px;padding:12px;border-radius:8px;background:transparent;color:var(--on-surface-color);outline:none;">
                            <h2 style="margin-top:0;">Document Title</h2>
                            <p>Start typing your document here. This editor simulates Word features: templates, simple spellcheck via browser, word count, and table insertion.</p>
                        </div>
                    </div>
                    <div id="wordStatus" style="font-size:0.95em;color:var(--on-surface-color);">Template: <span id="wordCurrentTemplate">Default</span></div>
                </div>
            `,
            init: (appElement) => {
                const editor = appElement.querySelector('#wordEditor');
                const applyTemplateBtn = appElement.querySelector('#wordApplyTemplate');
                const saveTemplateBtn = appElement.querySelector('#wordSaveTemplate');
                const wordCountBtn = appElement.querySelector('#wordWordCount');
                const insertTableBtn = appElement.querySelector('#wordInsertTable');
                const toggleSpellBtn = appElement.querySelector('#wordToggleSpellcheck');
                const runMacroBtn = appElement.querySelector('#wordRunMacro');
                const statusSpan = appElement.querySelector('#wordCurrentTemplate');

                // Load/simulate Normal.dotm defaults from localStorage
                const TEMPLATE_KEY = 'word2010_template_normal';
                function loadTemplate() {
                    try {
                        const saved = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '{}');
                        return saved;
                    } catch (e) { return {}; }
                }
                function applyTemplateObject(t) {
                    if (!t) return;
                    if (t.title) {
                        const h = editor.querySelector('h2');
                        if (h) h.textContent = t.title;
                    }
                    if (t.paragraphStyle) {
                        editor.querySelectorAll('p').forEach(p => p.style.fontFamily = t.paragraphStyle.fontFamily || '');
                    }
                }

                // Save current editor defaults as template (simulates Normal.dotm)
                saveTemplateBtn.addEventListener('click', () => {
                    const titleEl = editor.querySelector('h2');
                    const title = titleEl ? titleEl.textContent : 'Document Title';
                    const templateObj = {
                        title,
                        paragraphStyle: {
                            fontFamily: getComputedStyle(editor).fontFamily
                        },
                        savedAt: new Date().toISOString()
                    };
                    try {
                        localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templateObj));
                        statusSpan.textContent = 'Saved Template';
                        createNotification('Word', 'Template saved as Normal.dotm (simulated).');
                    } catch (e) {
                        createNotification('Word', 'Failed to save template (storage).');
                    }
                });

                applyTemplateBtn.addEventListener('click', () => {
                    const t = loadTemplate();
                    if (Object.keys(t).length === 0) {
                        createNotification('Word', 'No saved template found; using defaults.');
                        statusSpan.textContent = 'Default';
                        return;
                    }
                    applyTemplateObject(t);
                    statusSpan.textContent = 'Applied Template';
                    createNotification('Word', 'Template applied (simulated).');
                });

                // Word count utility
                function computeWordCount(text) {
                    if (!text) return { words:0, chars:0 };
                    const stripped = text.replace(/\s+/g, ' ').trim();
                    const words = stripped ? stripped.split(' ').filter(Boolean).length : 0;
                    const chars = text.replace(/\s/g, '').length;
                    return { words, chars };
                }
                wordCountBtn.addEventListener('click', () => {
                    const txt = editor.innerText || editor.textContent || '';
                    const { words, chars } = computeWordCount(txt);
                    createNotification('Word Count', `Words: ${words} · Characters (no spaces): ${chars}`);
                });

                // Insert table: prompt rows/cols and inject a simple HTML table
                insertTableBtn.addEventListener('click', () => {
                    const rows = parseInt(prompt('Rows:', '2') || '2', 10);
                    const cols = parseInt(prompt('Columns:', '2') || '2', 10);
                    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
                        createNotification('Word', 'Invalid table size.');
                        return;
                    }
                    const table = document.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.style.margin = '8px 0';
                    table.style.background = 'transparent';
                    for (let r=0;r<rows;r++) {
                        const tr = document.createElement('tr');
                        for (let c=0;c<cols;c++) {
                            const td = document.createElement(r===0 ? 'th' : 'td');
                            td.style.border = '1px solid rgba(255,255,255,0.06)';
                            td.style.padding = '6px';
                            td.textContent = (r===0) ? `Heading ${c+1}` : `Cell ${r},${c+1}`;
                            tr.appendChild(td);
                        }
                        table.appendChild(tr);
                    }
                    // insert at caret if possible, else append
                    insertNodeAtCaret(table) || editor.appendChild(table);
                    createNotification('Word', `Inserted ${rows}×${cols} table.`);
                });

                // Simple caret insertion helper
                function insertNodeAtCaret(node) {
                    try {
                        const sel = window.getSelection();
                        if (!sel || !sel.rangeCount) return false;
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(node);
                        // move caret after inserted node
                        range.setStartAfter(node);
                        range.setEndAfter(node);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        return true;
                    } catch (e) {
                        return false;
                    }
                }

                // Spellcheck toggle uses browser spellcheck on contenteditable
                toggleSpellBtn.addEventListener('click', () => {
                    const current = editor.getAttribute('spellcheck') === 'true';
                    editor.setAttribute('spellcheck', String(!current));
                    createNotification('Word', `Spellcheck ${!current ? 'enabled' : 'disabled'} (browser-based).`);
                });

                // Simulated macro runner (safe: non-destructive)
                runMacroBtn.addEventListener('click', () => {
                    if (!confirm('Run simulated macro? This demo will NOT execute any real macros. Continue?')) return;
                    createNotification('Word Macro', 'Simulated macro started: auto-formatting document (demo).');
                    // example macro-like action: trim trailing whitespace in paragraphs
                    const ps = editor.querySelectorAll('p, div, li');
                    ps.forEach(p => {
                        p.textContent = (p.textContent || '').replace(/\s+$/,'');
                    });
                    setTimeout(()=> createNotification('Word Macro', 'Simulated macro completed.'), 700);
                });

                // Basic inline "thesaurus" demo: right-click selected word offers synonyms
                editor.addEventListener('contextmenu', (e) => {
                    const sel = window.getSelection();
                    const word = sel.toString().trim();
                    if (!word) return; // let default context menu show
                    e.preventDefault();
                    // tiny built-in synonym map for demo
                    const synonyms = {
                        quick: ['fast','speedy','swift'],
                        happy: ['glad','joyful','pleased'],
                        important: ['crucial','vital','significant'],
                        document: ['file','manuscript','paper']
                    };
                    const lower = word.toLowerCase();
                    const list = synonyms[lower] || [];
                    if (!list.length) {
                        createNotification('Thesaurus', `No suggestions for "${word}".`);
                        return;
                    }
                    // build small popup menu at cursor
                    const menu = document.createElement('div');
                    menu.style.position = 'fixed';
                    menu.style.left = `${e.clientX}px`;
                    menu.style.top = `${e.clientY}px`;
                    menu.style.background = 'var(--surface-color)';
                    menu.style.border = '1px solid var(--outline-color)';
                    menu.style.padding = '6px';
                    menu.style.borderRadius = '8px';
                    menu.style.zIndex = 9999;
                    list.forEach(s => {
                        const btn = document.createElement('div');
                        btn.textContent = s;
                        btn.style.padding = '6px 8px';
                        btn.style.cursor = 'pointer';
                        btn.addEventListener('click', () => {
                            replaceSelectionWith(s);
                            document.body.removeChild(menu);
                            createNotification('Thesaurus', `Replaced "${word}" with "${s}".`);
                        });
                        menu.appendChild(btn);
                    });
                    document.body.appendChild(menu);
                    // dismiss on next click
                    const dismiss = () => { if (menu.parentNode) menu.parentNode.removeChild(menu); document.removeEventListener('click', dismiss); };
                    setTimeout(()=> document.addEventListener('click', dismiss), 10);
                });

                function replaceSelectionWith(text) {
                    try {
                        const sel = window.getSelection();
                        if (!sel.rangeCount) return;
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(document.createTextNode(text));
                        // move caret after inserted text node
                        range.setStart(range.endContainer, range.endOffset);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } catch (e) {}
                }

                // Initialize: apply saved template preview if any
                const initialTemplate = loadTemplate();
                if (Object.keys(initialTemplate).length) {
                    statusSpan.textContent = 'Template loaded';
                    applyTemplateObject(initialTemplate);
                } else {
                    statusSpan.textContent = 'Default';
                }
            }
        },
        {
            id: 'touchShareApp',
            name: 'Touch to Share',
            icon: 'photo_icon.png',
            header: 'Touch to Share',
            contentHTML: `
                <p>Touch. Share. Celebrate.</p>
                <p style="font-size:0.95em;color:var(--on-surface-color);max-width:420px;margin:0 auto;text-align:center;">Seamlessly connect Android and iOS — exchange photos & videos with a simple touch.</p>
                <div style="display:flex;flex-direction:column;gap:12px;align-items:center;margin-top:16px;">
                    <input type="file" id="touchShareFileInput" accept="image/*,video/*" style="display:block;">
                    <button id="touchShareButton">Touch to Share</button>
                    <div id="touchSharePreview" style="width:220px;height:220px;border-radius:12px;overflow:hidden;background:var(--background-color);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                        <img id="touchSharePreviewImg" src="placeholder_image.png" alt="Preview" style="max-width:100%;max-height:100%;display:none;">
                        <video id="touchSharePreviewVideo" style="max-width:100%;max-height:100%;display:none;" controls></video>
                        <div id="touchSharePlaceholder" style="color:color-mix(in srgb, var(--on-surface-color), transparent 40%);font-size:0.95em;">No file selected</div>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const fileInput = appElement.querySelector('#touchShareFileInput');
                const shareBtn = appElement.querySelector('#touchShareButton');
                const previewImg = appElement.querySelector('#touchSharePreviewImg');
                const previewVideo = appElement.querySelector('#touchSharePreviewVideo');
                const placeholder = appElement.querySelector('#touchSharePlaceholder');

                let lastFileDataUrl = null;

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) {
                        previewImg.style.display = 'none';
                        previewVideo.style.display = 'none';
                        placeholder.style.display = 'block';
                        lastFileDataUrl = null;
                        return;
                    }
                    const url = URL.createObjectURL(file);
                    lastFileDataUrl = url;
                    placeholder.style.display = 'none';
                    if (file.type.startsWith('video/')) {
                        previewImg.style.display = 'none';
                        previewVideo.src = url;
                        previewVideo.style.display = 'block';
                    } else {
                        previewVideo.style.display = 'none';
                        previewImg.src = url;
                        previewImg.style.display = 'block';
                    }
                });

                shareBtn.addEventListener('click', async () => {
                    if (!lastFileDataUrl) {
                        createNotification('Touch to Share', 'Please select a photo or video to share.');
                        return;
                    }

                    // Simulate touch/connect handshake
                    createNotification('Touch to Share', 'Searching for nearby devices...');
                    shareBtn.disabled = true;
                    shareBtn.textContent = 'Connecting…';

                    // short simulated delay
                    setTimeout(() => {
                        // Simulate found device(s)
                        createNotification('Touch to Share', 'Device found: FriendPhone — Preparing transfer...');
                        setTimeout(() => {
                            // Simulate transfer success
                            createNotification('Touch to Share', 'Transfer complete — Shared with FriendPhone.');
                            // Optional: open small album-art overlay to view sent media briefly
                            const albumArtOverlay = document.getElementById('albumArtOverlay');
                            if (albumArtOverlay) {
                                const albumArtImage = document.getElementById('albumArtImage');
                                const closeBtn = document.getElementById('closeAlbumArtOverlay');
                                if (albumArtImage) {
                                    albumArtImage.src = lastFileDataUrl;
                                }
                                if (albumArtOverlay && albumArtImage) {
                                    albumArtOverlay.classList.add('active');
                                    // close after 2.5s automatically
                                    setTimeout(() => { albumArtOverlay.classList.remove('active'); }, 2500);
                                }
                            }
                            shareBtn.disabled = false;
                            shareBtn.textContent = 'Touch to Share';
                        }, 1400);
                    }, 900);
                });
            }
        },
        {
            id: 'tapCounterApp',
            name: 'Tap Counter',
            icon: 'tap_icon.png',
            header: 'Tap Counter',
            contentHTML: `
                <p id="tapCount">Taps: 0</p>
                <button id="tapButton">Tap Me!</button>
            `,
            init: (appElement) => {
                let tapCount = 0;
                const tapButton = appElement.querySelector('#tapButton');
                const tapCountDisplay = appElement.querySelector('#tapCount');
                if (tapButton && tapCountDisplay) {
                    tapButton.addEventListener('click', () => {
                        tapCount++;
                        tapCountDisplay.textContent = `Taps: ${tapCount}`;
                    });
                }
            }
        },
        {
            id: 'settingsApp',
            name: 'Settings',
            icon: 'settings_icon.png',
            header: 'Settings',
            contentHTML: `
                <h3>Theme & Color</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Accent Color</span>
                        <div class="theme-color-options">
                            <div class="color-swatch" style="background-color: #61dafb;" data-theme="blue"></div>
                            <div class="color-swatch" style="background-color: #8BC34A;" data-theme="green"></div>
                            <div class="color-swatch" style="background-color: #9C27B0;" data-theme="purple"></div>
                            <div class="color-swatch" style="background-color: #FF9800;" data-theme="orange"></div>

                            <!-- New color swatches -->
                            <div class="color-swatch" style="background-color: #8DA7CC;" data-theme="yaru" title="yaru"></div>
                            <div class="color-swatch" style="background-color: #5293E3;" data-theme="sky" title="#5293E3"></div>
                            <div class="color-swatch" style="background-color: #F64D50;" data-theme="danger" title="#F64D50"></div>
                            <div class="color-swatch" style="background-color: #B8D9EC;" data-theme="paleBlue" title="#B8D9EC"></div>
                            <div class="color-swatch" style="background-color: #F26997;" data-theme="pink" title="#F26997"></div>
                            <div class="color-swatch" style="background-color: #FE7E53;" data-theme="coral" title="#FE7E53"></div>
                            <div class="color-swatch" style="background-color: #44ACB3;" data-theme="teal" title="#44ACB3"></div>
                            <div class="color-swatch" style="background-color: #ABABAB;" data-theme="neutral" title="#ABABAB"></div>
                            <div class="color-swatch" style="background-color: #666666;" data-theme="slate" title="#666666"></div>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Display Mode</span>
                        <div class="mode-options">
                            <button class="mode-switch" data-mode="dark">Dark</button>
                            <button class="mode-switch" data-mode="light">Light</button>
                            <button class="mode-switch" data-mode="liquidGlass">Liquid Glass</button>
                            <button class="mode-switch" data-mode="darkGlass">Dark Glass</button>
                            <button class="mode-switch" data-mode="metro">Metro</button>
                            <button class="mode-switch" data-mode="gingerbread" title="Android 2.3 Gingerbread">Gingerbread</button>
                            <button class="mode-switch" data-mode="eclair" title="Android 2.0 Eclair">Eclair</button>
                            <button class="mode-switch" data-mode="aero">Windows Aero</button>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Wallpaper</span>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <button id="openWallpaperButton" style="padding:10px 14px;">Use Wallpaper</button>
                            <span style="font-size:0.95em;color:var(--on-surface-color);">Choose from available wallpapers in the Wallpaper app.</span>
                        </div>
                    </li>

                    <!-- New: View Online / Websim integration -->
                    <li>
                        <span class="setting-detail">View Project Online</span>
                        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
                            <div style="display:flex;gap:8px;align-items:center;width:100%;flex-wrap:wrap;">
                                <button id="openGuestSiteButton" style="padding:8px 10px;font-size:1em;">Open guest82644.vercel.app</button>
                                <button id="openProjectOnlineButton" style="padding:8px 10px;background:var(--outline-color);font-size:1em;">Open Current Project</button>
                                <button id="settingsFixQSTilesSizeButton" style="padding:10px 14px;background:var(--outline-color);" title="Fix Quick Settings tile size from Settings">Fix QS Size</button>
                                <button id="openCloudHawkSyncButton" style="padding:8px 10px;background:var(--primary-color);color:var(--on-primary-color);">Open Cloud Hawk Sync</button>
                                <button id="openCloudHawkDriveButton" style="padding:8px 10px;background:var(--outline-color);">Open Cloud Hawk Drive</button>
                            </div>
                            <div id="guestOnlineStatus" style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">Open the guest site or try to view this project online (uses websim.getCurrentProject if available).</div>
                        </div>
                    </li>
                </ul>
                <h3>App Appearance</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Icon Shape</span>
                        <div class="icon-shape-options">
                            <button id="setRoundedIcons">Rounded</button>
                            <button id="setSquareIcons">Square</button>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Icon Size</span>
                        <div class="icon-size-options">
                            <button class="icon-size-switch" data-size="small">Small</button>
                            <button class="icon-size-switch" data-size="medium">Medium</button>
                            <button class="icon-size-switch" data-size="large">Large</button>
                        </div>
                    </li>
                </ul>
                <h3>Lock Screen</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Clock face width</span>
                        <div style="width:100%;max-width:420px;margin-top:8px;">
                            <div style="font-size:0.95em;color:var(--on-surface-color);margin-bottom:6px;">Clock thickness</div>
                            <input type="range" min="1" max="10" value="4" style="width:100%;">
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Orientation</span>
                        <div class="orientation-options">
                            <button id="setLockScreenPortrait" class="orientation-switch" data-orientation="portrait">Portrait</button>
                            <button id="setLockScreenLandscape" class="orientation-switch" data-orientation="landscape">Landscape</button>
                        </div>
                    </li>
                </ul>
                <h3>Device</h3>
                <ul class="settings-category">
                    <li><span class="setting-detail">Display</span></li>
                    <li><span class="setting-detail">Storage</span> <span class="setting-value">80% Used</span></li>
                    <li><span class="setting-detail">Apps</span></li>
                    <li><span class="setting-detail">App Launch</span></li>
                </ul>
                <h3>Network & Internet</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Wi-Fi</span>
                        <label class="switch">
                            <input type="checkbox" id="wifiToggle" checked>
                            <span class="slider round"></span>
                        </label>
                    </li>
                    <li><span class="setting-detail">Mobile Network</span></li>
                    <li><span class="setting-detail">Bluetooth</span></li>
                    <li><span class="setting-detail">VPN</span></li>
                    <li><span class="setting-detail">Private DNS</span></li>
                    <li><span class="setting-detail">Airplane Mode</span></li>
                </ul>
                <h3>Personal</h3>
                <ul class="settings-category">
                    <li><span class="setting-detail">Location</span></li>
                    <li><span class="setting-detail">Security</span></li>
                    <li><span class="setting-detail">Account</span></li>
                    <li><span class="setting-detail">Google Account</span></li>
                    <li><span class="setting-detail">Language & Input</span></li>
                </ul>
                <h3>System</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">About Tablet</span>
                        <div class="setting-value" style="text-align: right;">
                            <p style="margin: 0;">Name: Oppo Reno 2F</p>
                            <p style="margin: 0;">OS: HawkOS 2.2</p>
                            <p style="margin: 0;">Android: 17</p>
                            <p style="margin: 0;">Model: CPH1989</p>
                            <p style="margin: 0;">CPU: Intel Potato</p>
                            <p style="margin: 0;">GPU: Intel Graphics Fire GPU</p>
                            <p style="margin: 0;">RAM: 4GB / 12GB</p>
                            <p style="margin: 0;">Storage: 2TB</p>
                            <p style="margin: 0;">Kernel version: Linux 6.12.41+deb13-amd64 debian 13</p>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Battery</span>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <button id="openBatteryButton" style="padding:10px 14px;">Open Battery Settings</button>
                            <span style="font-size:0.95em;color:var(--on-surface-color);">Battery health & adaptive charging settings.</span>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Update OS</span>
                        <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:420px;">
                            <div style="display:flex;gap:8px;align-items:center;">
                                <button id="checkUpdatesSettingButton" style="flex:1;">Check for Updates</button>
                                <button id="updateOSButton" style="flex:1;background:var(--primary-color);color:var(--on-primary-color);">Download/Install Now</button>
                            </div>
                            <div id="updateStatusSetting" style="font-size:0.95em;color:var(--on-surface-color);">Status: Idle</div>
                            <div style="display:flex;gap:8px;margin-top:6px;">
                                <button id="localInstallSettingButton" style="flex:1;background:var(--outline-color);color:var(--on-surface-color);">Local Install</button>
                                <button id="joinBetaSettingButton" style="flex:1;background:#f0ad4e;color:#111;">Join Beta</button>
                            </div>
                            <label style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                                <input type="checkbox" id="autoUpdateSettingToggle">
                                <div>
                                    <strong>Enable Auto Update</strong>
                                    <div style="font-size:0.9em;color:var(--on-surface-color);">Automatically download and install updates when available.</div>
                                </div>
                            </label>
                        </div>
                    </li>
                </ul>
                <h3>Language</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">App Language</span>
                        <div class="language-options">
                            <button class="language-switch" data-lang="en">English</button>
                            <button class="language-switch" data-lang="id">Indonesian</button>
                            <button class="language-switch" data-lang="vi">Vietnamese</button>
                            <button class="language-switch" data-lang="ko">Korean</button>
                            <button class="language-switch" data-lang="ar">Arabic</button>
                            <button class="language-switch" data-lang="th">Thai</button>
                            <button class="language-switch" data-lang="in">India</button>
                        </div>
                    </li>
                </ul>

                <h3>Bootloader</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Unlock Bootloader</span>
                        <div style="display:flex;gap:10px;align-items:center;flex-direction:column;">
                            <div style="font-size:0.95em;color:var(--on-surface-color);max-width:420px;">Unlocking the bootloader allows installing unsigned code and custom firmware; this may void warranties and will likely erase user data.</div>
                            <label style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                                <input type="checkbox" id="bootloaderFactoryWipe" checked>
                                <span style="font-size:0.95em;color:var(--on-surface-color);">Perform factory wipe (recommended)</span>
                            </label>
                            <div style="display:flex;flex-direction:column;gap:10px;width:100%;margin-top:8px;">
                                <div style="font-size:0.95em;color:#ffdddd;background:#5a0000;padding:10px;border-radius:8px;">
                                    <strong>Warning:</strong> You are operating as mobile. You may harm your system. Unlocking the bootloader allows installing custom OS images — do not destroy or overwrite critical system files.
                                </div>
                                <label style="display:flex;gap:8px;align-items:center;">
                                    <input type="checkbox" id="bootloaderFactoryWipe" checked>
                                    <span style="font-size:0.95em;color:var(--on-surface-color);">Perform factory wipe (recommended)</span>
                                </label>
                                <label style="display:flex;gap:8px;align-items:center;">
                                    <input type="checkbox" id="bootloaderRebootAfter">
                                    <span style="font-size:0.95em;color:var(--on-surface-color);">Reboot after unlock</span>
                                </label>
                                <div style="display:flex;gap:8px;width:100%;margin-top:6px;">
                                    <button id="unlockBootloaderButton" style="flex:1;background:#b22222;">Unlock Bootloader</button>
                                    <button id="lockBootloaderButton" style="flex:1;background:var(--outline-color);color:var(--on-surface-color);">Relock</button>
                                </div>
                                <div id="bootloaderState" style="margin-top:8px;font-size:0.95em;color:var(--primary-color);">Status: <span id="bootloaderStatusText">Locked</span></div>
                            </div>
                        </div>
                    </li>
                </ul>

                <h3>TV & Media</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Channel Controls</span>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <button id="tvChMinus" class="tv-button">CH-</button>
                            <button id="tvChPlus" class="tv-button">CH+</button>
                            <button id="tvScan" class="tv-button">Scan Channels</button>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">Broadcast Standard</span>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <button class="tv-standard tv-standard-button" data-standard="ntsc" id="tvNTSC">NTSC 720x480@60</button>
                            <button class="tv-standard tv-standard-button" data-standard="pal" id="tvPAL">PAL 720x576@50</button>
                        </div>
                    </li>
                    <li>
                        <span class="setting-detail">TV Actions</span>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <button id="tvSound" class="tv-button">Toggle Sound</button>
                            <button id="tvScreenshot" class="tv-button">Screenshot</button>
                        </div>
                    </li>
                </ul>

                <h3>Aqua Dynamics</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Aqua Dynamics8</span>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div style="font-size:0.95em;color:var(--on-surface-color);">High Profile · Low Interference — Switch tunes, tap a timer, or check where your ride is, instantly.</div>
                            <label style="display:flex;gap:10px;align-items:center;">
                                <input type="checkbox" id="aquaHighProfileToggle">
                                <div>Enable High Profile</div>
                            </label>
                            <label style="display:flex;gap:10px;align-items:center;">
                                <input type="checkbox" id="aquaLowInterferenceToggle">
                                <div>Enable Low Interference</div>
                            </label>
                        </div>
                    </li>
                </ul>

                <h3>Notifications</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Test Notification</span>
                        <button id="sendTestNotification">Send</button>
                    </li>
                </ul>
                <h3>Accessibility</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Color & motion</span>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="display:flex;gap:10px;align-items:center;">
                                <input type="checkbox" id="disableBlurToggle">
                                <div>
                                    <strong>Disable blur effects</strong>
                                    <div style="font-size:0.95em;color:var(--on-surface-color);">Reduce motion / visual clutter by turning off modal and background blur.</div>
                                </div>
                            </label>
                        </div>
                    </li>
                </ul>

                <h3>Program Beta</h3>
                <ul class="settings-category">
                    <li>
                        <span class="setting-detail">Join Beta Update</span>
                        <button id="joinBetaButton">Email Click Join Beta</button>
                    </li>
                </ul>
            `,
            init: (appElement) => {
                const setRoundedIconsBtn = appElement.querySelector('#setRoundedIcons');
                const setSquareIconsBtn = appElement.querySelector('#setSquareIcons');
                const sendTestNotificationBtn = appElement.querySelector('#sendTestNotification');
                const updateOSButton = appElement.querySelector('#updateOSButton');
                const wifiToggle = appElement.querySelector('#wifiToggle');
                const joinBetaButton = appElement.querySelector('#joinBetaButton'); 
                const setLockScreenPortraitBtn = appElement.querySelector('#setLockScreenPortrait'); 
                const setLockScreenLandscapeBtn = appElement.querySelector('#setLockScreenLandscape'); 

                // New: Icon size buttons
                const setSmallIconsBtn = appElement.querySelector('.icon-size-switch[data-size="small"]');
                const setMediumIconsBtn = appElement.querySelector('.icon-size-switch[data-size="medium"]');
                const setLargeIconsBtn = appElement.querySelector('.icon-size-switch[data-size="large"]');

                if (setSmallIconsBtn && setMediumIconsBtn && setLargeIconsBtn) {
                    setSmallIconsBtn.addEventListener('click', () => applyIconSize('small'));
                    setMediumIconsBtn.addEventListener('click', () => applyIconSize('medium'));
                    setLargeIconsBtn.addEventListener('click', () => applyIconSize('large'));

                    const initialSizeButton = appElement.querySelector(`.icon-size-switch[data-size="${currentIconSize}"]`);
                    if (initialSizeButton) {
                        initialSizeButton.classList.add('selected');
                    }
                }

                if (setRoundedIconsBtn && setSquareIconsBtn) {
                    setRoundedIconsBtn.addEventListener('click', () => applyIconShape('rounded'));
                    setSquareIconsBtn.addEventListener('click', () => applyIconShape('square'));
                }
                // Accessibility: toggle to disable blur effects (Color & motion)
                const disableBlurToggle = appElement.querySelector('#disableBlurToggle');
                if (disableBlurToggle) {
                    disableBlurToggle.addEventListener('change', (e) => {
                        const disabled = e.target.checked;
                        if (disabled) {
                            document.documentElement.classList.add('no-blur');
                            createNotification('Accessibility', 'Blur effects disabled.');
                        } else {
                            document.documentElement.classList.remove('no-blur');
                            createNotification('Accessibility', 'Blur effects enabled.');
                        }
                        localStorage.setItem('disableBlurEffects', disabled ? 'true' : 'false');
                    });
                    // initialize from saved preference
                    const saved = localStorage.getItem('disableBlurEffects') === 'true';
                    disableBlurToggle.checked = saved;
                    if (saved) document.documentElement.classList.add('no-blur');
                }
                if (sendTestNotificationBtn) {
                    sendTestNotificationBtn.addEventListener('click', () => {
                        createNotification('New Message', 'You have a new message from User123!');
                    });
                }
                if (updateOSButton) {
                    updateOSButton.addEventListener('click', () => {
                        createNotification('System Update', 'HawkOS 1.4 is downloading. It will install soon!');
                    });
                }
                if (wifiToggle) {
                    wifiToggle.addEventListener('change', (event) => {
                        if (event.target.checked) {
                            createNotification('Wi-Fi', 'Wi-Fi turned ON.');
                        } else {
                            createNotification('Wi-Fi', 'Wi-Fi turned OFF.');
                        }
                    });
                }
                if (joinBetaButton) {
                    joinBetaButton.addEventListener('click', () => {
                        createNotification('Program Beta', 'You have successfully joined the Beta Program! Check your email for more details.');
                    });
                }
                if (setLockScreenPortraitBtn && setLockScreenLandscapeBtn) {
                    setLockScreenPortraitBtn.addEventListener('click', () => {
                        applyLockScreenConfig({ orientation: 'portrait' });
                        setLockScreenPortraitBtn.classList.add('selected');
                        setLockScreenLandscapeBtn.classList.remove('selected');
                        createNotification('Lock Screen', 'Orientation set to Portrait.');
                    });
                    setLockScreenLandscapeBtn.addEventListener('click', () => {
                        applyLockScreenConfig({ orientation: 'landscape' });
                        setLockScreenLandscapeBtn.classList.add('selected');
                        setLockScreenPortraitBtn.classList.remove('selected');
                        createNotification('Lock Screen', 'Orientation set to Landscape.');
                    });
                    if (currentLockScreenConfig.orientation === 'landscape') {
                        setLockScreenLandscapeBtn.classList.add('selected');
                    } else {
                        setLockScreenPortraitBtn.classList.add('selected');
                    }
                }

                // existing swatches
                appElement.querySelectorAll('.color-swatch').forEach(swatch => {
                    // ignore the customSwatch element (it has id)
                    if (swatch.id === 'customSwatch') return;
                    swatch.addEventListener('click', () => {
                        const themeName = swatch.dataset.theme;
                        applyTheme(themeName, currentMode);
                    });
                });

                // Custom accent handling: allow user to pick hex color, apply and persist as "custom" theme
                const customPicker = appElement.querySelector('#customAccentPicker') || document.getElementById('customAccentPicker');
                const applyCustomBtn = appElement.querySelector('#applyCustomAccent') || document.getElementById('applyCustomAccent');
                const customSwatch = appElement.querySelector('#customSwatch') || document.getElementById('customSwatch');

                // Load previously saved custom accent color (if any)
                const savedCustomAccent = localStorage.getItem('customAccentColor');
                if (savedCustomAccent) {
                    if (!accentColors.custom) accentColors.custom = { primary: savedCustomAccent, onPrimary: '#111827' };
                    if (customPicker) customPicker.value = savedCustomAccent;
                    if (customSwatch) customSwatch.style.backgroundColor = savedCustomAccent;
                } else {
                    // initialize swatch to current accent
                    if (customSwatch && accentColors.custom && accentColors.custom.primary) {
                        customSwatch.style.backgroundColor = accentColors.custom.primary;
                    } else if (customSwatch) {
                        customSwatch.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#61dafb';
                    }
                }

                if (applyCustomBtn && customPicker) {
                    applyCustomBtn.addEventListener('click', () => {
                        const color = customPicker.value || '#61dafb';
                        // add/update 'custom' accent entry
                        accentColors.custom = { primary: color, onPrimary: (getContrastYIQ(color) === 'dark' ? '#111827' : '#ffffff') };
                        // persist
                        localStorage.setItem('customAccentColor', color);
                        // update UI preview swatch
                        if (customSwatch) {
                            customSwatch.style.backgroundColor = color;
                            // add a visual selection border
                            customSwatch.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
                        }
                        // apply theme using the 'custom' key
                        applyTheme('custom', currentMode);
                        // mark selection visually (deselect other swatches)
                        appElement.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                        if (customSwatch) customSwatch.classList.add('selected');
                        createNotification('Theme', `Custom accent ${color} applied.`);
                    });
                }

                // Utility: determine whether to use dark/white text on custom accent (simple YIQ)
                function getContrastYIQ(hexcolor) {
                    // normalize and strip #
                    const hex = (hexcolor || '#61dafb').replace('#', '');
                    const r = parseInt(hex.substr(0,2),16);
                    const g = parseInt(hex.substr(2,2),16);
                    const b = parseInt(hex.substr(4,2),16);
                    const yiq = ((r*299)+(g*587)+(b*114))/1000;
                    return (yiq >= 128) ? 'dark' : 'light';
                }

                // If previously selected accent was 'custom', ensure UI reflects it
                if (currentAccent === 'custom') {
                    // mark custom swatch selected
                    const currentSwatch = appElement.querySelector('#customSwatch') || document.getElementById('customSwatch');
                    if (currentSwatch) {
                        appElement.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                        currentSwatch.classList.add('selected');
                    }
                }

                appElement.querySelectorAll('.mode-switch').forEach(modeButton => {
                    modeButton.addEventListener('click', () => {
                        const modeName = modeButton.dataset.mode;
                        applyTheme(currentAccent, modeName); 
                    });
                });

                const initialSwatch = appElement.querySelector(`.color-swatch[data-theme="${currentAccent}"]`);
                if (initialSwatch) {
                    initialSwatch.classList.add('selected');
                }
                const initialMode = appElement.querySelector(`.mode-switch[data-mode="${currentMode}"]`);
                if (initialMode) {
                    initialMode.classList.add('selected');
                }

                // Open Wallpaper app from Settings
                const openWallpaperBtn = appElement.querySelector('#openWallpaperButton');
                if (openWallpaperBtn) {
                    openWallpaperBtn.addEventListener('click', () => {
                        if (!isScreenOn) return;
                        showApp('wallpaperApp');
                        createNotification('Wallpaper', 'Open Wallpaper app to choose a background.');
                    });
                }

                // Guest site / websim quick actions
                const openGuestSiteButton = appElement.querySelector('#openGuestSiteButton');
                const openProjectOnlineButton = appElement.querySelector('#openProjectOnlineButton');
                const guestOnlineStatus = appElement.querySelector('#guestOnlineStatus');

                if (openGuestSiteButton) {
                    openGuestSiteButton.addEventListener('click', () => {
                        try {
                            window.open('https://guest82644.vercel.app', '_blank', 'noopener');
                            createNotification('Web', 'Opened guest82644.vercel.app in a new tab.');
                        } catch (e) {
                            createNotification('Web', 'Failed to open guest site (popup blocked?).');
                        }
                    });
                }

                if (openProjectOnlineButton) {
                    openProjectOnlineButton.addEventListener('click', async () => {
                        try {
                            // Try to get current project via websim; fallback to notifying user
                            let projectId = null;
                            if (window.websim && typeof window.websim.getCurrentProject === 'function') {
                                const project = await window.websim.getCurrentProject();
                                projectId = project && project.id;
                            }
                            if (projectId) {
                                const url = `https://guest82644.vercel.app/?project=${encodeURIComponent(projectId)}`;
                                window.open(url, '_blank', 'noopener');
                                guestOnlineStatus.textContent = `Opened project ${projectId} on guest82644.vercel.app`;
                                createNotification('Web', `Opening project ${projectId} on guest site.`);
                            } else {
                                // fallback: open guest site home and inform inability to determine project
                                window.open('https://guest82644.vercel.app', '_blank', 'noopener');
                                guestOnlineStatus.textContent = 'Guest site opened; current project info not available from websim.';
                                createNotification('Web', 'Opened guest site; current project id not available.');
                            }
                        } catch (err) {
                            console.error('Open project online error', err);
                            guestOnlineStatus.textContent = 'Error contacting websim or opening guest site.';
                            createNotification('Web', 'Error opening project online (see console).');
                        }
                    });
                }

                appElement.querySelectorAll('.language-switch').forEach(langButton => {
                    langButton.addEventListener('click', () => {
                        const langName = langButton.dataset.lang;
                        applyLanguage(langName);
                    });
                });

                // Cloud Hawk quick-open buttons (open app views)
                const openCloudHawkSyncButton = appElement.querySelector('#openCloudHawkSyncButton');
                const openCloudHawkDriveButton = appElement.querySelector('#openCloudHawkDriveButton');

                if (openCloudHawkSyncButton) {
                    openCloudHawkSyncButton.addEventListener('click', () => {
                        if (!isScreenOn) { createNotification('Cloud Hawk', 'Turn the screen on first.'); return; }
                        showApp('cloudHawkSyncApp');
                        createNotification('Cloud Hawk', 'Opened Cloud Hawk Sync app.');
                    });
                }
                if (openCloudHawkDriveButton) {
                    openCloudHawkDriveButton.addEventListener('click', () => {
                        if (!isScreenOn) { createNotification('Cloud Hawk', 'Turn the screen on first.'); return; }
                        showApp('cloudHawkDriveApp');
                        createNotification('Cloud Hawk', 'Opened Cloud Hawk Drive app.');
                    });
                }

                const initialLang = appElement.querySelector(`.language-switch[data-lang="${currentLanguage}"]`);
                if (initialLang) {
                    initialLang.classList.add('selected');
                }

                // Bootloader controls
                const unlockBootloaderBtn = appElement.querySelector('#unlockBootloaderButton');
                const lockBootloaderBtn = appElement.querySelector('#lockBootloaderButton');
                const bootloaderWipeCheckbox = appElement.querySelector('#bootloaderFactoryWipe');
                const bootloaderStatusText = appElement.querySelector('#bootloaderStatusText');

                // New: Open Noob Vietnam Websim page from Regedit app
                const regeditOpenNoobBtn = appElement.querySelector('#regeditOpenNoobBtn');
                const regeditMessage = appElement.querySelector('#regeditMessage');
                if (regeditOpenNoobBtn) {
                    regeditOpenNoobBtn.addEventListener('click', () => {
                        const url = 'https://websim.com/@unevenflag8869521/noob-vietnam';
                        try {
                            window.open(url, '_blank', 'noopener');
                            createNotification('Regedit', 'Opened Noob Vietnam page.');
                            if (regeditMessage) regeditMessage.textContent = `Opened: ${url}`;
                        } catch (err) {
                            createNotification('Regedit', 'Failed to open the Noob Vietnam page (popup blocked).');
                            if (regeditMessage) regeditMessage.textContent = 'Could not open the page.';
                        }
                    });
                }

                // Restore persisted bootloader state
                const bootState = localStorage.getItem('bootloaderUnlocked') === 'true';
                if (bootloaderStatusText) bootloaderStatusText.textContent = bootState ? 'Unlocked' : 'Locked';

                async function performBootloaderToggle(unlock) {
                    if (!isScreenOn) return;
                    const confirmed = confirm(unlock
                        ? 'Unlocking the bootloader will likely erase user data and may void warranty. Continue?'
                        : 'Relocking the bootloader may restrict custom firmware. Continue?');
                    if (!confirmed) return;

                    // Show system-level message overlay while "processing"
                    showSystemMessage(unlock ? 'Unlocking bootloader...' : 'Relocking bootloader...', true);

                    // Simulate time for operation
                    await new Promise(res => setTimeout(res, 2200));

                    // Optionally simulate factory wipe on unlock
                    if (unlock && bootloaderWipeCheckbox && bootloaderWipeCheckbox.checked) {
                        showSystemMessage('Performing factory wipe...', true);
                        await new Promise(res => setTimeout(res, 1800));
                        // simulate clearing some user data stores
                        localStorage.removeItem('mindSpaceArchive');
                        localStorage.removeItem('selectedWallpaper');
                        localStorage.removeItem('lockScreenProfiles');
                        localStorage.removeItem('lockScreenConfig');
                    }

                    hideSystemMessage();

                    // Persist state
                    localStorage.setItem('bootloaderUnlocked', unlock ? 'true' : 'false');
                    if (bootloaderStatusText) bootloaderStatusText.textContent = unlock ? 'Unlocked' : 'Locked';

                    // If user opted to reboot after unlocking, perform a restart to apply changes
                    const bootloaderRebootCheckbox = appElement.querySelector('#bootloaderRebootAfter');
                    if (unlock && bootloaderRebootCheckbox && bootloaderRebootCheckbox.checked) {
                        createNotification('Bootloader', 'Bootloader unlocked. Rebooting to apply changes...');
                        // small delay so user sees notification before UI transitions
                        setTimeout(() => {
                            restartDevice();
                        }, 600);
                        return; // restartDevice will handle UI state
                    }

                    createNotification('Bootloader', unlock ? 'Bootloader unlocked.' : 'Bootloader relocked.');
                }

                if (unlockBootloaderBtn) {
                    unlockBootloaderBtn.addEventListener('click', () => performBootloaderToggle(true));
                }
                if (lockBootloaderBtn) {
                    lockBootloaderBtn.addEventListener('click', () => performBootloaderToggle(false));
                }

                // --- TV & Media handlers ---
                const tvChMinusBtn = appElement.querySelector('#tvChMinus');
                const tvChPlusBtn = appElement.querySelector('#tvChPlus');
                const tvScanBtn = appElement.querySelector('#tvScan');
                const tvNTSCBtn = appElement.querySelector('#tvNTSC');
                const tvPALBtn = appElement.querySelector('#tvPAL');
                const tvSoundBtn = appElement.querySelector('#tvSound');
                const tvScreenshotBtn = appElement.querySelector('#tvScreenshot');

                let tvCurrentChannel = 1;
                let tvSoundOn = true;
                let tvStandard = 'ntsc';

                if (tvChMinusBtn) {
                    tvChMinusBtn.addEventListener('click', () => {
                        tvCurrentChannel = Math.max(1, tvCurrentChannel - 1);
                        createNotification('TV', `Channel ${tvCurrentChannel}`);
                    });
                }
                if (tvChPlusBtn) {
                    tvChPlusBtn.addEventListener('click', () => {
                        tvCurrentChannel = tvCurrentChannel + 1;
                        createNotification('TV', `Channel ${tvCurrentChannel}`);
                    });
                }
                if (tvScanBtn) {
                    tvScanBtn.addEventListener('click', () => {
                        createNotification('TV', 'Scanning channels...');
                        // Simulated scan: after delay show result
                        setTimeout(() => {
                            createNotification('TV', 'Scan complete: 42 channels found.');
                        }, 2000);
                    });
                }
                if (tvNTSCBtn) {
                    tvNTSCBtn.addEventListener('click', () => {
                        tvStandard = 'ntsc';
                        createNotification('TV', 'Standard set to NTSC 720x480@60.');
                    });
                }
                if (tvPALBtn) {
                    tvPALBtn.addEventListener('click', () => {
                        tvStandard = 'pal';
                        createNotification('TV', 'Standard set to PAL 720x576@50.');
                    });
                }
                if (tvSoundBtn) {
                    tvSoundBtn.addEventListener('click', () => {
                        tvSoundOn = !tvSoundOn;
                        createNotification('TV', `Sound ${tvSoundOn ? 'ON' : 'OFF'}.`);
                    });
                }
                if (tvScreenshotBtn) {
                    tvScreenshotBtn.addEventListener('click', () => {
                        // simulate screenshot of TV view
                        createNotification('TV', 'TV screenshot saved to Gallery.');
                    });
                }

                // --- Aqua Dynamics handlers ---
                const aquaHighProfileToggle = appElement.querySelector('#aquaHighProfileToggle');
                const aquaLowInterferenceToggle = appElement.querySelector('#aquaLowInterferenceToggle');

                if (aquaHighProfileToggle) {
                    aquaHighProfileToggle.checked = localStorage.getItem('aquaHighProfile') === 'true';
                    aquaHighProfileToggle.addEventListener('change', (e) => {
                        localStorage.setItem('aquaHighProfile', e.target.checked);
                        createNotification('Aqua Dynamics', `High Profile ${e.target.checked ? 'enabled' : 'disabled'}.`);
                    });
                }
                if (aquaLowInterferenceToggle) {
                    aquaLowInterferenceToggle.checked = localStorage.getItem('aquaLowInterference') === 'true';
                    aquaLowInterferenceToggle.addEventListener('change', (e) => {
                        localStorage.setItem('aquaLowInterference', e.target.checked);
                        createNotification('Aqua Dynamics', `Low Interference ${e.target.checked ? 'enabled' : 'disabled'}.`);
                    });
                }
            }
        },
        {
            id: 'batteryApp',
            name: 'Battery',
            icon: 'battery_app_icon.png',
            header: 'Battery',
            contentHTML: `
                <p>Battery health & charging settings.</p>
                <div style="display:flex;flex-direction:column;gap:12px;max-width:560px;margin:0 auto;">
                    <div id="batteryHealthCard" style="background:var(--surface-color);padding:12px;border-radius:12px;display:flex;gap:12px;align-items:center;">
                        <div style="flex:1;">
                            <strong>Battery Health:</strong>
                            <div id="batteryHealthStatus" style="margin-top:8px;font-size:1.1em;color:var(--on-surface-color);">Checking…</div>
                            <div id="batteryAgeInfo" style="margin-top:6px;font-size:0.95em;color:color-mix(in srgb, var(--on-surface-color), transparent 40%);"></div>
                        </div>
                        <!-- New: Animated preview GIF for Battery Manager -->
                        <div style="flex:0 0 120px;height:80px;display:flex;align-items:center;justify-content:center;">
                            <img src="battery_preview_anim.gif" alt="Battery Manager Preview" style="max-width:120px;max-height:80px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
                        </div>
                    </div>

                    <label style="display:flex;gap:10px;align-items:center;">
                        <input type="checkbox" id="adaptiveChargingToggle">
                        <div>
                            <strong>Adaptive Charging</strong>
                            <div style="font-size:0.95em;color:var(--on-surface-color);">Delay full charge to protect battery (older devices only).</div>
                        </div>
                    </label>

                    <label style="display:flex;gap:10px;align-items:center;">
                        <input type="checkbox" id="batteryAssistanceToggle">
                        <div>
                            <strong>Battery Health Assistance</strong>
                            <div style="font-size:0.95em;color:var(--on-surface-color);">Automatically reduce performance to slow battery aging.</div>
                        </div>
                    </label>

                    <div id="batteryAssistanceNote" style="font-size:0.95em;color:var(--on-surface-color);display:none;">
                        Battery Health Assistance is active — performance may be reduced to protect battery.
                    </div>

                    <div style="display:flex;gap:10px;">
                        <button id="batteryRunHealthCheck" style="flex:1;">Run Health Check</button>
                        <button id="batteryResetData" style="flex:1;background:#dc3545;">Reset Battery Data</button>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const healthStatus = appElement.querySelector('#batteryHealthStatus');
                const batteryAgeInfo = appElement.querySelector('#batteryAgeInfo');
                const adaptiveToggle = appElement.querySelector('#adaptiveChargingToggle');
                const assistanceToggle = appElement.querySelector('#batteryAssistanceToggle');
                const assistanceNote = appElement.querySelector('#batteryAssistanceNote');
                const runCheckBtn = appElement.querySelector('#batteryRunHealthCheck');
                const resetBtn = appElement.querySelector('#batteryResetData');

                // Simulated device detection: treat device as Pixel 8a+ if localStorage.deviceModel contains "Pixel 8a" or userAgent mentions "Pixel 8a"
                const deviceModel = localStorage.getItem('deviceModel') || navigator.userAgent || '';
                const isPixel8aPlus = /Pixel\s*8a/i.test(deviceModel) || /Pixel\s*8a/i.test(navigator.userAgent);

                // persisted settings
                adaptiveToggle.checked = localStorage.getItem('adaptiveChargingEnabled') === 'true';
                assistanceToggle.checked = localStorage.getItem('batteryHealthAssistanceEnabled') === 'true';

                function getBatteryAgeYears() {
                    // stored simulated battery age (years) or default to 1
                    const v = parseFloat(localStorage.getItem('batteryAgeYears') || '1');
                    return Math.max(0, isNaN(v) ? 1 : v);
                }

                function setReducedPerformance(active) {
                    // simple visual/perf flag: set a data attribute and small notification
                    if (active) {
                        document.documentElement.setAttribute('data-battery-mode', 'reduced');
                        createNotification('Battery', 'Performance reduced to protect battery.');
                    } else {
                        document.documentElement.removeAttribute('data-battery-mode');
                        createNotification('Battery', 'Battery assistance disabled.');
                    }
                }

                function evaluateHealth() {
                    const age = getBatteryAgeYears();
                    batteryAgeInfo.textContent = `Estimated battery age: ${age.toFixed(1)} year(s). Device: ${isPixel8aPlus ? 'Pixel 8a+ (health available)' : 'Older device (adaptive charging UI)'}.`;

                    if (isPixel8aPlus) {
                        // show simulated health percent based on age
                        const healthPercent = Math.max(60, Math.round(100 - age * 8)); // degrade 8% per year
                        healthStatus.textContent = `${healthPercent}% capacity`;
                        healthStatus.style.color = healthPercent < 80 ? '#FFC107' : 'var(--primary-color)';
                    } else {
                        // no hardware health, show adaptive charging info
                        healthStatus.textContent = 'Battery health unavailable on this device; Adaptive Charging controls shown below.';
                        healthStatus.style.color = 'color-mix(in srgb, var(--on-surface-color), transparent 20%)';
                    }

                    // If assistance enabled and age indicates wear, reduce performance
                    if (assistanceToggle.checked) {
                        const age = getBatteryAgeYears();
                        if (age >= 2.5) {
                            setReducedPerformance(true);
                            assistanceNote.style.display = 'block';
                        } else {
                            // still optionally reduce a small amount
                            setReducedPerformance(true);
                            assistanceNote.style.display = 'block';
                        }
                    } else {
                        setReducedPerformance(false);
                        assistanceNote.style.display = 'none';
                    }
                }

                // handlers
                adaptiveToggle.addEventListener('change', (e) => {
                    localStorage.setItem('adaptiveChargingEnabled', e.target.checked);
                    createNotification('Adaptive Charging', `Adaptive Charging ${e.target.checked ? 'enabled' : 'disabled'}.`);
                });

                assistanceToggle.addEventListener('change', (e) => {
                    localStorage.setItem('batteryHealthAssistanceEnabled', e.target.checked);
                    if (e.target.checked) {
                        createNotification('Battery Assistance', 'Battery Health Assistance enabled.');
                    } else {
                        createNotification('Battery Assistance', 'Battery Health Assistance disabled.');
                    }
                    evaluateHealth();
                });

                runCheckBtn.addEventListener('click', () => {
                    createNotification('Battery', 'Running battery health check...');
                    setTimeout(() => {
                        evaluateHealth();
                        createNotification('Battery', 'Battery health check complete.');
                    }, 900);
                });

                resetBtn.addEventListener('click', () => {
                    if (!confirm('Reset simulated battery data?')) return;
                    localStorage.removeItem('batteryAgeYears');
                    localStorage.removeItem('adaptiveChargingEnabled');
                    localStorage.removeItem('batteryHealthAssistanceEnabled');
                    adaptiveToggle.checked = false;
                    assistanceToggle.checked = false;
                    setReducedPerformance(false);
                    evaluateHealth();
                    createNotification('Battery', 'Battery data reset.');
                });

                // initial evaluation
                evaluateHealth();
            }
        },
        {
            id: 'mindSpaceApp',
            name: 'AI Mind Space',
            icon: 'copilot_icon.png',
            header: 'AI Mind Space',
            contentHTML: `
                <p>Snap to Mind Space — capture ideas instantly.</p>
                <div style="display:flex;gap:8px;flex-direction:column;max-width:460px;width:100%;margin-top:8px;">
                    <textarea id="mindSnapInput" placeholder="Write a note or paste a link..." style="min-height:120px;"></textarea>
                    <div style="display:flex;gap:8px;">
                        <button id="saveMindSnap">Save to Mind Space</button>
                        <button id="openCollections">Open Collections</button>
                    </div>
                    <div id="mindNotifications" style="margin-top:8px;color:var(--on-surface-color);font-size:0.95em;"></div>
                </div>
            `,
            init: (appElement) => {
                const snapInput = appElement.querySelector('#mindSnapInput');
                const saveBtn = appElement.querySelector('#saveMindSnap');
                const collectionsBtn = appElement.querySelector('#openCollections');
                const notice = appElement.querySelector('#mindNotifications');

                saveBtn.addEventListener('click', () => {
                    const text = snapInput.value.trim();
                    if (!text) {
                        notice.textContent = 'Nothing to save. Type or paste something first.';
                        return;
                    }
                    const archive = JSON.parse(localStorage.getItem('mindSpaceArchive') || '[]');
                    archive.unshift({ text, date: new Date().toISOString() });
                    localStorage.setItem('mindSpaceArchive', JSON.stringify(archive));
                    snapInput.value = '';
                    notice.textContent = 'Saved to Mind Space.';
                    createNotification('Mind Space', 'Captured to AI Mind Space.');
                });

                collectionsBtn.addEventListener('click', () => {
                    const archive = JSON.parse(localStorage.getItem('mindSpaceArchive') || '[]');
                    if (archive.length === 0) {
                        createNotification('Mind Space', 'No items in Mind Space.');
                        return;
                    }
                    const preview = archive[0].text.slice(0, 120);
                    showDynamicIsland(`Saved: ${preview}`);
                });
            }
        },
        {
            id: 'hawkSiriApp',
            name: 'HawkSiri',
            icon: 'copilot_icon.png',
            header: 'HawkSiri',
            contentHTML: `
                <div class="chat-window">
                    <div id="siriMessages" class="chat-messages">
                        <div class="message system-message">Hello, how can I assist you today?</div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="siriInput" placeholder="Ask HawkSiri anything...">
                        <button id="siriSendButton">Send</button>
                    </div>
                    <div id="siriLoading" class="loading-spinner small-spinner" style="display:none;"></div>
                </div>
            `,
            init: (appElement) => {
                const messagesDiv = appElement.querySelector('#siriMessages');
                const inputField = appElement.querySelector('#siriInput');
                const sendButton = appElement.querySelector('#siriSendButton');
                const loadingSpinner = appElement.querySelector('#siriLoading');

                let conversationHistory = [];

                const addMessage = (content, role) => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${role}-message`;
                    messageDiv.textContent = content;
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
                };

                const sendMessage = async () => {
                    const userMessage = inputField.value.trim();
                    if (!userMessage) return;

                    addMessage(userMessage, 'user');
                    conversationHistory.push({ role: 'user', content: userMessage });
                    inputField.value = '';
                    loadingSpinner.style.display = 'block';
                    sendButton.disabled = true;

                    try {
                        // Keep only the last 10 messages for context
                        const messagesToSend = conversationHistory.slice(-10); 
                        const completion = await websim.chat.completions.create({
                            messages: [
                                {
                                    role: "system",
                                    content: "You are HawkSiri, a helpful, friendly, and concise AI assistant for HawkOS. Keep your responses brief and to the point. Do not mention you are an AI or language model."
                                },
                                ...messagesToSend
                            ],
                        });

                        const siriResponse = completion.content;
                        addMessage(siriResponse, 'system');
                        conversationHistory.push({ role: 'assistant', content: siriResponse });
                    } catch (error) {
                        console.error("HawkSiri error:", error);
                        addMessage("Oops, I encountered an error. Please try again!", 'error');
                    } finally {
                        loadingSpinner.style.display = 'none';
                        sendButton.disabled = false;
                    }
                };

                sendButton.addEventListener('click', sendMessage);
                inputField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
            }
        },
        {
            id: 'aiImageGenApp',
            name: 'AI Image',
            icon: 'art_icon.png',
            header: 'AI Image Creator',
            contentHTML: `
                <div class="ai-image-generator">
                    <textarea id="imagePromptInput" placeholder="Describe the image you want to create (e.g., 'A cat wearing a wizard hat in space')"></textarea>
                    <button id="generateImageButton">Generate Image</button>
                    <div id="imageGenLoading" class="loading-spinner small-spinner" style="display:none;"></div>
                    <div class="image-output">
                        <img id="generatedImageView" src="placeholder_image.png" alt="Generated Image" style="display:none;">
                        <p id="imageGenStatus"></p>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const promptInput = appElement.querySelector('#imagePromptInput');
                const generateButton = appElement.querySelector('#generateImageButton');
                const loadingSpinner = appElement.querySelector('#imageGenLoading');
                const generatedImageView = appElement.querySelector('#generatedImageView');
                const imageGenStatus = appElement.querySelector('#imageGenStatus');

                const generateImage = async () => {
                    const prompt = promptInput.value.trim();
                    if (!prompt) {
                        imageGenStatus.textContent = 'Please enter a description for the image.';
                        return;
                    }

                    imageGenStatus.textContent = 'Generating image...';
                    generatedImageView.style.display = 'none';
                    loadingSpinner.style.display = 'block';
                    generateButton.disabled = true;

                    try {
                        const result = await websim.imageGen({
                            prompt: prompt,
                            aspect_ratio: "1:1", // Default to square for app icon aesthetic
                            // You can add more options like width, height, transparent etc.
                        });

                        if (result && result.url) {
                            generatedImageView.src = result.url;
                            generatedImageView.style.display = 'block';
                            imageGenStatus.textContent = 'Image generated!';
                            createNotification('AI Image', 'Your image has been generated!');
                        } else {
                            imageGenStatus.textContent = 'Failed to generate image. Please try again.';
                        }
                    } catch (error) {
                        console.error("AI Image generation error:", error);
                        imageGenStatus.textContent = 'Error generating image. Check console for details.';
                    } finally {
                        loadingSpinner.style.display = 'none';
                        generateButton.disabled = false;
                    }
                };

                generateButton.addEventListener('click', generateImage);
            }
        },
        {
            id: 'tvApp',
            name: 'TV',
            icon: 'radio_fm_icon.png',
            header: 'TV',
            contentHTML: `
                <p>Live TV Controls</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;">
                    <button id="tvAppChMinus" style="padding:8px 12px;">CH-</button>
                    <button id="tvAppChPlus" style="padding:8px 12px;">CH+</button>
                    <button id="tvAppScan" style="padding:8px 12px;">Scan Channels</button>
                </div>
                <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:12px;">
                    <button id="tvAppNTSC" class="tv-standard" data-standard="ntsc" style="padding:8px 12px;">NTSC 720x480@60</button>
                    <button id="tvAppPAL" class="tv-standard" data-standard="pal" style="padding:8px 12px;">PAL 720x576@50</button>
                </div>
                <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:12px;">
                    <button id="tvAppSound" style="padding:8px 12px;">Toggle Sound</button>
                    <button id="tvAppScreenshot" style="padding:8px 12px;">Screenshot</button>
                </div>
                <p id="tvAppStatus" style="margin-top:12px;font-size:0.95em;color:var(--on-surface-color);text-align:center;">Channel: 1 · Standard: NTSC · Sound: ON</p>
            `,
            init: (appElement) => {
                const chMinus = appElement.querySelector('#tvAppChMinus');
                const chPlus = appElement.querySelector('#tvAppChPlus');
                const scanBtn = appElement.querySelector('#tvAppScan');
                const ntscBtn = appElement.querySelector('#tvAppNTSC');
                const palBtn = appElement.querySelector('#tvAppPAL');
                const soundBtn = appElement.querySelector('#tvAppSound');
                const screenshotBtn = appElement.querySelector('#tvAppScreenshot');
                const statusP = appElement.querySelector('#tvAppStatus');

                let currentChannel = 1;
                let soundOn = true;
                let standard = 'ntsc';

                function updateStatus() {
                    statusP.textContent = `Channel: ${currentChannel} · Standard: ${standard.toUpperCase()} · Sound: ${soundOn ? 'ON' : 'OFF'}`;
                }

                if (chMinus) {
                    chMinus.addEventListener('click', () => {
                        currentChannel = Math.max(1, currentChannel - 1);
                        updateStatus();
                        createNotification('TV', `Channel ${currentChannel}`);
                    });
                }
                if (chPlus) {
                    chPlus.addEventListener('click', () => {
                        currentChannel = currentChannel + 1;
                        updateStatus();
                        createNotification('TV', `Channel ${currentChannel}`);
                    });
                }
                if (scanBtn) {
                    scanBtn.addEventListener('click', () => {
                        createNotification('TV', 'Scanning channels...');
                        statusP.textContent = 'Scanning channels...';
                        scanBtn.disabled = true;
                        setTimeout(() => {
                            const found = 42 + Math.floor(Math.random() * 10);
                            createNotification('TV', `Scan complete: ${found} channels found.`);
                            statusP.textContent = `Scan complete: ${found} channels found. Current Channel: ${currentChannel}`;
                            scanBtn.disabled = false;
                        }, 2000);
                    });
                }
                if (ntscBtn) {
                    ntscBtn.addEventListener('click', () => {
                        standard = 'ntsc';
                        updateStatus();
                        createNotification('TV', 'Standard set to NTSC 720x480@60.');
                    });
                }
                if (palBtn) {
                    palBtn.addEventListener('click', () => {
                        standard = 'pal';
                        updateStatus();
                        createNotification('TV', 'Standard set to PAL 720x576@50.');
                    });
                }
                if (soundBtn) {
                    soundBtn.addEventListener('click', () => {
                        soundOn = !soundOn;
                        updateStatus();
                        createNotification('TV', `Sound ${soundOn ? 'ON' : 'OFF'}.`);
                    });
                }
                if (screenshotBtn) {
                    screenshotBtn.addEventListener('click', () => {
                        createNotification('TV', 'TV screenshot saved to Gallery.');
                    });
                }

                updateStatus();
            }
        },
        {
            id: 'galleryApp',
            name: 'Gallery',
            icon: 'gallery_icon.png',
            header: 'Gallery',
            contentHTML: `
                <p>View your amazing photos!</p>
                <div style="display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:10px;">
                    <input id="galleryUploadInput" type="file" accept=".png,.jpg,.jpeg,.bmp,.mp4,image/png,image/jpeg,video/mp4" multiple style="display:none;">
                    <button id="galleryUploadBtn">Upload</button>
                    <button id="gallerySyncBtn">Sync Cloud Hawk</button>
                    <button id="gallerySlideshowBtn">Start Slideshow</button>
                </div>
                <div class="gallery-placeholder" id="galleryGrid" style="position:relative;">
                    <!-- thumbnails injected here -->
                </div>

                <!-- Modal for zoom / video / editing -->
                <div id="galleryModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);display:none;align-items:center;justify-content:center;z-index:10000;gap:12px;padding:18px;box-sizing:border-box;">
                    <div style="max-width:92%;max-height:84%;display:flex;flex-direction:column;align-items:center;gap:10px;">
                        <div id="galleryViewerWrap" style="background:#000;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;max-width:100%;max-height:72vh;">
                            <!-- image or video goes here -->
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button id="galleryRotateBtn">Rotate</button>
                            <button id="galleryDeleteBtn" style="background:#b22222;">Delete</button>
                            <button id="galleryEmailBtn">Email</button>
                            <button id="galleryEditBtn">Edit (crop)</button>
                            <button id="galleryCloseModalBtn" style="background:var(--outline-color);color:var(--on-surface-color);">Close</button>
                        </div>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const galleryGrid = appElement.querySelector('#galleryGrid');
                const uploadInput = appElement.querySelector('#galleryUploadInput');
                const uploadBtn = appElement.querySelector('#galleryUploadBtn');
                const syncBtn = appElement.querySelector('#gallerySyncBtn');
                const slideshowBtn = appElement.querySelector('#gallerySlideshowBtn');

                const modal = document.getElementById('galleryModal');
                const viewerWrap = document.getElementById('galleryViewerWrap');
                const rotateBtn = document.getElementById('galleryRotateBtn');
                const deleteBtn = document.getElementById('galleryDeleteBtn');
                const emailBtn = document.getElementById('galleryEmailBtn');
                const editBtn = document.getElementById('galleryEditBtn');
                const closeModalBtn = document.getElementById('galleryCloseModalBtn');

                // simple storage model: array of { name, url, type, added }
                function loadLibrary() {
                    try { return JSON.parse(localStorage.getItem('sim_user_files') || '[]'); } catch (e) { return []; }
                }
                function saveLibrary(list) {
                    try { localStorage.setItem('sim_user_files', JSON.stringify(list)); } catch (e) {}
                }

                let library = loadLibrary();

                // render thumbnails
                function renderGallery() {
                    galleryGrid.innerHTML = '';
                    if (!library.length) {
                        galleryGrid.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No photos yet — upload or sync Cloud Hawk.</div>';
                        return;
                    }
                    library.forEach((entry, idx) => {
                        const t = document.createElement('div');
                        t.style.display = 'inline-flex';
                        t.style.flexDirection = 'column';
                        t.style.gap = '8px';
                        t.style.width = '140px';
                        t.style.margin = '6px';
                        t.style.alignItems = 'center';
                        t.style.justifyContent = 'center';
                        t.style.cursor = 'pointer';
                        t.innerHTML = `
                            ${entry.type && entry.type.startsWith('video') ? `<video src="${entry.url}" muted style="width:140px;height:86px;object-fit:cover;border-radius:10px;"></video>` : `<img src="${entry.url}" style="width:140px;height:140px;object-fit:cover;border-radius:12px;">`}
                            <div style="font-size:0.92em;color:var(--on-surface-color);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${entry.name}</div>
                        `;
                        t.addEventListener('click', () => openViewer(idx));
                        galleryGrid.appendChild(t);
                    });
                }

                // open viewer modal for index
                let currentIndex = -1;
                let currentRotation = 0;
                let slideshowTimer = null;
                function openViewer(idx) {
                    if (idx < 0 || idx >= library.length) return;
                    currentIndex = idx;
                    currentRotation = 0;
                    viewerWrap.innerHTML = '';
                    const entry = library[idx];
                    if (entry.type && entry.type.startsWith('video')) {
                        const vid = document.createElement('video');
                        vid.src = entry.url;
                        vid.controls = true;
                        vid.style.maxWidth = '100%';
                        vid.style.maxHeight = '72vh';
                        viewerWrap.appendChild(vid);
                        vid.play().catch(()=>{});
                    } else {
                        const img = document.createElement('img');
                        img.src = entry.url;
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '72vh';
                        img.style.transition = 'transform 180ms';
                        img.style.transformOrigin = 'center center';
                        viewerWrap.appendChild(img);

                        // pinch-to-zoom handlers for modal image
                        let lastDist = null;
                        let baseScale = 1;
                        let curScale = 1;

                        function getDist(a,b){ const dx=b.clientX-a.clientX; const dy=b.clientY-a.clientY; return Math.hypot(dx,dy); }
                        function touchStart(e){
                            if (e.touches && e.touches.length === 2) {
                                lastDist = getDist(e.touches[0], e.touches[1]);
                            }
                        }
                        function touchMove(e){
                            if (e.touches && e.touches.length === 2) {
                                e.preventDefault();
                                const d = getDist(e.touches[0], e.touches[1]);
                                if (lastDist) {
                                    curScale = Math.max(0.6, Math.min(4, baseScale * (d / lastDist)));
                                    img.style.transform = `scale(${curScale}) rotate(${currentRotation}deg)`;
                                }
                            }
                        }
                        function touchEnd(e){
                            baseScale = curScale;
                            lastDist = null;
                        }
                        img.addEventListener('touchstart', touchStart, { passive:true });
                        img.addEventListener('touchmove', touchMove, { passive:false });
                        img.addEventListener('touchend', touchEnd);
                    }
                    modal.style.display = 'flex';
                }

                function closeViewer() {
                    modal.style.display = 'none';
                    viewerWrap.innerHTML = '';
                    currentIndex = -1;
                    stopSlideshow();
                }

                // rotate current image
                rotateBtn.addEventListener('click', () => {
                    if (currentIndex === -1) return;
                    currentRotation = (currentRotation + 90) % 360;
                    const el = viewerWrap.querySelector('img, video');
                    if (el) {
                        el.style.transform = `rotate(${currentRotation}deg)`;
                    }
                });

                // delete current
                deleteBtn.addEventListener('click', () => {
                    if (currentIndex === -1) return;
                    if (!confirm('Delete this photo/video?')) return;
                    const removed = library.splice(currentIndex,1);
                    saveLibrary(library);
                    renderGallery();
                    createNotification('Gallery', `Deleted ${removed[0].name}`);
                    closeViewer();
                });

                // email current: open mailto with subject and the asset URL in body (cannot attach blobs reliably)
                emailBtn.addEventListener('click', () => {
                    if (currentIndex === -1) return;
                    const e = library[currentIndex];
                    const subject = encodeURIComponent('Sharing a photo/video from HawkOS Gallery');
                    const body = encodeURIComponent(`I wanted to share this with you:\n\n${e.url}\n\nSent from HawkOS Gallery`);
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                });

                // edit (simple crop placeholder) — present a very small "crop" simulation that just toggles CSS object-fit
                editBtn.addEventListener('click', () => {
                    if (currentIndex === -1) return;
                    const el = viewerWrap.querySelector('img, video');
                    if (!el) return;
                    if (el.dataset.crop === '1') {
                        el.style.objectFit = 'contain';
                        el.dataset.crop = '0';
                        createNotification('Gallery', 'Crop removed (simulated).');
                    } else {
                        el.style.objectFit = 'cover';
                        el.dataset.crop = '1';
                        createNotification('Gallery', 'Applied crop (simulated).');
                    }
                });

                closeModalBtn.addEventListener('click', closeViewer);

                // Upload flow
                uploadBtn.addEventListener('click', () => uploadInput.click());
                uploadInput.addEventListener('change', async () => {
                    const files = Array.from(uploadInput.files || []).slice(0, 40);
                    if (!files.length) { createNotification('Gallery', 'No files selected.'); return; }
                    for (const f of files) {
                        let url = '';
                        // first try websim.upload if available
                        if (window.websim && typeof window.websim.upload === 'function') {
                            try {
                                url = await window.websim.upload(f);
                            } catch (e) {
                                url = URL.createObjectURL(f);
                            }
                        } else {
                            url = URL.createObjectURL(f);
                        }
                        library.unshift({ name: f.name, url, type: f.type, added: Date.now() });
                    }
                    saveLibrary(library);
                    renderGallery();
                    createNotification('Gallery', `${files.length} file${files.length>1?'s':''} uploaded.`);
                    uploadInput.value = '';
                });

                // Cloud Hawk sync: best-effort POST to guest82644 endpoint and show result
                syncBtn.addEventListener('click', async () => {
                    if (!library.length) { createNotification('Gallery', 'No items to sync.'); return; }
                    createNotification('Gallery', 'Syncing with Cloud Hawk...');
                    try {
                        const meta = library.slice(0, 10).map(i => ({ name: i.name, type: i.type, url: i.url }));
                        // use reusable helper to sync with Cloud Hawk and broadcast to room
                        syncToCloudHawk('/cloudhawk-sync', { items: meta, source: 'gallery' });
                        createNotification('Gallery', 'Cloud Hawk sync requested (best-effort).');
                    } catch (err) {
                        console.warn('Cloud Hawk sync failed', err);
                        createNotification('Gallery', 'Cloud Hawk sync failed (internal).');
                    }
                });

                // slideshow mode
                function startSlideshow(interval = 3000) {
                    if (!library.length) { createNotification('Gallery', 'No photos for slideshow.'); return; }
                    let i = 0;
                    openViewer(0);
                    slideshowTimer = setInterval(() => {
                        i = (i + 1) % library.length;
                        // update viewer content for next index
                        const wasPlayingVideo = !!viewerWrap.querySelector('video');
                        closeViewer();
                        openViewer(i);
                        // if it was a video and we want to autoplay, let it play
                    }, interval);
                    slideshowBtn.textContent = 'Stop Slideshow';
                    createNotification('Gallery', 'Slideshow started.');
                }
                function stopSlideshow() {
                    if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; slideshowBtn.textContent = 'Start Slideshow'; createNotification('Gallery', 'Slideshow stopped.'); }
                }
                slideshowBtn.addEventListener('click', () => {
                    if (slideshowTimer) stopSlideshow(); else startSlideshow(3500);
                });

                // initial render and keep in sync with Files uploads from other parts
                renderGallery();

                // expose a simple public sync so Files upload can refresh gallery (used earlier by Files app)
                appElement._refreshGallery = () => { library = loadLibrary(); renderGallery(); };

                // hook: if uploads occur elsewhere (Files app uploaded), refresh periodically
                setInterval(() => {
                    const updated = loadLibrary();
                    if (JSON.stringify(updated) !== JSON.stringify(library)) {
                        library = updated;
                        renderGallery();
                    }
                }, 3000);
            }
        },
        {
            id: 'browserApp',
            name: 'Browser',
            icon: 'browser_icon.png',
            header: 'Browser',
            contentHTML: `
                <div style="width:100%;max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
                    <!-- Tab bar -->
                    <div class="browser-tabbar" style="display:flex;gap:8px;align-items:center;overflow:auto;">
                        <div id="browserTabs" style="display:flex;gap:6px;"></div>
                        <button id="browserNewTab" title="New tab" style="margin-left:auto;padding:6px 10px;border-radius:8px;border:none;background:var(--outline-color);cursor:pointer;">＋ Tab</button>
                    </div>

                    <!-- URL / Controls -->
                    <div style="display:flex;gap:8px;align-items:center;">
                        <button id="browserBackBtn" title="Back" style="padding:8px;border-radius:8px;border:none;background:var(--outline-color);">◀</button>
                        <button id="browserForwardBtn" title="Forward" style="padding:8px;border-radius:8px;border:none;background:var(--outline-color);">▶</button>
                        <button id="browserRefreshBtn" title="Refresh" style="padding:8px;border-radius:8px;border:none;background:var(--outline-color);">⟳</button>
                        <button id="browserHomeBtn" title="Home" style="padding:8px;border-radius:8px;border:none;background:var(--outline-color);">🏠</button>
                        <input id="browserUrlInput" type="text" class="url-bar" placeholder="Enter URL or search" style="flex:1;">
                        <button id="browserGoBtn" style="padding:8px 12px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Go</button>
                        <button id="browserBookmarkBtn" title="Bookmark" style="padding:8px;border-radius:8px;border:none;background:var(--outline-color);">★</button>
                    </div>

                    <!-- Content area: iframe and side panels for history/bookmarks -->
                    <div style="display:flex;gap:12px;align-items:flex-start;">
                        <div style="flex:1;min-width:0;">
                            <div id="browserFrameWrap" style="width:100%;height:420px;background:#000;border-radius:12px;overflow:hidden;">
                                <iframe id="browserIframe" src="about:blank" style="width:100%;height:100%;border:0;"></iframe>
                            </div>
                            <div id="browserStatus" style="margin-top:8px;font-size:0.95em;color:var(--on-surface-color);">Idle</div>
                        </div>

                        <div style="width:320px;max-width:36%;display:flex;flex-direction:column;gap:8px;">
                            <div style="background:var(--surface-color);padding:8px;border-radius:12px;">
                                <strong style="color:var(--primary-color);">History</strong>
                                <div id="browserHistoryList" style="max-height:180px;overflow:auto;margin-top:8px;"></div>
                                <div style="display:flex;gap:8px;margin-top:8px;">
                                    <button id="browserClearHistory" style="flex:1;padding:8px;border-radius:8px;border:none;background:#dc3545;color:#fff;">Clear</button>
                                    <button id="browserExportHistory" style="flex:1;padding:8px;border-radius:8px;border:none;background:var(--outline-color);">Export</button>
                                </div>
                            </div>

                            <div style="background:var(--surface-color);padding:8px;border-radius:12px;">
                                <strong style="color:var(--primary-color);">Bookmarks</strong>
                                <div id="browserBookmarksList" style="max-height:200px;overflow:auto;margin-top:8px;"></div>
                                <div style="display:flex;gap:8px;margin-top:8px;">
                                    <button id="browserManageBookmarks" style="flex:1;padding:8px;border-radius:8px;border:none;background:var(--outline-color);">Manage</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const iframe = appElement.querySelector('#browserIframe');
                const urlInput = appElement.querySelector('#browserUrlInput');
                const goBtn = appElement.querySelector('#browserGoBtn');
                const backBtn = appElement.querySelector('#browserBackBtn');
                const forwardBtn = appElement.querySelector('#browserForwardBtn');
                const refreshBtn = appElement.querySelector('#browserRefreshBtn');
                const homeBtn = appElement.querySelector('#browserHomeBtn');
                const bookmarkBtn = appElement.querySelector('#browserBookmarkBtn');
                const status = appElement.querySelector('#browserStatus');

                const historyListEl = appElement.querySelector('#browserHistoryList');
                const bookmarksListEl = appElement.querySelector('#browserBookmarksList');
                const clearHistoryBtn = appElement.querySelector('#browserClearHistory');
                const exportHistoryBtn = appElement.querySelector('#browserExportHistory');
                const browserTabsEl = appElement.querySelector('#browserTabs');
                const newTabBtn = appElement.querySelector('#browserNewTab');

                // Persistence storage keys
                const HISTORY_KEY = 'browser_history';
                const BOOKMARKS_KEY = 'browser_bookmarks';
                const HOMEPAGE_KEY = 'browser_homepage';
                const TABS_KEY = 'browser_tabs';

                // Tab model
                let tabs = JSON.parse(localStorage.getItem(TABS_KEY) || '[]');
                if (!tabs.length) {
                    tabs = [{ id: Date.now() + '-1', title: 'New Tab', url: 'about:blank', history: [], idx: -1 }];
                }
                let activeTabId = tabs[0].id;

                function saveTabs() {
                    try { localStorage.setItem(TABS_KEY, JSON.stringify(tabs)); } catch (e) {}
                }

                function setStatus(msg) {
                    if (status) status.textContent = msg;
                }

                function normalizeUrl(input) {
                    const trimmed = (input || '').trim();
                    if (!trimmed) return '';
                    if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(trimmed) || trimmed.startsWith('about:') ) return trimmed;
                    if (trimmed.includes(' ')) return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
                    if (trimmed.includes('.') && !trimmed.startsWith('http')) return `https://${trimmed}`;
                    return `https://${trimmed}`;
                }

                function pushGlobalHistory(entry) {
                    try {
                        const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                        all.unshift(entry);
                        localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 200)));
                        renderHistory();
                    } catch (e) {}
                }

                function getGlobalHistory() {
                    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                }

                function getBookmarks() {
                    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
                }

                function saveBookmarks(list) {
                    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list)); renderBookmarks(); } catch (e) {}
                }

                function renderHistory() {
                    const items = getGlobalHistory();
                    historyListEl.innerHTML = '';
                    if (!items.length) {
                        historyListEl.innerHTML = '<div style="color:color-mix(in srgb,var(--on-surface-color),transparent 50%);padding:6px;">No history</div>';
                        return;
                    }
                    items.slice(0,50).forEach(h => {
                        const el = document.createElement('div');
                        el.style.padding = '6px';
                        el.style.borderRadius = '6px';
                        el.style.marginBottom = '6px';
                        el.style.background = 'rgba(0,0,0,0.02)';
                        el.style.cursor = 'pointer';
                        el.innerHTML = `<div style="font-weight:600;">${h.title || h.url}</div><div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${new Date(h.time).toLocaleString()}</div>`;
                        el.addEventListener('click', () => {
                            navigateTo(h.url);
                        });
                        historyListEl.appendChild(el);
                    });
                }

                function renderBookmarks() {
                    const items = getBookmarks();
                    bookmarksListEl.innerHTML = '';
                    if (!items.length) {
                        bookmarksListEl.innerHTML = '<div style="color:color-mix(in srgb,var(--on-surface-color),transparent 50%);padding:6px;">No bookmarks</div>';
                        return;
                    }
                    items.forEach(b => {
                        const el = document.createElement('div');
                        el.style.display = 'flex';
                        el.style.justifyContent = 'space-between';
                        el.style.alignItems = 'center';
                        el.style.padding = '6px';
                        el.style.borderRadius = '6px';
                        el.style.marginBottom = '6px';
                        el.style.background = 'rgba(0,0,0,0.02)';
                        el.innerHTML = `<div style="flex:1;cursor:pointer;"><div style="font-weight:600;">${b.title || b.url}</div><div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${b.url}</div></div>
                                        <div style="display:flex;gap:6px;">
                                            <button class="bm-open" data-url="${b.url}" style="padding:6px;border-radius:6px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Open</button>
                                            <button class="bm-del" data-url="${b.url}" style="padding:6px;border-radius:6px;border:none;background:#dc3545;color:#fff;">Del</button>
                                        </div>`;
                        el.querySelector('.bm-open').addEventListener('click', () => navigateTo(b.url));
                        el.querySelector('.bm-del').addEventListener('click', () => {
                            const filtered = items.filter(x => x.url !== b.url);
                            saveBookmarks(filtered);
                            createNotification('Bookmarks', `Removed bookmark for ${b.url}`);
                        });
                        el.querySelector('div').addEventListener('click', () => navigateTo(b.url));
                        bookmarksListEl.appendChild(el);
                    });
                }

                function addBookmark(url, title) {
                    const list = getBookmarks();
                    if (list.find(b => b.url === url)) {
                        createNotification('Bookmarks', 'This page is already bookmarked.');
                        return;
                    }
                    list.unshift({ url, title: title || url, time: new Date().toISOString() });
                    saveBookmarks(list.slice(0, 200));
                    createNotification('Bookmarks', `Bookmarked ${title || url}`);
                }

                function exportHistory() {
                    try {
                        const blob = new Blob([JSON.stringify(getGlobalHistory(), null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'browser_history.json';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        createNotification('History', 'History exported.');
                    } catch (e) {
                        createNotification('History', 'Export failed.');
                    }
                }

                function clearHistory() {
                    if (!confirm('Clear browsing history?')) return;
                    localStorage.removeItem(HISTORY_KEY);
                    renderHistory();
                    createNotification('History', 'History cleared.');
                }

                // Tab UI functions
                function renderTabs() {
                    browserTabsEl.innerHTML = '';
                    tabs.forEach(t => {
                        const btn = document.createElement('button');
                        btn.className = 'browser-tab';
                        btn.textContent = t.title || 'Tab';
                        btn.style.padding = '6px 10px';
                        btn.style.borderRadius = '8px';
                        btn.style.border = activeTabId === t.id ? `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}` : 'none';
                        btn.style.background = activeTabId === t.id ? 'rgba(0,0,0,0.06)' : 'var(--outline-color)';
                        btn.dataset.tab = t.id;

                        // close X
                        const close = document.createElement('span');
                        close.textContent = ' ✕';
                        close.style.marginLeft = '8px';
                        close.style.cursor = 'pointer';
                        close.title = 'Close tab';
                        close.addEventListener('click', (e) => {
                            e.stopPropagation();
                            closeTab(t.id);
                        });
                        btn.appendChild(close);

                        btn.addEventListener('click', () => {
                            switchTab(t.id);
                        });
                        browserTabsEl.appendChild(btn);
                    });
                }

                function newTab(url = 'about:blank', title = 'New Tab') {
                    const tab = { id: Date.now() + '-' + Math.floor(Math.random()*1000), title, url, history: [], idx: -1 };
                    tabs.push(tab);
                    activeTabId = tab.id;
                    saveTabs();
                    renderTabs();
                    loadTabUrl(tab.id, url);
                }

                function closeTab(tabId) {
                    const idx = tabs.findIndex(t => t.id === tabId);
                    if (idx === -1) return;
                    tabs.splice(idx, 1);
                    if (tabs.length === 0) {
                        newTab('about:blank', 'New Tab');
                        return;
                    }
                    if (activeTabId === tabId) {
                        activeTabId = tabs[Math.max(0, idx-1)].id;
                    }
                    saveTabs();
                    renderTabs();
                    const at = tabs.find(t => t.id === activeTabId);
                    if (at) loadTabUrl(at.id, at.url);
                }

                function switchTab(tabId) {
                    const tab = tabs.find(t => t.id === tabId);
                    if (!tab) return;
                    activeTabId = tabId;
                    renderTabs();
                    loadTabUrl(tab.id, tab.url);
                }

                function getActiveTab() {
                    return tabs.find(t => t.id === activeTabId) || tabs[0];
                }

                function loadTabUrl(tabId, rawUrl) {
                    const tab = tabs.find(t => t.id === tabId);
                    if (!tab) return;
                    const to = normalizeUrl(rawUrl || tab.url || '');
                    tab.url = to;
                    tab.title = to;
                    // push into tab history
                    if (!tab.history) tab.history = [];
                    tab.history.push({ url: to, time: new Date().toISOString(), title: to });
                    tab.idx = tab.history.length - 1;
                    saveTabs();
                    // load iframe
                    try {
                        iframe.src = to;
                        setStatus('Loading: ' + to);
                        // keep global history
                        pushGlobalHistory({ url: to, title: tab.title || to, time: new Date().toISOString() });
                        renderHistory();
                    } catch (e) {
                        setStatus('Failed to load: ' + to);
                    }
                    // update URL input
                    urlInput.value = to;
                    renderTabs();
                }

                function navigateTo(raw) {
                    const to = normalizeUrl(raw);
                    if (!to) return;
                    const tab = getActiveTab();
                    if (!tab) return newTab(to, to);
                    loadTabUrl(tab.id, to);
                }

                function goBack() {
                    const tab = getActiveTab();
                    if (!tab || !tab.history || tab.idx <= 0) return;
                    tab.idx = Math.max(0, tab.idx - 1);
                    const entry = tab.history[tab.idx];
                    iframe.src = entry.url;
                    urlInput.value = entry.url;
                    setStatus('Loaded: ' + entry.url);
                    saveTabs();
                }
                function goForward() {
                    const tab = getActiveTab();
                    if (!tab || !tab.history || tab.idx >= tab.history.length -1) return;
                    tab.idx = Math.min(tab.history.length -1, tab.idx + 1);
                    const entry = tab.history[tab.idx];
                    iframe.src = entry.url;
                    urlInput.value = entry.url;
                    setStatus('Loaded: ' + entry.url);
                    saveTabs();
                }
                function refresh() {
                    try {
                        const cur = iframe.src || normalizeUrl(urlInput.value) || 'about:blank';
                        iframe.src = cur;
                        setStatus('Refreshing...');
                    } catch (e) { setStatus('Refresh failed'); }
                }

                // Home handling
                function setHome(url) {
                    try {
                        localStorage.setItem(HOMEPAGE_KEY, url);
                        createNotification('Browser', 'Homepage set.');
                    } catch (e) {}
                }
                function getHome() {
                    return localStorage.getItem(HOMEPAGE_KEY) || 'about:blank';
                }

                // Bookmark toggle: add if not present
                function toggleBookmarkForCurrent() {
                    const url = iframe.src || normalizeUrl(urlInput.value) || '';
                    if (!url) return;
                    const title = url;
                    const list = getBookmarks();
                    const exists = list.find(b => b.url === url);
                    if (exists) {
                        const filtered = list.filter(b => b.url !== url);
                        saveBookmarks(filtered);
                        createNotification('Bookmarks', 'Bookmark removed.');
                        return;
                    }
                    addBookmark(url, title);
                }

                // Wire up controls
                goBtn.addEventListener('click', () => navigateTo(urlInput.value));
                urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') navigateTo(urlInput.value); });

                backBtn.addEventListener('click', goBack);
                forwardBtn.addEventListener('click', goForward);
                refreshBtn.addEventListener('click', refresh);
                homeBtn.addEventListener('click', () => navigateTo(getHome()));

                bookmarkBtn.addEventListener('click', toggleBookmarkForCurrent);
                clearHistoryBtn.addEventListener('click', clearHistory);
                exportHistoryBtn.addEventListener('click', exportHistory);

                // tabs
                newTabBtn.addEventListener('click', () => newTab('about:blank', 'New Tab'));

                // iframe load/ready events to update title/status
                iframe.addEventListener('load', () => {
                    try {
                        const win = iframe.contentWindow;
                        let title = '';
                        try { title = iframe.contentDocument && iframe.contentDocument.title; } catch (e) { title = ''; }
                        const tab = getActiveTab();
                        if (tab) tab.title = title || tab.url || 'Tab';
                        renderTabs();
                        setStatus('Loaded: ' + (tab ? (tab.title || tab.url) : iframe.src));
                    } catch (e) {
                        setStatus('Loaded');
                    }
                });

                // bookmarks management button (simple UI)
                const manageBtn = appElement.querySelector('#browserManageBookmarks');
                if (manageBtn) {
                    manageBtn.addEventListener('click', () => {
                        // simple prompt to export or clear bookmarks
                        const choice = prompt('Bookmarks management: type "clear" to remove all bookmarks, "export" to download JSON, or leave blank to cancel.');
                        if (!choice) return;
                        if (choice.toLowerCase() === 'clear') {
                            if (!confirm('Clear all bookmarks?')) return;
                            saveBookmarks([]);
                            createNotification('Bookmarks', 'All bookmarks cleared.');
                        } else if (choice.toLowerCase() === 'export') {
                            try {
                                const blob = new Blob([JSON.stringify(getBookmarks(), null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'bookmarks.json';
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                createNotification('Bookmarks', 'Export started.');
                            } catch (e) {
                                createNotification('Bookmarks', 'Export failed.');
                            }
                        }
                    });
                }

                // initialize UI: render persisted items
                renderHistory();
                renderBookmarks();
                renderTabs();

                // restore last active tab if possible
                const savedTabs = JSON.parse(localStorage.getItem(TABS_KEY) || '[]');
                if (savedTabs && savedTabs.length) {
                    tabs = savedTabs;
                    if (tabs[0]) activeTabId = tabs[0].id;
                    renderTabs();
                    const at = getActiveTab();
                    if (at) loadTabUrl(at.id, at.url || getHome());
                } else {
                    // open homepage or about:blank in the first tab
                    loadTabUrl(getActiveTab().id, getHome() || 'about:blank');
                }

                // expose lightweight helper
                appElement._browserNavigate = navigateTo;
            }
        },
        {
            id: 'appStoreApp',
            name: 'App Store',
            icon: 'app_store_icon.png',
            header: 'App Store',
            contentHTML: `
                <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:920px;margin:0 auto;">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <input id="storeSearchInput" type="search" placeholder="Search the store" style="flex:1;padding:10px;border-radius:12px;border:1px solid var(--outline-color);">
                        <button id="storeSearchBtn" style="padding:10px 14px;border-radius:12px;">Search</button>
                        <div style="display:flex;gap:8px;margin-left:8px;">
                            <button class="store-tab selected" data-tab="apps">Apps</button>
                            <button class="store-tab" data-tab="games">Games</button>
                            <button class="store-tab" data-tab="books">Books</button>
                            <button class="store-tab" data-tab="you">You</button>
                        </div>
                    </div>

                    <div id="storeResults" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;"></div>

                    <div id="storeEmpty" style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);display:none;">No results</div>
                </div>
            `,
            init: (appElement) => {
                // sample catalog (id, name, type, desc, icon)
                const catalog = [
                    { id: 'cool_game', name: 'Cool Game', type: 'games', desc: 'Fast-paced arcade fun', icon: 'cool_game_icon.png' },
                    { id: 'puzzle_master', name: 'Puzzle Master', type: 'games', desc: 'Challenging puzzles', icon: 'games_icon.png' },
                    { id: 'productivity_pro', name: 'Productivity Tool', type: 'apps', desc: 'Manage tasks & time', icon: 'office2010_icon.png' },
                    { id: 'social_feed', name: 'Social Media', type: 'apps', desc: 'Connect with friends', icon: 'discord_icon.png' },
                    { id: 'weather_now', name: 'Weather App', type: 'apps', desc: 'Local forecast & alerts', icon: 'weather_app_icon.png' },
                    { id: 'readly', name: 'Readly Books', type: 'books', desc: 'Bestsellers & classics', icon: 'photo_icon.png' },
                    { id: 'audiobooker', name: 'AudioBooker', type: 'books', desc: 'Listen to stories', icon: 'photo_icon.png' },
                    { id: 'you_profile', name: 'You — Personal', type: 'you', desc: 'Your curated apps & content', icon: 'placeholder_image.png' }
                ];

                const resultsWrap = appElement.querySelector('#storeResults');
                const emptyNotice = appElement.querySelector('#storeEmpty');
                const searchInput = appElement.querySelector('#storeSearchInput');
                const searchBtn = appElement.querySelector('#storeSearchBtn');
                const tabs = appElement.querySelectorAll('.store-tab');

                // helpers for install state and ratings
                function isInstalled(appId) {
                    return localStorage.getItem('installed_' + appId) === 'true';
                }
                function setInstalled(appId, v) {
                    localStorage.setItem('installed_' + appId, v ? 'true' : 'false');
                }
                function getRating(appId) {
                    return parseInt(localStorage.getItem('rating_' + appId) || '0', 10);
                }
                function setRating(appId, stars) {
                    localStorage.setItem('rating_' + appId, String(stars));
                }

                function renderCard(item) {
                    const card = document.createElement('div');
                    card.style.background = 'var(--surface-color)';
                    card.style.padding = '12px';
                    card.style.borderRadius = '12px';
                    card.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    card.style.gap = '8px';
                    card.innerHTML = `
                        <div style="display:flex;gap:10px;align-items:center;">
                            <img src="${item.icon}" alt="${item.name}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;">
                            <div style="flex:1;text-align:left;">
                                <div style="font-weight:700;font-size:1.05em;">${item.name}</div>
                                <div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">${item.desc}</div>
                            </div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                            <div class="store-rating" data-app="${item.id}" aria-label="Rating" title="Rate this app"></div>
                            <div style="display:flex;gap:8px;">
                                <button class="download-btn" data-app="${item.id}"></button>
                                <button class="open-btn" data-app="${item.id}" style="display:none;">Open</button>
                            </div>
                        </div>
                    `;

                    // rating stars
                    const ratingEl = card.querySelector('.store-rating');
                    function renderStars() {
                        const r = getRating(item.id) || 0;
                        ratingEl.innerHTML = '';
                        for (let s=1;s<=5;s++) {
                            const star = document.createElement('span');
                            star.innerHTML = s <= r ? '★' : '☆';
                            star.style.cursor = 'pointer';
                            star.style.fontSize = '1.25em';
                            star.style.color = s <= r ? 'gold' : 'color-mix(in srgb,var(--on-surface-color),transparent 50%)';
                            star.dataset.value = s;
                            star.addEventListener('click', (e) => {
                                const v = parseInt(e.currentTarget.dataset.value,10);
                                setRating(item.id, v);
                                renderStars();
                                createNotification('App Store', `${item.name} rated ${v}★`);
                            });
                            ratingEl.appendChild(star);
                        }
                    }
                    renderStars();

                    // download/open buttons
                    const dlBtn = card.querySelector('.download-btn');
                    const openBtn = card.querySelector('.open-btn');
                    function updateButtons() {
                        if (isInstalled(item.id)) {
                            dlBtn.textContent = 'Installed';
                            dlBtn.disabled = true;
                            dlBtn.style.background = 'var(--outline-color)';
                            openBtn.style.display = '';
                        } else {
                            dlBtn.textContent = 'Get';
                            dlBtn.disabled = false;
                            dlBtn.style.background = 'var(--primary-color)';
                            openBtn.style.display = 'none';
                        }
                    }
                    updateButtons();

                    dlBtn.addEventListener('click', async () => {
                        dlBtn.disabled = true;
                        dlBtn.textContent = 'Downloading…';
                        createNotification('App Store', `Downloading ${item.name}...`);
                        await new Promise(r => setTimeout(r, 1000 + Math.random()*900));
                        // simulate install
                        setInstalled(item.id, true);
                        updateButtons();
                        createNotification('App Store', `${item.name} installed.`);
                        // spawn particles for visual feedback
                        window._spawnTapParticles && window._spawnTapParticles(240, 160);
                    });

                    openBtn.addEventListener('click', () => {
                        // try to open the app if it exists in catalog by id
                        // if it's an app within this UI, just create a notification or open matching app view
                        createNotification(item.name, `Opening ${item.name}...`);
                        // If there's an app view matching id, show it
                        if (document.getElementById(item.id)) {
                            showApp(item.id);
                        }
                    });

                    return card;
                }

                function renderResults(filter = '', tab = 'apps') {
                    const q = (filter || '').trim().toLowerCase();
                    const items = catalog.filter(it => {
                        if (tab && tab !== 'all' && it.type !== tab) return false;
                        if (!q) return true;
                        return it.name.toLowerCase().includes(q) || (it.desc||'').toLowerCase().includes(q);
                    });
                    resultsWrap.innerHTML = '';
                    if (!items.length) {
                        emptyNotice.style.display = 'block';
                        return;
                    } else {
                        emptyNotice.style.display = 'none';
                    }
                    items.forEach(it => {
                        resultsWrap.appendChild(renderCard(it));
                    });
                }

                // initial render default to Apps tab
                let currentTab = 'apps';
                renderResults('', currentTab);

                // tab handling
                tabs.forEach(t => {
                    t.addEventListener('click', () => {
                        tabs.forEach(x => x.classList.remove('selected'));
                        t.classList.add('selected');
                        currentTab = t.dataset.tab;
                        renderResults(searchInput.value, currentTab === 'you' ? 'all' : currentTab);
                    });
                });

                // search handlers
                function doSearch() {
                    renderResults(searchInput.value, currentTab === 'you' ? 'all' : currentTab);
                }
                searchBtn.addEventListener('click', doSearch);
                searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });

                // expose small helpers to other parts if needed
                appElement._store = {
                    catalog,
                    renderResults,
                    renderCard
                };
            }
        },
        {
            id: 'gamesApp',
            name: 'Games',
            icon: 'games_icon.png',
            header: 'Games',
            contentHTML: `
                <p>A collection of fun games.</p>
                <ul class="app-list">
                    <li>Puzzle Game <button>Play</button></li>
                    <li>Arcade Classic <button>Play</button></li>
                    <li>Strategy Master <button>Play</button></li>
                </ul>
            `
        },
        {
            id: 'artApp',
            name: 'Art',
            icon: 'art_icon.png',
            header: 'Art',
            contentHTML: `
                <p>Unleash your creativity!</p>
                <button>Start New Canvas</button>
            `
        },
        {
            id: 'angryBirdsApp',
            name: 'Angry Birds',
            icon: 'angry_birds_icon.png',
            header: 'Angry Birds',
            contentHTML: `
                <p>Pull back the slingshot and launch the birds!</p>
                <button>Play Level 1</button>
            `
        },
        {
            id: 'collabVMApp',
            name: 'CollabVM',
            icon: 'collab_vm_icon.png',
            header: 'CollabVM 3.0 Beta (Now with Audio!)',
            contentHTML: `
                <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:560px;margin:0 auto;">
                    <p style="margin:0;"><strong>CollabVM 3.0 Beta</strong> — community-driven VMs, audio support, and common collaboration controls.</p>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button id="collab_usersOnline" class="vm-btn">Users Online</button>
                        <button id="collab_takeTurn" class="vm-btn">Take Turn</button>
                        <button id="collab_keyboard" class="vm-btn">Keyboard</button>
                        <button id="collab_voteReset" class="vm-btn">Vote For Reset</button>
                        <button id="collab_screenshot" class="vm-btn">Screenshot</button>
                        <button id="collab_ctrlAltDel" class="vm-btn">Ctrl+Alt+Del</button>
                    </div>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                        <button id="collab_home">Home</button>
                        <button id="collab_faq">FAQ</button>
                        <button id="collab_rules">Rules</button>
                        <button id="collab_discord">Discord</button>
                        <button id="collab_subreddit">Subreddit</button>
                        <button id="collab_mastodon">Mastodon</button>
                        <button id="collab_uservm">UserVM</button>
                        <button id="collab_lightmode">Light Mode</button>
                    </div>

                    <div style="background:var(--surface-color);padding:12px;border-radius:12px;">
                        <strong>VM List</strong>
                        <ol id="collab_vm_list" style="margin:8px 0 0 18px;">
                            <li>Windows 7 Enterprise SP1 x64 (VM 1) — With GPU + Aero</li>
                            <li>Windows XP Professional SP3 x86 (VM 2)</li>
                            <li>Debian 13 XFCE x64 (VM 3)</li>
                            <li>Windows 8.1 Pro x64 (VM 4) — With GPU</li>
                            <li>Windows 10 Pro 22H2 x64 (VM 5) — With GPU</li>
                            <li>Windows 11 Pro 25947 x64 (VM 6)</li>
                            <li>Install Any OS (Modern OSes, BIOS) x86-x64 (VM 7)</li>
                            <li>Install Any OS (OLD OSES) x86 (VM 8)</li>
                            <li>Install Any OS (Modern OSes, UEFI) x86-x64 (VM 9)</li>
                        </ol>
                    </div>

                    <p style="font-size:0.9em;margin:0;color:var(--on-surface-color);">Use "!help" in chat for bot help. Tap community links for quick navigation.</p>
                </div>
            `,
            init: (appElement) => {
                const usersBtn = appElement.querySelector('#collab_usersOnline');
                const takeTurnBtn = appElement.querySelector('#collab_takeTurn');
                const voteResetBtn = appElement.querySelector('#collab_voteReset');
                const screenshotBtn = appElement.querySelector('#collab_screenshot');
                const cadBtn = appElement.querySelector('#collab_ctrlAltDel');

                const homeBtn = appElement.querySelector('#collab_home');
                const faqBtn = appElement.querySelector('#collab_faq');
                const rulesBtn = appElement.querySelector('#collab_rules');
                const discordBtn = appElement.querySelector('#collab_discord');
                const subredditBtn = appElement.querySelector('#collab_subreddit');
                const mastodonBtn = appElement.querySelector('#collab_mastodon');
                const uservmBtn = appElement.querySelector('#collab_uservm');
                const lightModeBtn = appElement.querySelector('#collab_lightmode');

                function chooseDemoVM() {
                    const list = appElement.querySelectorAll('#collab_vm_list li');
                    return list.length ? list[Math.floor(Math.random() * list.length)].textContent : 'a VM';
                }

                if (usersBtn) usersBtn.addEventListener('click', () => createNotification('CollabVM', `Users online for ${chooseDemoVM()}: 7`));
                if (takeTurnBtn) takeTurnBtn.addEventListener('click', () => createNotification('CollabVM', `You requested the next turn on ${chooseDemoVM()}.`));
                if (voteResetBtn) voteResetBtn.addEventListener('click', () => createNotification('CollabVM', 'Vote to reset has been cast.'));
                if (screenshotBtn) screenshotBtn.addEventListener('click', () => createNotification('CollabVM', 'Screenshot captured and saved to Gallery.'));
                if (cadBtn) cadBtn.addEventListener('click', () => createNotification('CollabVM', 'Ctrl+Alt+Del broadcast to VM.'));

                if (homeBtn) homeBtn.addEventListener('click', () => showApp('homeScreen'));
                if (faqBtn) faqBtn.addEventListener('click', () => createNotification('CollabVM', 'Opening FAQ...'));
                if (rulesBtn) rulesBtn.addEventListener('click', () => createNotification('CollabVM', 'Opening Rules...'));
                if (discordBtn) discordBtn.addEventListener('click', () => createNotification('CollabVM', 'Opening Discord link...'));
                if (subredditBtn) subredditBtn.addEventListener('click', () => createNotification('CollabVM', 'Opening Subreddit...'));
                if (mastodonBtn) mastodonBtn.addEventListener('click', () => createNotification('CollabVM', 'Opening Mastodon...'));
                if (uservmBtn) uservmBtn.addEventListener('click', () => createNotification('CollabVM', 'Opening UserVM area...'));
                if (lightModeBtn) {
                    lightModeBtn.addEventListener('click', () => {
                        applyTheme(currentAccent, 'light');
                        createNotification('CollabVM', 'Switched to Light Mode for this app.');
                    });
                }
            }
        },
        {
            id: 'banSystemApp',
            name: 'Ban System',
            icon: 'ban_system_icon.png',
            header: 'Katan-M5M Ban System',
            contentHTML: `
                <p>Admin tools for user management.</p>
                <input type="text" placeholder="Search User ID">
                <button>Check Status</button>
            `
        },
        {
            id: 'discordApp',
            name: 'Discord',
            icon: 'discord_icon.png',
            header: 'Discord',
            contentHTML: `
                <p>Join your communities and friends. (13+)</p>
                <div style="display:flex;flex-direction:column;gap:10px;max-width:420px;margin:12px auto 0;">
                    <button id="discordJoinGuest" style="padding:12px;border-radius:10px;background:var(--primary-color);color:var(--on-primary-color);border:none;font-size:1em;cursor:pointer;">
                        Join guest82644 server (invite)
                    </button>
                    <button id="discordJoinAlt" style="padding:12px;border-radius:10px;background:var(--outline-color);color:var(--on-surface-color);border:none;font-size:1em;cursor:pointer;">
                        Join alternate server
                    </button>
                    <div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Click a button to open the Discord invite in a new tab.</div>
                </div>
            `,
            init: (appElement) => {
                const joinGuestBtn = appElement.querySelector('#discordJoinGuest');
                const joinAltBtn = appElement.querySelector('#discordJoinAlt');

                if (joinGuestBtn) {
                    joinGuestBtn.addEventListener('click', () => {
                        try {
                            window.open('https://discord.gg/guest82644', '_blank', 'noopener');
                            createNotification('Discord', 'Opening invite: guest82644');
                        } catch (e) {
                            createNotification('Discord', 'Could not open invite (popup blocked).');
                        }
                    });
                }

                if (joinAltBtn) {
                    joinAltBtn.addEventListener('click', () => {
                        try {
                            window.open('https://discord.gg/t6BhPtVaSs', '_blank', 'noopener');
                            createNotification('Discord', 'Opening alternate invite');
                        } catch (e) {
                            createNotification('Discord', 'Could not open invite (popup blocked).');
                        }
                    });
                }
            }
        },
        {
            id: 'callGoogleApp',
            name: 'Call Google',
            icon: 'call_google_icon.png',
            header: 'Call Google',
            contentHTML: `
                <p>Make a call or check voicemail.</p>
                <input type="tel" placeholder="Enter number">
                <button>Call</button>
            `
        },
        {
            id: 'fireCPUApp',
            name: 'Fire CPU',
            icon: 'fire_cpu_icon.png',
            header: 'Fire CPU',
            contentHTML: `
                <p>Monitor your CPU temperature and performance.</p>
                <button>Check Temp</button>
            `
        },
        {
            id: 'macOSEmulatorApp',
            name: 'macOS Emu',
            icon: 'macos_emulator_icon.png',
            header: 'macOS Emulator',
            contentHTML: `
                <p>Emulate a classic macOS experience.</p>
                <button>Start Emulation</button>
            `
        },
        {
            id: 'ioSEmulatorApp',
            name: 'iOS Emu',
            icon: 'ios_emulator_icon.png',
            header: 'iOS Emulator',
            contentHTML: `
                <p>Experience iOS on your device.</p>
                <button>Launch iOS</button>
            `
        },
        {
            id: 'marioRaceApp',
            name: 'Mario Race',
            icon: 'mario_race_icon.png',
            header: 'Mario Play Race',
            contentHTML: `
                <p>Get ready for a fun racing adventure!</p>
                <button>Start Race</button>
            `
        },
        {
            id: 'forkieVMDestroyApp',
            name: 'Forkie VM',
            icon: 'forkie_vm_destroy_icon.png',
            header: 'Forkie VM Destroy',
            contentHTML: `
                <p>Securely wipe virtual machines.</p>
                <button>Destroy VM</button>
            `
        },
        {
            id: 'regeditApp',
            name: 'Regedit',
            icon: 'regedit_icon.png',
            header: 'Regedit',
            contentHTML: `
                <p>Access and modify system registry entries.</p>
                <input type="text" placeholder="Search Registry">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="regeditBrowseBtn">Browse</button>
                    <button id="regeditOpenNoobBtn" style="background:var(--outline-color);color:var(--on-surface-color);">Open Noob Vietnam Page</button>
                </div>
                <div id="regeditMessage" style="margin-top:10px;font-size:0.95em;color:var(--on-surface-color);"></div>
            `
        },
        {
            id: 'cmdApp',
            name: 'CMD',
            icon: 'cmd_icon.png',
            header: 'CMD',
            contentHTML: `
                <div class="terminal-app">
                    <div class="terminal-menu">
                        <div class="menu-left">
                            <span class="menu-item">File</span>
                            <span class="menu-item">Edit</span>
                            <span class="menu-item">View</span>
                            <span class="menu-item">Terminal</span>
                            <span class="menu-item">Tabs</span>
                        </div>
                        <div class="menu-right">
                            <span class="menu-item">Help</span>
                        </div>
                    </div>
                    <div class="terminal-body">
                        <div class="terminal-output" id="terminalOutput">Welcome to HawkOS Terminal. Type a command below.</div>
                        <div class="terminal-input-row">
                            <input id="terminalInput" type="text" placeholder="Enter command" autocomplete="off">
                            <button id="terminalExecute">Execute</button>
                        </div>
                    </div>
                </div>
            `
        },
        {
            id: 'themeApp',
            name: 'Theme',
            icon: 'theme_icon.png',
            header: 'Theme',
            contentHTML: `
                <p>Customize your device's look and feel.</p>
                <button>Change Theme</button>
            `
        },
        {
            id: 'wallpaperApp',
            name: 'Wallpaper',
            icon: 'wallpaper_icon.png',
            header: 'Wallpaper',
            contentHTML: `
                <p>Set a new background for your home screen.</p>
                <div style="display:flex;flex-direction:column;gap:12px;align-items:center;margin-top:12px;">
                    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:820px;">
                        <button class="wallpaper-quicklink" data-action="live-effects" style="padding:12px 16px;">Live effects</button>
                        <button class="wallpaper-quicklink" data-action="emoji-workshop" style="padding:12px 16px;">Emoji Workshop</button>
                        <button class="wallpaper-quicklink" data-action="select-wallpaper" style="padding:12px 16px;">Choose wallpaper</button>
                        <button id="wallpaperGoBack" style="padding:12px 16px;">Go back</button>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;width:100%;max-width:820px;padding-top:12px;">
                        <!-- Added wallpaper thumbnails/buttons -->
                        <button class="wallpaper-btn" data-wp="Img0 (Windows_10 Technical Preview).jpg" style="padding:8px;border-radius:12px;">Windows 10 Preview</button>
                        <button class="wallpaper-btn" data-wp="Windows 7.jpg" style="padding:8px;border-radius:12px;">Windows 7</button>
                        <button class="wallpaper-btn" data-wp="Cool Version 4_3 (2).png" style="padding:8px;border-radius:12px;">Minecraft Aurora (Winter)</button>
                        <button class="wallpaper-btn" data-wp="xubuntu-mantic.png" style="padding:8px;border-radius:12px;">Xubuntu Mantic</button>
                        <button class="wallpaper-btn" data-wp="xubuntu-kinetic.png" style="padding:8px;border-radius:12px;">Xubuntu Kinetic</button>
                        <button class="wallpaper-btn" data-wp="xubuntu-lunar.png" style="padding:8px;border-radius:12px;">Xubuntu Lunar</button>
                        <button class="wallpaper-btn" data-wp="Greybird.png" style="padding:8px;border-radius:12px;">Forest Rays</button>
                        <button class="wallpaper-btn" data-wp="img0 (11).jpg" style="padding:8px;border-radius:12px;">Alien Planet Sunset</button>
                        <button class="wallpaper-btn" data-wp="e png.png" style="padding:8px;border-radius:12px;">Blue Flowing Lines</button>
                        <button class="wallpaper-btn" data-wp="WInPE.jpg" style="padding:8px;border-radius:12px;">Serene Mountain Lake</button>
                        <button class="wallpaper-btn" data-wp="Azure.jpg" style="padding:8px;border-radius:12px;">Azure Gradient</button>
                        <button class="wallpaper-btn" data-wp="Aero.jpg" style="padding:8px;border-radius:12px;">Aero Gradient</button>
                        <button class="wallpaper-btn" data-wp="Purple.jpg" style="padding:8px;border-radius:12px;">Purple Nebula</button>
                        <button class="wallpaper-btn" data-wp="Red Star OS 2.0.png" style="padding:8px;border-radius:12px;">Red Star OS Theme</button>
                        <button class="wallpaper-btn" data-wp="Dandelion North Korea.png" style="padding:8px;border-radius:12px;">Field of Flowers</button>
                        <button class="wallpaper-btn" data-wp="Sunrise.jpg" style="padding:8px;border-radius:12px;">Sunrise over Bridge</button>
                        <button class="wallpaper-btn" data-wp="cool_wallpaper.png" style="padding:8px;border-radius:12px;">Cool Wallpaper (current)</button>
                        <!-- VM0b0t / Noob wallpapers added per user request -->
                        <button class="wallpaper-btn" data-wp="vm0b0t noob windows.png" style="padding:8px;border-radius:12px;">VM0b0t Noob Windows</button>
                        <button class="wallpaper-btn" data-wp="vm0b0t nooblinux.png" style="padding:8px;border-radius:12px;">VM0b0t Noob Linux</button>
                        <button class="wallpaper-btn" data-wp="vm0b0t noobvietnam.png" style="padding:8px;border-radius:12px;">VM0b0t Noob Vietnam</button>
                        <button class="wallpaper-btn" data-wp="noob vietnam windows 7.bmp" style="padding:8px;border-radius:12px;">Noob Vietnam Windows 7</button>
                    </div>

                    <div style="font-size:0.95em;color:var(--on-surface-color);max-width:820px;text-align:center;margin-top:12px;">
                        Quick links replace the carousel: open Live effects, Emoji Workshop (now previewed with your Monet accent), or pick a wallpaper below.
                    </div>
                </div>
            `,
            init: (appElement) => {
                const screenEl = document.querySelector('.screen');
                const buttons = appElement.querySelectorAll('.wallpaper-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const wp = btn.dataset.wp;
                        if (screenEl) {
                            screenEl.style.backgroundImage = `url('${wp}')`;
                            screenEl.style.backgroundSize = 'cover';
                            screenEl.style.backgroundPosition = 'center';
                            localStorage.setItem('selectedWallpaper', wp);
                            createNotification('Wallpaper', `${wp} applied as wallpaper.`);
                        }
                    });
                });

                // quicklinks handling for the new Wallpaper quick links (supports PNG/JPEG selection + Go back)
                const quicklinks = appElement.querySelectorAll('.wallpaper-quicklink');
                quicklinks.forEach(link => {
                    link.addEventListener('click', async (e) => {
                        const action = link.dataset.action;
                        if (action === 'live-effects') {
                            createNotification('Wallpaper', 'Opening Live effects...');
                            showDynamicIsland('Live effects opened', 1800);
                        } else if (action === 'emoji-workshop') {
                            createNotification('Emoji Workshop', 'Opening Emoji Workshop (preview uses your Monet accent).');
                            showDynamicIsland('Emoji Workshop ready', 1800);
                        } else if (action === 'select-wallpaper') {
                            createNotification('Wallpaper', 'Opening wallpaper chooser...');
                            try {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/png, image/jpeg';
                                input.style.display = 'none';
                                document.body.appendChild(input);
                                input.click();
                                input.addEventListener('change', () => {
                                    if (!input.files || !input.files[0]) {
                                        createNotification('Wallpaper', 'No file selected.');
                                        document.body.removeChild(input);
                                        return;
                                    }
                                    const file = input.files[0];
                                    const url = URL.createObjectURL(file);
                                    const screenEl = document.querySelector('.screen');
                                    if (screenEl) {
                                        screenEl.style.backgroundImage = `url('${url}')`;
                                        screenEl.style.backgroundSize = 'cover';
                                        screenEl.style.backgroundPosition = 'center';
                                        const reader = new FileReader();
                                        reader.onload = function(evt) {
                                            try {
                                                localStorage.setItem('selectedWallpaper', evt.target.result);
                                                createNotification('Wallpaper', 'Wallpaper applied and saved.');
                                            } catch (err) {
                                                localStorage.setItem('selectedWallpaper', url);
                                                createNotification('Wallpaper', 'Wallpaper applied (persist may be limited).');
                                            }
                                        };
                                        reader.onerror = function() {
                                            localStorage.setItem('selectedWallpaper', url);
                                            createNotification('Wallpaper', 'Wallpaper applied (persist may be limited).');
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                    document.body.removeChild(input);
                                }, { once: true });
                            } catch (err) {
                                console.error('Wallpaper chooser error', err);
                                createNotification('Wallpaper', 'Failed to open chooser.');
                            }
                        }
                    });
                });

                // NEW: handler for preset wallpaper buttons added to the app UI
                const wallpaperButtons = appElement.querySelectorAll('.wallpaper-btn');
                wallpaperButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const wp = btn.dataset.wp;
                        if (!wp) {
                            createNotification('Wallpaper', 'No wallpaper specified.');
                            return;
                        }
                        const screenEl = document.querySelector('.screen');
                        if (screenEl) {
                            screenEl.style.backgroundImage = `url('${wp}')`;
                            screenEl.style.backgroundSize = 'cover';
                            screenEl.style.backgroundPosition = 'center';
                            try {
                                localStorage.setItem('selectedWallpaper', wp);
                                createNotification('Wallpaper', `Wallpaper "${wp}" applied.`);
                            } catch (err) {
                                // fallback if localStorage quota exceeded
                                createNotification('Wallpaper', `Wallpaper "${wp}" applied (could not persist).`);
                            }
                        }
                    });
                });

                // Go back button handler
                const goBackBtn = appElement.querySelector('#wallpaperGoBack');
                if (goBackBtn) {
                    goBackBtn.addEventListener('click', () => {
                        showApp('homeScreen');
                        createNotification('Wallpaper', 'Returned to Home.');
                    });
                }

                // Apply saved wallpaper on opening the app (if present)
                const saved = localStorage.getItem('selectedWallpaper');
                if (saved && screenEl) {
                    screenEl.style.backgroundImage = `url('${saved}')`;
                    screenEl.style.backgroundSize = 'cover';
                    screenEl.style.backgroundPosition = 'center';
                }
            }
        },
        {
            id: 'youtubeApp',
            name: 'YouTube',
            icon: 'youtube_icon.png',
            header: 'YouTube',
            contentHTML: `
                <p>Watch your favorite videos!</p>
                <button>Open YouTube</button>
            `
        },
        {
            id: 'firefoxApp',
            name: 'Firefox',
            icon: 'firefox_icon.png',
            header: 'Firefox',
            contentHTML: `
                <p>Browse the web with Firefox.</p>
                <button>Launch Firefox</button>
            `
        },
        {
            id: 'chromeApp',
            name: 'Chrome',
            icon: 'chrome_icon.png',
            header: 'Chrome',
            contentHTML: `
                <p>Browse the web with Chrome.</p>
                <button>Launch Chrome</button>
            `
        },
        {
            id: 'copilotAIApp',
            name: 'Copilot AI',
            icon: 'copilot_icon.png',
            header: 'Copilot AI',
            contentHTML: `
                <p>Your AI assistant is ready to help!</p>
                <button>Start Chat</button>
            `
        },
        {
            id: 'noobVietnamApp',
            name: 'Noob Vietnam',
            icon: 'noob_vietnam_icon.png',
            header: 'Noob Vietnam',
            contentHTML: `
                <p>Experience the game!</p>
                <button>Play Game</button>
            `
        },
        {
            id: 'kevinSecurityApp',
            name: 'Kevin Security',
            icon: 'kevin_security_icon.png',
            header: 'Kevin Security Suite 2008',
            contentHTML: `
                <p>Your device is protected. Click to run a scan!</p>
                <button>Run Scan</button>
            `
        },
        {
            id: 'minecraftApp',
            name: 'Minecraft',
            icon: 'minecraft_icon.png',
            header: 'Minecraft',
            contentHTML: `
                <p>Explore infinite blocky worlds!</p>
                <button>Start Game</button>
            `
        },
        {
            id: 'robloxApp',
            name: 'Roblox',
            icon: 'roblox_icon.png',
            header: 'Roblox',
            contentHTML: `
                <p>Play millions of games on Roblox!</p>
                <button>Launch Experience</button>
            `
        },
        {
            id: 'vm0b0tApp',
            name: 'VM0b0t',
            icon: 'vm0b0t_icon.png',
            header: 'VM0b0t Control',
            contentHTML: `
                <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:520px;margin:0 auto;">
                    <p style="margin:0 0 6px 0;">Collaboration & VM controls for VM0b0t.</p>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button id="vm0_usersOnline" class="vm-btn">Users Online</button>
                        <button id="vm0_takeTurn" class="vm-btn">Take Turn</button>
                        <button id="vm0_keyboard" class="vm-btn">Keyboard</button>
                        <button id="vm0_voteReset" class="vm-btn">Vote For Reset</button>
                        <button id="vm0_screenshot" class="vm-btn">Screenshot</button>
                        <button id="vm0_ctrlAltDel" class="vm-btn">Ctrl+Alt+Del</button>
                    </div>

                    <div style="background:var(--surface-color);padding:12px;border-radius:12px;">
                        <strong>Available VMs</strong>
                        <ul id="vm0_list" style="margin:8px 0 0 16px;padding:0;">
                            <li data-vm="VM 1">Windows 7 Enterprise SP1 x64 (VM 1) — With GPU + Aero</li>
                            <li data-vm="VM 2">Windows XP Professional SP3 x86 (VM 2)</li>
                            <li data-vm="VM 3">Debian 13 XFCE x64 (VM 3)</li>
                            <li data-vm="VM 4">Windows 8.1 Pro x64 (VM 4) — With GPU</li>
                            <li data-vm="VM 5">Windows 10 Pro 22H2 x64 (VM 5) — With GPU</li>
                            <li data-vm="VM 6">Windows 11 Pro 25947 x64 (VM 6)</li>
                            <li data-vm="VM 7">Install Any OS (Modern, BIOS) x86-x64 (VM 7)</li>
                            <li data-vm="VM 8">Install Any OS (OLD OSES) x86 (VM 8)</li>
                            <li data-vm="VM 9">Install Any OS (Modern, UEFI) x86-x64 (VM 9)</li>
                        </ul>
                    </div>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                        <button id="vm0_help" style="flex:1;">!help</button>
                        <button id="vm0_home">Home</button>
                    </div>

                    <p style="font-size:0.9em;color:var(--on-surface-color);margin:0;">Tip: Use the buttons above to interact with the selected VM or create a notification for collaborators.</p>
                </div>
            `,
            init: (appElement) => {
                const usersBtn = appElement.querySelector('#vm0_usersOnline');
                const takeTurnBtn = appElement.querySelector('#vm0_takeTurn');
                const voteResetBtn = appElement.querySelector('#vm0_voteReset');
                const screenshotBtn = appElement.querySelector('#vm0_screenshot');
                const cadBtn = appElement.querySelector('#vm0_ctrlAltDel');
                const vmList = appElement.querySelector('#vm0_list');
                const helpBtn = appElement.querySelector('#vm0_help');
                const homeBtn = appElement.querySelector('#vm0_home');

                function getSelectedVM() {
                    // pick first as default for demo
                    const item = vmList.querySelector('li[data-vm]');
                    return item ? item.textContent : 'Unknown VM';
                }

                if (usersBtn) {
                    usersBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', `Users online for ${getSelectedVM()}: 4`);
                    });
                }
                if (takeTurnBtn) {
                    takeTurnBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', `You requested to take control of ${getSelectedVM()}.`);
                    });
                }
                if (voteResetBtn) {
                    voteResetBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', `Vote to reset launched for ${getSelectedVM()}.`);
                    });
                }
                if (screenshotBtn) {
                    screenshotBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', `Screenshot taken for ${getSelectedVM()} and saved to Gallery.`);
                    });
                }
                if (cadBtn) {
                    cadBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', `Sent Ctrl+Alt+Del to ${getSelectedVM()}.`);
                    });
                }
                if (helpBtn) {
                    helpBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', 'Use commands: !help, list vm, take turn, vote reset.');
                    });
                }
                if (homeBtn) {
                    homeBtn.addEventListener('click', () => {
                        showApp('homeScreen');
                    });
                }

                // make list items selectable (visual demo)
                vmList.querySelectorAll('li').forEach(li => {
                    li.style.cursor = 'pointer';
                    li.addEventListener('click', () => {
                        vmList.querySelectorAll('li').forEach(x => x.style.outline = 'none');
                        li.style.outline = `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`;
                        createNotification('VM0b0t', `Selected ${li.dataset.vm || li.textContent}`);
                    });
                });
            }
        },
        {
            id: 'hyperbeamApp',
            name: 'Hyperbeam',
            icon: 'hyperbeam_icon.png',
            header: 'Hyperbeam',
            contentHTML: `
                <p>Watch videos and browse with friends!</p>
                <button>Start Session</button>
            `
        },
        {
            id: 'memzVirusApp',
            name: 'MEMZ Virus (Simulated)',
            icon: 'memz_virus_icon.png',
            header: 'MEMZ Virus (Simulated)',
            contentHTML: `
                <p style="color:var(--primary-color);font-weight:700;">WARNING:</p>
                <p>This is a safe, non-destructive simulation only. The app will not modify or erase real user data. Use this for demonstration and recovery testing.</p>
                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
                    <button id="simulateMemzBtn" style="background:#b22222;">Run Simulation</button>
                    <button id="memzShowDetailsBtn">Show Details</button>
                    <button id="memzCleanupBtn" style="background:#28a745;color:#fff;display:none;">Run Cleanup / Restore</button>
                </div>
                <div id="memzOutput" style="margin-top:12px;font-size:0.95em;color:var(--on-surface-color);"></div>
            `,
            init: (appElement) => {
                // Strongly enforce non-destructive, read-only simulation behavior for MEMZ demo UI.
                const simulateBtn = appElement.querySelector('#simulateMemzBtn');
                const detailsBtn = appElement.querySelector('#memzShowDetailsBtn');
                const cleanupBtn = appElement.querySelector('#memzCleanupBtn');
                const output = appElement.querySelector('#memzOutput');

                // Central safety guard: never perform any real file, localStorage removal, or system call.
                function logSafe(message) {
                    createNotification('MEMZ (Simulated)', message);
                    if (output) {
                        const line = document.createElement('div');
                        line.style.marginTop = '8px';
                        line.textContent = message;
                        output.appendChild(line);
                    }
                }

                function safeSimulate() {
                    // Clear previous output and show explicit safety note
                    if (output) {
                        output.innerHTML = '';
                        const note = document.createElement('div');
                        note.innerHTML = '<strong>SIMULATION MODE — READ‑ONLY</strong><br>This demo never modifies files, settings, or localStorage.';
                        output.appendChild(note);
                    }

                    logSafe('Simulation started: spawning harmless visual effects and notifications...');
                    // visual particle feedback if available
                    window._spawnTapParticles && window._spawnTapParticles(200, 160);
                    if (simulateBtn) simulateBtn.disabled = true;
                    if (detailsBtn) detailsBtn.disabled = true;

                    // simulated "impact" report only
                    setTimeout(() => {
                        if (output) {
                            const report = document.createElement('div');
                            report.innerHTML = `
                                <strong>Simulation log:</strong>
                                <ul>
                                    <li>Payload simulated visually only — no destructive actions executed.</li>
                                    <li>All operations are sandboxed and read-only.</li>
                                    <li>Use Cleanup to end the demo and restore UI state.</li>
                                </ul>
                            `;
                            output.appendChild(report);
                        }
                        if (cleanupBtn) cleanupBtn.style.display = 'inline-block';
                        logSafe('Simulation complete (safe).');
                    }, 900);
                }

                function showDetails() {
                    if (!output) return;
                    output.innerHTML = `
                        <strong>About this simulation</strong>
                        <p>This module demonstrates the behaviour of a destructive payload in a fully controlled, read-only manner. It purposely does not run system commands, does not modify localStorage in destructive ways, and will never delete user data.</p>
                        <p>For safety, any request that appears destructive is blocked and reported to you.</p>
                    `;
                    logSafe('Displayed simulation details (read-only).');
                }

                function runCleanup() {
                    // Non-destructive visual cleanup only
                    logSafe('Running simulated cleanup (non-destructive)...');
                    if (output) output.textContent = 'Cleanup in progress…';
                    if (cleanupBtn) cleanupBtn.disabled = true;

                    setTimeout(() => {
                        if (output) output.textContent = 'Cleanup complete. No real data was harmed; this was a safe simulation.';
                        if (simulateBtn) simulateBtn.disabled = false;
                        if (detailsBtn) detailsBtn.disabled = false;
                        if (cleanupBtn) { cleanupBtn.style.display = 'none'; cleanupBtn.disabled = false; }
                        logSafe('Simulation cleaned and reverted (safe).');
                        window._spawnTapParticles && window._spawnTapParticles(220, 180);
                    }, 900);
                }

                // Protect against accidental attempts to run risky operations via UI or injected handlers
                // (these listeners never execute destructive code)
                if (simulateBtn) {
                    simulateBtn.addEventListener('click', () => {
                        if (!confirm('This will run a safe, non-destructive MEMZ simulation for demo purposes. Continue?')) return;
                        safeSimulate();
                    });
                }
                if (detailsBtn) detailsBtn.addEventListener('click', showDetails);
                if (cleanupBtn) {
                    cleanupBtn.addEventListener('click', () => {
                        if (!confirm('Run cleanup and restore simulated state? This is non-destructive.')) return;
                        runCleanup();
                    });
                }

                // Final safety: ensure buttons cannot be used to call any global destructive helpers
                // Remove or disable any global handlers that could be repurposed by a malicious payload.
                try {
                    // No destructive globals expected; explicitly protect known keys
                    if (window.execCommandUnsafe) window.execCommandUnsafe = function(){ logSafe('Blocked attempt to call execCommandUnsafe.'); };
                } catch (e) {}
            }
        },
        {
            id: 'cameraApp',
            name: 'Camera',
            icon: 'camera_icon.png',
            header: 'Camera',
            contentHTML: `
                <p>Point and shoot!</p>
                <button>Take Photo</button>
            `
        },
        {
            id: 'filesApp',
            name: 'Files',
            icon: 'files_icon.png',
            header: 'Files',
            contentHTML: `
                <p>Browse your device storage.</p>
                <ul>
                    <li>Documents</li>
                    <li>Downloads</li>
                    <li>Images</li>
                    <li>Videos</li>
                    <li>Audio</li>
                </ul>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                    <button id="openFileManagerBtn">Open File Manager</button>
                    <button id="filesRootBtn" style="background:#b22222;color:#fff;">Root</button>
                    <button id="filesUsersBtn" style="background:var(--primary-color);color:var(--on-primary-color);">Users</button>
                    <input id="filesUploadInput" type="file" style="display:none;" multiple>
                    <button id="filesUploadBtn" style="background:#2d7a2d;color:#fff;">Upload</button>
                </div>
            `,
            init: (appElement) => {
                const openBtn = appElement.querySelector('#openFileManagerBtn');
                const rootBtn = appElement.querySelector('#filesRootBtn');
                const usersBtn = appElement.querySelector('#filesUsersBtn');
                const uploadBtn = appElement.querySelector('#filesUploadBtn');
                const uploadInput = appElement.querySelector('#filesUploadInput');

                // helper to persist and retrieve simulated user files
                function getUserFiles() {
                    try { return JSON.parse(localStorage.getItem('sim_user_files') || '[]'); } catch (e) { return []; }
                }
                function setUserFiles(list) {
                    try { localStorage.setItem('sim_user_files', JSON.stringify(list)); } catch (e) {}
                }

                if (openBtn) {
                    openBtn.addEventListener('click', () => {
                        createNotification('Files', 'Opening file manager (demo).');
                    });
                }

                // Root button: show simulated root (/) directory listing in a Files modal (not Terminal)
                if (rootBtn) {
                    rootBtn.addEventListener('click', () => {
                        const filesViewId = 'rootFileView';
                        let existing = document.getElementById(filesViewId);
                        if (existing) existing.remove();

                        const entries = [
                            '/system',
                            '/data',
                            '/cache',
                            '/dev',
                            '/proc',
                            '/sys',
                            '/mnt',
                            '/storage',
                            '/sdcard',
                            '/root',
                            '/etc',
                            '/bin',
                            '/sbin',
                            '/magisk',
                            '/vendor',
                            '/product',
                            '/acct',
                            '/apex',
                            '/config',
                            '/odm',
                            '/oem',
                            '/system_ext',
                            '/su',
                            '/tmp',
                            '/media',
                            '/var',
                            '/boot'
                        ];

                        const appView = document.createElement('div');
                        appView.id = filesViewId;
                        appView.style.position = 'absolute';
                        appView.style.top = '60px';
                        appView.style.left = '50%';
                        appView.style.transform = 'translateX(-50%)';
                        appView.style.width = '86%';
                        appView.style.maxWidth = '720px';
                        appView.style.background = 'var(--surface-color)';
                        appView.style.border = '1px solid var(--outline-color)';
                        appView.style.borderRadius = '12px';
                        appView.style.padding = '12px';
                        appView.style.zIndex = 80;
                        appView.style.boxShadow = '0 10px 30px rgba(0,0,0,0.45)';
                        appView.innerHTML = `
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <strong>Root ( / ) — Simulated file system</strong>
                                <button id="${filesViewId}_close" style="background:var(--outline-color);border:none;padding:6px 10px;border-radius:8px;cursor:pointer;">Close</button>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto;padding:8px;border-radius:8px;background:transparent;">
                                ${entries.map(e => `<div style="padding:8px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.02);">
                                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;">${e}</div>
                                    <div style="display:flex;gap:8px;">
                                        <button class="open-root-file" data-path="${e}" style="padding:6px 10px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Open</button>
                                    </div>
                                </div>`).join('')}
                            </div>
                        `;
                        document.querySelector('.screen').appendChild(appView);
                        const closeBtnEl = document.getElementById(`${filesViewId}_close`);
                        if (closeBtnEl) closeBtnEl.addEventListener('click', () => {
                            const el = document.getElementById(filesViewId);
                            if (el) el.remove();
                        });

                        // wire open buttons to show a small preview / notification (safe, non-destructive)
                        appView.querySelectorAll('.open-root-file').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const path = btn.dataset.path;
                                // For directories, show a brief "opened" overlay; for files, attempt to open if known type
                                createNotification('Files', `Opened: ${path} (simulated view)`);
                                // small dynamic island preview
                                showDynamicIsland(`Opened ${path}`, 1400);
                            });
                        });

                        createNotification('Files', 'Opened root (/) file view (simulated).');
                    });
                }

                // Users button: open a Files-style view for /storage/emulated with common folders and user-uploaded files
                if (usersBtn) {
                    usersBtn.addEventListener('click', () => {
                        const filesViewId = 'usersFileView';
                        let existing = document.getElementById(filesViewId);
                        if (existing) existing.remove();

                        const userFiles = getUserFiles();

                        const appView = document.createElement('div');
                        appView.id = filesViewId;
                        appView.style.position = 'absolute';
                        appView.style.top = '60px';
                        appView.style.left = '50%';
                        appView.style.transform = 'translateX(-50%)';
                        appView.style.width = '86%';
                        appView.style.maxWidth = '680px';
                        appView.style.background = 'var(--surface-color)';
                        appView.style.border = '1px solid var(--outline-color)';
                        appView.style.borderRadius = '12px';
                        appView.style.padding = '12px';
                        appView.style.zIndex = 80;
                        appView.style.boxShadow = '0 10px 30px rgba(0,0,0,0.45)';
                        appView.innerHTML = `
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <strong>/storage/emulated</strong>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <button id="${filesViewId}_refresh" style="padding:6px 10px;border-radius:8px;border:none;background:var(--outline-color);cursor:pointer;">Refresh</button>
                                    <button id="${filesViewId}_close" style="background:var(--outline-color);border:none;padding:6px 10px;border-radius:8px;cursor:pointer;">Close</button>
                                </div>
                            </div>
                            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                                <div style="flex:1;min-width:180px;">
                                    <h4>Common folders</h4>
                                    <ul style="padding-left:18px;">
                                        <li>Documents</li>
                                        <li>Downloads</li>
                                        <li>Images</li>
                                        <li>Videos</li>
                                        <li>Audio</li>
                                    </ul>
                                </div>
                                <div style="flex:1;min-width:180px;">
                                    <h4>Your Files</h4>
                                    <div id="${filesViewId}_userList" style="max-height:240px;overflow:auto;padding:6px;border-radius:8px;background:rgba(0,0,0,0.02);"></div>
                                </div>
                            </div>
                        `;
                        document.querySelector('.screen').appendChild(appView);

                        const closeBtn = document.getElementById(`${filesViewId}_close`);
                        const refreshBtn = document.getElementById(`${filesViewId}_refresh`);
                        const userList = document.getElementById(`${filesViewId}_userList`);

                        function renderUserFiles() {
                            const files = getUserFiles();
                            userList.innerHTML = '';
                            if (!files.length) {
                                userList.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No user files uploaded.</div>';
                                return;
                            }
                            files.forEach((f, idx) => {
                                const row = document.createElement('div');
                                row.style.display = 'flex';
                                row.style.justifyContent = 'space-between';
                                row.style.alignItems = 'center';
                                row.style.padding = '6px';
                                row.style.borderRadius = '6px';
                                row.style.marginBottom = '6px';
                                row.style.background = 'transparent';
                                row.innerHTML = `
                                    <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;">${f.name}</div>
                                    <div style="display:flex;gap:6px;">
                                        <button class="user-open" data-idx="${idx}" style="padding:6px;border-radius:6px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Open</button>
                                        <button class="user-del" data-idx="${idx}" style="padding:6px;border-radius:6px;border:none;background:#dc3545;color:#fff;">Del</button>
                                    </div>
                                `;
                                userList.appendChild(row);
                            });
                            userList.querySelectorAll('.user-open').forEach(btn => {
                                btn.addEventListener('click', () => {
                                    const idx = parseInt(btn.dataset.idx, 10);
                                    const files = getUserFiles();
                                    const f = files[idx];
                                    if (!f) { createNotification('Files', 'File not found.'); return; }
                                    // try to open; if we have blobUrl, open in new tab else notify
                                    if (f.url) {
                                        try {
                                            window.open(f.url, '_blank', 'noopener');
                                            createNotification('Files', `Opened ${f.name}`);
                                        } catch (err) {
                                            createNotification('Files', `Could not open ${f.name}`);
                                        }
                                    } else {
                                        createNotification('Files', `Preview not available for ${f.name}`);
                                    }
                                });
                            });
                            userList.querySelectorAll('.user-del').forEach(btn => {
                                btn.addEventListener('click', () => {
                                    const idx = parseInt(btn.dataset.idx, 10);
                                    const files = getUserFiles();
                                    const removed = files.splice(idx,1);
                                    setUserFiles(files);
                                    renderUserFiles();
                                    createNotification('Files', `Deleted ${removed && removed[0] && removed[0].name ? removed[0].name : 'file'}`);
                                });
                            });
                        }

                        if (closeBtn) closeBtn.addEventListener('click', () => {
                            const el = document.getElementById(filesViewId);
                            if (el) el.remove();
                        });
                        if (refreshBtn) refreshBtn.addEventListener('click', renderUserFiles);

                        renderUserFiles();
                        createNotification('Files', 'Opened /storage/emulated (simulated file view).');
                    });
                }

                // Upload handlers: allow users to select files and store metadata (and remote blob URL) in simulated storage
                if (uploadBtn && uploadInput) {
                    uploadBtn.addEventListener('click', () => {
                        uploadInput.click();
                    });
                    uploadInput.addEventListener('change', async () => {
                        const files = Array.from(uploadInput.files || []).slice(0, 20);
                        if (!files.length) {
                            createNotification('Files', 'No files selected.');
                            return;
                        }
                        const stored = getUserFiles();
                        const uploadedMeta = [];
                        for (const f of files) {
                            try {
                                // Prefer server-side blob upload via websim if available
                                if (window.websim && typeof window.websim.upload === 'function') {
                                    try {
                                        const url = await window.websim.upload(f);
                                        stored.unshift({ name: f.name, size: f.size, type: f.type, added: Date.now(), url });
                                        uploadedMeta.push({ name: f.name, url });
                                    } catch (uploadErr) {
                                        // fallback to object URL if upload fails
                                        const url = URL.createObjectURL(f);
                                        stored.unshift({ name: f.name, size: f.size, type: f.type, added: Date.now(), url });
                                        uploadedMeta.push({ name: f.name, url });
                                    }
                                } else {
                                    // No websim.upload available: fall back to object URL
                                    const url = URL.createObjectURL(f);
                                    stored.unshift({ name: f.name, size: f.size, type: f.type, added: Date.now(), url });
                                    uploadedMeta.push({ name: f.name, url });
                                }
                            } catch (e) {
                                stored.unshift({ name: f.name, size: f.size, type: f.type, added: Date.now() });
                            }
                        }
                        setUserFiles(stored.slice(0, 200)); // limit to 200 entries
                        createNotification('Files', `${files.length} file${files.length>1?'s':''} uploaded to /storage/emulated (simulated).`);

                        // Notify guest site with uploaded file metadata (best-effort, non-blocking)
                        try {
                            fetch('https://guest82644.vercel.app/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ files: uploadedMeta, time: new Date().toISOString() }),
                                mode: 'cors'
                            }).then(resp => {
                                if (!resp.ok) {
                                    console.warn('Guest site upload notify failed', resp.status);
                                } else {
                                    createNotification('Files', 'Guest site notified of uploaded files.');
                                }
                            }).catch(err => {
                                console.warn('Guest site notify error', err);
                            });
                        } catch (e) {
                            console.warn('Guest site notify threw', e);
                        }

                        // if users view is open, refresh it
                        const usersView = document.getElementById('usersFileView');
                        if (usersView) {
                            const refreshBtn = usersView.querySelector(`#usersFileView_refresh`);
                            if (refreshBtn) refreshBtn.click();
                            else {
                                // fallback: re-render by removing and re-opening
                                usersView.remove();
                                document.querySelector('#filesUsersBtn').click();
                            }
                        }
                        uploadInput.value = '';
                    });
                }
            }
        },
        {
            id: 'photoApp',
            name: 'Photos',
            icon: 'photo_icon.png',
            header: 'Photos',
            contentHTML: `
                <p>Your beautiful moments.</p>
                <div class="gallery-placeholder">
                    <img id="aiAnalyzeImage" src="placeholder_image.png" alt="Photo 1">
                    <img src="placeholder_image.png" alt="Photo 2">
                </div>
                <button id="viewAllPhotos">View All</button>
                <button id="analyzeImageAIButton" style="margin-top: 15px;">Analyze with Hawk Intelligence</button>
                <div id="aiAnalysisResult" class="ai-result-box" style="display:none;">
                    <p><strong>Analysis:</strong></p>
                    <p id="analysisText"></p>
                    <div id="analysisLoading" class="loading-spinner small-spinner" style="display:none;"></div>
                </div>
            `,
            init: (appElement) => {
                const analyzeButton = appElement.querySelector('#analyzeImageAIButton');
                const aiAnalyzeImage = appElement.querySelector('#aiAnalyzeImage');
                const aiAnalysisResultDiv = appElement.querySelector('#aiAnalysisResult');
                const analysisText = appElement.querySelector('#analysisText');
                const analysisLoading = appElement.querySelector('#analysisLoading');
                const viewAllPhotosButton = appElement.querySelector('#viewAllPhotos');

                if (viewAllPhotosButton) {
                    viewAllPhotosButton.addEventListener('click', () => {
                        createNotification('Photos', 'Opening full gallery view...');
                    });
                }
                
                if (analyzeButton && aiAnalyzeImage) {
                    analyzeButton.addEventListener('click', async () => {
                        aiAnalysisResultDiv.style.display = 'block';
                        analysisText.textContent = '';
                        analysisLoading.style.display = 'block';
                        analyzeButton.disabled = true;

                        try {
                            const imageUrl = aiAnalyzeImage.src; 
                            const completion = await websim.chat.completions.create({
                                messages: [
                                    {
                                        role: "user",
                                        content: [
                                            { type: "text", text: "Describe this image in detail." },
                                            { type: "image_url", image_url: { url: imageUrl } },
                                        ],
                                    },
                                ],
                            });

                            const siriResponse = completion.content;
                            analysisText.textContent = siriResponse;
                        } catch (error) {
                            console.error("AI analysis error:", error);
                            analysisText.textContent = 'Error analyzing image. Please try again.';
                        } finally {
                            analysisLoading.style.display = 'none';
                            analyzeButton.disabled = false;
                        }
                    });
                }
            }
        },
        {
            id: 'googleMeetApp',
            name: 'Meet',
            icon: 'google_meet_icon.png',
            header: 'Google Meet',
            contentHTML: `
                <p>Join or start a video meeting.</p>
                <button>New Meeting</button>
                <input type="text" placeholder="Enter meeting code" style="margin-top: 15px;">
                <button style="margin-top: 15px;">Join</button>
            `
        },
        {
            id: 'oppoGameApp',
            name: 'Oppo Game',
            icon: 'oppo_game_icon.png',
            header: 'Oppo Game',
            contentHTML: `
                <p>A fun game from Oppo!</p>
                <button>Start Game</button>
            `
        },
        {
            id: 'calculatorApp',
            name: 'Calculator',
            icon: 'calculator_icon.png',
            header: 'Calculator',
            contentHTML: `
                <p>Perform calculations.</p>
                <input type="text" value="0" readonly style="width: 90%; text-align: right; font-size: 2em; margin-bottom: 15px; background-color: #333; color: #eee; border: none; padding: 10px; border-radius: 12px;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; width: 90%; max-width: 300px;">
                    <button>7</button><button>8</button><button>9</button><button>/</button>
                    <button>4</button><button>5</button><button>6</button><button>*</button>
                    <button>1</button><button>2</button><button>3</button><button>-</button>
                    <button>0</button><button>.</button><button>=</button><button>+</button>
                </div>
            `
        },
        {
            id: 'gmailApp',
            name: 'Gmail',
            icon: 'gmail_icon.png',
            header: 'Gmail',
            contentHTML: `
                <p>Your inbox at a glance.</p>
                <button>Check Inbox</button>
                <button style="margin-top: 15px;">Compose New Email</button>
            `
        },
        {
            id: 'auroraStoreApp',
            name: 'Aurora Store',
            icon: 'aurora_store_icon.png',
            header: 'Aurora Store',
            contentHTML: `
                <p>An alternative app store.</p>
                <button>Browse Apps</button>
                <button style="margin-top: 15px;">Updates</button>
            `
        },
        {
            id: 'amazingVMApp',
            name: 'AmazingVM',
            icon: 'amazing_vm_icon.png',
            header: 'AmazingVM',
            contentHTML: `
                <p>Connect to amazing virtual machines.</p>
                <button>Connect to VM</button>
                <button style="margin-top: 15px;">Server List</button>
            `
        },
        {
            id: 'tiktokApp',
            name: 'TikTok',
            icon: 'tiktok_icon.png',
            header: 'TikTok',
            contentHTML: `
                <p>Watch short videos and share your creativity!</p>
                <button>Open For You Page</button>
                <button style="margin-top: 15px;">Record New Video</button>
            `
        },
        {
            id: 'northKoreaApps',
            name: 'NK Apps',
            icon: 'north_korea_icon.png',
            header: 'NK Apps — KCTV & KCNA Watch',
            contentHTML: `
                <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
                    <p style="margin:0 0 8px 0;">Watch or browse Korea Central TV (KCTV) livestreams and archives, and read KCNA feeds for research/private study.</p>

                    <h4>KCTV Live (PAL 720×576)</h4>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        <button id="kctvOpenLiveBtn" style="padding:10px 14px;background:var(--primary-color);color:var(--on-primary-color);">Open Live Player (mpd)</button>
                        <button id="kctvOpenHlsBtn" style="padding:10px 14px;background:var(--outline-color);">Open Live (HLS .m3u8)</button>
                        <button id="kctvOpenMpdBtn" style="padding:10px 14px;background:var(--outline-color);">Open Live (MPD)</button>
                        <button id="kctvOpenInNewTab" style="padding:10px 14px;background:var(--outline-color);">Open manifest in new tab</button>
                        <label style="display:flex;align-items:center;gap:8px;margin-left:auto;">
                            <input id="kctvAutoOnOutgoing" type="checkbox">
                            <span style="font-size:0.95em;">Auto KCTV on outgoing</span>
                        </label>
                    </div>
                    <div id="kctvPlayerWrap" style="width:100%;max-width:720px;background:var(--surface-color);padding:12px;border-radius:12px;display:none;flex-direction:column;gap:8px;">
                        <div style="font-size:0.95em;color:var(--on-surface-color);">KCTV [Livestream] — PAL 720×576 (beta)</div>
                        <video id="kctvPlayer" controls playsinline style="width:100%;height:auto;background:#000;border-radius:8px;">
                            <source id="kctvSource" src="https://streamer.nknews.org/tvdash/stream.mpd" type="application/dash+xml">
                            Your browser cannot play this stream directly; open in a supporting player.
                        </video>
                        <div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Note: DASH manifest provided; some browsers may require a DASH-capable player or external player support.</div>
                    </div>

                    <h4>KCTV Archive & KCNA</h4>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button id="kctvArchiveBtn" style="padding:10px 14px;">Open KCTV Archive (last 24h)</button>
                            <button id="kcnaEnBtn" style="padding:10px 14px;background:var(--outline-color);">KCNA (EN) — Latest Articles</button>
                            <button id="kcnaKrBtn" style="padding:10px 14px;background:var(--outline-color);">KCNA (KR) — Latest (korea only)</button>
                        </div>
                        <div id="kctvArchiveInfo" style="font-size:0.9em;color:var(--on-surface-color);">
                            KCTV Archive: videos published in the last 24 hours; KCNA archive and article counts are shown when available.
                        </div>
                    </div>

                    <h4>Schedule & Disclaimer</h4>
                    <div style="background:rgba(0,0,0,0.02);padding:10px;border-radius:8px;font-size:0.9em;color:var(--on-surface-color);">
                        <strong>Schedule:</strong>
                        <ul style="margin:6px 0 0 18px;">
                            <li>News broadcasts at 5:00pm, 8:00pm, and 10:30pm daily</li>
                            <li>TV broadcasts Mon–Fri from 3:00–10:30pm</li>
                            <li>Sunday/holidays and 1st/11th/21st of month: 9:00–10:30pm (Pyongyang time)</li>
                        </ul>
                        <p style="margin-top:8px;"><strong>Disclaimer:</strong> KCNA Watch provides publicly available signals for research and private study and does not derive income from sourced signals; services comply with applicable sanctions and provide material for public-interest research.</p>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const openLiveBtn = appElement.querySelector('#kctvOpenLiveBtn');
                const openHlsBtn = appElement.querySelector('#kctvOpenHlsBtn');
                const openMpdBtn = appElement.querySelector('#kctvOpenMpdBtn');
                const openInNewTabBtn = appElement.querySelector('#kctvOpenInNewTab');
                const kctvPlayerWrap = appElement.querySelector('#kctvPlayerWrap');
                const kctvPlayer = appElement.querySelector('#kctvPlayer');
                const kctvSource = appElement.querySelector('#kctvSource');
                const archiveBtn = appElement.querySelector('#kctvArchiveBtn');
                const kcnaEnBtn = appElement.querySelector('#kcnaEnBtn');
                const kcnaKrBtn = appElement.querySelector('#kcnaKrBtn');
                const autoToggle = appElement.querySelector('#kctvAutoOnOutgoing');

                // restore auto toggle preference
                autoToggle.checked = localStorage.getItem('kctvAutoOnOutgoing') === 'true';
                autoToggle.addEventListener('change', () => {
                    localStorage.setItem('kctvAutoOnOutgoing', autoToggle.checked ? 'true' : 'false');
                    createNotification('KCTV', `Auto KCTV on outgoing ${autoToggle.checked ? 'enabled' : 'disabled'}.`);
                });

                // helper to show player area and set source; supports mpd and m3u8 (HLS)
                function playStream(url, typeLabel) {
                    kctvPlayerWrap.style.display = 'flex';
                    // clear any previous source children
                    try {
                        // If the player has <source id="kctvSource"> present (mpd path), update it; otherwise set src directly
                        if (kctvSource) {
                            // if using mpd, set source's src and set type attribute; otherwise set video.src to url and remove source element
                            if (url.endsWith('.mpd')) {
                                kctvSource.src = url;
                                // set type attribute if available
                                kctvSource.type = 'application/dash+xml';
                                // ensure video element uses the source
                                kctvPlayer.load();
                            } else {
                                // for m3u8/hls: many browsers only Safari supports natively; set src directly and attempt play
                                // remove <source> to avoid conflicts
                                if (kctvSource && kctvSource.parentNode) {
                                    try { kctvSource.parentNode.removeChild(kctvSource); } catch (e) {}
                                }
                                kctvPlayer.src = url;
                                kctvPlayer.load();
                            }
                        } else {
                            // fallback: set src directly
                            kctvPlayer.src = url;
                            kctvPlayer.load();
                        }

                        kctvPlayer.play().catch(()=>{ /* autoplay blocked */ });
                        createNotification('KCTV', `Attempting to play KCTV livestream (${typeLabel}).`);
                    } catch (e) {
                        console.warn('KCTV play error', e);
                        createNotification('KCTV', 'Failed to start playback in this browser; try opening the manifest in a supporting player.');
                    }
                }

                // Primary button: play mpd (DASH) as before
                if (openLiveBtn) {
                    openLiveBtn.addEventListener('click', () => {
                        playStream('https://streamer.nknews.org/tvdash/stream.mpd', 'MPD (DASH)');
                    });
                }

                // HLS button: m3u8 stream
                if (openHlsBtn) {
                    openHlsBtn.addEventListener('click', () => {
                        // HLS: many desktop browsers need Hls.js; fallback to direct src (Safari supports natively)
                        const hlsUrl = 'https://streamer.nknews.org/tvhls/stream.m3u8';
                        playStream(hlsUrl, 'HLS (.m3u8)');
                    });
                }

                // MPD explicit button: same as live mpd but provided for clarity
                if (openMpdBtn) {
                    openMpdBtn.addEventListener('click', () => {
                        const mpdUrl = 'https://streamer.nknews.org/tvdash/stream.mpd';
                        playStream(mpdUrl, 'MPD (DASH)');
                    });
                }

                // Open manifest(s) in new tab: allow user to pick based on current UI preference
                if (openInNewTabBtn) {
                    openInNewTabBtn.addEventListener('click', () => {
                        try {
                            // open both manifest types in separate tabs for convenience
                            window.open('https://streamer.nknews.org/tvhls/stream.m3u8', '_blank', 'noopener');
                            window.open('https://streamer.nknews.org/tvdash/stream.mpd', '_blank', 'noopener');
                            createNotification('KCTV', 'Opened HLS (.m3u8) and DASH (.mpd) manifests in new tabs.');
                        } catch (e) {
                            createNotification('KCTV', 'Failed to open manifests (popup blocked?).');
                        }
                    });
                }

                archiveBtn.addEventListener('click', () => {
                    try {
                        window.open('https://kcnawatch.org/kctv-archive/', '_blank', 'noopener');
                        createNotification('KCTV Archive', 'Opened KCTV archive (kcnawatch).');
                    } catch (e) {
                        createNotification('KCTV Archive', 'Failed to open archive (popup blocked).');
                    }
                });

                kcnaEnBtn.addEventListener('click', async () => {
                    try {
                        window.open('https://kcnawatch.org/', '_blank', 'noopener');
                        createNotification('KCNA', 'Opened KCNA Watch (EN).');
                    } catch (e) {
                        createNotification('KCNA', 'Failed to open KCNA Watch (popup blocked).');
                    }
                });

                kcnaKrBtn.addEventListener('click', () => {
                    try {
                        window.open('https://kcnawatch.org/article/183982/', '_blank', 'noopener');
                        createNotification('KCNA (KR)', 'Opened KCNA KR feed.');
                    } catch (e) {
                        createNotification('KCNA (KR)', 'Failed to open KCNA KR (popup blocked).');
                    }
                });

                // Expose a helper that other apps or outgoing actions can call to auto-open KCTV if enabled
                window._maybeAutoOpenKCTV = function(reasonText) {
                    try {
                        const enabled = localStorage.getItem('kctvAutoOnOutgoing') === 'true';
                        if (!enabled) return false;
                        // show notification and open player
                        createNotification('KCTV Auto', `Auto-opening KCTV due to: ${reasonText || 'outgoing action'}`);
                        // show KCTV app view if screen on
                        if (!isScreenOn) toggleScreenOn();
                        showApp('northKoreaApps');
                        setTimeout(() => {
                            // simulate click to open live (choose DASH by default)
                            const btn = document.getElementById('kctvOpenLiveBtn');
                            if (btn) btn.click();
                        }, 300);
                        return true;
                    } catch (e) {
                        console.warn('Auto open KCTV failed', e);
                        return false;
                    }
                };

                // optional: show counts/summary for KCNA (best-effort fetch)
                async function fetchKCNASummary() {
                    try {
                        // lightweight fetch to kcnawatch to attempt to extract article counts (best-effort)
                        const resp = await fetch('https://kcnawatch.org/');
                        if (!resp.ok) return;
                        const text = await resp.text();
                        // best-effort regex to find "articles" numbers (not guaranteed)
                        const match = text.match(/([0-9,]{1,})\s+articles/i);
                        if (match && match[1]) {
                            createNotification('KCNA', `KCNA archive samples: ${match[1]} articles (scraped).`);
                        }
                    } catch (e) {
                        // ignore fetch failures (CORS, blocking)
                    }
                }
                // run a background summary attempt
                setTimeout(fetchKCNASummary, 1200);
            }
        },
        {
            id: 'clockApp',
            name: 'Clock',
            icon: 'clock_icon.png',
            header: 'Clock',
            contentHTML: `
                <p>Current Time: <span id="currentTime"></span></p>
                <button style="margin-top: 15px;">Set Alarm</button>
                <button style="margin-top: 15px;">Start Timer</button>
                <button style="margin-top: 15px;">Stopwatch</button>
            `,
            init: (appElement) => {
                const currentTimeSpan = appElement.querySelector('#currentTime');
                if (currentTimeSpan) {
                    const updateClockAppTime = () => { 
                        const now = new Date();
                        currentTimeSpan.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                    };
                    updateClockAppTime();
                }
            }
        },
        {
            id: 'r3dfoxApp',
            name: 'R3dFox',
            icon: 'r3dfox_icon.png',
            header: 'R3dFox Browser',
            contentHTML: `
                <p>Browse the web with R3dFox.</p>
                <button>Launch Browser</button>
            `
        },
        {
            id: 'supermiumApp',
            name: 'Supermium',
            icon: 'supermium_icon.png',
            header: 'Supermium Browser',
            contentHTML: `
                <p>A super fast browser experience.</p>
                <button>Launch Browser</button>
            `
        },
        {
            id: 'mypalApp',
            name: 'Mypal',
            icon: 'mypal_icon.png',
            header: 'Mypal Browser',
            contentHTML: `
                <p>A browser built for privacy.</p>
                <button>Launch Browser</button>
            `
        },
        {
            id: 'windowsApp',
            name: 'Windows App',
            icon: 'windows_icon.png',
            header: 'Windows Emulator',
            contentHTML: `
                <p>Emulate a Windows desktop experience.</p>
                <button id="startWindowsEmulatorBtn">Start Emulator</button>
                <button id="configWindowsEmulatorBtn" style="margin-top: 15px;">Configuration</button>
            `,
            init: (appElement) => {
                const startBtn = appElement.querySelector('#startWindowsEmulatorBtn');
                const configBtn = appElement.querySelector('#configWindowsEmulatorBtn');

                if (startBtn) {
                    startBtn.addEventListener('click', () => {
                        if (typeof window.showWindowsEmulator === 'function') {
                            window.showWindowsEmulator();
                        } else {
                            createNotification('Windows Emulator', 'Emulator core not ready yet.');
                        }
                    });
                }

                if (configBtn) {
                    configBtn.addEventListener('click', () => {
                        createNotification('Windows Emulator', 'Configuration is not yet implemented (demo only).');
                    });
                }
            }
        },
        {
            id: 'office2010App',
            name: 'Microsoft Office 2010 SP2',
            icon: 'office2010_icon.png',
            header: 'Microsoft Office 2010 SP2',
            contentHTML: `
                <p>Your productivity suite is ready. Choose an application:</p>
                <button id="openWord" style="margin-top: 15px;">Microsoft Word 2010</button>
                <button id="openExcel" style="margin-top: 15px;">Microsoft Excel 2010</button>
                <button id="openPowerPoint" style="margin-top: 15px;">Microsoft PowerPoint 2010</button>
                <button id="openOutlook" style="margin-top: 15px;">Microsoft Outlook 2010</button>
                <button id="openOneNote" style="margin-top: 15px;">Microsoft OneNote 2010</button>
            `,
            init: (appElement) => {
                const addClickListener = (buttonId, appName) => {
                    const button = appElement.querySelector(`#${buttonId}`);
                    if (button) {
                        button.addEventListener('click', () => {
                            createNotification(appName, `Launching ${appName}...`);
                        });
                    }
                };

                addClickListener('openWord', 'Microsoft Word 2010');
                addClickListener('openExcel', 'Microsoft Excel 2010');
                addClickListener('openPowerPoint', 'Microsoft PowerPoint 2010');
                addClickListener('openOutlook', 'Microsoft Outlook 2010');
                addClickListener('openOneNote', 'Microsoft OneNote 2010');
            }
        },
        {
            id: 'colorNoteApp',
            name: 'ColorNote',
            icon: 'colornote_icon.png',
            header: 'ColorNote',
            contentHTML: `
                <p>Simple and fast notepad.</p>
                <button>New Note</button>
                <button style="margin-top: 15px;">View Notes</button>
            `
        },
        {
            id: 'radioFMApp',
            name: 'Radio FM',
            icon: 'radio_fm_icon.png',
            header: 'Radio FM',
            contentHTML: `
                <p>Listen to your favorite radio stations.</p>
                <button>Tune In</button>
                <button style="margin-top: 15px;">Stations List</button>
            `
        },
        {
            id: 'spotifyApp',
            name: 'Spotify',
            icon: 'spotify_icon.png',
            header: 'Spotify',
            contentHTML: `
                <p>Millions of songs and podcasts.</p>
                <button>Open Spotify</button>
                <button style="margin-top: 15px;">Browse Playlists</button>
            `
        },
        {
            id: 'robloxVNApp',
            name: 'Roblox VN',
            icon: 'roblox_vn_icon.png',
            header: 'Roblox Vietnam',
            contentHTML: `
                <p>Play Roblox experiences tailored for Vietnam!</p>
                <button>Launch Experience</button>
            `
        },
        {
            id: 'googleMapsApp',
            name: 'Maps',
            icon: 'google_maps_icon.png',
            header: 'Google Maps',
            contentHTML: `
                <p>Find your way around the world!</p>
                <button>Search for Places</button>
                <button style="margin-top: 15px;">Get Directions</button>
            `
        },
        {
            id: 'weatherApp',
            name: 'Weather',
            icon: 'weather_app_icon.png',
            header: 'Weather',
            contentHTML: `
                <p>Current City: London</p>
                <p>Temperature: 22°C</p>
                <p>Conditions: Sunny</p>
                <button>Refresh Weather</button>
                <button style="margin-top: 15px;">View Forecast</button>
            `,
            init: (appElement) => {
                const updateWeather = () => {
                    const cities = ['London', 'New York', 'Tokyo', 'Sydney', 'Paris', 'Hanoi'];
                    const conditions = ['Sunny', 'Partly Cloudy', 'Rainy', 'Cloudy', 'Stormy'];
                    const temperatures = [15, 20, 25, 30];

                    const randomCity = cities[Math.floor(Math.random() * cities.length)];
                    const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)] + Math.floor(Math.random() * 5); 
                    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

                    appElement.querySelector('p:nth-child(1)').textContent = `Current City: ${randomCity}`;
                    appElement.querySelector('p:nth-child(2)').textContent = `Temperature: ${randomTemp}°C`;
                    appElement.querySelector('p:nth-child(3)').textContent = `Conditions: ${randomCondition}`;
                };

                const refreshButton = appElement.querySelector('button');
                if (refreshButton) {
                    refreshButton.addEventListener('click', updateWeather);
                }
                updateWeather(); 
            }
        },
        {
            id: 'coolGameApp',
            name: 'Cool Game',
            icon: 'cool_game_icon.png',
            header: 'Cool Game',
            contentHTML: `
                <p>Welcome to the coolest game ever!</p>
                <button>Start Game</button>
                <button style="margin-top: 15px;">Leaderboards</button>
            `
        },
        {
            id: 'vmosProApp',
            name: 'VMOS Pro',
            icon: 'vmos_pro_icon.png',
            header: 'VMOS Pro',
            contentHTML: `
                <p>Run Android on Android with VMOS Pro.</p>
                <button>Launch Virtual Machine</button>
                <button style="margin-top: 15px;">Manage ROMs</button>
            `
        },
        {
            id: 'cocCocBrowserApp',
            name: 'Cốc Cốc',
            icon: 'coc_coc_icon.png',
            header: 'Cốc Cốc Browser',
            contentHTML: `
                <p>Browse the web with Cốc Cốc.</p>
                <button>Launch Browser</button>
            `
        },
        {
            id: 'vtvGoApp',
            name: 'VTV Go',
            icon: 'vtv_go_icon.png',
            header: 'VTV Go',
            contentHTML: `
                <p>Watch Vietnamese TV channels and shows.</p>
                <button>Open Live TV</button>
                <button style="margin-top: 15px;">Browse Shows</button>
            `
        },
        {
            id: 'recentAppsView',
            name: 'Recent Apps',
            icon: 'placeholder_image.png', 
            header: 'Recent Applications',
            contentHTML: `
                <ul id="recentAppsList" class="app-list">
                    
                </ul>
            `,
            init: (appElement) => {
                
            }
        },
        {
            id: 'allAppsView',
            name: 'All Apps',
            icon: 'placeholder_image.png', 
            header: 'All Applications',
            contentHTML: `
                <div id="allAppsGrid" class="app-grid">
                    
                </div>
            `,
            init: (appElement) => {
                
            }
        },
        {
            id: 'videoApp',
            name: 'Video',
            icon: 'placeholder_image.png',
            header: 'Video Player',
            contentHTML: `
                <div style="max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center;">
                    <p style="margin:0;">Play local video files, preview a URL, or select from project videos below.</p>

                    <div style="display:flex;gap:8px;width:100%;max-width:720px;align-items:center;">
                        <input id="videoUrlInput" type="text" placeholder="Paste video URL (optional)" class="url-bar" style="flex:1;">
                        <button id="videoLoadUrl" style="padding:10px 14px;">Load</button>
                        <input id="videoFileInput" type="file" accept="video/*" style="display:none;">
                        <button id="videoPickFile" style="padding:10px 14px;background:var(--outline-color);">Choose File</button>
                    </div>

                    <div id="videoPlayerWrap" style="width:100%;max-width:860px;background:var(--surface-color);padding:12px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:8px;">
                        <video id="videoPlayer" controls style="width:100%;height:auto;max-height:420px;background:#000;border-radius:8px;">
                            <source src="" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                            <button id="videoPlayPause">Play/Pause</button>
                            <button id="videoMute">Mute</button>
                            <button id="videoFull">Toggle Size</button>
                            <button id="videoPAL" title="Set 720×576 PAL">PAL 720×576</button>
                            <button id="videoNTSC" title="Set 720×480 NTSC">NTSC 720×480</button>
                        </div>
                        <div id="videoStatus" style="font-size:1.1em;color:var(--on-surface-color);">No video loaded.</div>
                    </div>

                    <div style="width:100%;max-width:860px;background:transparent;padding:6px;border-radius:8px;">
                        <h4 style="margin:8px 0;color:var(--primary-color);">Project Videos</h4>
                        <div id="projectVideoList" style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow:auto;background:rgba(0,0,0,0.02);padding:8px;border-radius:8px;"></div>
                    </div>

                </div>
            `,
            init: (appElement) => {
                const urlInput = appElement.querySelector('#videoUrlInput');
                const loadUrlBtn = appElement.querySelector('#videoLoadUrl');
                const fileInput = appElement.querySelector('#videoFileInput');
                const pickFileBtn = appElement.querySelector('#videoPickFile');
                const player = appElement.querySelector('#videoPlayer');
                const playPauseBtn = appElement.querySelector('#videoPlayPause');
                const muteBtn = appElement.querySelector('#videoMute');
                // create Stop button element (added)
                let stopBtn = null;
                const fullBtn = appElement.querySelector('#videoFull');
                const palBtn = appElement.querySelector('#videoPAL');
                const ntscBtn = appElement.querySelector('#videoNTSC');
                const status = appElement.querySelector('#videoStatus');
                const projectVideoList = appElement.querySelector('#projectVideoList');

                // Insert a Stop button into the control row (just before the Full/Toggle Size button)
                (function ensureStopButton() {
                    try {
                        const controlsRow = fullBtn ? fullBtn.parentElement : null;
                        if (!controlsRow) return;
                        stopBtn = document.createElement('button');
                        stopBtn.id = 'videoStop';
                        stopBtn.textContent = 'Stop';
                        stopBtn.style.padding = '8px 12px';
                        stopBtn.style.borderRadius = '10px';
                        stopBtn.style.border = 'none';
                        stopBtn.style.background = 'var(--outline-color)';
                        stopBtn.style.color = 'var(--on-surface-color)';
                        stopBtn.style.cursor = 'pointer';
                        // insert before the Full button for logical grouping
                        controlsRow.insertBefore(stopBtn, fullBtn);
                        // handler: stop playback and reset to start
                        stopBtn.addEventListener('click', () => {
                            if (!player) return;
                            player.pause();
                            try { player.currentTime = 0; } catch (e) {}
                            setStatus('Stopped.');
                            createNotification('Video', 'Playback stopped.');
                        });
                    } catch (e) {
                        console.warn('Failed to add Stop button', e);
                    }
                })();

                // keep track of preferred display size state for toggle
                let preferredSize = null; // {width, height} or null

                function setStatus(text) {
                    if (status) status.textContent = text;
                }

                // helper to set player display size (CSS) to emulate output resolution
                function applyPlayerDisplaySize(w, h) {
                    // set max-height to match aspect-ish and set container sizing styles
                    const wrap = appElement.querySelector('#videoPlayerWrap');
                    if (!wrap || !player) return;
                    // convert numeric to px
                    player.style.maxWidth = w + 'px';
                    player.style.maxHeight = h + 'px';
                    // adjust the wrap to allow the player to center and not overflow
                    wrap.style.width = '100%';
                    wrap.style.maxWidth = Math.max(360, w) + 'px';
                    // remember preferred size for Toggle
                    preferredSize = { width: w, height: h };
                    setStatus(`Player display set to ${w}×${h}`);
                }

                // List of project asset filenames to expose in the Video app
                const projectVideos = [
                    'noob vietnam song (Official Music Video) (1).mp4',
                    'song noob vietnam @katan-m5m.mp4',
                    'Noob Vietnam S2 - android 1_1 screen fire cpu new  @katan-m5m   ( funny vietnam ).mp4',
                    'noob vietnam  @Kaka Hieu  HAHAAHA part 3.mp4',
                    'noob vietnam 2026 fire cpu new KatanHieu ( funny vietnam ).mp4',
                    'noob vietnam boat.mp4',
                    'laptop 1_1 screen fire cpu_gpu new @vm67vakatanvm ( funny vietnam ).mp4',
                    'delete windows 11.mp4',
                    'noob vietnam island song.mp4',
                    'delete windows 10.mp4',
                    'computer 1_1 screen fire cpu_gpu new @katan2011vm  ( funny vietnam ).mp4',
                    'android 1_1 screen fire cpu new @katan-m5m  ( funny vietnam ).mp4',
                    'android 1_1 screen fire cpu new @katan2011vm  ( funny vietnam ) HD! Fixed.mp4',
                    '0113 (3)(3).mp4'
                ];

                function createProjectList() {
                    projectVideoList.innerHTML = '';
                    projectVideos.forEach(fname => {
                        const row = document.createElement('div');
                        row.style.display = 'flex';
                        row.style.justifyContent = 'space-between';
                        row.style.alignItems = 'center';
                        row.style.padding = '8px';
                        row.style.borderRadius = '6px';
                        row.style.background = 'transparent';
                        row.innerHTML = `
                            <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;">${fname}</div>
                            <div style="display:flex;gap:8px;">
                                <button class="pv-play" data-file="${fname}" style="padding:6px 10px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Play</button>
                                <button class="pv-open" data-file="${fname}" style="padding:6px 10px;border-radius:8px;border:none;background:var(--outline-color);">Open</button>
                            </div>
                        `;
                        projectVideoList.appendChild(row);
                    });

                    projectVideoList.querySelectorAll('.pv-play').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const f = btn.dataset.file;
                            if (!f) return;
                            // Attempt to load project asset URL directly by name
                            player.pause();
                            player.src = f;
                            player.load();
                            player.play().catch(()=>{});
                            setStatus(`Playing project video: ${f}`);
                            createNotification('Video', `Playing ${f}`);
                        });
                    });

                    projectVideoList.querySelectorAll('.pv-open').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const f = btn.dataset.file;
                            if (!f) return;
                            // open file in a new tab if possible
                            try {
                                window.open(f, '_blank', 'noopener');
                                createNotification('Video', `Opened ${f} in new tab (if supported).`);
                            } catch (e) {
                                createNotification('Video', `Could not open ${f}.`);
                            }
                        });
                    });
                }

                // Basic URL load
                loadUrlBtn.addEventListener('click', () => {
                    const url = (urlInput.value || '').trim();
                    if (!url) {
                        createNotification('Video', 'No URL provided.');
                        return;
                    }
                    player.pause();
                    player.src = url;
                    player.load();
                    player.play().catch(()=>{});
                    setStatus(`Playing URL: ${url}`);
                    createNotification('Video', 'Loaded video URL.');
                });

                // Local file picker
                pickFileBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', () => {
                    const f = fileInput.files && fileInput.files[0];
                    if (!f) { setStatus('No file selected.'); return; }
                    const url = URL.createObjectURL(f);
                    player.pause();
                    player.src = url;
                    player.load();
                    player.play().catch(()=>{});
                    setStatus(`Playing file: ${f.name}`);
                    createNotification('Video', `Playing ${f.name}`);
                });

                // Player controls
                playPauseBtn.addEventListener('click', () => {
                    if (player.paused) { player.play().catch(()=>{}); createNotification('Video', 'Playback started.'); }
                    else { player.pause(); createNotification('Video', 'Playback paused.'); }
                });
                muteBtn.addEventListener('click', () => {
                    player.muted = !player.muted;
                    muteBtn.textContent = player.muted ? 'Unmute' : 'Mute';
                });

                // Toggle size button: if preferredSize set, toggle between preferred display size and fluid
                fullBtn.addEventListener('click', () => {
                    const wrap = appElement.querySelector('#videoPlayerWrap');
                    if (!preferredSize) {
                        // default to a larger fluid fullscreen attempt
                        if (player.requestFullscreen) player.requestFullscreen().catch(()=>{});
                        else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
                        createNotification('Video', 'Requested fullscreen.');
                        return;
                    }
                    // toggle between preferred display and responsive full width
                    const isApplied = player.style.maxWidth && player.style.maxWidth.endsWith(preferredSize.width + 'px');
                    if (isApplied) {
                        // revert to responsive
                        player.style.maxWidth = '';
                        player.style.maxHeight = '';
                        wrap.style.maxWidth = '860px';
                        setStatus('Player display reverted to responsive.');
                    } else {
                        applyPlayerDisplaySize(preferredSize.width, preferredSize.height);
                    }
                });

                palBtn.addEventListener('click', () => {
                    // PAL 720x576
                    applyPlayerDisplaySize(720, 576);
                    createNotification('Video', 'Player set to PAL 720×576 display size.');
                });
                ntscBtn.addEventListener('click', () => {
                    // NTSC 720x480
                    applyPlayerDisplaySize(720, 480);
                    createNotification('Video', 'Player set to NTSC 720×480 display size.');
                });

                player.addEventListener('ended', () => setStatus('Playback finished.'));
                player.addEventListener('play', () => setStatus('Playing...'));
                player.addEventListener('pause', () => setStatus('Paused.'));
                player.addEventListener('error', () => setStatus('Playback error.'));

                // initialize project video list UI
                createProjectList();
            }
        }
    ];

    /* --- Insert Magisk app (Magisk Home / Superroot / Modules / Logs) --- */
    apps.push({
        id: 'magiskApp',
        name: 'Magisk Manager',
        icon: 'memz_virus_icon.png',
        header: 'Magisk Home',
        contentHTML: `
        <div style="max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <button id="magiskHomeBtn" style="padding:8px 12px;">Home</button>
                <button id="magiskSuperrootBtn" style="padding:8px 12px;">Superroot</button>
                <button id="magiskModulesBtn" style="padding:8px 12px;">Modules</button>
                <button id="magiskLogsBtn" style="padding:8px 12px;">Logs</button>
                <div style="margin-left:auto;color:var(--primary-color);font-weight:700;">Magisk (simulated)</div>
            </div>
            <div id="magiskBody" style="background:var(--surface-color);padding:12px;border-radius:12px;min-height:320px;">
                <div id="magiskHomeView">
                    <p style="margin:0 0 8px 0;">Magisk provides systemless root via Magic Mounts. Use the tabs above to manage modules and view logs (simulation only).</p>
                    <div style="display:flex;gap:8px;">
                        <button id="magiskCheckStatus" style="padding:8px 12px;">Check Status</button>
                        <button id="magiskToggleRoot" style="padding:8px 12px;">Toggle Root</button>
                    </div>
                    <div id="magiskStatus" style="margin-top:10px;color:var(--on-surface-color);">Status: Unknown</div>
                </div>
                <div id="magiskSuperrootView" style="display:none;">
                    <p style="margin:0 0 8px 0;">Superroot (simulated) grants elevated permissions to trusted apps.</p>
                    <label style="display:flex;gap:8px;align-items:center;">
                        <input type="checkbox" id="magiskSuperrootToggle">
                        Enable Superroot (simulation)
                    </label>
                    <div style="margin-top:10px;">
                        <button id="magiskGrantSuperroot" style="padding:8px 12px;">Grant to App</button>
                        <button id="magiskRevokeSuperroot" style="padding:8px 12px;background:#dc3545;color:#fff;">Revoke</button>
                    </div>
                    <div id="magiskSuperrootStatus" style="margin-top:10px;color:var(--on-surface-color);">Superroot: Off</div>
                </div>
                <div id="magiskModulesView" style="display:none;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>Installed Modules</strong>
                        <button id="magiskScanModules" style="padding:6px 10px;">Scan</button>
                    </div>
                    <div id="magiskModulesList" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;max-height:220px;overflow:auto;">
                        <!-- Modules loaded dynamically -->
                    </div>
                    <div style="margin-top:8px;display:flex;gap:8px;">
                        <input id="magiskModuleUrl" placeholder="Module ZIP URL (simulated)" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--outline-color);">
                        <button id="magiskInstallModule" style="padding:8px 12px;background:var(--primary-color);color:var(--on-primary-color);">Install</button>
                    </div>
                </div>
                <div id="magiskLogsView" style="display:none;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>Magisk Logs</strong>
                        <div>
                            <button id="magiskRefreshLogs" style="padding:6px 10px;">Refresh</button>
                            <button id="magiskClearLogs" style="padding:6px 10px;background:#dc3545;color:#fff;">Clear</button>
                        </div>
                    </div>
                    <pre id="magiskLogsArea" style="margin-top:10px;background:rgba(0,0,0,0.06);padding:10px;border-radius:8px;max-height:340px;overflow:auto;font-family:ui-monospace,monospace;font-size:0.95em;">No logs yet.</pre>
                </div>
            </div>
        </div>
    `,
        init: (appElement) => {
            const homeBtn = appElement.querySelector('#magiskHomeBtn');
            const superrootBtn = appElement.querySelector('#magiskSuperrootBtn');
            const modulesBtn = appElement.querySelector('#magiskModulesBtn');
            const logsBtn = appElement.querySelector('#magiskLogsBtn');

            const homeView = appElement.querySelector('#magiskHomeView');
            const superView = appElement.querySelector('#magiskSuperrootView');
            const modulesView = appElement.querySelector('#magiskModulesView');
            const logsView = appElement.querySelector('#magiskLogsView');

            const statusEl = appElement.querySelector('#magiskStatus');
            const toggleRootBtn = appElement.querySelector('#magiskToggleRoot');
            const checkStatusBtn = appElement.querySelector('#magiskCheckStatus');

            const superToggle = appElement.querySelector('#magiskSuperrootToggle');
            const grantSuperBtn = appElement.querySelector('#magiskGrantSuperroot');
            const revokeSuperBtn = appElement.querySelector('#magiskRevokeSuperroot');
            const superStatus = appElement.querySelector('#magiskSuperrootStatus');

            const modulesList = appElement.querySelector('#magiskModulesList');
            const scanModulesBtn = appElement.querySelector('#magiskScanModules');
            const installModuleBtn = appElement.querySelector('#magiskInstallModule');
            const moduleUrlInput = appElement.querySelector('#magiskModuleUrl');

            const logsArea = appElement.querySelector('#magiskLogsArea');
            const refreshLogsBtn = appElement.querySelector('#magiskRefreshLogs');
            const clearLogsBtn = appElement.querySelector('#magiskClearLogs');

            // Simulated state
            let rooted = localStorage.getItem('sim_magisk_rooted') === 'true';
            let superroot = localStorage.getItem('sim_magisk_superroot') === 'true';
            let modules = JSON.parse(localStorage.getItem('sim_magisk_modules') || '[]');
            let logs = JSON.parse(localStorage.getItem('sim_magisk_logs') || '[]');

            function renderStatus() {
                statusEl.textContent = rooted ? 'Status: Rooted (Magisk present)' : 'Status: Not rooted';
                toggleRootBtn.textContent = rooted ? 'Unroot (simulate)' : 'Root (simulate)';
            }

            function showView(view) {
                [homeView, superView, modulesView, logsView].forEach(v => v.style.display = 'none');
                view.style.display = '';
            }

            function renderModules() {
                modulesList.innerHTML = '';
                if (!modules.length) {
                    modulesList.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No modules installed.</div>';
                    return;
                }
                modules.forEach((m, idx) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '8px';
                    row.style.borderRadius = '8px';
                    row.style.background = 'transparent';
                    row.innerHTML = `<div style="flex:1;"><strong>${m.name}</strong><div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${m.desc || 'Module'}</div></div>
                                     <div style="display:flex;gap:8px;">
                                         <button class="mod-toggle" data-idx="${idx}" style="padding:6px;border-radius:8px;background:var(--outline-color);">Toggle</button>
                                         <button class="mod-remove" data-idx="${idx}" style="padding:6px;border-radius:8px;background:#dc3545;color:#fff;">Remove</button>
                                     </div>`;
                    modulesList.appendChild(row);
                });
                modulesList.querySelectorAll('.mod-remove').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.dataset.idx,10);
                        const removed = modules.splice(i,1);
                        localStorage.setItem('sim_magisk_modules', JSON.stringify(modules));
                        renderModules();
                        appendLog(`Module removed: ${removed[0].name}`);
                        createNotification('Magisk', `Removed ${removed[0].name} (simulated).`);
                    });
                });
                modulesList.querySelectorAll('.mod-toggle').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.dataset.idx,10);
                        modules[i].enabled = !modules[i].enabled;
                        localStorage.setItem('sim_magisk_modules', JSON.stringify(modules));
                        renderModules();
                        appendLog(`Module ${modules[i].name} ${modules[i].enabled ? 'enabled' : 'disabled'}`);
                        createNotification('Magisk', `${modules[i].name} ${modules[i].enabled ? 'enabled' : 'disabled'} (simulated).`);
                    });
                });
            }

            function appendLog(text) {
                const entry = { t: Date.now(), text };
                logs.unshift(entry);
                logs = logs.slice(0,200);
                localStorage.setItem('sim_magisk_logs', JSON.stringify(logs));
                renderLogs();
            }
            function renderLogs() {
                if (!logs.length) {
                    logsArea.textContent = 'No logs yet.';
                    return;
                }
                logsArea.textContent = logs.map(l => `[${new Date(l.t).toLocaleString()}] ${l.text}`).join('\n\n');
            }

            // Handlers
            if (checkStatusBtn) checkStatusBtn.addEventListener('click', () => {
                renderStatus();
                appendLog(`Checked Magisk status: ${rooted ? 'rooted' : 'not rooted'}`);
                createNotification('Magisk', `Magisk status: ${rooted ? 'Rooted' : 'Not rooted'}`);
            });
            if (toggleRootBtn) toggleRootBtn.addEventListener('click', async () => {
                rooted = !rooted;
                localStorage.setItem('sim_magisk_rooted', rooted ? 'true' : 'false');
                renderStatus();
                appendLog(rooted ? 'Magisk installed (simulated root enabled)' : 'Magisk uninstalled (simulated root disabled)');
                createNotification('Magisk', rooted ? 'Root enabled (simulated)' : 'Root disabled (simulated)');
            });

            if (superToggle) {
                superToggle.checked = superroot;
                superToggle.addEventListener('change', (e) => {
                    superroot = e.target.checked;
                    localStorage.setItem('sim_magisk_superroot', superroot ? 'true' : 'false');
                    superStatus.textContent = `Superroot: ${superroot ? 'On' : 'Off'}`;
                    appendLog(`Superroot ${superroot ? 'enabled' : 'disabled'}`);
                    createNotification('Magisk', `Superroot ${superroot ? 'enabled' : 'disabled'} (simulated).`);
                });
            }
            if (grantSuperBtn) grantSuperBtn.addEventListener('click', () => {
                appendLog('Granted Superroot to app: com.example.app (simulated)');
                createNotification('Magisk', 'Granted Superroot to app (simulated).');
            });
            if (revokeSuperBtn) revokeSuperBtn.addEventListener('click', () => {
                appendLog('Revoked Superroot from app: com.example.app (simulated)');
                createNotification('Magisk', 'Revoked Superroot from app (simulated).');
            });

            if (scanModulesBtn) scanModulesBtn.addEventListener('click', () => {
                appendLog('Scanned modules directory (simulated).');
                createNotification('Magisk', 'Module scan complete (simulated).');
                renderModules();
            });
            if (installModuleBtn) installModuleBtn.addEventListener('click', async () => {
                const url = (moduleUrlInput.value || '').trim();
                if (!url) { createNotification('Magisk', 'Enter a module URL (simulated).'); return; }
                const mod = { name: url.split('/').pop().split('.zip')[0] || 'module-' + (Math.random()*1000|0), desc: 'Installed from URL', enabled: true };
                modules.unshift(mod);
                localStorage.setItem('sim_magisk_modules', JSON.stringify(modules));
                moduleUrlInput.value = '';
                renderModules();
                appendLog(`Module installed: ${mod.name} (simulated)`);
                createNotification('Magisk', `${mod.name} installed (simulated).`);
            });

            if (refreshLogsBtn) refreshLogsBtn.addEventListener('click', () => {
                appendLog('Refreshed Magisk logs (simulated).');
                renderLogs();
                createNotification('Magisk', 'Logs refreshed (simulated).');
            });
            if (clearLogsBtn) clearLogsBtn.addEventListener('click', () => {
                if (!confirm('Clear Magisk logs (simulation)?')) return;
                logs = [];
                localStorage.setItem('sim_magisk_logs', JSON.stringify(logs));
                renderLogs();
                createNotification('Magisk', 'Logs cleared (simulated).');
            });

            // Navigation handlers for tabs
            homeBtn.addEventListener('click', () => showView(homeView));
            superrootBtn.addEventListener('click', () => showView(superView));
            modulesBtn.addEventListener('click', () => showView(modulesView));
            logsBtn.addEventListener('click', () => showView(logsView));

            // initial render
            renderStatus();
            renderModules();
            renderLogs();
        }
    });

    // Add dedicated Microsoft PowerPoint 2010 demo app
    apps.push({
        id: 'powerpoint2010App',
        name: 'Microsoft PowerPoint 2010',
        icon: 'office2010_icon.png',
        header: 'Microsoft PowerPoint 2010',
        contentHTML: `
            <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
                <strong>Microsoft PowerPoint 2010 — Demo</strong>
                <p style="margin:0;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">PowerPoint is used to create slideshows for school, business, teaching, and simple animations.</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                    <button id="pptNewDeck">New Presentation</button>
                    <button id="pptAddSlide">Add Slide</button>
                    <button id="pptAddImage">Insert Image</button>
                    <button id="pptAddChart">Insert Chart</button>
                    <button id="pptPlaySlideshow">Present</button>
                </div>

                <div id="pptDeckPreview" style="background:var(--surface-color);padding:12px;border-radius:12px;min-height:260px;">
                    <div id="pptSlides" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
                    <div id="pptStatus" style="margin-top:8px;color:var(--on-surface-color);font-size:0.95em;">Slides: 0 · Format: .pptx</div>
                </div>
            </div>
        `,
        init: (appElement) => {
            const slidesWrap = appElement.querySelector('#pptSlides');
            const status = appElement.querySelector('#pptStatus');
            const newBtn = appElement.querySelector('#pptNewDeck');
            const addSlideBtn = appElement.querySelector('#pptAddSlide');
            const addImageBtn = appElement.querySelector('#pptAddImage');
            const addChartBtn = appElement.querySelector('#pptAddChart');
            const presentBtn = appElement.querySelector('#pptPlaySlideshow');

            let slides = [];

            function renderSlides() {
                slidesWrap.innerHTML = '';
                slides.forEach((s, i) => {
                    const el = document.createElement('div');
                    el.style.width = '180px';
                    el.style.height = '110px';
                    el.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.04))';
                    el.style.border = '1px solid rgba(255,255,255,0.03)';
                    el.style.borderRadius = '8px';
                    el.style.padding = '8px';
                    el.style.boxSizing = 'border-box';
                    el.innerHTML = `<strong style="display:block;font-size:0.95em;margin-bottom:6px;">Slide ${i+1}: ${s.title || 'Untitled'}</strong><div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${s.content || ''}</div>`;
                    slidesWrap.appendChild(el);
                });
                status.textContent = `Slides: ${slides.length} · Format: .pptx`;
            }

            newBtn.addEventListener('click', () => {
                slides = [];
                renderSlides();
                createNotification('PowerPoint', 'New presentation created.');
            });

            addSlideBtn.addEventListener('click', () => {
                const title = prompt('Slide title:', `Slide ${slides.length + 1}`) || `Slide ${slides.length + 1}`;
                const content = prompt('Slide content (short):', 'Main points or notes') || '';
                slides.push({ title, content });
                renderSlides();
                createNotification('PowerPoint', `Added slide "${title}".`);
            });

            addImageBtn.addEventListener('click', async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.style.display = 'none';
                document.body.appendChild(input);
                input.click();
                input.addEventListener('change', () => {
                    if (!input.files || !input.files[0]) {
                        createNotification('PowerPoint', 'No image selected.');
                        document.body.removeChild(input);
                        return;
                    }
                    const url = URL.createObjectURL(input.files[0]);
                    slides.push({ title: `Image ${slides.length+1}`, content: `<img src="${url}" style="max-width:100%;border-radius:6px;">` });
                    renderSlides();
                    createNotification('PowerPoint', 'Image inserted into slide.');
                    document.body.removeChild(input);
                }, { once: true });
            });

            addChartBtn.addEventListener('click', () => {
                const chartTitle = prompt('Chart title:', 'Sales') || 'Chart';
                slides.push({ title: chartTitle, content: 'Chart (placeholder) — use real data in desktop PowerPoint.' });
                renderSlides();
                createNotification('PowerPoint', `Inserted placeholder chart "${chartTitle}".`);
            });

            presentBtn.addEventListener('click', () => {
                if (!slides.length) {
                    createNotification('PowerPoint', 'No slides to present. Add slides first.');
                    return;
                }
                // Simple slideshow modal
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.inset = '0';
                modal.style.background = 'rgba(0,0,0,0.85)';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.zIndex = 9999;
                let idx = 0;
                const slideBox = document.createElement('div');
                slideBox.style.width = '720px';
                slideBox.style.height = '420px';
                slideBox.style.background = '#111';
                slideBox.style.color = '#fff';
                slideBox.style.borderRadius = '12px';
                slideBox.style.padding = '24px';
                slideBox.style.boxSizing = 'border-box';
                slideBox.innerHTML = `<h2 id="pptViewTitle" style="margin-top:0;"></h2><div id="pptViewContent" style="font-size:1.1em;"></div>`;
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Exit';
                closeBtn.style.position = 'absolute';
                closeBtn.style.right = '20px';
                closeBtn.style.top = '20px';
                closeBtn.style.padding = '8px 12px';
                closeBtn.style.borderRadius = '8px';
                closeBtn.style.border = 'none';
                closeBtn.style.cursor = 'pointer';
                closeBtn.addEventListener('click', () => { document.body.removeChild(modal); });
                modal.appendChild(slideBox);
                modal.appendChild(closeBtn);
                document.body.appendChild(modal);

                function showIdx(i) {
                    const s = slides[i];
                    slideBox.querySelector('#pptViewTitle').textContent = s.title || '';
                    slideBox.querySelector('#pptViewContent').innerHTML = s.content || '';
                }
                showIdx(idx);

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                        return;
                    }
                    // advance slide on click inside slide region
                    idx = (idx + 1) % slides.length;
                    showIdx(idx);
                }, { passive: true });

                createNotification('PowerPoint', 'Presentation started (click to advance slides).');
            });

            // initial render
            renderSlides();
        }
    });

    const homeScreenWidgets = [
        {
            id: 'homeClockWidget',
            name: 'Clock Widget',
            className: 'home-widget',
            contentHTML: `
                <span class="widget-time"></span>
                <span class="widget-date"></span>
            `,
            init: (widgetElement) => {
                updateHomeScreenClockWidget(widgetElement);
                homeScreenClockWidgetIntervalId = setInterval(() => updateHomeScreenClockWidget(widgetElement), 1000); 
            }
        }
    ];

    function showApp(appId) {
        if (!isScreenOn) return; 

        hideAllOverlays(); 

        const appViews = document.querySelectorAll('.app-view'); 
        appViews.forEach(view => {
            view.classList.remove('active');
        });
        const targetApp = document.getElementById(appId);
        if (targetApp) {
            targetApp.classList.add('active');

            const currentApp = appHistory[appHistory.length - 1];
            if (appId !== currentApp && appId !== 'recentAppsView' && appId !== 'allAppsView' && appId !== 'homeScreen') {
                appHistory.push(appId);
            } else if (appId === 'homeScreen' && currentApp !== 'homeScreen' && appHistory[0] !== 'homeScreen') {
                appHistory = ['homeScreen'];
            } else if (appId === 'homeScreen' && appHistory.length === 0) {
                 appHistory = ['homeScreen'];
            }
            
            if (appHistory.length > 20) {
                appHistory.shift(); 
            }

            if (appId === 'recentAppsView') {
                populateRecentAppsView();
            }
            
            const savedIconShape = localStorage.getItem('iconShape');
            if (savedIconShape) {
                applyIconShape(savedIconShape);
            } else {
                applyIconShape('rounded'); 
            }
            applyIconSize(currentIconSize); // Apply icon size when showing app
        }
        updateNavButtons(); 
    }

    function navigateBack() {
        if (!isScreenOn) return; 
        hideAllOverlays(); 

        if (appHistory.length > 1) {
            appHistory.pop(); 
            const previousAppId = appHistory[appHistory.length - 1]; 
            showApp(previousAppId); 
        } else {
            showApp('homeScreen');
        }
    }

    function updateNavButtons() {
        if (backButton) {
            backButton.disabled = appHistory.length <= 1 || (appHistory.length === 1 && appHistory[0] === 'homeScreen');
            backButton.classList.toggle('disabled', appHistory.length <= 1 || (appHistory.length === 1 && appHistory[0] === 'homeScreen'));
        }
    }

    // Add Microsoft Excel 2010 demo app to the apps list (lightweight editable sheet + macros info)
    apps.push({
        id: 'excel2010App',
        name: 'Microsoft Excel 2010',
        icon: 'office2010_icon.png',
        header: 'Microsoft Excel 2010',
        contentHTML: `
            <div style="max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>Microsoft Excel 2010 — Demo</strong>
                    <div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Grid, formulas, Pivot-like summary & macro demo</div>
                </div>
                <div id="excelToolbar" style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button id="newSheetBtn">New Sheet</button>
                    <button id="insertRowBtn">Insert Row</button>
                    <button id="insertColBtn">Insert Col</button>
                    <button id="computeSumBtn">Compute Sum (Selection)</button>
                    <button id="recordMacroBtn">Record Macro</button>
                    <button id="playMacroBtn">Play Macro</button>
                </div>
                <div id="excelGridWrap" style="overflow:auto;background:var(--surface-color);padding:12px;border-radius:12px;">
                    <table id="excelGrid" style="border-collapse:collapse;width:100%;min-width:720px;">
                        <!-- grid generated by init -->
                    </table>
                </div>
                <div id="excelStatus" style="font-size:0.95em;color:var(--on-surface-color);">Ready</div>
                <div style="font-size:0.95em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">
                    This demo shows basic spreadsheet operations, simple formula (SUM), and a simulated Macro Recorder (records cell edits).
                </div>
            </div>
        `,
        init: (appElement) => {
            const grid = appElement.querySelector('#excelGrid');
            const status = appElement.querySelector('#excelStatus');
            const newSheetBtn = appElement.querySelector('#newSheetBtn');
            const insertRowBtn = appElement.querySelector('#insertRowBtn');
            const insertColBtn = appElement.querySelector('#insertColBtn');
            const computeSumBtn = appElement.querySelector('#computeSumBtn');
            const recordMacroBtn = appElement.querySelector('#recordMacroBtn');
            const playMacroBtn = appElement.querySelector('#playMacroBtn');

            let rows = 10, cols = 8;
            let macroRecording = false;
            let macroActions = [];

            function colName(n) {
                let s = '';
                while (n >= 0) {
                    s = String.fromCharCode(65 + (n % 26)) + s;
                    n = Math.floor(n / 26) - 1;
                }
                return s;
            }

            function buildGrid() {
                grid.innerHTML = '';
                const thead = document.createElement('thead');
                const headRow = document.createElement('tr');
                headRow.appendChild(document.createElement('th')); // corner
                for (let c=0;c<cols;c++) {
                    const th = document.createElement('th');
                    th.textContent = colName(c);
                    th.style.border = '1px solid rgba(255,255,255,0.03)';
                    th.style.padding = '6px';
                    th.style.background = 'rgba(0,0,0,0.02)';
                    headRow.appendChild(th);
                }
                thead.appendChild(headRow);
                grid.appendChild(thead);

                const tbody = document.createElement('tbody');
                for (let r=0;r<rows;r++) {
                    const tr = document.createElement('tr');
                    const rowHeader = document.createElement('th');
                    rowHeader.textContent = String(r+1);
                    rowHeader.style.border = '1px solid rgba(255,255,255,0.03)';
                    rowHeader.style.padding = '6px';
                    rowHeader.style.background = 'rgba(0,0,0,0.02)';
                    tr.appendChild(rowHeader);
                    for (let c=0;c<cols;c++) {
                        const td = document.createElement('td');
                        td.contentEditable = 'true';
                        td.dataset.r = r;
                        td.dataset.c = c;
                        td.style.minWidth = '90px';
                        td.style.border = '1px solid rgba(255,255,255,0.03)';
                        td.style.padding = '6px';
                        td.style.background = 'transparent';
                        td.addEventListener('focus', () => { td.classList.add('editing'); });
                        td.addEventListener('blur', () => {
                            td.classList.remove('editing');
                            if (macroRecording) {
                                macroActions.push({ type: 'edit', r: td.dataset.r, c: td.dataset.c, value: td.textContent });
                            }
                        });
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                grid.appendChild(tbody);
            }

            function getSelectedCells() {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed) return [];
                // find all td elements that intersect selection by scanning table
                const cells = Array.from(grid.querySelectorAll('td'));
                return cells.filter(td => {
                    const range = document.createRange();
                    range.selectNodeContents(td);
                    return !(sel.anchorNode && sel.anchorNode.ownerDocument && sel.containsNode && sel.containsNode(td, true) === false) ? sel.containsNode(td, true) : sel.containsNode(td, true);
                });
            }

            function computeSumOfSelection() {
                // simple: sum numeric values in focused row selection or selected cells; fallback to all table numeric
                const selected = Array.from(grid.querySelectorAll('td')).filter(td => td.classList.contains('selected') || td === document.activeElement);
                let target = selected.length ? selected : Array.from(grid.querySelectorAll('td'));
                let sum = 0;
                let found = 0;
                target.forEach(td => {
                    const v = parseFloat(td.textContent.replace(/[^0-9.\-]/g,'')); // crude parse
                    if (!isNaN(v)) { sum += v; found++; }
                });
                status.textContent = `SUM of ${found} cells = ${sum}`;
            }

            // basic selection visual: click to toggle selected class, shift-click to select range (simple)
            grid.addEventListener('click', (e) => {
                const td = e.target.closest('td');
                if (!td) return;
                if (e.shiftKey) {
                    // select range between last focused and this
                    const focused = grid.querySelector('td.editing') || grid.querySelector('td.focused');
                    const all = Array.from(grid.querySelectorAll('td'));
                    if (focused) {
                        const aIndex = all.indexOf(focused);
                        const bIndex = all.indexOf(td);
                        const [lo, hi] = [Math.min(aIndex,bIndex), Math.max(aIndex,bIndex)];
                        all.forEach((c,i)=> c.classList.toggle('selected', i>=lo && i<=hi));
                        return;
                    }
                }
                // simple toggle
                td.classList.toggle('selected');
                // mark focused
                grid.querySelectorAll('td').forEach(x => x.classList.remove('focused'));
                td.classList.add('focused');
            });

            // toolbar actions
            newSheetBtn.addEventListener('click', () => {
                rows = 10; cols = 8; macroActions = [];
                buildGrid();
                status.textContent = 'New sheet created.';
            });
            insertRowBtn.addEventListener('click', () => {
                rows += 1; buildGrid(); status.textContent = 'Row inserted.';
                if (macroRecording) macroActions.push({ type:'insertRow' });
            });
            insertColBtn.addEventListener('click', () => {
                cols += 1; buildGrid(); status.textContent = 'Column inserted.';
                if (macroRecording) macroActions.push({ type:'insertCol' });
            });
            computeSumBtn.addEventListener('click', () => {
                computeSumOfSelection();
            });

            // Macro recorder simulation (records edits and basic structure actions)
            recordMacroBtn.addEventListener('click', () => {
                macroRecording = !macroRecording;
                recordMacroBtn.textContent = macroRecording ? 'Stop Recording' : 'Record Macro';
                if (!macroRecording) {
                    status.textContent = `Macro recorded (${macroActions.length} actions).`;
                } else {
                    macroActions = [];
                    status.textContent = 'Recording macro...';
                }
            });
            playMacroBtn.addEventListener('click', async () => {
                if (!macroActions.length) { createNotification('Excel', 'No macro recorded.'); return; }
                status.textContent = 'Playing macro...';
                for (const act of macroActions) {
                    if (act.type === 'edit') {
                        const selector = `td[data-r="${act.r}"][data-c="${act.c}"]`;
                        const td = grid.querySelector(selector);
                        if (td) td.textContent = act.value;
                    } else if (act.type === 'insertRow') {
                        rows += 1; buildGrid();
                    } else if (act.type === 'insertCol') {
                        cols += 1; buildGrid();
                    }
                    await new Promise(r => setTimeout(r, 220)); // step delay
                }
                status.textContent = 'Macro playback finished.';
                createNotification('Excel', 'Macro played (simulated).');
            });

            // initialize grid
            buildGrid();

            // small primer: populate a few cells with numbers/formula-like texts
            const sampleA1 = grid.querySelector('td[data-r="0"][data-c="0"]');
            const sampleA2 = grid.querySelector('td[data-r="1"][data-c="0"]');
            const sampleA3 = grid.querySelector('td[data-r="2"][data-c="0"]');
            if (sampleA1) sampleA1.textContent = '120';
            if (sampleA2) sampleA2.textContent = '80';
            if (sampleA3) sampleA3.textContent = 'SUM(A1:A2)  -> 200 (demo)';

            // accessibility hint
            status.textContent = 'Tip: Edit cells directly; record a macro to capture edits (simulated).';
        }
    });

/* New: Music app - simple playlist + audio player using project assets */
    apps.push({
        id: 'musicApp',
        name: 'Music',
        icon: 'spotify_icon.png',
        header: 'Music Player',
        contentHTML: `
            <div style="max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center;">
                <p style="margin:0;">Play local project music files or upload your own.</p>

                <div style="display:flex;gap:8px;width:100%;max-width:720px;align-items:center;">
                    <input id="musicUrlInput" type="text" placeholder="Paste audio URL (optional)" class="url-bar" style="flex:1;">
                    <button id="musicLoadUrl" style="padding:10px 14px;">Load</button>
                    <input id="musicFileInput" type="file" accept="audio/*,video/*" style="display:none;">
                    <button id="musicPickFile" style="padding:10px 14px;background:var(--outline-color);">Choose File</button>
                </div>

                <div id="musicPlayerWrap" style="width:100%;max-width:860px;background:var(--surface-color);padding:12px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:8px;">
                    <audio id="musicPlayer" controls style="width:100%;height:auto;max-height:140px;background:#000;border-radius:8px;">
                        Your browser does not support the audio tag.
                    </audio>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                        <button id="musicPrev">Prev</button>
                        <button id="musicPlayPause">Play/Pause</button>
                        <button id="musicNext">Next</button>
                        <button id="musicMute">Mute</button>
                    </div>
                    <div id="musicStatus" style="font-size:1.1em;color:var(--on-surface-color);">No track loaded.</div>
                </div>

                <div style="width:100%;max-width:860px;background:transparent;padding:6px;border-radius:8px;">
                    <h4 style="margin:8px 0;color:var(--primary-color);">Playlist</h4>
                    <div id="musicPlaylist" style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow:auto;background:rgba(0,0,0,0.02);padding:8px;border-radius:8px;"></div>
                </div>

            </div>
        `,
        init: (appElement) => {
            const urlInput = appElement.querySelector('#musicUrlInput');
            const loadUrlBtn = appElement.querySelector('#musicLoadUrl');
            const fileInput = appElement.querySelector('#musicFileInput');
            const pickFileBtn = appElement.querySelector('#musicPickFile');
            const player = appElement.querySelector('#musicPlayer');
            const playPauseBtn = appElement.querySelector('#musicPlayPause');
            const muteBtn = appElement.querySelector('#musicMute');
            const prevBtn = appElement.querySelector('#musicPrev');
            const nextBtn = appElement.querySelector('#musicNext');
            const status = appElement.querySelector('#musicStatus');
            const playlistEl = appElement.querySelector('#musicPlaylist');

            const projectTracks = [
                'noob vietnam song (Official Music Video) (1).mp4',
                'song noob vietnam @katan-m5m.mp4',
                'noob vietnam island song.mp4',
                '0113 (3)(3).mp4'
            ].filter(Boolean);

            let currentIndex = -1;
            let playlist = [];

            function setStatus(text) {
                status.textContent = text;
            }

            function buildLocalPlaylistUI() {
                playlistEl.innerHTML = '';
                playlist.forEach((item, idx) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '8px';
                    row.style.borderRadius = '6px';
                    row.style.background = 'transparent';
                    row.innerHTML = `
                        <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;">${item.title}</div>
                        <div style="display:flex;gap:8px;">
                            <button class="mp-play" data-idx="${idx}" style="padding:6px 10px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Play</button>
                        </div>
                    `;
                    playlistEl.appendChild(row);
                });
                playlistEl.querySelectorAll('.mp-play').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.idx, 10);
                        playTrackByIndex(idx);
                    });
                });
            }

            function playTrackByIndex(idx) {
                if (idx < 0 || idx >= playlist.length) return;
                currentIndex = idx;
                const track = playlist[currentIndex];
                player.src = track.url;
                player.load();
                player.play().catch(()=>{});
                setStatus(`Playing: ${track.title}`);
                createNotification('Music', `Playing ${track.title}`);
            }

            playPauseBtn.addEventListener('click', () => {
                if (!player.src) {
                    if (playlist.length) playTrackByIndex(0);
                    else setStatus('No tracks available.');
                    return;
                }
                if (player.paused) {
                    player.play().catch(()=>{});
                    createNotification('Music', 'Playback started.');
                } else {
                    player.pause();
                    createNotification('Music', 'Playback paused.');
                }
            });

            muteBtn.addEventListener('click', () => {
                player.muted = !player.muted;
                muteBtn.textContent = player.muted ? 'Unmute' : 'Mute';
            });

            prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) playTrackByIndex(currentIndex - 1);
                else createNotification('Music', 'No previous track.');
            });

            nextBtn.addEventListener('click', () => {
                if (currentIndex + 1 < playlist.length) playTrackByIndex(currentIndex + 1);
                else createNotification('Music', 'No next track.');
            });

            loadUrlBtn.addEventListener('click', () => {
                const url = (urlInput.value || '').trim();
                if (!url) { createNotification('Music', 'No URL provided.'); return; }
                player.src = url;
                player.load();
                player.play().catch(()=>{});
                setStatus(`Playing URL: ${url}`);
                createNotification('Music', 'Loaded audio URL.');
            });

            pickFileBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => {
                const f = fileInput.files && fileInput.files[0];
                if (!f) { setStatus('No file selected.'); return; }
                const url = URL.createObjectURL(f);
                playlist.unshift({ title: f.name, url });
                buildLocalPlaylistUI();
                currentIndex = 0;
                player.src = url;
                player.load();
                player.play().catch(()=>{});
                setStatus(`Playing file: ${f.name}`);
                createNotification('Music', `Playing ${f.name}`);
            });

            // initialize playlist model used by local additions
            playlist = projectTracks.map((fn) => ({ title: fn, url: fn }));
            buildLocalPlaylistUI();

            player.addEventListener('ended', () => setStatus('Playback finished.'));
            player.addEventListener('play', () => setStatus('Playing...'));
            player.addEventListener('pause', () => setStatus('Paused.'));
            player.addEventListener('error', () => setStatus('Playback error.'));
        }
    });

    // New: Feedback app — posts to project comments with optional images
    apps.push({
        id: 'feedbackApp',
        name: 'Feedback',
        icon: 'placeholder_image.png',
        header: 'Feedback',
        contentHTML: `
            <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center;">
                <p style="margin:0;text-align:center;">Send feedback about this project — your message will be posted as a comment.</p>
                <textarea id="feedbackText" placeholder="Write your feedback..." style="width:100%;min-height:140px;padding:10px;border-radius:8px;border:1px solid var(--outline-color);"></textarea>
                <div style="display:flex;gap:8px;width:100%;justify-content:flex-start;align-items:center;">
                    <input id="feedbackImages" type="file" accept="image/*" multiple style="display:none;">
                    <button id="feedbackPickImages" style="padding:10px 14px;">Attach images</button>
                    <span id="feedbackImagesCount" style="color:color-mix(in srgb,var(--on-surface-color),transparent 40%);font-size:0.95em;">0 images selected</span>
                </div>
                <div style="display:flex;gap:8px;">
                    <button id="feedbackSubmit" style="padding:10px 18px;background:var(--primary-color);color:var(--on-primary-color);">Submit Feedback</button>
                    <button id="feedbackCancel" style="padding:10px 18px;background:var(--outline-color);color:var(--on-surface-color);">Clear</button>
                </div>
                <div id="feedbackStatus" style="margin-top:8px;font-size:0.95em;color:var(--on-surface-color);"></div>
            </div>
        `,
        init: (appElement) => {
            const textEl = appElement.querySelector('#feedbackText');
            const fileInput = appElement.querySelector('#feedbackImages');
            const pickBtn = appElement.querySelector('#feedbackPickImages');
            const imagesCount = appElement.querySelector('#feedbackImagesCount');
            const submitBtn = appElement.querySelector('#feedbackSubmit');
            const cancelBtn = appElement.querySelector('#feedbackCancel');
            const statusEl = appElement.querySelector('#feedbackStatus');

            let selectedFiles = [];

            pickBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => {
                selectedFiles = Array.from(fileInput.files || []).slice(0,4);
                imagesCount.textContent = `${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''} selected`;
            });

            cancelBtn.addEventListener('click', () => {
                textEl.value = '';
                fileInput.value = '';
                selectedFiles = [];
                imagesCount.textContent = '0 images selected';
                statusEl.textContent = '';
            });

            submitBtn.addEventListener('click', async () => {
                const content = (textEl.value || '').trim();
                if (!content) {
                    statusEl.textContent = 'Please enter feedback before submitting.';
                    return;
                }
                // Provide immediate UI feedback
                submitBtn.disabled = true;
                statusEl.textContent = 'Sending feedback...';

                try {
                    // If websim.postComment is available, upload images (max 4) and post
                    if (window.websim && typeof window.websim.postComment === 'function') {
                        let imageUrls = [];
                        try {
                            if (selectedFiles.length) {
                                // upload sequentially to reduce concurrency issues
                                for (let i = 0; i < selectedFiles.length && imageUrls.length < 4; i++) {
                                    const f = selectedFiles[i];
                                    try {
                                        const url = await window.websim.upload(f);
                                        if (url) imageUrls.push(url);
                                    } catch (errUpload) {
                                        console.warn('Image upload failed for', f.name, errUpload);
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn('Image upload flow error', err);
                        }

                        // Post the comment (websim.postComment will allow user to edit/prompt if necessary)
                        const postParams = { content };
                        if (imageUrls.length) postParams.images = imageUrls;
                        try {
                            const res = await window.websim.postComment(postParams);
                            if (res && res.error) {
                                statusEl.textContent = `Failed to post feedback: ${res.error}`;
                            } else {
                                statusEl.textContent = 'Feedback submitted — thank you!';
                                // clear inputs
                                textEl.value = '';
                                fileInput.value = '';
                                selectedFiles = [];
                                imagesCount.textContent = '0 images selected';
                            }
                        } catch (errPost) {
                            console.error('postComment error', errPost);
                            statusEl.textContent = 'Failed to post feedback (error).';
                        }
                    } else {
                        // Fallback: inform user that posting is unavailable
                        statusEl.textContent = 'Cannot send feedback in this environment (websim.postComment unavailable).';
                    }
                } catch (err) {
                    console.error('Feedback submit error', err);
                    statusEl.textContent = 'An error occurred while sending feedback.';
                } finally {
                    submitBtn.disabled = false;
                }
            });
        }
    });

    apps.push({
        id: 'redditApp',
        name: 'Reddit',
        icon: 'placeholder_image.png',
        header: 'Reddit - r/guest82644',
        contentHTML: `
            <p>Visit the subreddit r/guest82644.</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <button id="openRedditBtn" style="padding:10px 16px;border-radius:12px;background:var(--primary-color);color:var(--on-primary-color);border:none;font-size:1.2em;cursor:pointer;">Open r/guest82644</button>
            </div>
        `,
        init: (appElement) => {
            const openBtn = appElement.querySelector('#openRedditBtn');
            if (openBtn) {
                openBtn.addEventListener('click', () => {
                    try {
                        window.open('https://www.reddit.com/r/guest82644/', '_blank', 'noopener');
                        createNotification('Reddit', 'Opened subreddit r/guest82644');
                    } catch (err) {
                        createNotification('Reddit', 'Failed to open subreddit (popup blocked).');
                    }
                });
            }
        }
    });
    apps.forEach(app => {
        const appViewDiv = document.createElement('div');
        appViewDiv.id = app.id;
        appViewDiv.className = 'app-view';
        appViewDiv.innerHTML = `
            <div class="app-header">
                <h2>${app.header}</h2>
            </div>
            <div class="app-body">
                ${app.contentHTML}
            </div>
        `;
        mainContent.appendChild(appViewDiv);

        if (app.init && typeof app.init === 'function') {
            app.init(appViewDiv);
        }

        if (app.id === 'allAppsView') {
            allAppsGridElement = appViewDiv.querySelector('#allAppsGrid');
        }
    });

    // Add "Users Logged In" / People Online view and icon (Users logged in: ( view ) on people online view)
    (function addPeopleOnlineView() {
        const peopleApp = {
            id: 'peopleOnlineView',
            name: 'People Online',
            icon: 'placeholder_image.png',
            header: 'Users Logged In',
            contentHTML: `
                <p style="margin:0 0 8px 0;">Users currently online & simple chat (real-time)</p>
                <div style="display:flex;gap:12px;">
                    <div style="flex:1;min-width:280px;">
                        <div id="peopleOnlineList" style="max-height:260px;overflow:auto;padding:8px;border-radius:8px;background:rgba(0,0,0,0.02);"></div>
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <button id="refreshPeopleOnline">Refresh</button>
                            <button id="viewPeopleDetails">View</button>
                        </div>
                    </div>

                    <div style="width:360px;min-width:260px;display:flex;flex-direction:column;gap:8px;">
                        <div style="background:var(--surface-color);padding:8px;border-radius:8px;min-height:200px;display:flex;flex-direction:column;">
                            <div style="font-weight:700;color:var(--primary-color);margin-bottom:6px;">Project Chat</div>
                            <div id="peopleChatHistory" style="flex:1;overflow:auto;padding:6px;border-radius:6px;background:rgba(0,0,0,0.02);"></div>
                            <div style="display:flex;gap:8px;margin-top:8px;">
                                <input id="peopleChatInput" placeholder="Message..." style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--outline-color);">
                                <button id="peopleChatSend" style="padding:8px 12px;background:var(--primary-color);color:var(--on-primary-color);border:none;border-radius:8px;">Send</button>
                            </div>
                            <div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);margin-top:6px;">Chat uses the project WebsimSocket room if available.</div>
                        </div>
                    </div>
                </div>
            `
        };

        // create view DOM
        const pView = document.createElement('div');
        pView.id = peopleApp.id;
        pView.className = 'app-view';
        pView.innerHTML = `
            <div class="app-header">
                <h2>${peopleApp.header}</h2>
            </div>
            <div class="app-body">
                ${peopleApp.contentHTML}
            </div>
        `;
        mainContent.appendChild(pView);

        // init UI elements/handlers
        const listEl = pView.querySelector('#peopleOnlineList');
        const refreshBtn = pView.querySelector('#refreshPeopleOnline');
        const viewBtn = pView.querySelector('#viewPeopleDetails');

        const chatHistory = pView.querySelector('#peopleChatHistory');
        const chatInput = pView.querySelector('#peopleChatInput');
        const chatSend = pView.querySelector('#peopleChatSend');

        // sample users data (will be replaced by live presence when available)
        function fetchOnlineUsers() {
            // demo fallback dataset
            return [
                { id: 'user_01', username: 'alice', status: 'active' },
                { id: 'user_02', username: 'bob', status: 'idle' },
                { id: 'user_03', username: 'carol', status: 'active' }
            ];
        }

        function renderPresenceList(presences) {
            listEl.innerHTML = '';
            const people = presences || fetchOnlineUsers();
            if (!Object.keys(people).length) {
                listEl.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No users online</div>';
                return;
            }
            // presences could be array or object
            const entries = Array.isArray(people) ? people : Object.entries(people).map(([id, p]) => ({ id, username: p.username || id, status: p.status || 'active' }));
            entries.forEach(u => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '6px';
                row.style.borderRadius = '6px';
                row.style.background = 'transparent';
                row.innerHTML = `
                    <div style="display:flex;flex-direction:column;">
                        <strong style="font-size:0.98em;">${u.username}</strong>
                        <span style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">${u.status}</span>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="people-view-btn" data-id="${u.id || u.username}" style="padding:6px 10px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">View</button>
                    </div>
                `;
                listEl.appendChild(row);
            });

            listEl.querySelectorAll('.people-view-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const uid = b.dataset.id;
                    showDynamicIsland(`Viewing ${uid}`, 1600);
                    createNotification('People', `Viewing user: ${uid}`);
                });
            });
        }

        refreshBtn.addEventListener('click', () => {
            // try to use live room presence if available
            const room = window._multiplayerRoom;
            if (room && room.presence) {
                renderPresenceList(room.presence);
            } else {
                renderPresenceList(null);
                createNotification('People', 'Using local presence fallback.');
            }
        });

        viewBtn.addEventListener('click', () => {
            const firstBtn = listEl.querySelector('.people-view-btn');
            if (firstBtn) firstBtn.click();
            else createNotification('People', 'No users to view.');
        });

        // Chat helpers
        function appendChatMessage({ username = 'System', text = '', self = false, time = Date.now() }) {
            const row = document.createElement('div');
            row.style.padding = '8px';
            row.style.marginBottom = '6px';
            row.style.borderRadius = '8px';
            row.style.background = self ? 'rgba(67,160,71,0.10)' : 'transparent';
            row.innerHTML = `<div style="font-weight:700;font-size:0.95em;">${username} <span style="font-weight:400;font-size:0.75em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">· ${new Date(time).toLocaleTimeString()}</span></div><div style="margin-top:6px;">${text}</div>`;
            chatHistory.appendChild(row);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        // Wire chat send: use WebsimSocket room if available, otherwise local echo only
        async function sendChatMessage() {
            const msg = (chatInput.value || '').trim();
            if (!msg) return;

            const room = window._multiplayerRoom;
            // prefer the authoritative username from the room peers if available
            const username = (room && room.peers && room.peers[room.clientId] && room.peers[room.clientId].username) || 'You';

            if (room && typeof room.send === 'function') {
                try {
                    // include username so receivers can display sender nicely
                    room.send({ type: 'project_chat', echo: true, message: msg, username });

                    // locally append immediately for snappy UX (server may echo as well)
                    appendChatMessage({ username, text: msg, self: true });
                } catch (e) {
                    console.warn('Chat send failed', e);
                    appendChatMessage({ username: 'You', text: msg, self: true });
                    createNotification('Chat', 'Failed to send via WebsimSocket; shown locally.');
                }
            } else {
                // local-only fallback
                appendChatMessage({ username: 'You', text: msg, self: true });
                createNotification('Chat', 'No realtime room available — message shown locally.');
            }

            chatInput.value = '';
        }

        chatSend.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });

        // Subscribe to room messages if available (also handle late initialization)
        function attachRoomListeners(room) {
            if (!room) return;
            // show join/disconnect via notifications is already handled elsewhere, but also listen for chat
            const originalOnMessage = room.onmessage;
            room.onmessage = (event) => {
                const data = event.data;
                if (!data) return;
                if (data.type === 'project_chat') {
                    // data.clientId and data.username are provided by the room messaging system where available
                    const name = data.username || (room.peers && room.peers[data.clientId] && room.peers[data.clientId].username) || data.clientId || 'Peer';
                    const isSelf = data.clientId === room.clientId;
                    appendChatMessage({ username: name, text: data.message || '', self: isSelf, time: Date.now() });

                    // Notify everyone when another user sends a chat (avoid notifying the sender)
                    try {
                        if (!isSelf) {
                            createNotification('Chat', `${name}: ${data.message || ''}`);
                        }
                    } catch (e) {
                        // silently ignore notification failures
                    }
                }
                // preserve existing handler behavior
                if (typeof originalOnMessage === 'function') originalOnMessage(event);
            };
        }

        // If room already initialized, attach immediately
        if (window._multiplayerRoom) {
            attachRoomListeners(window._multiplayerRoom);
            // populate presence from room
            try { renderPresenceList(window._multiplayerRoom.presence); } catch(e){}
        } else {
            // otherwise watch for room to appear later (e.g., after init)
            const roomWatchInterval = setInterval(() => {
                if (window._multiplayerRoom) {
                    attachRoomListeners(window._multiplayerRoom);
                    try { renderPresenceList(window._multiplayerRoom.presence); } catch(e){}
                    clearInterval(roomWatchInterval);
                }
            }, 800);
            // stop after a while
            setTimeout(() => clearInterval(roomWatchInterval), 20000);
        }

        // initial population fallback
        renderPresenceList(null);

        // add icon to home and all apps grids
        const iconDiv = document.createElement('div');
        iconDiv.className = 'app-icon';
        iconDiv.dataset.app = peopleApp.id;
        iconDiv.innerHTML = `
            <div class="app-icon-inner" tabindex="0" role="button" aria-label="${peopleApp.name}">
                <img src="${peopleApp.icon}" alt="${peopleApp.name} Icon">
            </div>
            <span>${peopleApp.name}</span>
        `;
        if (homeScreenAppGrid) {
            homeScreenAppGrid.appendChild(iconDiv.cloneNode(true));
        }
        if (allAppsGridElement) {
            allAppsGridElement.appendChild(iconDiv.cloneNode(true));
        }

    })();

    homeScreenWidgets.forEach(widget => {
        const widgetDiv = document.createElement('div');
        widgetDiv.id = widget.id;
        widgetDiv.className = widget.className;
        widgetDiv.innerHTML = widget.contentHTML;
        if (homeScreenAppGrid) {
            homeScreenAppGrid.prepend(widgetDiv);
            if (widget.init && typeof widget.init === 'function') {
                widget.init(widgetDiv);
            }
        }
    });

    const appIconsToCreate = []; 

    // Mark certain apps as moved (adds a "movedTo" hint shown as a badge on their icons)
    (function markMovedApps() {
        const movedMap = {
            cloudHawkSyncApp: 'Cloud Hawk → Sync',
            cloudHawkDriveApp: 'Cloud Hawk → Drive',
            windowsApp: 'Windows → Emulator',
            cloudHawkSyncApp: 'Cloud Hawk → Sync',
            cloudHawkDriveApp: 'Cloud Hawk → Drive'
        };
        apps.forEach(a => {
            if (movedMap[a.id]) {
                a.moved = true;
                a.movedTo = movedMap[a.id];
            }
        });
    })();

    // Add Multiplayer Minesweeper app (shared "global" board using WebsimSocket room.roomState)
    apps.push({
        id: 'minesweeperApp',
        name: 'Minesweeper',
        icon: 'games_icon.png',
        header: 'Minesweeper (Multiplayer)',
        contentHTML: `
            <div style="max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <label>Width: <input id="msWidth" type="number" value="9" min="5" max="24" style="width:70px;"></label>
                    <label>Height: <input id="msHeight" type="number" value="9" min="5" max="24" style="width:70px;"></label>
                    <label>Bombs: <input id="msBombs" type="number" value="10" min="1" style="width:70px;"></label>
                    <button id="msNewGame">New Game</button>
                    <button id="msFlagMode">Flag Mode: Off</button>
                </div>
                <div id="msStatus" style="font-size:1.1em;color:var(--on-surface-color);">Multiplayer: Shared "global" board.</div>
                <div id="msBoardWrap" style="background:var(--surface-color);padding:12px;border-radius:12px;overflow:auto;"></div>
            </div>
        `,
        init: (appElement) => {
            const wrap = appElement.querySelector('#msBoardWrap');
            const newBtn = appElement.querySelector('#msNewGame');
            const flagBtn = appElement.querySelector('#msFlagMode');
            const status = appElement.querySelector('#msStatus');
            const inputW = appElement.querySelector('#msWidth');
            const inputH = appElement.querySelector('#msHeight');
            const inputB = appElement.querySelector('#msBombs');

            const GAME_KEY = 'global'; // single shared game id
            let flagMode = false;
            let currentState = null; // local mirror of room.roomState.minesweeperGames[GAME_KEY]

            function getRoom() { return window._multiplayerRoom || null; }

            function createEmptyBoard(w,h,bombs) {
                const cells = {};
                const positions = [];
                for (let r=0;r<h;r++) for (let c=0;c<w;c++) positions.push([r,c]);
                for (let i = positions.length -1; i>0; i--){
                    const j = Math.floor(Math.random()*(i+1));
                    [positions[i], positions[j]] = [positions[j], positions[i]];
                }
                const bombSet = new Set(positions.slice(0, bombs).map(p=>p.join('_')));
                for (let r=0;r<h;r++){
                    for (let c=0;c<w;c++){
                        const key = `${r}_${c}`;
                        cells[key] = {
                            bomb: bombSet.has(key),
                            revealed: false,
                            flagged: false,
                            adj: 0
                        };
                    }
                }
                for (let r=0;r<h;r++){
                    for (let c=0;c<w;c++){
                        const key = `${r}_${c}`;
                        if (cells[key].bomb) continue;
                        let count=0;
                        for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++){
                            if (dr===0 && dc===0) continue;
                            const nr=r+dr, nc=c+dc;
                            const nk = `${nr}_${nc}`;
                            if (cells[nk] && cells[nk].bomb) count++;
                        }
                        cells[key].adj = count;
                    }
                }
                return { width: w, height: h, bombs, cells, createdAt: Date.now(), over: false };
            }

            function renderBoard(state) {
                if (!state) { wrap.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No game.</div>'; return; }
                currentState = state;
                const w = state.width, h = state.height;
                wrap.innerHTML = '';
                const grid = document.createElement('div');
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = `repeat(${w}, 36px)`;
                grid.style.gap = '6px';
                grid.style.padding = '6px';
                for (let r=0;r<h;r++){
                    for (let c=0;c<w;c++){
                        const key = `${r}_${c}`;
                        const cell = state.cells[key];
                        const btn = document.createElement('button');
                        btn.className = 'ms-cell';
                        btn.style.width = '36px';
                        btn.style.height = '36px';
                        btn.style.padding = '0';
                        btn.style.borderRadius = '8px';
                        btn.style.border = '1px solid rgba(255,255,255,0.04)';
                        btn.style.background = cell.revealed ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.02)';
                        btn.style.color = 'var(--on-surface-color)';
                        btn.dataset.key = key;
                        if (cell.revealed) {
                            if (cell.bomb) {
                                btn.textContent = '💣';
                                btn.style.background = '#b22222';
                            } else if (cell.adj > 0) {
                                btn.textContent = String(cell.adj);
                                btn.style.fontWeight = '700';
                            } else {
                                btn.textContent = '';
                            }
                        } else {
                            btn.textContent = cell.flagged ? '🚩' : '';
                        }
                        btn.addEventListener('click', (e) => {
                            handleTileClick(key);
                        });
                        btn.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            toggleFlag(key);
                        });
                        grid.appendChild(btn);
                    }
                }
                wrap.appendChild(grid);
                const revealedCount = Object.values(state.cells).filter(c=>c.revealed).length;
                status.textContent = `Revealed: ${revealedCount} · Bombs: ${state.bombs} · Shared "global" board`;
            }

            async function pushStateToRoom(newState) {
                const room = getRoom();
                if (!room || typeof room.updateRoomState !== 'function') {
                    renderBoard(newState);
                    return;
                }
                try {
                    const payload = { minesweeperGames: {} };
                    payload.minesweeperGames[GAME_KEY] = newState;
                    room.updateRoomState(payload);
                } catch (e) {
                    console.warn('Failed to push minesweeper state', e);
                    renderBoard(newState);
                }
            }

            function handleTileClick(key) {
                const state = currentState;
                if (!state || state.over) return;
                const cell = state.cells[key];
                if (!cell) return;
                if (flagMode) {
                    toggleFlag(key);
                    return;
                }
                if (cell.revealed || cell.flagged) return;
                const toReveal = [key];
                const visited = new Set();
                while (toReveal.length) {
                    const k = toReveal.pop();
                    if (visited.has(k)) continue;
                    visited.add(k);
                    const [r,c] = k.split('_').map(Number);
                    const cc = state.cells[k];
                    if (!cc) continue;
                    cc.revealed = true;
                    if (!cc.bomb && cc.adj === 0) {
                        for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++){
                            if (dr===0 && dc===0) continue;
                            const nk = `${r+dr}_${c+dc}`;
                            if (state.cells[nk] && !state.cells[nk].revealed && !state.cells[nk].flagged) {
                                toReveal.push(nk);
                            }
                        }
                    }
                }
                if (cell.bomb) {
                    state.over = true;
                    Object.values(state.cells).forEach((c) => { if (c.bomb) c.revealed = true; });
                }
                pushStateToRoom(state);
            }

            function toggleFlag(key) {
                const state = currentState;
                if (!state || state.over) return;
                const c = state.cells[key];
                if (!c || c.revealed) return;
                c.flagged = !c.flagged;
                pushStateToRoom(state);
            }

            function startNewGame(w,h,bombs) {
                const newState = createEmptyBoard(w,h,bombs);
                pushStateToRoom(newState);
            }

            newBtn.addEventListener('click', () => {
                const w = Math.max(5, Math.min(24, parseInt(inputW.value || '9',10)));
                const h = Math.max(5, Math.min(24, parseInt(inputH.value || '9',10)));
                const b = Math.max(1, Math.min(Math.floor(w*h*0.6), parseInt(inputB.value || '10',10)));
                startNewGame(w,h,b);
            });
            flagBtn.addEventListener('click', () => {
                flagMode = !flagMode;
                flagBtn.textContent = `Flag Mode: ${flagMode ? 'On' : 'Off'}`;
            });

            function attachRoomListeners(room) {
                if (!room || typeof room.subscribeRoomState !== 'function') return;
                try {
                    const current = room.roomState && room.roomState.minesweeperGames && room.roomState.minesweeperGames[GAME_KEY];
                    if (current) renderBoard(current);
                } catch(e){}
                const unsub = room.subscribeRoomState((currentRoomState) => {
                    try {
                        const games = currentRoomState && currentRoomState.minesweeperGames;
                        const st = games && games[GAME_KEY];
                        if (st) renderBoard(st);
                    } catch (err) {}
                });
                room.subscribePresence((p) => {
                    const count = Object.keys(p || {}).length;
                    status.textContent = `${status.textContent.split('·')[0].trim()} · Players: ${count}`;
                });
            }

            if (window._multiplayerRoom) {
                attachRoomListeners(window._multiplayerRoom);
            } else {
                const iv = setInterval(() => {
                    if (window._multiplayerRoom) {
                        attachRoomListeners(window._multiplayerRoom);
                        clearInterval(iv);
                    }
                }, 800);
                setTimeout(()=> clearInterval(iv), 20000);
            }

            if (!currentState) {
                wrap.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Click \"New Game\" to start a shared Minesweeper board.</div>';
            }
        }
    });

    // --- Cloud Hawk apps: Sync & Drive (added) ---
    apps.push({
        id: 'cloudHawkSyncApp',
        name: 'Cloud Hawk Sync',
        icon: 'files_icon.png',
        header: 'Cloud Hawk Sync',
        contentHTML: `
            <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center;">
                <p>Perform manual Cloud Hawk syncs and review recent sync history.</p>
                <div style="display:flex;gap:8px;width:100%;max-width:720px;align-items:center;">
                    <input id="cloudhawkPath" type="text" placeholder="/path/to/sync" class="url-bar" style="flex:1;">
                    <button id="cloudhawkSendBtn" style="padding:10px 14px;">Send</button>
                    <button id="cloudhawkRefreshBtn" style="padding:10px 14px;background:var(--outline-color);">Refresh</button>
                </div>
                <div id="cloudhawkStatus" style="width:100%;max-width:720px;background:var(--surface-color);padding:12px;border-radius:12px;min-height:120px;overflow:auto;">
                    <strong>Recent Cloud Hawk syncs</strong>
                    <div id="cloudhawkList" style="margin-top:8px;"></div>
                </div>
            </div>
        `,
        init: (appElement) => {
            const pathInput = appElement.querySelector('#cloudhawkPath');
            const sendBtn = appElement.querySelector('#cloudhawkSendBtn');
            const refreshBtn = appElement.querySelector('#cloudhawkRefreshBtn');
            const listEl = appElement.querySelector('#cloudhawkList');

            function renderList() {
                try {
                    const entries = JSON.parse(localStorage.getItem('cloudhawk_syncs') || '[]');
                    listEl.innerHTML = '';
                    if (!entries.length) {
                        listEl.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No syncs recorded.</div>';
                        return;
                    }
                    entries.slice(0,50).forEach(e => {
                        const r = document.createElement('div');
                        r.style.padding = '8px';
                        r.style.borderRadius = '8px';
                        r.style.marginBottom = '6px';
                        r.style.background = 'transparent';
                        r.innerHTML = `<div style="font-weight:700;">${e.path || '(no path)'}</div><div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${new Date(e.ts || Date.now()).toLocaleString()} · ${e.source || 'peer/local'}</div>`;
                        listEl.appendChild(r);
                    });
                } catch (err) {
                    listEl.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Error reading sync history.</div>';
                }
            }

            async function doSend() {
                const path = (pathInput.value || '').trim() || '/cloudhawk-sync';
                createNotification('Cloud Hawk', `Requesting sync: ${path}`);
                try {
                    await syncToCloudHawk(path, { sample: 'payload', from: Date.now() });
                    // persist a local record for visibility
                    const key = 'cloudhawk_syncs';
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    existing.unshift({ path, payload: { sample: 'payload' }, ts: Date.now(), source: 'local-client' });
                    localStorage.setItem(key, JSON.stringify(existing.slice(0,200)));
                    createNotification('Cloud Hawk', 'Sync requested (best-effort).');
                } catch (e) {
                    createNotification('Cloud Hawk', 'Sync failed (see console).');
                    console.warn('cloudhawk sync error', e);
                }
                renderList();
            }

            sendBtn.addEventListener('click', doSend);
            refreshBtn.addEventListener('click', renderList);

            // initial render
            renderList();

            // poll for changes in sync log (lightweight)
            setInterval(renderList, 3000);
        }
    });

    apps.push({
        id: 'cloudHawkDriveApp',
        name: 'Cloud Hawk Drive',
        icon: 'files_icon.png',
        header: 'Cloud Hawk Drive',
        contentHTML: `
            <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center;">
                <p>Browse & manage files indexed from Cloud Hawk syncs (simulated index).</p>
                <div style="display:flex;gap:8px;width:100%;max-width:720px;align-items:center;">
                    <button id="cloudhawkIndexBtn" style="padding:10px 14px;">Re-index</button>
                    <button id="cloudhawkOpenBtn" style="padding:10px 14px;background:var(--outline-color);">Open Selected</button>
                    <button id="cloudhawkClearBtn" style="padding:10px 14px;background:#dc3545;color:#fff;">Clear Index</button>
                </div>
                <div id="cloudhawkDriveListWrap" style="width:100%;max-width:720px;background:var(--surface-color);padding:12px;border-radius:12px;min-height:140px;overflow:auto;">
                    <div id="cloudhawkDriveList"></div>
                </div>
            </div>
        `,
        init: (appElement) => {
            const idxBtn = appElement.querySelector('#cloudhawkIndexBtn');
            const openBtn = appElement.querySelector('#cloudhawkOpenBtn');
            const clearBtn = appElement.querySelector('#cloudhawkClearBtn');
            const listWrap = appElement.querySelector('#cloudhawkDriveList');
            let selectedIndex = null;

            function loadIndex() {
                try { return JSON.parse(localStorage.getItem('cloudhawk_drive_index') || '[]'); } catch (e) { return []; }
            }
            function saveIndex(list) { try { localStorage.setItem('cloudhawk_drive_index', JSON.stringify(list.slice(0,200))); } catch (e) {} }

            function render() {
                const list = loadIndex();
                listWrap.innerHTML = '';
                if (!list.length) {
                    listWrap.innerHTML = '<div style="padding:8px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No indexed files. Use Re-index after a Cloud Hawk sync.</div>';
                    return;
                }
                list.forEach((f, i) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '8px';
                    row.style.borderRadius = '8px';
                    row.style.marginBottom = '6px';
                    row.style.cursor = 'pointer';
                    row.dataset.idx = i;
                    row.style.background = (selectedIndex === i) ? 'rgba(0,0,0,0.06)' : 'transparent';
                    row.innerHTML = `<div style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${f.name || f.path || ('item-'+i)}</div><div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${f.size?f.size+' bytes':''}</div>`;
                    row.addEventListener('click', () => { selectedIndex = i; render(); });
                    listWrap.appendChild(row);
                });
            }

            async function reindex() {
                createNotification('Cloud Hawk Drive', 'Re-indexing Cloud Hawk files (simulated)...');
                const syncs = JSON.parse(localStorage.getItem('cloudhawk_syncs') || '[]');
                const files = [];
                for (const s of syncs.slice(0,50)) {
                    if (s.payload && s.payload.items && Array.isArray(s.payload.items)) {
                        s.payload.items.forEach(it => files.push({ name: it.name || it.path || 'file', path: it.url || it.path || '', size: it.size || 0, ts: s.ts }));
                    }
                }
                if (!files.length) files.push({ name: 'demo.txt', path: '', size: 1234, ts: Date.now() });
                saveIndex(files);
                render();
                createNotification('Cloud Hawk Drive', 'Index updated.');
            }

            openBtn.addEventListener('click', () => {
                const list = loadIndex();
                if (selectedIndex === null || !list[selectedIndex]) { createNotification('Cloud Hawk Drive', 'No file selected.'); return; }
                const f = list[selectedIndex];
                if (f.path) { try { window.open(f.path, '_blank'); createNotification('Cloud Hawk Drive', `Opened ${f.name}`); } catch (e) { createNotification('Cloud Hawk Drive', 'Cannot open file.'); } }
                else { createNotification('Cloud Hawk Drive', `Preview: ${f.name} (no remote URL)`); }
            });
            clearBtn.addEventListener('click', () => {
                if (!confirm('Clear Cloud Hawk index?')) return;
                saveIndex([]); render(); createNotification('Cloud Hawk Drive', 'Index cleared.');
            });

            idxBtn.addEventListener('click', reindex);

            // initial render
            render();
        }
    });

    apps.forEach(app => {
        if (app.id === 'homeScreen' || app.id === 'recentAppsView' || app.id === 'allAppsView') {
            return;
        }

        const appIconDiv = document.createElement('div');
        appIconDiv.className = 'app-icon';
        appIconDiv.dataset.app = app.id;

        // Build icon inner with optional moved badge
        const movedBadgeHTML = app.moved ? `<div class="moved-badge" title="${(app.movedTo || 'Moved')}">Moved</div>` : '';
        appIconDiv.innerHTML = `
            <div class="app-icon-inner" tabindex="0" role="button" aria-label="${app.name}">
                <img src="${app.icon}" alt="${app.name} Icon">
                ${movedBadgeHTML}
            </div>
            <span>${app.name}</span>
        `;
        // If moved, add a data attribute for further styling/interaction
        if (app.moved) appIconDiv.setAttribute('data-moved', app.movedTo || 'moved');

        appIconsToCreate.push(appIconDiv);
    });

    appIconsToCreate.forEach(iconDiv => {
        if (homeScreenAppGrid) {
            homeScreenAppGrid.appendChild(iconDiv.cloneNode(true)); 
        }
        if (allAppsGridElement) {
            allAppsGridElement.appendChild(iconDiv.cloneNode(true)); 
        }
    });

    const savedIconShape = localStorage.getItem('iconShape');
    if (savedIconShape) {
        applyIconShape(savedIconShape);
    } else {
        applyIconShape('rounded'); 
    }
    applyIconSize(currentIconSize); // New: Apply icon size on load

    applyTheme(currentAccent, currentMode);
    applyLanguage(currentLanguage);
    applyLockScreenConfig(currentLockScreenConfig);

    mainContent.addEventListener('click', (event) => {
        const appIcon = event.target.closest('.app-icon');
        if (appIcon) {
            const appId = appIcon.dataset.app;
            if (appId) { 
                showApp(appId);
            }
        }
    });

    // Ensure Cloud Hawk Sync / Drive icons explicitly open their apps when tapped (home / all-apps shortcuts)
    (function wireCloudHawkShortcuts() {
        function attachShortcuts() {
            const syncIcons = document.querySelectorAll('.app-icon[data-app="cloudHawkSyncApp"], .app-icon[data-app="cloudHawkDriveApp"]');
            syncIcons.forEach(icon => {
                // avoid double-binding
                if (icon.dataset.cloudhawkBound === 'true') return;
                icon.addEventListener('click', (e) => {
                    const id = icon.dataset.app;
                    if (!id) return;
                    // ensure screen is on
                    if (!isScreenOn) {
                        toggleScreenOn();
                        setTimeout(() => showApp(id), 300);
                    } else {
                        showApp(id);
                    }
                });
                icon.dataset.cloudhawkBound = 'true';
            });
        }
        // attach now and also after app grid population changes
        attachShortcuts();
        // monitor additions to home/all apps grids
        const mo = new MutationObserver(() => attachShortcuts());
        mo.observe(document.querySelector('.app-grid') || document.body, { childList: true, subtree: true });
    })();

    if (homeButton) {
        homeButton.addEventListener('click', () => {
            if (!isScreenOn) return;
            appHistory = ['homeScreen']; 
            showApp('homeScreen');
        });
    }

    if (backButton) {
        backButton.addEventListener('click', navigateBack);
    }

    if (recentAppsButton) {
        recentAppsButton.addEventListener('click', () => {
            if (!isScreenOn) return;
            showApp('allAppsView'); 
        });
    }

    if (notificationIcon) {
        // Tapping the notification / ongoing-call chip will surface a concise call-style notification first,
        // then reveal the notification shade (matches behavior: show call notification rather than open dialer).
        notificationIcon.addEventListener('click', () => {
            if (!isScreenOn) return;
            // If there's an "ongoing call" simulated state, show call notification; otherwise toggle shade.
            const hasOngoingCall = localStorage.getItem('sim_ongoing_call') === 'true';
            if (hasOngoingCall) {
                createNotification('Call', 'Ongoing call — tap notification for details.');
                // ensure the notification shade is visible so user can interact with the call notification
                setTimeout(() => {
                    notificationShade.classList.add('active');
                }, 220);
            } else {
                // fallback: open the notification shade as usual
                toggleNotificationShade();
            }
        });
    }

    if (clearAllNotificationsBtn) {
        clearAllNotificationsBtn.addEventListener('click', clearNotifications);
    }

    // Quick settings toggle from notification shade
    function toggleQuickSettingsFromShade() {
        // try to find an existing QS row inside the notification shade
        let qsRow = document.getElementById('shadeQuickSettingsRow');
        if (qsRow) {
            qsRow.remove();
            return;
        }
        // create a compact quick settings row and prepend to notification shade
        qsRow = document.createElement('div');
        qsRow.id = 'shadeQuickSettingsRow';
        qsRow.className = 'qs-row';
        qsRow.style.padding = '12px 20px';
        qsRow.style.background = 'rgba(var(--surface-color-rgb), 0.9)';
        qsRow.style.borderRadius = '12px';
        qsRow.style.margin = '10px 16px';
        qsRow.style.justifyContent = 'space-between';
        qsRow.innerHTML = `
            <div class="qs-tile" role="button" tabindex="0" data-label="Users" aria-label="Users / Account">
                <div class="qs-icon"><span class="qs-glyph">👤</span></div>
                <div class="qs-label">Users</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="Settings" aria-label="Settings">
                <div class="qs-icon"><span class="qs-glyph">⚙️</span></div>
                <div class="qs-label">Settings</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="Brightness" aria-label="Brightness">
                <div class="qs-icon"><span class="qs-glyph">☀️</span></div>
                <div class="qs-label">Brightness</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="Airplane" aria-label="Airplane Mode">
                <div class="qs-icon"><span class="qs-glyph">✈️</span></div>
                <div class="qs-label">Airplane</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="Battery" aria-label="Battery">
                <div class="qs-icon qs-battery"><span class="qs-glyph">🔋</span></div>
                <div class="qs-label">Battery</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="MobileData" aria-label="Mobile Data">
                <div class="qs-icon"><span class="qs-glyph">📡</span></div>
                <div class="qs-label">Mobile Data</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="WiFi" aria-label="Wi‑Fi">
                <div class="qs-icon"><span class="qs-glyph">📶</span></div>
                <div class="qs-label">Wi‑Fi</div>
            </div>
            <div class="qs-tile" role="button" tabindex="0" data-label="Bluetooth" aria-label="Bluetooth">
                <div class="qs-icon"><span class="qs-glyph">🔵</span></div>
                <div class="qs-label">Bluetooth</div>
            </div>
            <div class="qs-tile compact" role="button" tabindex="0" data-label="Flashlight" aria-label="Flashlight">
                <div class="qs-icon"><span class="qs-glyph">🔦</span></div>
                <div class="qs-label">Flashlight</div>
            </div>
        `;

        // Add interactive handlers for the new quick-settings tiles
        (function attachQSHandlers(row) {
            try {
                const usersTile = row.querySelector('.qs-tile[data-label="Users"]');
                const settingsTile = row.querySelector('.qs-tile[data-label="Settings"]');
                const brightnessTile = row.querySelector('.qs-tile[data-label="Brightness"]');
                const airplaneTile = row.querySelector('.qs-tile[data-label="Airplane"]');
                const batteryTile = row.querySelector('.qs-tile[data-label="Battery"]');
                const mobileTile = row.querySelector('.qs-tile[data-label="MobileData"]');
                const wifiTile = row.querySelector('.qs-tile[data-label="WiFi"]');
                const btTile = row.querySelector('.qs-tile[data-label="Bluetooth"]');
                const flashTile = row.querySelector('.qs-tile[data-label="Flashlight"]');

                if (usersTile) {
                    usersTile.addEventListener('click', () => {
                        createNotification('Users', 'Open user accounts — switching profile (simulated).');
                        showDynamicIsland('Switching user profile', 1600);
                    });
                }
                if (settingsTile) {
                    settingsTile.addEventListener('click', () => {
                        showApp('settingsApp');
                        createNotification('Settings', 'Opened Settings.');
                    });
                }
                if (brightnessTile) {
                    brightnessTile.addEventListener('click', () => {
                        // toggle a simple "dim/bright" state visual
                        const isDim = document.documentElement.classList.toggle('qs-dimmed');
                        createNotification('Display', `Brightness: ${isDim ? 'Dimmed' : 'Normal'}`);
                    });
                }
                if (airplaneTile) {
                    airplaneTile.addEventListener('click', () => {
                        const active = airplaneTile.classList.toggle('active');
                        createNotification('Airplane mode', `${active ? 'Enabled' : 'Disabled'}`);
                    });
                }
                if (batteryTile) {
                    batteryTile.addEventListener('click', () => {
                        // open battery app
                        showApp('batteryApp');
                        createNotification('Battery', 'Opened Battery settings.');
                    });
                }
                if (mobileTile) {
                    mobileTile.addEventListener('click', () => {
                        const active = mobileTile.classList.toggle('active');
                        createNotification('Mobile Data', `${active ? 'Enabled' : 'Disabled'}`);
                    });
                }
                if (wifiTile) {
                    wifiTile.addEventListener('click', () => {
                        const active = wifiTile.classList.toggle('active');
                        createNotification('Wi‑Fi', `${active ? 'Connected' : 'Disconnected'}`);
                    });
                }
                if (btTile) {
                    btTile.addEventListener('click', () => {
                        const active = btTile.classList.toggle('active');
                        createNotification('Bluetooth', `${active ? 'On' : 'Off'}`);
                    });
                }
                if (flashTile) {
                    flashTile.addEventListener('click', () => {
                        flashlightOn = !flashlightOn;
                        if (flashlightOn) {
                            document.body.classList.add('flashlight-on');
                            createNotification('Flashlight', 'Flashlight turned ON.');
                        } else {
                            document.body.classList.remove('flashlight-on');
                            createNotification('Flashlight', 'Flashlight turned OFF.');
                        }
                    });
                }
            } catch (e) {
                console.warn('QS handlers attach failed', e);
            }
        })(qsRow);
        // insert directly under the header (after .shade-header)
        const shadeHeader = notificationShade.querySelector('.shade-header');
        if (shadeHeader && shadeHeader.parentNode) {
            shadeHeader.parentNode.insertBefore(qsRow, shadeHeader.nextSibling);
        } else {
            notificationShade.querySelector('.notification-list').prepend(qsRow);
        }
        // small particle feedback and notification
        window._spawnTapParticles && window._spawnTapParticles(200, 120);
        createNotification('Quick settings', 'Quick settings opened.');
    }

    const quickSettingsButton = document.getElementById('openQuickSettingsFromShade');
    const fixQSTilesSizeButton = document.getElementById('fixQSTilesSizeButton');

    // initialize fixed-size QS tiles preference
    const qsFixedPref = localStorage.getItem('qsFixedSize') === 'true';
    if (qsFixedPref) {
        document.documentElement.classList.add('qs-fixed-size');
        if (fixQSTilesSizeButton) fixQSTilesSizeButton.classList.add('active');
    }

    if (quickSettingsButton) {
        quickSettingsButton.addEventListener('click', () => {
            if (!isScreenOn) return;
            toggleQuickSettingsFromShade();
        });
    }

    // Toggle "Fix size" for Quick Settings tiles
    if (fixQSTilesSizeButton) {
        fixQSTilesSizeButton.addEventListener('click', () => {
            const enabled = document.documentElement.classList.toggle('qs-fixed-size');
            fixQSTilesSizeButton.classList.toggle('active', enabled);
            localStorage.setItem('qsFixedSize', enabled ? 'true' : 'false');
            createNotification('Quick settings', `Fixed tile size ${enabled ? 'enabled' : 'disabled'}.`);
        });
    }

    if (closeNotificationShadeBtn) {
        closeNotificationShadeBtn.addEventListener('click', toggleNotificationShade);
    }

    if (cameraButton) {
        cameraButton.addEventListener('click', () => {
            createNotification('Camera', 'Opening camera...');
        });
    }

    if (flashlightButton) {
        flashlightButton.addEventListener('click', () => {
            flashlightOn = !flashlightOn;
            if (flashlightOn) {
                document.body.classList.add('flashlight-on');
                createNotification('Flashlight', 'Flashlight turned ON.');
            } else {
                document.body.classList.remove('flashlight-on');
                createNotification('Flashlight', 'Flashlight turned OFF.');
            }
        });
    }

    if (powerButton) {
        powerButton.addEventListener('mousedown', startPowerButtonPress);
        powerButton.addEventListener('mouseup', endPowerButtonPress);
        powerButton.addEventListener('mouseleave', endPowerButtonPress);

        // Touch support for power button (mobile)
        powerButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startPowerButtonPress();
        }, { passive: false });

        powerButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            endPowerButtonPress();
        }, { passive: false });

        powerButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            endPowerButtonPress();
        }, { passive: false });
    }

    // Snap Key (opens Mind Space and can auto-capture clipboard/prompt)
    const snapButton = document.getElementById('snapButton');
    function showDynamicIsland(text, timeout = 4000) {
        const di = document.getElementById('dynamicIsland');
        if (!di) return;
        di.querySelector('.island-content').textContent = text;
        di.classList.add('active');
        setTimeout(() => di.classList.remove('active'), timeout);
    }

    if (snapButton) {
        snapButton.addEventListener('click', async () => {
            if (!isScreenOn) {
                toggleScreenOn();
                setTimeout(() => showDynamicIsland('Mind Space ready'), 800);
                return;
            }
            // open Mind Space app
            showApp('mindSpaceApp');
            // try to paste clipboard text automatically (if permission)
            try {
                const text = await navigator.clipboard.readText();
                const input = document.getElementById('mindSnapInput');
                if (input && text) {
                    input.value = text;
                    showDynamicIsland('Pasted clipboard into Mind Space');
                } else {
                    showDynamicIsland('Open Mind Space — ready to capture');
                }
            } catch (e) {
                showDynamicIsland('Open Mind Space — tap to save');
            }
        });
        // touch support
        snapButton.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
        snapButton.addEventListener('touchend', (e) => { e.preventDefault(); snapButton.click(); }, { passive: false });
    }

    // Keyboard support and hardware key mapping for bootloader screen:
    // ArrowUp / ArrowDown navigate boot menu; Enter / Power select; Escape cancels power menu
    document.addEventListener('keydown', (e) => {
        // If boot screen is active, allow up/down/enter to navigate/select
        if (bootScreen && bootScreen.classList.contains('active')) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateBootMenu(-1);
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateBootMenu(1);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Power') {
                e.preventDefault();
                // use the same selection handler as physical power button
                handleBootPowerSelect();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                // close boot screen and show lock screen
                bootScreen.classList.remove('active');
                showLockScreen();
                return;
            }
        }

        // If power menu active, Escape closes it
        if (powerMenu && powerMenu.classList.contains('active') && e.key === 'Escape') {
            e.preventDefault();
            hidePowerMenu();
            return;
        }

        // Map Volume Up/Down keys to increase/decrease even when boot screen active
        if (e.key === 'ArrowUp' && !bootScreen.classList.contains('active')) {
            // non-boot contexts already handled by normal UI; do nothing special here
            return;
        }
    });

    // Also listen for global key events for 'PageUp'/'PageDown' as alternative volume keys
    document.addEventListener('keydown', (e) => {
        if (e.key === 'PageUp') {
            e.preventDefault();
            increaseVolume();
        } else if (e.key === 'PageDown') {
            e.preventDefault();
            decreaseVolume();
        }
    });

    if (restartButton) restartButton.addEventListener('click', restartDevice);
    if (shutdownButton) shutdownButton.addEventListener('click', shutdownDevice);
    if (unlockBootloaderPowerButton) {
        unlockBootloaderPowerButton.addEventListener('click', async () => {
            // basic confirmation and simulated unlock flow
            if (!isScreenOn) return;
            const confirmed = confirm('Unlocking the bootloader will likely erase user data and may void warranty. Continue?');
            if (!confirmed) return;
            hidePowerMenu();
            showSystemMessage('Unlocking bootloader...', true);
            await new Promise(res => setTimeout(res, 2200));
            // simulate optional factory wipe: clear some user stores
            localStorage.removeItem('mindSpaceArchive');
            localStorage.removeItem('selectedWallpaper');
            localStorage.removeItem('lockScreenProfiles');
            localStorage.removeItem('lockScreenConfig');
            localStorage.setItem('bootloaderUnlocked', 'true');
            // update any visible bootloader status UI (if present)
            const bootStatusElem = document.getElementById('bootloaderStatusText');
            if (bootStatusElem) bootStatusElem.textContent = 'Unlocked';
            hideSystemMessage();
            createNotification('Bootloader', 'Bootloader unlocked.');
        });
    }
    if (cancelPowerMenuButton) cancelPowerMenuButton.addEventListener('click', hidePowerMenu);

    if (volumeUpButton) {
        volumeUpButton.addEventListener('click', increaseVolume);
        // Touch support
        volumeUpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            increaseVolume();
        }, { passive: false });
    }
    if (volumeDownButton) {
        volumeDownButton.addEventListener('click', decreaseVolume);
        // Touch support
        volumeDownButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            decreaseVolume();
        }, { passive: false });
    }

    if (closeAlbumArtOverlayButton) {
        closeAlbumArtOverlayButton.addEventListener('click', hideAlbumArt);
    }

    updateLockScreenTime();
    lockScreenTimeIntervalId = setInterval(updateLockScreenTime, 1000);

    // --- Flux Themes: Lock screen AI / dynamic features setup ---
    (function setupFluxThemes() {
        function ready(fn) {
            if (document.readyState !== 'loading') return fn();
            document.addEventListener('DOMContentLoaded', fn);
        }

        ready(() => {
            const settingsAppEl = document.getElementById('settingsApp');
            if (!settingsAppEl) return;

            // Create Flux Themes section UI
            const fluxSection = document.createElement('div');
            fluxSection.className = 'customization-section flux-themes-section';
            fluxSection.innerHTML = `
                <h3>Flux Themes (Lock screen AI & Dynamic)</h3>
                <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;width:100%;max-width:500px;margin:0 auto;">
                    <label style="display:flex;gap:10px;align-items:center;width:100%;">
                        <input type="checkbox" id="fluxAIDepthToggle">
                        <div style="flex:1;">
                            <strong>AI Dynamic Depth</strong>
                            <div style="font-size:0.95em;color:var(--on-surface-color);">Turn motion photos into layered wallpapers with immersive depth.</div>
                        </div>
                    </label>
                    <div style="display:flex;gap:10px;width:100%;align-items:center;">
                        <button id="fluxGenerateCaption" style="flex:1;">Script Your Style (Generate Caption)</button>
                        <button id="fluxGenerateCaptionSample" style="flex:0 0 auto;background-color:var(--outline-color);color:var(--on-surface-color);">Sample</button>
                    </div>
                    <label style="display:flex;gap:10px;align-items:center;width:100%;">
                        <input type="checkbox" id="fluxLuminousIconsToggle">
                        <div style="flex:1;">
                            <strong>Luminous Design — Light Shadow Icons</strong>
                            <div style="font-size:0.95em;color:var(--on-surface-color);">Enable natural light & shadow outlines to add subtle glow and depth to home screen icons.</div>
                        </div>
                    </label>
                    <div style="display:flex;gap:8px;">
                        <button id="fluxApplyNow">Apply Now</button>
                        <button id="fluxReset" style="background-color:#dc3545;">Reset</button>
                    </div>
                </div>
            `;
            // Insert into settings app body (after header)
            const settingsBody = settingsAppEl.querySelector('.app-body');
            if (settingsBody) {
                // place near top for visibility
                settingsBody.insertBefore(fluxSection, settingsBody.firstChild);
            }

            // Elements
            const fluxAIDepthToggle = document.getElementById('fluxAIDepthToggle');
            const fluxGenerateCaption = document.getElementById('fluxGenerateCaption');
            const fluxGenerateCaptionSample = document.getElementById('fluxGenerateCaptionSample');
            const fluxLuminousIconsToggle = document.getElementById('fluxLuminousIconsToggle');
            const fluxApplyNow = document.getElementById('fluxApplyNow');
            const fluxReset = document.getElementById('fluxReset');

            // Restore saved states
            fluxAIDepthToggle.checked = localStorage.getItem('fluxAIDepth') === 'true';
            fluxLuminousIconsToggle.checked = localStorage.getItem('fluxLuminousIcons') === 'true';
            if (fluxLuminousIconsToggle.checked) document.documentElement.classList.add('luminous-icons');

            // Handlers
            fluxAIDepthToggle.addEventListener('change', () => {
                localStorage.setItem('fluxAIDepth', fluxAIDepthToggle.checked);
                createNotification('Flux Themes', `AI Dynamic Depth ${fluxAIDepthToggle.checked ? 'enabled' : 'disabled'}.`);
            });

            fluxLuminousIconsToggle.addEventListener('change', () => {
                localStorage.setItem('fluxLuminousIcons', fluxLuminousIconsToggle.checked);
                if (fluxLuminousIconsToggle.checked) {
                    document.documentElement.classList.add('luminous-icons');
                } else {
                    document.documentElement.classList.remove('luminous-icons');
                }
                createNotification('Flux Themes', `Luminous Design ${fluxLuminousIconsToggle.checked ? 'enabled' : 'disabled'}.`);
            });

            fluxGenerateCaption.addEventListener('click', async () => {
                fluxGenerateCaption.disabled = true;
                fluxGenerateCaption.textContent = 'Generating…';
                try {
                    // Use the local websim chat API to get a short caption
                    const completion = await websim.chat.completions.create({
                        messages: [
                            { role: "system", content: "You are a concise caption generator for lock screen wallpapers. Provide one short, stylish caption (6-10 words) that matches the mood of a wallpaper." },
                            { role: "user", content: "Generate a short, stylish caption for my wallpaper." }
                        ],
                        // Keep reply brief
                    });
                    const caption = completion.content.trim();
                    // Show result as notification and prefill a quick prompt modal (simple prompt flow)
                    createNotification('Flux Caption', caption);
                    // Optionally put text into clipboard for quick use
                    try { await navigator.clipboard.writeText(caption); createNotification('Flux Caption', 'Caption copied to clipboard.'); } catch (e) {}
                } catch (err) {
                    console.error('Flux caption error', err);
                    createNotification('Flux Caption', 'Failed to generate caption.');
                } finally {
                    fluxGenerateCaption.disabled = false;
                    fluxGenerateCaption.textContent = 'Script Your Style (Generate Caption)';
                }
            });

            fluxGenerateCaptionSample.addEventListener('click', () => {
                const sample = "Drifting lights, quiet wonder — wake to delight.";
                createNotification('Flux Caption', sample);
                try { navigator.clipboard.writeText(sample); } catch (e) {}
            });

            fluxApplyNow.addEventListener('click', () => {
                createNotification('Flux Themes', 'Applying Flux Themes settings...');
                // Simulate applying AI depth by toggling a class on lockScreenEffectOverlay for visual demo
                const lockScreenEffectOverlay = document.getElementById('lockScreenEffectOverlay');
                if (lockScreenEffectOverlay) {
                    if (fluxAIDepthToggle.checked) {
                        lockScreenEffectOverlay.style.backdropFilter = 'blur(6px) saturate(120%)';
                        lockScreenEffectOverlay.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))';
                    } else {
                        lockScreenEffectOverlay.style.backdropFilter = '';
                        lockScreenEffectOverlay.style.background = '';
                    }
                }
                // Luminous icons effect is handled via CSS class on html (already toggled)
                createNotification('Flux Themes', 'Flux settings applied.');
            });

            fluxReset.addEventListener('click', () => {
                if (!confirm('Reset Flux Themes settings to defaults?')) return;
                fluxAIDepthToggle.checked = false;
                fluxLuminousIconsToggle.checked = false;
                localStorage.removeItem('fluxAIDepth');
                localStorage.removeItem('fluxLuminousIcons');
                document.documentElement.classList.remove('luminous-icons');
                const lockScreenEffectOverlay = document.getElementById('lockScreenEffectOverlay');
                if (lockScreenEffectOverlay) {
                    lockScreenEffectOverlay.style.backdropFilter = '';
                    lockScreenEffectOverlay.style.background = '';
                }
                createNotification('Flux Themes', 'Flux settings reset.');
            });
        });
    })();

    // --- LUMINOUS MOTION: Tap particles & halo effects ---
    (function setupTapParticles() {
        // create canvas overlay for particles
        const canvas = document.createElement('canvas');
        canvas.id = 'particleCanvas';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = 9999;
        document.querySelector('.screen').appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let DPR = Math.max(1, window.devicePixelRatio || 1);
        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.round(rect.width * DPR);
            canvas.height = Math.round(rect.height * DPR);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.scale(DPR, DPR);
        }
        resizeCanvas();
        window.addEventListener('resize', () => { DPR = Math.max(1, window.devicePixelRatio || 1); resizeCanvas(); });

        const particles = [];
        function spawnParticles(x, y) {
            const hue = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#61dafb';
            const color = hue.trim();
            // small halo
            particles.push({
                x, y, life: 400, maxLife: 400, r: 6, type: 'halo', color
            });
            const count = 18 + Math.floor(Math.random() * 8);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.8 + Math.random() * 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - (Math.random() * 0.6),
                    life: 600 + Math.random() * 400,
                    maxLife: 600 + Math.random() * 400,
                    r: 2 + Math.random() * 3,
                    type: 'spark',
                    color
                });
            }
        }

        // animate
        let last = performance.now();
        function tick(now) {
            const dt = now - last;
            last = now;
            ctx.clearRect(0, 0, canvas.width / DPR, canvas.height / DPR);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                const t = 1 - p.life / p.maxLife;
                if (p.type === 'spark') {
                    p.x += (p.vx || 0) * (dt / 16);
                    p.y += (p.vy || 0) * (dt / 16);
                    const alpha = (1 - t) * 0.95;
                    ctx.beginPath();
                    ctx.fillStyle = hexToRgba(p.color, alpha);
                    ctx.arc(p.x, p.y, p.r * (1 - 0.3 * t), 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'halo') {
                    const alpha = (1 - t) * 0.45;
                    const radius = p.r + t * 30;
                    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
                    grd.addColorStop(0, hexToRgba(p.color, alpha));
                    grd.addColorStop(1, hexToRgba(p.color, 0));
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // helper to convert CSS color to rgba string with alpha
        function hexToRgba(input, alpha) {
            // accept rgb/hex/var names; try to resolve by creating a temp element
            const tmp = document.createElement('div');
            tmp.style.color = input;
            document.body.appendChild(tmp);
            const cs = getComputedStyle(tmp).color;
            document.body.removeChild(tmp);
            // cs in the form "rgb(r, g, b)" or "rgba(...)"
            const m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!m) return `rgba(97,218,251,${alpha})`;
            return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
        }

        // bind taps/clicks on interactive elements
        function particleTapHandler(e) {
            // determine coordinates relative to screen
            const rect = canvas.getBoundingClientRect();
            let x = (e.clientX !== undefined) ? e.clientX - rect.left : (e.touches && e.touches[0] && e.touches[0].clientX - rect.left);
            let y = (e.clientY !== undefined) ? e.clientY - rect.top : (e.touches && e.touches[0] && e.touches[0].clientY - rect.top);
            if (typeof x !== 'number' || typeof y !== 'number') return;
            spawnParticles(x, y);
        }

        // Attach listeners to main interactive container for taps/clicks
        const interactiveRoot = document.querySelector('.screen');
        interactiveRoot.addEventListener('click', particleTapHandler);
        interactiveRoot.addEventListener('touchstart', particleTapHandler, { passive: true });

        // expose spawn for programmatic use (e.g., buttons, notifications)
        window._spawnTapParticles = spawnParticles;
    })();

    // --- Add "What's New" app for HawkOS 2.0 + Android 17 / Debian 13 update ---
    (function addWhatsNewApp() {
        const whatsNewApp = {
            id: 'whatsNewApp',
            name: "What's New",
            icon: 'placeholder_image.png',
            header: "HawkOS 2.2 • Android 17 • Debian 13 — What's New",
            contentHTML: `
                <div style="max-width:820px;margin:0 auto;text-align:left;">
                    <h3>HawkOS 2.1 Highlights</h3>
                    <ul>
                        <li>Refreshed Aero-inspired UI with Glass & Luminous icon options for a cleaner, modern look.</li>
                        <li>Lock screen customizer with presets, AI depth effects, widget toggles, and savable profiles.</li>
                        <li>Improved Quick Settings: notification when tiles are added, fixed-size option, and compact shade QS row.</li>
                        <li>Bootloader controls: safe unlock/relock flows with optional factory-wipe simulation and reboot handling.</li>
                        <li>Flux Themes: caption generator, AI-driven depth for wallpapers, and luminous icon visuals.</li>
                        <li>Pixel variant features: expressive restart animation, AOD wallpaper preview, and optional system sounds.</li>
                    </ul>

                    <h3>Android 17 & System</h3>
                    <ul>
                        <li>Privacy & sandbox improvements and new APIs for contextual widgets and image-generation integrations.</li>
                        <li>Better media controls, smoother background task handling, and AOD enhancements.</li>
                    </ul>

                    <h3>Debian 13 & VM Improvements</h3>
                    <ul>
                        <li>Improved VM tooling and container compatibility for CollabVM & VM0b0t apps.</li>
                        <li>Updated toolchain/kernel tweaks for broader native package support.</li>
                    </ul>

                    <h3>Quality-of-life</h3>
                    <ul>
                        <li>Lock-screen long-press to customize, snapshot "Snap" hardware key to open Mind Space (auto-paste), and particle/haptic visual feedback.</li>
                        <li>Battery health simulation & assistance, adaptive charging persistence, and stronger accessibility options (disable blur).</li>
                    </ul>

                    <h3>Quick Actions</h3>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
                        <button id="whatsNewClose" style="flex:1;min-width:140px;">Close</button>
                        <button id="whatsNewApplyAero" style="flex:1;min-width:140px;">Apply Aero Theme</button>
                        <button id="whatsNewShowSummary" style="flex:1;min-width:140px;">Show Summary Notification</button>
                        <button id="whatsNewCheckUpdates" style="flex:1;min-width:140px;background:var(--primary-color);color:var(--on-primary-color);">Software Update</button>
                    </div>

                    <div id="whatsNewUpdateCard" style="margin-top:14px;display:none;gap:8px;align-items:center;">
                        <div id="whatsNewUpdateStatus" style="padding:12px;border-radius:12px;background:rgba(0,0,0,0.06);color:var(--on-surface-color);">Status: Idle</div>
                        <div id="whatsNewUpdateActions" style="display:flex;gap:8px;margin-top:8px;">
                            <button id="whatsNewInstallBtn" style="display:none;">Install Update</button>
                            <button id="whatsNewLocalInstallBtn" style="display:none;">Local Install</button>
                            <button id="whatsNewJoinBetaBtn" style="display:none;">Join Beta (Closed)</button>
                            <button id="whatsNewCheckAgainBtn" style="display:none;">Check Again</button>
                        </div>
                        <label style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                            <input type="checkbox" id="whatsNewAutoUpdateToggle">
                            <span style="font-size:0.95em;color:var(--on-surface-color);">Enable Auto Update</span>
                        </label>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const closeBtn = appElement.querySelector('#whatsNewClose');
                const applyAeroBtn = appElement.querySelector('#whatsNewApplyAero');
                const showSummaryBtn = appElement.querySelector('#whatsNewShowSummary');
                const checkUpdatesBtn = appElement.querySelector('#whatsNewCheckUpdates');
                const updateCard = appElement.querySelector('#whatsNewUpdateCard');
                const updateStatus = appElement.querySelector('#whatsNewUpdateStatus');
                const installBtn = appElement.querySelector('#whatsNewInstallBtn');
                const localInstallBtn = appElement.querySelector('#whatsNewLocalInstallBtn');
                const joinBetaBtn = appElement.querySelector('#whatsNewJoinBetaBtn');
                const checkAgainBtn = appElement.querySelector('#whatsNewCheckAgainBtn');
                const autoUpdateToggle = appElement.querySelector('#whatsNewAutoUpdateToggle');

                if (closeBtn) closeBtn.addEventListener('click', () => showApp('homeScreen'));
                if (applyAeroBtn) applyAeroBtn.addEventListener('click', () => {
                    applyTheme(currentAccent, 'aero');
                    createNotification('Theme', 'Windows Aero applied.');
                });
                if (showSummaryBtn) showSummaryBtn.addEventListener('click', () => {
                    createNotification('Update Summary', 'HawkOS 2.1 adds UI polish, Lock Screen AI, Flux Themes, QS improvements, and VM/tooling enhancements.');
                    showDynamicIsland('HawkOS 2.1 highlights shown', 3000);
                    window._spawnTapParticles && window._spawnTapParticles(200, 220);
                });

                // restore auto-update preference
                autoUpdateToggle.checked = localStorage.getItem('whatsNewAutoUpdate') === 'true';
                autoUpdateToggle.addEventListener('change', (e) => {
                    localStorage.setItem('whatsNewAutoUpdate', e.target.checked ? 'true' : 'false');
                    createNotification('Software Update', `Auto Update ${e.target.checked ? 'enabled' : 'disabled'}.`);
                });

                // helper to set UI state after check
                function setUpdateUI({statusText, available=false}) {
                    updateCard.style.display = 'flex';
                    updateStatus.textContent = `Status: ${statusText}`;
                    installBtn.style.display = available ? 'inline-block' : 'none';
                    localInstallBtn.style.display = available ? 'inline-block' : 'none';
                    joinBetaBtn.style.display = available ? 'inline-block' : 'none';
                    checkAgainBtn.style.display = 'inline-block';
                }

                // Simulated check flow
                async function performCheck(simulatedDelay = 1400) {
                    if (!isScreenOn) {
                        createNotification('Software Update', 'Turn the screen on to check for updates.');
                        return;
                    }
                    hideAllOverlays();
                    showDynamicIsland('Checking for updates…', 1600);
                    updateCard.style.display = 'flex';
                    updateStatus.textContent = 'Status: Checking for updates…';
                    installBtn.style.display = 'none';
                    localInstallBtn.style.display = 'none';
                    joinBetaBtn.style.display = 'none';
                    checkAgainBtn.style.display = 'none';

                    // show a system message overlay briefly to simulate OS-level check
                    showSystemMessage('Checking for updates...', true);
                    await new Promise(res => setTimeout(res, simulatedDelay));
                    hideSystemMessage();

                    // Demo: report available update
                    const available = true;
                    if (available) {
                        setUpdateUI({ statusText: 'Update available: HawkOS 2.2', available: true });
                        createNotification('Software Update', 'Update available: HawkOS 2.2');
                        // if auto-update enabled, simulate auto-download/auto-install behavior
                        if (autoUpdateToggle.checked) {
                            createNotification('Software Update', 'Auto Update is enabled — downloading and installing...');
                            setTimeout(() => {
                                // finalize install and record build info
                                localStorage.setItem('hawk_build_hash', 'hawkos-2.2');
                                localStorage.setItem('hawk_build_date', new Date().toISOString());
                                createNotification('Software Update', 'Update installed. Restarting to apply HawkOS 2.2...');
                                updateStatus.textContent = 'Status: Installed (restarting)';
                                // short delay then reboot/boot sequence
                                setTimeout(() => {
                                    restartDevice();
                                }, 800);
                            }, 1600);
                        }
                    } else {
                        setUpdateUI({ statusText: 'No updates available', available: false });
                        createNotification('Software Update', 'No updates available.');
                    }
                }

                // primary check button
                if (checkUpdatesBtn) {
                    checkUpdatesBtn.addEventListener('click', () => {
                        performCheck(1200);
                    });
                }
                if (checkAgainBtn) {
                    checkAgainBtn.addEventListener('click', () => performCheck(900));
                }

                if (installBtn) {
                    installBtn.addEventListener('click', async () => {
                        if (!confirm('Install update HawkOS 2.1 now?')) return;
                        // show install progress
                        showSystemMessage('Installing HawkOS 2.1...', true);
                        await new Promise(res => setTimeout(res, 2200));
                        // record the new build metadata
                        localStorage.setItem('hawk_build_hash', 'hawkos-2.1');
                        localStorage.setItem('hawk_build_date', new Date().toISOString());
                        hideSystemMessage();
                        createNotification('Software Update', 'HawkOS 2.1 installed — device will restart now.');
                        updateStatus.textContent = 'Status: Installed (restarting)';
                        // short delay to let user see notification, then restart
                        setTimeout(() => {
                            restartDevice();
                        }, 800);
                    });
                }
                if (localInstallBtn) {
                    localInstallBtn.addEventListener('click', async () => {
                        createNotification('Software Update', 'Select a local update package to install (simulated).');
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.zip,.img,.bin';
                        input.style.display = 'none';
                        document.body.appendChild(input);
                        input.click();
                        input.addEventListener('change', async () => {
                            if (!input.files || !input.files[0]) {
                                createNotification('Software Update', 'No local package selected.');
                                document.body.removeChild(input);
                                return;
                            }
                            createNotification('Software Update', `Installing local package: ${input.files[0].name}`);
                            showSystemMessage('Installing local package...', true);
                            await new Promise(res => setTimeout(res, 2000));
                            hideSystemMessage();
                            createNotification('Software Update', 'Local install complete.');
                            document.body.removeChild(input);
                        });
                    });
                }
                if (joinBetaBtn) {
                    joinBetaBtn.addEventListener('click', async () => {
                        const confirmed = confirm('Join the closed beta program (Release Candidate)? This may be unstable.');
                        if (!confirmed) return;
                        createNotification('Beta Program', 'Requesting invitation to closed beta...');
                        showDynamicIsland('Checking Beta availability...', 1600);
                        await new Promise(res => setTimeout(res, 1400));
                        const accepted = Math.random() < 0.6;
                        if (accepted) {
                            createNotification('Beta Program', 'You are now enrolled in the Release Candidate / Closed Beta.');
                            localStorage.setItem('whatsNewInBeta', 'true');
                            updateStatus.textContent = 'Status: Enrolled in Closed Beta (auto-update applies)';
                            autoUpdateToggle.checked = true;
                            localStorage.setItem('whatsNewAutoUpdate', 'true');
                        } else {
                            createNotification('Beta Program', 'Sorry, the closed beta is full. Check again later.');
                        }
                    });
                }

                // init UI hidden state
                updateCard.style.display = 'none';
            }
        };

        // Insert into apps array and create view/icon entries consistent with other apps
        apps.unshift(whatsNewApp);

        // create app view and init
        const appViewDiv = document.createElement('div');
        appViewDiv.id = whatsNewApp.id;
        appViewDiv.className = 'app-view';
        appViewDiv.innerHTML = `
            <div class="app-header">
                <h2>${whatsNewApp.header}</h2>
            </div>
            <div class="app-body">
                ${whatsNewApp.contentHTML}
            </div>
        `;
        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(appViewDiv);
        if (whatsNewApp.init && typeof whatsNewApp.init === 'function') {
            whatsNewApp.init(appViewDiv);
        }

        // add icon to home grid and all apps grid (if present)
        const appIconDiv = document.createElement('div');
        appIconDiv.className = 'app-icon';
        appIconDiv.dataset.app = whatsNewApp.id;
        appIconDiv.innerHTML = `
            <img src="${whatsNewApp.icon}" alt="${whatsNewApp.name} Icon">
            <span>${whatsNewApp.name}</span>
        `;
        const homeScreenAppGrid = document.querySelector('#homeScreen .app-grid');
        if (homeScreenAppGrid) homeScreenAppGrid.appendChild(appIconDiv.cloneNode(true));
        const allAppsGridElement = document.querySelector('#allAppsGrid');
        if (allAppsGridElement) allAppsGridElement.appendChild(appIconDiv.cloneNode(true));
    })();

    // --- Extra UI behaviours: Recents refresh, Widget Resize controls, Screen Automation permission ---
    (function enhancePixelLauncher() {
        // 1) Slight Recents visual adjustments (class toggles applied when recents view opened)
        function markRecentsUpdated() {
            const recentView = document.getElementById('recentAppsView');
            if (!recentView) return;
            recentView.classList.add('recent-updated');
            // subtle timed accent pulse
            setTimeout(() => recentView.classList.remove('recent-updated'), 1400);
        }

        // 2) Widget resize controls: add small resize action buttons to widgets and hide grabbers while active
        function attachWidgetResizeControls() {
            const grid = document.querySelector('.app-grid');
            if (!grid) return;
            // create a single floating control container reused when entering resize mode
            const controls = document.createElement('div');
            controls.className = 'widget-resize-controls';
            controls.innerHTML = `
                <button id="resizeShrinkBtn" title="Shrink">−</button>
                <button id="resizeGrowBtn" title="Grow">＋</button>
                <button id="resizeCloseBtn" title="Done">Done</button>
            `;
            document.querySelector('.screen').appendChild(controls);

            // state
            let activeWidget = null;
            function enterResizeMode(widgetEl) {
                if (!widgetEl) return;
                activeWidget = widgetEl;
                document.querySelector('.screen').classList.add('widget-resize-active');
                // position controls near top-right of the widget
                const rect = widgetEl.getBoundingClientRect();
                const screenRect = document.querySelector('.screen').getBoundingClientRect();
                controls.style.top = Math.max(8, rect.top - screenRect.top + 8) + 'px';
                controls.style.left = (rect.right - screenRect.left - controls.offsetWidth - 8) + 'px';
                controls.style.display = 'flex';
            }
            function leaveResizeMode() {
                activeWidget = null;
                document.querySelector('.screen').classList.remove('widget-resize-active');
                controls.style.display = 'none';
            }

            // apply to existing home widgets: clicking toggles resize mode for that widget
            document.querySelectorAll('.home-widget, .lock-screen-widget').forEach(w => {
                // add a small (non-intrusive) grabber element to mark resize handles (these will hide dynamically)
                const grab = document.createElement('div');
                grab.className = 'widget-resize-grabber';
                grab.title = 'Resize';
                grab.style.right = '10px';
                grab.style.top = '10px';
                grab.style.position = 'absolute';
                grab.style.zIndex = '70';
                w.style.position = 'relative';
                w.appendChild(grab);
                // clicking widget enters resize mode
                w.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    enterResizeMode(w);
                }, { passive: true });
            });

            // control actions
            controls.querySelector('#resizeGrowBtn').addEventListener('click', () => {
                if (!activeWidget) return;
                // visual feedback for grow
                activeWidget.style.transform = 'scale(1.08)';
                setTimeout(()=> activeWidget.style.transform = '', 180);
                createNotification('Widget', 'Widget resized larger.');
            });
            controls.querySelector('#resizeShrinkBtn').addEventListener('click', () => {
                if (!activeWidget) return;
                activeWidget.style.transform = 'scale(0.94)';
                setTimeout(()=> activeWidget.style.transform = '', 180);
                createNotification('Widget', 'Widget resized smaller.');
            });
            controls.querySelector('#resizeCloseBtn').addEventListener('click', leaveResizeMode);

            // clicking outside closes resize mode
            document.querySelector('.screen').addEventListener('click', (e) => {
                if (!e.target.closest('.home-widget') && !e.target.closest('.widget-resize-controls')) {
                    leaveResizeMode();
                }
            });
            // start hidden
            controls.style.display = 'none';

            // programmatic exposure if needed elsewhere
            window._enterWidgetResize = enterResizeMode;
        }

        // 3) Settings: add "Screen automation" special permission entry to System category
        function injectScreenAutomationPermission() {
            const settingsEl = document.getElementById('settingsApp');
            if (!settingsEl) return;
            // find System section container inside settings (heuristic: "System" heading)
            const systemHeading = Array.from(settingsEl.querySelectorAll('h3')).find(h => /System/i.test(h.textContent));
            let container = null;
            if (systemHeading) {
                // the UL right after heading is the system list in this layout
                container = systemHeading.nextElementSibling;
            }
            // fallback to app-body
            if (!container) container = settingsEl.querySelector('.app-body');

            // create permission entry
            const permDiv = document.createElement('div');
            permDiv.className = 'permission-entry';
            permDiv.innerHTML = `
                <div>
                    <strong>Screen automation</strong>
                    <div class="perm-desc">Allow automation of screen actions (special access for trusted apps).</div>
                </div>
                <div class="perm-actions">
                    <button id="screenAutomationGrant" class="primary">Grant</button>
                    <button id="screenAutomationRevoke">Revoke</button>
                </div>
            `;
            container.appendChild(permDiv);

            // persist state
            const grantBtn = permDiv.querySelector('#screenAutomationGrant');
            const revokeBtn = permDiv.querySelector('#screenAutomationRevoke');
            function updateButtons() {
                const granted = localStorage.getItem('screenAutomationGranted') === 'true';
                grantBtn.disabled = granted;
                revokeBtn.disabled = !granted;
                if (granted) grantBtn.textContent = 'Granted';
                else grantBtn.textContent = 'Grant';
            }
            grantBtn.addEventListener('click', () => {
                if (confirm('Grant Screen automation permission to trusted apps?')) {
                    localStorage.setItem('screenAutomationGranted','true');
                    createNotification('Permissions', 'Screen automation permission granted.');
                    updateButtons();
                }
            });
            revokeBtn.addEventListener('click', () => {
                if (confirm('Revoke Screen automation permission?')) {
                    localStorage.setItem('screenAutomationGranted','false');
                    createNotification('Permissions', 'Screen automation permission revoked.');
                    updateButtons();
                }
            });
            updateButtons();
        }

        // Initialize these enhancements after the rest of the UI is built
        try {
            markRecentsUpdated();
            attachWidgetResizeControls();
            injectScreenAutomationPermission();
        } catch (e) {
            console.warn('PixelLauncher enhancements failed to initialize', e);
        }
    })();

    initiateBootSequence();

    // Update Microsoft Word app description with concise usage info provided by the user
    (function enhanceWordAppDescription() {
        const wordAppView = document.getElementById('word2010App');
        if (!wordAppView) return;
        const body = wordAppView.querySelector('.app-body');
        if (!body) return;

        // Replace body content with a clear "What Word is used for" + "What you can add" + example uses,
        // while keeping the existing interactive editor (if present) below as a demo section.
        body.innerHTML = `
            <div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;text-align:left;">
                <h3>What Microsoft Word is used for</h3>
                <ul>
                    <li>Writing documents</li>
                    <li>School assignments</li>
                    <li>Letters</li>
                    <li>Reports</li>
                    <li>Resumes (CV)</li>
                    <li>Books</li>
                    <li>Forms</li>
                </ul>

                <h3>What you can add in Word</h3>
                <ul>
                    <li>Text (with different fonts and sizes)</li>
                    <li>Images</li>
                    <li>Tables</li>
                    <li>Charts</li>
                    <li>Page numbers</li>
                    <li>Headers and footers</li>
                    <li>Spell check</li>
                    <li>Formatting (bold, italic, underline)</li>
                </ul>

                <h3>File format</h3>
                <p>Usually saved as <code>.docx</code></p>

                <h3>Example uses</h3>
                <ul>
                    <li>Write an essay</li>
                    <li>Make a resume</li>
                    <li>Create a formal letter</li>
                    <li>Print documents</li>
                </ul>

                <hr style="opacity:0.06;border:none;border-top:1px solid rgba(255,255,255,0.04);">

                <div id="wordDemoArea" style="background:var(--surface-color);padding:12px;border-radius:12px;">
                    <strong>Interactive demo</strong>
                    <div id="wordEditorWrap" style="background:transparent;padding-top:8px;">
                        <!-- keep existing editor if present; otherwise provide a simple editable region -->
                        <div id="wordEditor" contenteditable="true" spellcheck="true" style="min-height:180px;padding:12px;border-radius:8px;background:transparent;color:var(--on-surface-color);outline:none;">
                            <h2 style="margin-top:0;">Document Title</h2>
                            <p>Start typing your document here. Use this area to try Word-like editing: insert text, basic formatting, and paste images.</p>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:10px;">
                            <button id="wordBoldBtn">Bold</button>
                            <button id="wordItalicBtn">Italic</button>
                            <button id="wordUnderlineBtn">Underline</button>
                            <button id="wordWordCountBtn">Word Count</button>
                        </div>
                        <div id="wordStatus" style="margin-top:8px;font-size:0.95em;color:var(--on-surface-color);">Template: <span id="wordCurrentTemplate">Default</span></div>
                    </div>
                </div>
            </div>
        `;

        // wire up simple formatting buttons (non-destructive, uses execCommand for demo)
        const editor = wordAppView.querySelector('#wordEditor');
        const boldBtn = wordAppView.querySelector('#wordBoldBtn');
        const italicBtn = wordAppView.querySelector('#wordItalicBtn');
        const underlineBtn = wordAppView.querySelector('#wordUnderlineBtn');
        const wcBtn = wordAppView.querySelector('#wordWordCountBtn');
        if (boldBtn) boldBtn.addEventListener('click', () => { document.execCommand('bold'); editor.focus(); });
        if (italicBtn) italicBtn.addEventListener('click', () => { document.execCommand('italic'); editor.focus(); });
        if (underlineBtn) underlineBtn.addEventListener('click', () => { document.execCommand('underline'); editor.focus(); });
        if (wcBtn) wcBtn.addEventListener('click', () => {
            const text = (editor && (editor.innerText || editor.textContent)) || '';
            const stripped = text.replace(/\s+/g,' ').trim();
            const words = stripped ? stripped.split(' ').filter(Boolean).length : 0;
            createNotification('Word Count', `Words: ${words}`);
        });
    })();

    // --- YouTube app: search, embedded player and history (lightweight, uses youtube.com/embed) ---
    (function setupYouTubeApp() {
        function renderSearchResults(container, results) {
            const list = container.querySelector('#ytResultsList');
            list.innerHTML = '';
            if (!results || results.length === 0) {
                list.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No results</div>';
                return;
            }
            results.forEach(item => {
                const row = document.createElement('div');
                row.className = 'yt-result';
                row.style.display = 'flex';
                row.style.gap = '10px';
                row.style.alignItems = 'center';
                row.style.padding = '8px';
                row.style.borderRadius = '8px';
                row.style.cursor = 'pointer';
                row.style.background = 'rgba(0,0,0,0.02)';
                row.innerHTML = `
                    <img src="${item.thumbnail}" alt="${item.title}" style="width:120px;height:68px;object-fit:cover;border-radius:6px;">
                    <div style="flex:1;text-align:left;">
                        <div style="font-weight:600;">${item.title}</div>
                        <div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">${item.channel}</div>
                    </div>
                `;
                row.addEventListener('click', () => {
                    playYouTubeVideo(container, item.videoId, item.title);
                });
                list.appendChild(row);
            });
        }

        function playYouTubeVideo(container, videoId, title) {
            const playerWrap = container.querySelector('#ytPlayerWrap');
            playerWrap.innerHTML = '';
            if (!videoId) {
                // fallback: open youtube search for title if no direct id
                const q = encodeURIComponent(title || '');
                playerWrap.innerHTML = `<div style="padding:12px;">No embeddable video id available — <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">open on youtube.com</a></div>`;
                createNotification('YouTube', `Opened search for: ${title}`);
                return;
            }
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            iframe.style.width = '100%';
            iframe.style.height = '360px';
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', 'true');
            playerWrap.appendChild(iframe);

            // save to history
            const history = JSON.parse(localStorage.getItem('ytHistory') || '[]');
            history.unshift({ videoId, title, time: new Date().toISOString() });
            // keep last 50
            localStorage.setItem('ytHistory', JSON.stringify(history.slice(0, 50)));
            renderYouTubeHistory(container);
            createNotification('YouTube', `Playing: ${title}`);
        }

        function renderYouTubeHistory(container) {
            const histWrap = container.querySelector('#ytHistoryList');
            histWrap.innerHTML = '';
            const history = JSON.parse(localStorage.getItem('ytHistory') || '[]');
            if (!history.length) {
                histWrap.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No history yet</div>';
                return;
            }
            history.forEach(entry => {
                const el = document.createElement('div');
                el.style.padding = '8px';
                el.style.borderRadius = '8px';
                el.style.cursor = 'pointer';
                el.style.background = 'rgba(0,0,0,0.02)';
                el.style.marginBottom = '6px';
                el.innerHTML = `<div style="font-weight:600;">${entry.title}</div><div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${new Date(entry.time).toLocaleString()}</div>`;
                el.addEventListener('click', () => {
                    playYouTubeVideo(container, entry.videoId, entry.title);
                });
                histWrap.appendChild(el);
            });
        }

        async function fetchYouTubeSearch(query) {
            // First try a lightweight HTML proxy to get the YouTube results page and extract a videoId.
            // Fallback to suggestions if the proxy fails.
            try {
                const proxyUrl = `https://r.jina.ai/http://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                const resp = await fetch(proxyUrl);
                if (resp.ok) {
                    const text = await resp.text();
                    // look for first occurrence of "videoId":"<id>" in the HTML/JSON blobs embedded in the page
                    const match = text.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
                    if (match && match[1]) {
                        const videoId = match[1];
                        // try to extract a title near the same area (best-effort)
                        const titleMatch = text.match(new RegExp(`"videoId"\\s*:\\s*"${videoId}".{0,200}?"title"\\s*:\\s*{"runs"\\s*:\\s*\\[\\s*{\\s*"text"\\s*:\\s*"([^"]+)"`));
                        const title = (titleMatch && titleMatch[1]) ? titleMatch[1] : query;
                        // return a single high-confidence result so the UI can play it
                        return [{
                            title,
                            videoId,
                            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                            channel: ''
                        }];
                    }
                }
            } catch (err) {
                console.warn('Proxy HTML parse failed', err);
            }

            // Fallback: Try suggestions endpoint via JSONP to obtain titles (no guaranteed ids)
            try {
                const suggUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&callback=__ytcb`;
                return await new Promise((resolve) => {
                    const cbName = '__ytcb' + Math.floor(Math.random() * 1000000);
                    window[cbName] = function(data) {
                        try {
                            const suggestions = (data && data[1]) || [];
                            const results = suggestions.slice(0,8).map(s => ({
                                title: typeof s === 'string' ? s : (s[0] || ''),
                                videoId: '', // unknown from suggestions
                                thumbnail: 'placeholder_image.png',
                                channel: ''
                            }));
                            delete window[cbName];
                            script.remove();
                            resolve(results);
                        } catch (e) {
                            delete window[cbName];
                            script.remove();
                            resolve([]);
                        }
                    };
                    const script = document.createElement('script');
                    script.src = suggUrl.replace('__ytcb', cbName);
                    script.onerror = () => { try { delete window[cbName]; } catch {} ; script.remove(); resolve([]); };
                    document.body.appendChild(script);
                });
            } catch (e) {
                console.warn('YouTube search fetch failed', e);
                return [];
            }
        }

        // Attach UI when youtubeApp view exists (apps were created earlier)
        function attachToYouTubeApp() {
            const ytApp = document.getElementById('youtubeApp');
            if (!ytApp) return;
            const body = ytApp.querySelector('.app-body');
            if (!body) return;

            // Expand UI: API key input + search + player + results + history + comments/like controls
            body.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:920px;margin:0 auto;">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <input id="ytApiKey" type="text" placeholder="(Optional) YouTube Data API v3 Key" style="flex:0 0 360px;padding:8px;border-radius:8px;border:1px solid var(--outline-color);">
                        <input id="ytSearchInput" type="search" placeholder="Search YouTube (press Enter or Search)" style="flex:1;padding:10px;border-radius:12px;border:1px solid var(--outline-color);">
                        <button id="ytSearchBtn" style="padding:10px 14px;border-radius:12px;">Search</button>
                        <button id="ytOpenSiteBtn" style="padding:10px 14px;border-radius:12px;background:var(--outline-color);">Open youtube.com</button>
                    </div>

                    <div id="ytPlayerWrap" style="width:100%;min-height:260px;background:linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.02));border-radius:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:12px;">
                        <div id="ytPlayerArea" style="width:100%;max-width:840px;height:360px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;">No video playing</div>
                        <div id="ytPlayerControls" style="width:100%;max-width:840px;display:flex;gap:8px;align-items:center;margin-top:8px;justify-content:space-between;">
                            <div style="display:flex;gap:8px;align-items:center;">
                                <button id="ytLikeBtn" style="padding:8px 10px;border-radius:8px;border:none;background:var(--outline-color);">👍 Like</button>
                                <button id="ytDislikeBtn" style="padding:8px 10px;border-radius:8px;border:none;background:var(--outline-color);">👎 Dislike</button>
                            </div>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <button id="ytOpenInYouTube" style="padding:8px 10px;border-radius:8px;border:none;background:var(--primary-color);color:var(--on-primary-color);">Open on YouTube</button>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;flex-wrap:wrap;">
                        <div style="flex:1;min-width:280px;">
                            <h4 style="margin:6px 0;color:var(--primary-color);">Results</h4>
                            <div id="ytResultsList" style="display:flex;flex-direction:column;gap:6px;max-height:320px;overflow:auto;padding:6px;border-radius:8px;background:rgba(0,0,0,0.02);"></div>
                        </div>

                        <div style="width:360px;min-width:260px;">
                            <h4 style="margin:6px 0;color:var(--primary-color);">History</h4>
                            <div id="ytHistoryList" style="max-height:160px;overflow:auto;padding:6px;background:rgba(0,0,0,0.02);border-radius:8px;"></div>
                            <div style="display:flex;gap:8px;margin-top:8px;">
                                <button id="ytClearHistory" style="flex:1;background:#dc3545;">Clear History</button>
                                <button id="ytExportHistory" style="flex:1;background:var(--outline-color);">Export</button>
                            </div>

                            <h4 style="margin:12px 0 6px 0;color:var(--primary-color);">Comments (Local)</h4>
                            <div id="ytCommentsList" style="max-height:200px;overflow:auto;padding:6px;background:rgba(0,0,0,0.02);border-radius:8px;margin-bottom:8px;"></div>
                            <div style="display:flex;gap:8px;">
                                <input id="ytCommentInput" placeholder="Write a comment..." style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--outline-color);">
                                <button id="ytPostComment" style="padding:8px 10px;border-radius:8px;background:var(--primary-color);color:var(--on-primary-color);">Post</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const container = ytApp;
            const apiKeyInput = container.querySelector('#ytApiKey');
            const input = container.querySelector('#ytSearchInput');
            const searchBtn = container.querySelector('#ytSearchBtn');
            const openSiteBtn = container.querySelector('#ytOpenSiteBtn');
            const clearHistoryBtn = container.querySelector('#ytClearHistory');
            const exportBtn = container.querySelector('#ytExportHistory');

            const playerArea = container.querySelector('#ytPlayerArea');
            const likeBtn = container.querySelector('#ytLikeBtn');
            const dislikeBtn = container.querySelector('#ytDislikeBtn');
            const openInYouTubeBtn = container.querySelector('#ytOpenInYouTube');

            const commentsList = container.querySelector('#ytCommentsList');
            const commentInput = container.querySelector('#ytCommentInput');
            const postCommentBtn = container.querySelector('#ytPostComment');

            // helpers for local likes/dislikes and comments
            function getLikesMap() {
                return JSON.parse(localStorage.getItem('ytLikes') || '{}');
            }
            function setLikesMap(m) {
                localStorage.setItem('ytLikes', JSON.stringify(m));
            }
            function toggleLike(videoId) {
                const map = getLikesMap();
                map[videoId] = map[videoId] === 'like' ? null : 'like';
                if (map[videoId] === 'like') {
                    // remove dislike if set
                    if (map[videoId] === 'dislike') map[videoId] = 'like';
                }
                setLikesMap(map);
                renderLikeState(videoId);
            }
            function toggleDislike(videoId) {
                const map = getLikesMap();
                map[videoId] = map[videoId] === 'dislike' ? null : 'dislike';
                if (map[videoId] === 'dislike') {
                    if (map[videoId] === 'like') map[videoId] = 'dislike';
                }
                setLikesMap(map);
                renderLikeState(videoId);
            }
            function renderLikeState(videoId) {
                const map = getLikesMap();
                const state = map[videoId] || null;
                likeBtn.style.background = state === 'like' ? 'color-mix(in srgb, var(--primary-color), black 8%)' : 'var(--outline-color)';
                dislikeBtn.style.background = state === 'dislike' ? 'color-mix(in srgb, var(--primary-color), black 8%)' : 'var(--outline-color)';
            }

            function getComments(videoId) {
                const all = JSON.parse(localStorage.getItem('ytComments') || '{}');
                return all[videoId] || [];
            }
            function saveComment(videoId, author, text) {
                const all = JSON.parse(localStorage.getItem('ytComments') || '{}');
                all[videoId] = all[videoId] || [];
                all[videoId].unshift({ id: 'c' + Date.now(), author: author || 'You', text, time: new Date().toISOString() });
                localStorage.setItem('ytComments', JSON.stringify(all));
            }
            function renderComments(videoId) {
                commentsList.innerHTML = '';
                const list = getComments(videoId);
                if (!list.length) {
                    commentsList.innerHTML = '<div style="padding:6px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No comments yet (local).</div>';
                    return;
                }
                list.forEach(c => {
                    const row = document.createElement('div');
                    row.style.padding = '8px';
                    row.style.borderRadius = '8px';
                    row.style.background = 'rgba(0,0,0,0.02)';
                    row.style.marginBottom = '6px';
                    row.innerHTML = `<div style="font-weight:600;">${c.author} · <span style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${new Date(c.time).toLocaleString()}</span></div><div style="margin-top:6px;">${c.text}</div>`;
                    commentsList.appendChild(row);
                });
            }

            // wiring likes/dislikes
            likeBtn.addEventListener('click', () => {
                if (!currentPlayingId) return;
                toggleLike(currentPlayingId);
                createNotification('YouTube', 'Like recorded locally.');
            });
            dislikeBtn.addEventListener('click', () => {
                if (!currentPlayingId) return;
                toggleDislike(currentPlayingId);
                createNotification('YouTube', 'Dislike recorded locally.');
            });

            postCommentBtn.addEventListener('click', () => {
                if (!currentPlayingId) {
                    createNotification('YouTube', 'Play a video before posting a comment.');
                    return;
                }
                const txt = (commentInput.value || '').trim();
                if (!txt) return;
                saveComment(currentPlayingId, 'You', txt);
                commentInput.value = '';
                renderComments(currentPlayingId);
                createNotification('YouTube', 'Comment posted (local).');
            });

            // Open site button
            openSiteBtn.addEventListener('click', () => {
                window.open('https://www.youtube.com', '_blank');
            });

            // Export & clear history actions
            clearHistoryBtn.addEventListener('click', () => {
                if (!confirm('Clear YouTube playback history?')) return;
                localStorage.removeItem('ytHistory');
                renderYouTubeHistory(container);
                createNotification('YouTube', 'History cleared.');
            });
            exportBtn.addEventListener('click', () => {
                try {
                    const history = JSON.parse(localStorage.getItem('ytHistory') || '[]');
                    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'youtube_history.json';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    createNotification('YouTube', 'History exported.');
                } catch (e) {
                    createNotification('YouTube', 'Failed to export history.');
                }
            });

            // Player state
            let currentPlayingId = null;
            function showVideoInPlayer(videoId, title) {
                currentPlayingId = videoId;
                playerArea.innerHTML = '';
                if (!videoId) {
                    playerArea.textContent = 'No video playing';
                    renderComments(null);
                    likeBtn.style.display = 'none';
                    dislikeBtn.style.display = 'none';
                    openInYouTubeBtn.style.display = 'none';
                    return;
                }
                likeBtn.style.display = '';
                dislikeBtn.style.display = '';
                openInYouTubeBtn.style.display = '';
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                playerArea.appendChild(iframe);
                renderLikeState(videoId);
                renderComments(videoId);
                // update history
                const history = JSON.parse(localStorage.getItem('ytHistory') || '[]');
                history.unshift({ videoId, title, time: new Date().toISOString() });
                localStorage.setItem('ytHistory', JSON.stringify(history.slice(0, 50)));
                renderYouTubeHistory(container);
            }

            openInYouTubeBtn.addEventListener('click', () => {
                if (!currentPlayingId) return;
                window.open(`https://www.youtube.com/watch?v=${currentPlayingId}`, '_blank');
            });

            // Search integration: if API key provided, call YouTube Data API v3; else fallback to proxy scraping
            async function fetchYouTubeSearch(query) {
                const key = (apiKeyInput.value || '').trim();
                if (key) {
                    try {
                        const params = new URLSearchParams({
                            key,
                            part: 'snippet',
                            maxResults: '12',
                            q: query,
                            type: 'video,channel'
                        });
                        const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
                        const resp = await fetch(url);
                        if (resp.ok) {
                            const json = await resp.json();
                            const items = (json.items || []).map(it => {
                                return {
                                    title: it.snippet && it.snippet.title || '',
                                    videoId: it.id && it.id.videoId ? it.id.videoId : '',
                                    thumbnail: (it.snippet && it.snippet.thumbnails && (it.snippet.thumbnails.high || it.snippet.thumbnails.default) && (it.snippet.thumbnails.high.url || it.snippet.thumbnails.default.url)) || 'placeholder_image.png',
                                    channel: it.snippet && it.snippet.channelTitle || ''
                                };
                            });
                            return items;
                        } else {
                            console.warn('YouTube API error', resp.status);
                            createNotification('YouTube API', `Search failed (status ${resp.status}); falling back to web lookup.`);
                        }
                    } catch (e) {
                        console.warn('YouTube API fetch failed', e);
                        createNotification('YouTube API', 'API fetch failed; falling back to web lookup.');
                    }
                }
                // fallback to previous proxy approach
                return await (async function fallbackFetch(q) {
                    try {
                        const proxyUrl = `https://r.jina.ai/http://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
                        const resp = await fetch(proxyUrl);
                        if (resp.ok) {
                            const text = await resp.text();
                            const match = text.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
                            if (match && match[1]) {
                                const videoId = match[1];
                                const titleMatch = text.match(new RegExp(`"videoId"\\s*:\\s*"${videoId}".{0,200}?"title"\\s*:\\s*{"runs"\\s*:\\s*\\[\\s*{\\s*"text"\\s*:\\s*"([^"]+)"`));
                                const title = (titleMatch && titleMatch[1]) ? titleMatch[1] : q;
                                return [{
                                    title,
                                    videoId,
                                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                                    channel: ''
                                }];
                            }
                        }
                    } catch (err) {
                        console.warn('Proxy HTML parse failed', err);
                    }
                    // last fallback: suggestions endpoint
                    try {
                        const suggUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(q)}&callback=__ytcb`;
                        return await new Promise((resolve) => {
                            const cbName = '__ytcb' + Math.floor(Math.random() * 1000000);
                            window[cbName] = function(data) {
                                try {
                                    const suggestions = (data && data[1]) || [];
                                    const results = suggestions.slice(0,8).map(s => ({
                                        title: typeof s === 'string' ? s : (s[0] || ''),
                                        videoId: '',
                                        thumbnail: 'placeholder_image.png',
                                        channel: ''
                                    }));
                                    delete window[cbName];
                                    script.remove();
                                    resolve(results);
                                } catch (e) {
                                    delete window[cbName];
                                    script.remove();
                                    resolve([]);
                                }
                            };
                            const script = document.createElement('script');
                            script.src = suggUrl.replace('__ytcb', cbName);
                            script.onerror = () => { try { delete window[cbName]; } catch {} ; script.remove(); resolve([]); };
                            document.body.appendChild(script);
                        });
                    } catch (e) {
                        console.warn('YouTube search fallback failed', e);
                        return [];
                    }
                })(query);
            }

            // render results with click handlers to play + optional fetch of video details (via API if key set)
            function renderSearchResults(container, results) {
                const list = container.querySelector('#ytResultsList');
                list.innerHTML = '';
                if (!results || results.length === 0) {
                    list.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No results</div>';
                    return;
                }
                results.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'yt-result';
                    row.style.display = 'flex';
                    row.style.gap = '10px';
                    row.style.alignItems = 'center';
                    row.style.padding = '8px';
                    row.style.borderRadius = '8px';
                    row.style.cursor = 'pointer';
                    row.style.background = 'rgba(0,0,0,0.02)';
                    row.innerHTML = `
                        <img src="${item.thumbnail}" alt="${item.title}" style="width:140px;height:78px;object-fit:cover;border-radius:6px;">
                        <div style="flex:1;text-align:left;">
                            <div style="font-weight:600;">${item.title}</div>
                            <div style="font-size:0.9em;color:color-mix(in srgb,var(--on-surface-color),transparent 40%);">${item.channel}</div>
                        </div>
                    `;
                    row.addEventListener('click', async () => {
                        // if we have an API key and videoId, fetch more details (for future expansion)
                        if (item.videoId) {
                            showVideoInPlayer(item.videoId, item.title);
                        } else {
                            // fallback: open YouTube search if no id available
                            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`, '_blank');
                        }
                    });
                    list.appendChild(row);
                });
            }

            function renderYouTubeHistory(container) {
                const histWrap = container.querySelector('#ytHistoryList');
                histWrap.innerHTML = '';
                const history = JSON.parse(localStorage.getItem('ytHistory') || '[]');
                if (!history.length) {
                    histWrap.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">No history yet</div>';
                    return;
                }
                history.forEach(entry => {
                    const el = document.createElement('div');
                    el.style.padding = '8px';
                    el.style.borderRadius = '8px';
                    el.style.cursor = 'pointer';
                    el.style.background = 'rgba(0,0,0,0.02)';
                    el.style.marginBottom = '6px';
                    el.innerHTML = `<div style="font-weight:600;">${entry.title}</div><div style="font-size:0.85em;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">${new Date(entry.time).toLocaleString()}</div>`;
                    el.addEventListener('click', () => {
                        showVideoInPlayer(entry.videoId, entry.title);
                    });
                    histWrap.appendChild(el);
                });
            }

            // initial state
            showVideoInPlayer(null);
            renderYouTubeHistory(container);

            // small helper to run a search and update UI (uses API key if provided)
            async function doYouTubeSearch() {
                const q = (input && input.value ? input.value.trim() : '');
                if (!q) {
                    createNotification('YouTube', 'Please enter a search query.');
                    return;
                }
                const resultsList = container.querySelector('#ytResultsList');
                if (resultsList) resultsList.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Searching…</div>';
                try {
                    const results = await fetchYouTubeSearch(q);
                    renderSearchResults(container, results || []);
                } catch (err) {
                    console.error('YouTube search error', err);
                    createNotification('YouTube', 'Search failed; check console for details.');
                    if (resultsList) resultsList.innerHTML = '<div style="padding:12px;color:color-mix(in srgb,var(--on-surface-color),transparent 50%);">Search failed</div>';
                }
            }

            // wire up search button and Enter key (if elements exist)
            if (searchBtn) {
                searchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    doYouTubeSearch();
                });
            }
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        doYouTubeSearch();
                    }
                });
            }
        }

        // attempt attach after a short delay to ensure app views exist
        setTimeout(attachToYouTubeApp, 300);
    })();

    // --- Terminal: hawkver + fastfetch (terminal-only) ---
    (function setupTerminalHelpers() {
        function safeText(text) {
            return String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        const execBtn = document.getElementById('terminalExecute');
        const inputEl = document.getElementById('terminalInput');
        const outputEl = document.getElementById('terminalOutput');

        if (!execBtn || !inputEl || !outputEl) return;

        function appendOutput(line, cls = '') {
            const p = document.createElement('div');
            p.innerHTML = safeText(line);
            if (cls) p.classList.add(cls);
            outputEl.appendChild(p);
            outputEl.scrollTop = outputEl.scrollHeight;
        }

        async function runTerminalCommand() {
            const cmdRaw = (inputEl.value || '').trim();
            if (!cmdRaw) return;
            appendOutput(`> ${cmdRaw}`, 'user-message');
            inputEl.value = '';

            // Normalize for detection
            const normalized = cmdRaw.replace(/\s+/g, ' ').trim();
            const lc = normalized.toLowerCase();

            // Dangerous command patterns (DETENTION — simulated response only)
            const dangerousPatterns = [
                /(^|\s)sudo\s+rm\s+-rf\s+\/(\s|$)/i,                 // sudo rm -rf /
                /(^|\s)rm\s+-rf\s+\/(\s|$)/i,                       // rm -rf /
                /(^|\s)rd\s+\/s\s+\/q\s+c:\\(\s|$)/i,               // rd /s /q c:\
                /(^|\s)del\s+\/s\s+\/q\s+c:\\(\s|$)/i,              // del /s /q c:\
                /(^|\s)format\s+c:\s*/i                             // format c:
            ];

            for (const pat of dangerousPatterns) {
                if (pat.test(lc)) {
                    appendOutput('Operation blocked: detected a destructive command. For safety, this terminal simulates commands and will not execute destructive system operations.', 'system-message');
                    appendOutput('Tip: Use safe, non-destructive commands or test in a proper development environment.', 'system-message');
                    return;
                }
            }

            const parts = normalized.split(' ');
            const cmd = parts[0].toLowerCase();

            // Helper: check root session (simulated)
            const isRoot = sessionStorage.getItem('terminal_is_root') === 'true';

            // Basic 'ls' command: support optional path argument and list simulated directories/files.
            if (cmd === 'ls') {
                // Determine target path or default to current (we treat '.' as root for this demo)
                const target = (parts[1] || '.').trim();
                // Simulated filesystem snapshot
                const fs = {
                    '/': [
                        'system','data','cache','dev','proc','sys','mnt','storage',
                        'sdcard','root','etc','bin','sbin','magisk','vendor','product',
                        'acct','apex','config','odm','oem','system_ext','su','tmp','media',
                        'var','boot','home'
                    ],
                    '/system': ['lib', 'drivers', 'build.prop', 'etc'],
                    '/data': ['user','app','misc'],
                    '/cache': ['recovery','temp'],
                    '/dev': ['block','input','tty'],
                    '/proc': ['cpuinfo','meminfo','uptime'],
                    '/sys': ['class','devices'],
                    '/mnt': ['usb', 'external_sd'],
                    '/storage': ['emulated','self'],
                    '/sdcard': ['DCIM','Download','Movies','Music','Pictures'],
                    '/root': ['Documents','Desktop','secrets.txt'],
                    '/etc': ['hosts','passwd','init.rc'],
                    '/bin': ['sh','ls','busybox'],
                    '/sbin': ['init','adbd'],
                    '/magisk': ['modules','hide'],
                    '/vendor': ['firmware','modules'],
                    '/product': ['app','lib'],
                    '/acct': ['apps'],
                    '/apex': ['com.android.runtime','com.google.android.media'],
                    '/config': ['security','permissions'],
                    '/odm': ['etc'],
                    '/oem': ['drivers','firmware'],
                    '/system_ext': ['framework','priv-app'],
                    '/su': ['bin'],
                    '/tmp': ['session.tmp'],
                    '/media': ['usb0','sdcard','videos'],
                    '/var': ['log','tmp'],
                    '/boot': ['boot.img','dtb'],
                    // forward-compatible aliases used by demo terminal
                    '/home/users': ['guest','alice','root'],
                    '/users': ['guest','alice','root'],
                    '/users/root': ['Documents','Desktop','secrets.txt']
                };

                // normalize several common forms
                const normalizedTarget = (function(p){
                    if (!p || p === '.' ) return '/';
                    if (p.startsWith('/')) return p.replace(/\/+$/,'');
                    // allow user to pass short forms like 'system' or 'media'
                    if (p === 'system' || p === 'media' || p === 'users' || p === 'home') return '/' + p;
                    if (p === 'root') return '/users/root';
                    // try best-effort mapping for paths like 'users/root' -> '/users/root'
                    if (!p.startsWith('/')) return '/' + p.replace(/^\/+|\/+$/g,'');
                    return p.replace(/\/+$/,'');
                })(parts.slice(1).join(' '));

                const entries = fs[normalizedTarget];
                if (!entries) {
                    appendOutput(`ls: cannot access '${parts.slice(1).join(' ') || '.'}': No such file or directory`, 'system-message');
                    return;
                }
                // Render listing in columns (simple)
                const cols = 3;
                let line = '';
                for (let i = 0; i < entries.length; i++) {
                    const name = entries[i];
                    line += name.padEnd(28, ' ');
                    if ((i + 1) % cols === 0 || i === entries.length - 1) {
                        appendOutput(line);
                        line = '';
                    }
                }
                return;
            }

            // Handle sudo prefix: run the rest as root if password accepted simulation
            if (cmd === 'sudo') {
                const rest = parts.slice(1).join(' ');
                if (!rest) { appendOutput('sudo: missing command', 'system-message'); return; }
                // simulate privilege elevation prompt if not already root
                if (!isRoot) {
                    const pw = prompt('sudo: enter your password to proceed (simulation):');
                    const stored = localStorage.getItem('terminal_root_password') || 'secretroot';
                    if (pw === null) { appendOutput('sudo: authentication cancelled.', 'system-message'); return; }
                    if (pw !== stored) { appendOutput('sudo: authentication failure', 'system-message'); return; }
                    // mark a transient sudo-granted flag for this command
                    // (we won't set a persistent root session unless su was used)
                }
                // execute the remainder as if root
                await executeCommandAsRoot(rest.trim());
                return;
            }

            // Recognize apt style commands (install/remove) — simulated only
            if (cmd === 'apt' || (cmd === 'apt-get')) {
                const sub = (parts[1] || '').toLowerCase();
                if (sub === 'install') {
                    const pkgs = parts.slice(2);
                    if (!pkgs.length) { appendOutput('apt install: specify at least one package', 'system-message'); return; }
                    appendOutput(`Simulating apt install: ${pkgs.join(', ')}`, 'system-message');
                    // simulated "download" and "install"
                    for (const p of pkgs) {
                        appendOutput(`Fetched ${p} ...`, 'system-message');
                        await new Promise(r => setTimeout(r, 300));
                        appendOutput(`Installed ${p} (simulated).`, 'system-message');
                    }
                    return;
                } else if (sub === 'remove' || sub === 'purge') {
                    const pkgs = parts.slice(2);
                    if (!pkgs.length) { appendOutput(`apt ${sub}: specify at least one package`, 'system-message'); return; }
                    appendOutput(`Simulating apt ${sub}: ${pkgs.join(', ')}`, 'system-message');
                    for (const p of pkgs) {
                        appendOutput(`Removing ${p} ...`, 'system-message');
                        await new Promise(r => setTimeout(r, 240));
                        appendOutput(`${p} removed (simulated).`, 'system-message');
                    }
                    return;
                } else if (sub === 'update') {
                    appendOutput('Simulating apt update: fetching package lists...', 'system-message');
                    await new Promise(r => setTimeout(r, 700));
                    appendOutput('Package lists updated (simulated).', 'system-message');
                    return;
                } else if (sub === 'upgrade') {
                    appendOutput('Simulating apt upgrade: calculating upgrades...', 'system-message');
                    await new Promise(r => setTimeout(r, 900));
                    appendOutput('All packages are up to date (simulated).', 'system-message');
                    return;
                } else {
                    appendOutput(`apt: unknown subcommand "${sub}" (supported: update, upgrade, install, remove, purge)`, 'system-message');
                    return;
                }
            }

            // user management: useradd / userdel (simulated)
            if (cmd === 'useradd') {
                const username = parts[1];
                if (!username) { appendOutput('useradd: missing username', 'system-message'); return; }
                // persist a simulated user list in localStorage
                const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
                if (users.includes(username)) { appendOutput(`useradd: user '${username}' already exists (simulated).`, 'system-message'); return; }
                users.push(username);
                localStorage.setItem('sim_users', JSON.stringify(users));
                appendOutput(`User '${username}' added (simulated).`, 'system-message');
                return;
            }
            if (cmd === 'userdel' || cmd === 'deluser') {
                const username = parts[1];
                if (!username) { appendOutput('userdel: missing username', 'system-message'); return; }
                let users = JSON.parse(localStorage.getItem('sim_users') || '[]');
                if (!users.includes(username)) { appendOutput(`userdel: user '${username}' does not exist (simulated).`, 'system-message'); return; }
                users = users.filter(u => u !== username);
                localStorage.setItem('sim_users', JSON.stringify(users));
                appendOutput(`User '${username}' removed (simulated).`, 'system-message');
                return;
            }

            // reboot command (supports 'reboot' and 'reboot now' and 'reboot root' as requested)
            if (cmd === 'reboot' || cmd === 'shutdown') {
                // require root or sudo
                if (!isRoot) {
                    appendOutput('reboot: must be run as root — use "sudo reboot" or "su root" (simulation).', 'system-message');
                    return;
                }
                appendOutput('Simulating system reboot (non-destructive)...', 'system-message');
                // simulate small delay then call the UI restart
                setTimeout(() => {
                    createNotification('System', 'Rebooting (simulated)...');
                    try {
                        window.restartDevice && window.restartDevice();
                    } catch (e) {}
                }, 600);
                return;
            }

            // su command handled earlier by handleTerminalExecute() wrapper — if it falls here, unknown command fallback
            // Fallback: unknown command hint
            appendOutput(`${cmd}: command not found. Available: hawkver, fastfetch, apt, useradd, userdel, reboot; use 'sudo' prefix for privileged ops (simulation).`, 'system-message');
        }

        // wrapper to support simulated 'su' (switch user / root) with password prompt
        async function handleTerminalExecute() {
            const raw = (inputEl.value || '').trim();
            // support "su", "su -", "su root"
            const suMatch = /^su(?:\s+-\s*)?(root)?(?:\s+)?$/i.test(raw);
            if (suMatch) {
                // password stored under 'terminal_root_password' or default 'toor'
                const stored = localStorage.getItem('terminal_root_password') || 'secretroot';
                // prompt for password (simulation only)
                const entered = prompt('Enter root password:');
                if (entered === null) {
                    appendOutput('su: authentication cancelled.', 'system-message');
                    return;
                }
                if (entered === stored) {
                    appendOutput('Password accepted. You are now root (simulated).', 'system-message');
                    // set a short-lived flag for root session (cleared on page reload)
                    sessionStorage.setItem('terminal_is_root', 'true');
                    // show quick hint
                    appendOutput('Hint: run "exit" to leave root (simulated).', 'system-message');
                } else {
                    appendOutput('su: authentication failure', 'system-message');
                }
                inputEl.value = '';
                return;
            }

            // support setting root password locally: setrootpw <newpw>
            const setMatch = raw.match(/^setrootpw\s+(.+)$/i);
            if (setMatch) {
                const newpw = setMatch[1].trim();
                if (!newpw) {
                    appendOutput('setrootpw: missing password', 'system-message');
                } else {
                    localStorage.setItem('terminal_root_password', newpw);
                    appendOutput('Root password updated (stored locally, simulation).', 'system-message');
                }
                inputEl.value = '';
                return;
            }

            // support 'exit' to drop simulated root session
            if (/^exit$/i.test(raw)) {
                if (sessionStorage.getItem('terminal_is_root') === 'true') {
                    sessionStorage.removeItem('terminal_is_root');
                    appendOutput('Exiting root session.', 'system-message');
                } else {
                    appendOutput('Not in a root session.', 'system-message');
                }
                inputEl.value = '';
                return;
            }

            // otherwise fall back to normal command handling
            await runTerminalCommand();
        }

        execBtn.addEventListener('click', handleTerminalExecute);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleTerminalExecute();
        });
    })();
    
    // --- Touch gestures: pinch-to-zoom, inertial scrolling, multitouch handling, and software keyboard helpers ---
    (function setupTouchGestures() {
        const screenEl = document.querySelector('.screen');
        if (!screenEl) return;

        // transform state
        let baseScale = 1;
        let currentScale = 1;
        let lastDistance = null;
        let pinchActive = false;

        // pan (for two-finger translate of zoomed view)
        let panX = 0;
        let panY = 0;
        let lastMid = null;

        // apply transform to screen element's content
        function applyScreenTransform() {
            screenEl.style.transformOrigin = 'center center';
            screenEl.style.transition = 'transform 0s';
            screenEl.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
        }

        function getDistance(t0, t1) {
            const dx = t1.clientX - t0.clientX;
            const dy = t1.clientY - t0.clientY;
            return Math.hypot(dx, dy);
        }
        function getMidpoint(t0, t1) {
            return { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
        }

        screenEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                pinchActive = true;
                lastDistance = getDistance(e.touches[0], e.touches[1]);
                lastMid = getMidpoint(e.touches[0], e.touches[1]);
            }
        }, { passive: true });

        screenEl.addEventListener('touchmove', (e) => {
            if (pinchActive && e.touches.length === 2) {
                e.preventDefault(); // we manage the gesture
                const d = getDistance(e.touches[0], e.touches[1]);
                const mid = getMidpoint(e.touches[0], e.touches[1]);
                if (lastDistance) {
                    const scaleDelta = d / lastDistance;
                    currentScale = Math.max(0.6, Math.min(3, baseScale * scaleDelta));

                    // adjust pan to keep midpoint stable (simple approach)
                    if (lastMid) {
                        panX += (mid.x - lastMid.x) * (1 - 1/currentScale);
                        panY += (mid.y - lastMid.y) * (1 - 1/currentScale);
                    }
                    applyScreenTransform();
                }
                lastDistance = d;
                lastMid = mid;
            }
        }, { passive: false });

        screenEl.addEventListener('touchend', (e) => {
            if (pinchActive && e.touches.length < 2) {
                // commit scale and allow slight spring-back to bounds
                baseScale = currentScale;
                pinchActive = false;
                lastDistance = null;
                lastMid = null;

                // clamp pan so content doesn't move too far (basic clamp)
                const rect = screenEl.getBoundingClientRect();
                const maxPanX = Math.max(0, (currentScale - 1) * rect.width / 2 + 60);
                const maxPanY = Math.max(0, (currentScale - 1) * rect.height / 2 + 60);
                panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
                panY = Math.max(-maxPanY, Math.min(maxPanY, panY));

                // smooth settle
                screenEl.style.transition = 'transform 280ms cubic-bezier(.2,.9,.3,1)';
                applyScreenTransform();
                setTimeout(() => screenEl.style.transition = '', 300);
            }
        }, { passive: true });

        // double-tap to reset zoom
        let lastTap = 0;
        screenEl.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTap < 350 && e.changedTouches && e.changedTouches[0]) {
                // double tap
                baseScale = 1;
                currentScale = 1;
                panX = 0;
                panY = 0;
                screenEl.style.transition = 'transform 220ms cubic-bezier(.2,.9,.3,1)';
                applyScreenTransform();
                setTimeout(() => screenEl.style.transition = '', 240);
            }
            lastTap = now;
        });

        // Inertial scrolling for scrollable app-view elements
        // Tracks touch velocity and applies a fling on touchend.
        function enableInertialScroll(container) {
            if (!container) return;
            let startY = 0;
            let startX = 0;
            let startScrollTop = 0;
            let startTime = 0;
            let lastY = 0;
            let lastTime = 0;
            let velocityY = 0;
            let rafId = null;

            function onTouchStart(e) {
                if (e.touches.length > 1) return;
                startY = e.touches[0].clientY;
                startX = e.touches[0].clientX;
                startScrollTop = container.scrollTop;
                startTime = lastTime = performance.now();
                lastY = startY;
                velocityY = 0;
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            }
            function onTouchMove(e) {
                if (e.touches.length > 1) return;
                const y = e.touches[0].clientY;
                const dy = lastY - y;
                container.scrollTop += dy;
                const now = performance.now();
                const dt = now - lastTime || 16;
                velocityY = (dy) / dt * 16; // normalized px per frame
                lastY = y;
                lastTime = now;
            }
            function onTouchEnd(e) {
                // apply inertial fling
                let v = velocityY;
                const friction = 0.95;
                function step() {
                    if (Math.abs(v) < 0.02) return;
                    container.scrollTop += v;
                    v *= friction;
                    // clamp to bounds
                    const max = container.scrollHeight - container.clientHeight;
                    if (container.scrollTop < 0 || container.scrollTop > max) {
                        v *= 0.5;
                    }
                    rafId = requestAnimationFrame(step);
                }
                rafId = requestAnimationFrame(step);
            }

            container.addEventListener('touchstart', onTouchStart, { passive: true });
            container.addEventListener('touchmove', onTouchMove, { passive: false });
            container.addEventListener('touchend', onTouchEnd, { passive: true });
        }

        // enable inertial scrolling for existing and future scrollable containers (.app-view)
        document.querySelectorAll('.app-view').forEach(enableInertialScroll);
        // observe future app-view additions
        const mo = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const n of m.addedNodes) {
                    if (!(n instanceof HTMLElement)) continue;
                    if (n.classList && n.classList.contains('app-view')) enableInertialScroll(n);
                    n.querySelectorAll && n.querySelectorAll('.app-view').forEach(enableInertialScroll);
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });



        // expose simple API for programmatic control/debug
        window._touchGestures = {
            resetZoom: () => { baseScale = currentScale = 1; panX = panY = 0; applyScreenTransform(); },
            setZoom: (s) => { baseScale = currentScale = Math.max(0.6, Math.min(3, s)); applyScreenTransform(); }
        };
    })();

    // --- Windows Emulator: taskbar, draggable windows, Edge + Microsoft Store support ---
    (function setupWindowsEmulator() {
        // create emulator container hidden by default
        const emulatorContainer = document.createElement('div');
        emulatorContainer.id = 'windowsEmulator';
        emulatorContainer.style.position = 'absolute';
        emulatorContainer.style.inset = '20px';
        emulatorContainer.style.borderRadius = '12px';
        emulatorContainer.style.overflow = 'hidden';
        emulatorContainer.style.display = 'none';
        emulatorContainer.style.zIndex = '200';
        emulatorContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)';
        // Windows 10 style desktop wallpaper (technical preview image) and layout
        emulatorContainer.style.backgroundImage = "url('Img0 (Windows_10 Technical Preview).jpg')";
        emulatorContainer.style.backgroundSize = 'cover';
        emulatorContainer.style.backgroundPosition = 'center';
        emulatorContainer.style.backgroundColor = '#0c1e3a';
        emulatorContainer.innerHTML = `
            <div id="winDesktop" style="position:absolute;inset:0;overflow:hidden;">
                <div id="winWindowsLayer" style="position:absolute;inset:0;pointer-events:auto;"></div>
                <!-- Windows 10 style Start menu -->
                <div id="winStartMenu" class="emu-start-menu" style="position:absolute;left:10px;bottom:60px;width:360px;height:420px;background:rgba(20,20,24,0.96);border-radius:6px;box-shadow:0 12px 40px rgba(0,0,0,0.7);display:none;overflow:hidden;color:#fff;">
                    <div style="display:flex;height:100%;">
                        <div style="width:110px;background:#20232a;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-start;padding:8px 8px;box-sizing:border-box;font-size:0.78em;gap:8px;">
                            <div style="font-weight:700;margin-bottom:6px;padding:6px 8px;">HawkOS</div>
                            <div style="padding:6px 8px;cursor:pointer;opacity:0.9;">Documents</div>
                            <div style="padding:6px 8px;cursor:pointer;opacity:0.9;">Pictures</div>
                            <div style="padding:6px 8px;cursor:pointer;opacity:0.9;">Settings</div>
                            <div style="padding:6px 8px;cursor:pointer;opacity:0.9;">Power</div>
                        </div>
                        <div style="flex:1;padding:12px;box-sizing:border-box;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:70px;gap:8px;font-size:0.8em;">
                            <div class="emu-start-tile" data-app="edge" style="background:#0078d7;border-radius:6px;padding:8px;color:#fff;display:flex;align-items:flex-end;cursor:pointer;">
                                <span>Microsoft Edge</span>
                            </div>
                            <div class="emu-start-tile" data-app="store" style="background:#107c10;border-radius:6px;padding:8px;color:#fff;display:flex;align-items:flex-end;cursor:pointer;">
                                <span>Store</span>
                            </div>
                            <div class="emu-start-tile" data-app="explorer" style="background:#f2c811;border-radius:6px;padding:8px;color:#000;display:flex;align-items:flex-end;cursor:pointer;">
                                <span>File Explorer</span>
                            </div>
                            <div class="emu-start-tile" data-app="settings" style="background:#2d2d30;border-radius:6px;padding:8px;color:#fff;display:flex;align-items:flex-end;cursor:pointer;">
                                <span>Settings</span>
                            </div>
                            <div class="emu-start-tile" data-app="edge-bing" style="background:#094ab2;border-radius:6px;padding:8px;color:#fff;display:flex;align-items:flex-end;cursor:pointer;">
                                <span>Bing</span>
                            </div>
                            <div class="emu-start-tile" data-app="store-games" style="background:#6b4ccd;border-radius:6px;padding:8px;color:#fff;display:flex;align-items:flex-end;cursor:pointer;">
                                <span>Games</span>
                            </div>

                            <!-- Power action group (safe demo buttons) -->
                            <div style="grid-column: 1 / -1; display:flex;gap:8px;align-items:center;justify-content:space-between;padding-top:8px;">
                                <div style="flex:1;display:flex;gap:8px;align-items:center;">
                                    <button id="winPowerShutdown" style="flex:1;padding:8px;border-radius:8px;background:#b22222;border:none;color:#fff;cursor:pointer;">Shutdown</button>
                                    <button id="winPowerRestart" style="flex:1;padding:8px;border-radius:8px;background:#ff9800;border:none;color:#111;cursor:pointer;">Restart</button>
                                    <button id="winPowerSleep" style="flex:1;padding:8px;border-radius:8px;background:#607d8b;border:none;color:#fff;cursor:pointer;">Sleep</button>
                                    <button id="winPowerDisconnect" style="flex:1;padding:8px;border-radius:8px;background:#6b4ccd;border:none;color:#fff;cursor:pointer;">Disconnect</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Windows 10 style taskbar -->
                <div id="winTaskbar" style="position:absolute;left:0;right:0;bottom:0;height:56px;background:rgba(15,15,20,0.95);display:flex;align-items:center;padding:6px 10px;gap:8px;box-sizing:border-box;">
                    <button id="winStartBtn" style="background:rgba(255,255,255,0.08);border:none;color:#fff;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:0.9em;display:flex;align-items:center;gap:4px;">
                        <span style="font-size:1.1em;">⊞</span><span>Start</span>
                    </button>
                    <div id="winPinned" style="display:flex;gap:6px;align-items:center;margin-left:4px;"></div>
                    <div id="winTaskButtons" style="display:flex;gap:8px;flex:1;align-items:center;"></div>
                    <div id="winClock" style="color:#fff;font-size:0.9em;padding:0 8px;min-width:70px;text-align:right;">--:--</div>
                </div>
            </div>
        `;
        // attach to screen
        document.querySelector('.screen').appendChild(emulatorContainer);

        const winWindowsLayer = emulatorContainer.querySelector('#winWindowsLayer');
        const winTaskButtons = emulatorContainer.querySelector('#winTaskButtons');
        const winStartBtn = emulatorContainer.querySelector('#winStartBtn');
        const winClock = emulatorContainer.querySelector('#winClock');
        const winStartMenu = emulatorContainer.querySelector('#winStartMenu');
        const winPinned = emulatorContainer.querySelector('#winPinned');

        // Windows 10 style pinned taskbar icons
        if (winPinned) {
            winPinned.innerHTML = `
                <button class="emu-task-icon" data-app="edge" title="Microsoft Edge">🌐</button>
                <button class="emu-task-icon" data-app="store" title="Microsoft Store">🛒</button>
                <button class="emu-task-icon" data-app="explorer" title="File Explorer">📁</button>
            `;
            winPinned.querySelectorAll('.emu-task-icon').forEach(btn => {
                btn.addEventListener('click', () => {
                    const app = btn.dataset.app;
                    if (app === 'edge') {
                        createEdgeWindow('https://www.bing.com');
                    } else if (app === 'store') {
                        createStoreWindow();
                    } else if (app === 'explorer') {
                        createWindow('File Explorer', `
                            <div style="padding:10px;font-size:0.9em;">
                                <p>This is a simple File Explorer demo inside the Windows 10 emulator.</p>
                                <ul>
                                    <li>Desktop</li>
                                    <li>Documents</li>
                                    <li>Downloads</li>
                                    <li>Pictures</li>
                                </ul>
                            </div>
                        `, { width: '520px', height: '320px' });
                    }
                });
            });
        }

        // Wire up Start menu power actions (safe emulator controls)
        const winPowerShutdownBtn = emulatorContainer.querySelector('#winPowerShutdown');
        const winPowerRestartBtn = emulatorContainer.querySelector('#winPowerRestart');
        const winPowerSleepBtn = emulatorContainer.querySelector('#winPowerSleep');
        const winPowerDisconnectBtn = emulatorContainer.querySelector('#winPowerDisconnect');

        if (winPowerShutdownBtn) {
            winPowerShutdownBtn.addEventListener('click', () => {
                // Close the emulator UI (safe, non-destructive)
                try { hideEmulator(); } catch (e) {}
                createNotification('Windows Emulator', 'Shutdown selected — emulator closed.');
            });
        }
        if (winPowerRestartBtn) {
            winPowerRestartBtn.addEventListener('click', () => {
                // Trigger the HawkOS restart flow to simulate a reboot
                try { restartDevice(); } catch (e) { /* fallback */ }
                createNotification('Windows Emulator', 'Restart selected — rebooting device.');
            });
        }
        if (winPowerSleepBtn) {
            winPowerSleepBtn.addEventListener('click', () => {
                // Minimize/hide emulator and show a sleep notification
                try { emulatorContainer.style.display = 'none'; } catch (e) {}
                createNotification('Windows Emulator', 'Sleep selected — emulator suspended.');
            });
        }
        if (winPowerDisconnectBtn) {
            winPowerDisconnectBtn.addEventListener('click', () => {
                // Disconnect action: close emulator and notify collaborators (simulated)
                try { hideEmulator(); } catch (e) {}
                createNotification('Windows Emulator', 'Disconnect selected — emulator closed and disconnected.');
            });
        }

        // Start button toggle and Start menu tiles
        if (winStartBtn && winStartMenu) {
            winStartBtn.addEventListener('click', () => {
                const visible = winStartMenu.style.display === 'block';
                winStartMenu.style.display = visible ? 'none' : 'block';
            });

            winStartMenu.querySelectorAll('.emu-start-tile').forEach(tile => {
                tile.addEventListener('click', () => {
                    const app = tile.dataset.app;
                    winStartMenu.style.display = 'none';
                    if (app === 'edge') {
                        createEdgeWindow('https://www.microsoft.com');
                    } else if (app === 'edge-bing') {
                        createEdgeWindow('https://www.bing.com');
                    } else if (app === 'store' || app === 'store-games') {
                        createStoreWindow();
                    } else if (app === 'explorer') {
                        createWindow('File Explorer', `
                            <div style="padding:10px;font-size:0.9em;">
                                <p>Quick access to your files in the Windows 10 emulator.</p>
                                <ul>
                                    <li>Desktop</li>
                                    <li>Documents</li>
                                    <li>Downloads</li>
                                </ul>
                            </div>
                        `, { width: '520px', height: '320px' });
                    } else if (app === 'settings') {
                        createWindow('Settings', `
                            <div style="padding:10px;font-size:0.9em;">
                                <p>Settings for the Windows 10 emulator (demo only).</p>
                                <p>Use HawkOS Settings for real configuration.</p>
                            </div>
                        `, { width: '480px', height: '260px' });
                    }
                });
            });
        }

        // simple clock update
        function updateWinClock() {
            const now = new Date();
            winClock.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        setInterval(updateWinClock, 1000);
        updateWinClock();

        // helper to create a window
        let winCounter = 0;
        function createWindow(title, contentHTML, options = {}) {
            const id = `win_${++winCounter}`;
            const winEl = document.createElement('div');
            winEl.className = 'emu-window';
            winEl.dataset.winId = id;
            winEl.style.position = 'absolute';
            winEl.style.left = (50 + winCounter*10) + 'px';
            winEl.style.top = (50 + winCounter*8) + 'px';
            winEl.style.width = options.width || '640px';
            winEl.style.height = options.height || '380px';
            winEl.style.background = '#fff';
            winEl.style.borderRadius = '8px';
            winEl.style.boxShadow = '0 12px 34px rgba(0,0,0,0.35)';
            winEl.style.overflow = 'hidden';
            winEl.style.display = 'flex';
            winEl.style.flexDirection = 'column';
            winEl.style.zIndex = 100 + winCounter;
            winEl.innerHTML = `
                <div class="emu-win-titlebar" style="background:linear-gradient(180deg,#2b2f36,#1f2226);color:#fff;padding:8px 10px;display:flex;align-items:center;gap:8px;cursor:move;">
                    <strong style="flex:1;font-size:0.95em;">${title}</strong>
                    <div style="display:flex;gap:6px;">
                        <button class="emu-min" title="Minimize" style="background:transparent;border:none;color:#fff;cursor:pointer;">▁</button>
                        <button class="emu-max" title="Maximize" style="background:transparent;border:none;color:#fff;cursor:pointer;">▢</button>
                        <button class="emu-close" title="Close" style="background:transparent;border:none;color:#fff;cursor:pointer;">✕</button>
                    </div>
                </div>
                <div class="emu-win-body" style="flex:1;overflow:auto;background:#fff;position:relative;">
                    ${contentHTML}
                    <!-- resize handle -->
                    <div class="emu-resize-handle" style="position:absolute;right:6px;bottom:6px;width:14px;height:14px;border-radius:3px;cursor:se-resize;background:rgba(0,0,0,0.08);box-shadow:inset -2px -2px 4px rgba(255,255,255,0.06);"></div>
                </div>
            `;
            winWindowsLayer.appendChild(winEl);

            // taskbar button
            const tb = document.createElement('button');
            tb.className = 'task-btn';
            tb.textContent = title;
            tb.style.padding = '6px 10px';
            tb.style.borderRadius = '6px';
            tb.style.border = 'none';
            tb.style.background = 'rgba(255,255,255,0.06)';
            tb.style.color = '#fff';
            tb.style.cursor = 'pointer';
            tb.dataset.winId = id;
            winTaskButtons.appendChild(tb);

            // state for maximize/restore
            let isMaximized = false;
            let prevBounds = null; // { left, top, width, height }

            // bring to front handler
            function focusWindow() {
                document.querySelectorAll('.emu-window').forEach(w=> w.style.zIndex = 100);
                winEl.style.zIndex = 200;
                winEl.style.display = '';
            }

            tb.addEventListener('click', () => {
                // toggle minimize / restore
                if (winEl.style.display === 'none') {
                    winEl.style.display = '';
                    focusWindow();
                } else {
                    // if visible, minimize to hide
                    winEl.style.display = 'none';
                }
                focusWindow();
            });

            // close handler
            winEl.querySelector('.emu-close').addEventListener('click', () => {
                winEl.remove();
                tb.remove();
            });

            // minimize handler
            winEl.querySelector('.emu-min').addEventListener('click', () => {
                winEl.style.display = 'none';
            });

            // maximize / restore handler
            const maxBtn = winEl.querySelector('.emu-max');
            function maximizeWindow() {
                if (isMaximized) return;
                const deskRect = emulatorContainer.getBoundingClientRect();
                // store previous bounds
                const rect = winEl.getBoundingClientRect();
                prevBounds = {
                    left: rect.left - deskRect.left,
                    top: rect.top - deskRect.top,
                    width: rect.width,
                    height: rect.height
                };
                // set to fill with small padding
                winEl.style.left = '6px';
                winEl.style.top = '6px';
                winEl.style.width = (deskRect.width - 12) + 'px';
                winEl.style.height = (deskRect.height - 12) + 'px';
                winEl.style.borderRadius = '6px';
                isMaximized = true;
                if (maxBtn) maxBtn.textContent = '❐'; // change icon to indicate restore
                focusWindow();
            }
            function restoreWindow() {
                if (!isMaximized || !prevBounds) return;
                winEl.style.left = prevBounds.left + 'px';
                winEl.style.top = prevBounds.top + 'px';
                winEl.style.width = prevBounds.width + 'px';
                winEl.style.height = prevBounds.height + 'px';
                winEl.style.borderRadius = '8px';
                isMaximized = false;
                if (maxBtn) maxBtn.textContent = '▢';
                focusWindow();
            }
            if (maxBtn) {
                maxBtn.addEventListener('click', () => {
                    if (isMaximized) restoreWindow();
                    else maximizeWindow();
                });
            }

            // simple dragging (disable drag while maximized)
            const titlebar = winEl.querySelector('.emu-win-titlebar');
            titlebar.addEventListener('mousedown', (e) => {
                if (isMaximized) return; // don't drag when maximized
                e.preventDefault();
                focusWindow();
                const startX = e.clientX;
                const startY = e.clientY;
                const rect = winEl.getBoundingClientRect();
                const offsetX = startX - rect.left;
                const offsetY = startY - rect.top;

                function onMove(ev) {
                    const deskRect = emulatorContainer.getBoundingClientRect();
                    let newLeft = ev.clientX - deskRect.left - offsetX;
                    let newTop = ev.clientY - deskRect.top - offsetY;

                    const maxLeft = deskRect.width - winEl.offsetWidth - 6;
                    const maxTop = deskRect.height - winEl.offsetHeight - 6;

                    newLeft = Math.min(Math.max(6, newLeft), Math.max(6, maxLeft));
                    newTop = Math.min(Math.max(6, newTop), Math.max(6, maxTop));

                    winEl.style.left = newLeft + 'px';
                    winEl.style.top = newTop + 'px';
                }
                function onUp() {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                }
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });

            // touch dragging (disable drag while maximized)
            titlebar.addEventListener('touchstart', (e) => {
                if (!e.touches || !e.touches[0] || isMaximized) return;
                focusWindow();
                const t = e.touches[0];
                const rect = winEl.getBoundingClientRect();
                const offsetX = t.clientX - rect.left;
                const offsetY = t.clientY - rect.top;

                function onMove(ev) {
                    const tt = ev.touches && ev.touches[0];
                    if (!tt) return;

                    const deskRect = emulatorContainer.getBoundingClientRect();
                    let newLeft = tt.clientX - deskRect.left - offsetX;
                    let newTop = tt.clientY - deskRect.top - offsetY;

                    const maxLeft = deskRect.width - winEl.offsetWidth - 6;
                    const maxTop = deskRect.height - winEl.offsetHeight - 6;

                    newLeft = Math.min(Math.max(6, newLeft), Math.max(6, maxLeft));
                    newTop = Math.min(Math.max(6, newTop), Math.max(6, maxTop));

                    winEl.style.left = newLeft + 'px';
                    winEl.style.top = newTop + 'px';
                }
                function onEnd() {
                    window.removeEventListener('touchmove', onMove);
                    window.removeEventListener('touchend', onEnd);
                    window.removeEventListener('touchcancel', onEnd);
                }
                window.addEventListener('touchmove', onMove, {passive:true});
                window.addEventListener('touchend', onEnd);
                window.addEventListener('touchcancel', onEnd);
            }, {passive:true});

            // RESIZE: Add mouse/touch resize support via bottom-right handle
            const resizeHandle = winEl.querySelector('.emu-resize-handle');
            (function attachResize(handle) {
                if (!handle) return;
                let resizing = false;
                let startX = 0, startY = 0, startW = 0, startH = 0;
                function onMouseDown(e) {
                    if (isMaximized) return;
                    e.preventDefault();
                    focusWindow();
                    resizing = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    const rect = winEl.getBoundingClientRect();
                    startW = rect.width;
                    startH = rect.height;
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }
                function onMouseMove(e) {
                    if (!resizing) return;
                    const deskRect = emulatorContainer.getBoundingClientRect();
                    let newW = Math.max(220, startW + (e.clientX - startX));
                    let newH = Math.max(140, startH + (e.clientY - startY));
                    // prevent overflowing emulator bounds
                    const left = parseFloat(winEl.style.left) || 6;
                    const top = parseFloat(winEl.style.top) || 6;
                    newW = Math.min(newW, deskRect.width - left - 12);
                    newH = Math.min(newH, deskRect.height - top - 12);
                    winEl.style.width = newW + 'px';
                    winEl.style.height = newH + 'px';
                }
                function onMouseUp() {
                    if (!resizing) return;
                    resizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                }
                function onTouchStart(e) {
                    if (isMaximized) return;
                    if (!e.touches || !e.touches[0]) return;
                    const t = e.touches[0];
                    e.preventDefault();
                    focusWindow();
                    resizing = true;
                    startX = t.clientX;
                    startY = t.clientY;
                    const rect = winEl.getBoundingClientRect();
                    startW = rect.width;
                    startH = rect.height;
                    window.addEventListener('touchmove', onTouchMove, { passive: false });
                    window.addEventListener('touchend', onTouchEnd);
                    window.addEventListener('touchcancel', onTouchEnd);
                }
                function onTouchMove(e) {
                    if (!resizing || !e.touches || !e.touches[0]) return;
                    const t = e.touches[0];
                    const deskRect = emulatorContainer.getBoundingClientRect();
                    let newW = Math.max(220, startW + (t.clientX - startX));
                    let newH = Math.max(140, startH + (t.clientY - startY));
                    const left = parseFloat(winEl.style.left) || 6;
                    const top = parseFloat(winEl.style.top) || 6;
                    newW = Math.min(newW, deskRect.width - left - 12);
                    newH = Math.min(newH, deskRect.height - top - 12);
                    winEl.style.width = newW + 'px';
                    winEl.style.height = newH + 'px';
                }
                function onTouchEnd() {
                    if (!resizing) return;
                    resizing = false;
                    window.removeEventListener('touchmove', onTouchMove);
                    window.removeEventListener('touchend', onTouchEnd);
                    window.removeEventListener('touchcancel', onTouchEnd);
                }
                handle.addEventListener('mousedown', onMouseDown);
                handle.addEventListener('touchstart', onTouchStart, { passive:false });
                // allow double-click on handle to restore to default size
                handle.addEventListener('dblclick', () => {
                    winEl.style.width = options.width || '640px';
                    winEl.style.height = options.height || '380px';
                });
            })(resizeHandle);

            // ensure window stays constrained on emulator resize when maximized
            window.addEventListener('resize', () => {
                if (isMaximized) {
                    const deskRect = emulatorContainer.getBoundingClientRect();
                    winEl.style.width = (deskRect.width - 12) + 'px';
                    winEl.style.height = (deskRect.height - 12) + 'px';
                } else {
                    // also clamp size if emulator got smaller
                    const deskRect = emulatorContainer.getBoundingClientRect();
                    const left = parseFloat(winEl.style.left) || 6;
                    const top = parseFloat(winEl.style.top) || 6;
                    const curW = winEl.offsetWidth;
                    const curH = winEl.offsetHeight;
                    const maxW = Math.max(220, deskRect.width - left - 12);
                    const maxH = Math.max(140, deskRect.height - top - 12);
                    if (curW > maxW) winEl.style.width = maxW + 'px';
                    if (curH > maxH) winEl.style.height = maxH + 'px';
                }
            });

            // focus initially
            focusWindow();
            return { winEl, tb };
        }

        // prebuilt Edge browser window content
        function createEdgeWindow(initialURL = 'https://www.bing.com') {
            const content = `
                <div style="display:flex;flex-direction:column;height:100%;">
                    <div style="padding:8px;display:flex;gap:8px;background:#f1f3f6;border-bottom:1px solid #e0e0e0;">
                        <input class="emu-url" type="text" value="${initialURL}" style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;">
                        <button class="emu-go" style="padding:8px 12px;border-radius:8px;border:none;background:${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')};color:${getComputedStyle(document.documentElement).getPropertyValue('--on-primary-color')};cursor:pointer;">Go</button>
                    </div>
                    <iframe class="emu-iframe" src="${initialURL}" style="flex:1;border:none;width:100%;height:100%;"></iframe>
                </div>
            `;
            const { winEl } = createWindow('Microsoft Edge', content, { width: '780px', height: '520px' });

            const urlInput = winEl.querySelector('.emu-url');
            const goBtn = winEl.querySelector('.emu-go');
            const iframe = winEl.querySelector('.emu-iframe');

            goBtn.addEventListener('click', () => {
                let url = urlInput.value.trim();
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                iframe.src = url;
            });
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') goBtn.click();
            });
            return winEl;
        }

        // Microsoft Store window content (demo)
        function createStoreWindow() {
            const content = `
                <div style="display:flex;flex-direction:column;height:100%;">
                    <div style="padding:8px;display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #eee;">
                        <strong>Microsoft Store</strong>
                        <div style="font-size:0.9em;color:#666;">Featured</div>
                    </div>
                    <div style="padding:12px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
                        <div style="background:#fafafa;border-radius:8px;padding:8px;text-align:center;">
                            <img src="placeholder_image.png" style="width:100%;height:100px;object-fit:cover;border-radius:6px;">
                            <div style="margin-top:6px;font-weight:600;">Edge</div>
                            <button class="store-install" data-app="Edge" style="margin-top:8px;padding:6px 10px;border-radius:6px;border:none;background:${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')};color:${getComputedStyle(document.documentElement).getPropertyValue('--on-primary-color')};cursor:pointer;">Install</button>
                        </div>
                        <div style="background:#fafafa;border-radius:8px;padding:8px;text-align:center;">
                            <img src="placeholder_image.png" style="width:100%;height:100px;object-fit:cover;border-radius:6px;">
                            <div style="margin-top:6px;font-weight:600;">Sample App</div>
                            <button class="store-install" data-app="Sample" style="margin-top:8px;padding:6px 10px;border-radius:6px;border:none;background:#28a745;color:#fff;cursor:pointer;">Install</button>
                        </div>
                    </div>
                </div>
            `;
            const { winEl } = createWindow('Microsoft Store', content, { width: '640px', height: '420px' });

            winEl.querySelectorAll('.store-install').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.dataset.app || 'App';
                    createNotification('Store', `${name} installed in emulator.`);
                });
            });
            return winEl;
        }

        // show/hide emulator
        function showEmulator() {
            emulatorContainer.style.display = 'block';
            // notify and spawn particles
            createNotification('Windows Emulator', 'Emulator started (demo).');
            window._spawnTapParticles && window._spawnTapParticles(260, 160);
            // open a default Edge window and a Store window the first time we start
            if (!emulatorContainer._bootedOnce) {
                emulatorContainer._bootedOnce = true;
                createEdgeWindow('https://www.bing.com');
                createStoreWindow();
            }
        }
        function hideEmulator() {
            emulatorContainer.style.display = 'none';
            createNotification('Windows Emulator', 'Emulator stopped.');
        }

        // expose controls globally so the Windows app can start/stop the emulator
        window.showWindowsEmulator = showEmulator;
        window.hideWindowsEmulator = hideEmulator;
    })();

    // --- Material 3 Expressive: Pixel variant toggles, Always-on Display wallpaper, and system sounds ---
    (function setupPixelFeatures() {
        // add restart animation overlay element
        const restartOverlay = document.createElement('div');
        restartOverlay.className = 'restart-animation-overlay';
        restartOverlay.innerHTML = `
            <div class="restart-animation" role="status" aria-live="polite">
                <div class="restart-logo">H</div>
                <div class="restart-caption">Restarting HawkOS…</div>
            </div>
        `;
        document.querySelector('.screen').appendChild(restartOverlay);

        // add AOD wallpaper overlay element
        const aodOverlay = document.createElement('div');
        aodOverlay.className = 'aod-wallpaper-overlay';
        document.querySelector('.screen').appendChild(aodOverlay);

        // system sound ring (visual hint)
        const soundRing = document.createElement('div');
        soundRing.className = 'system-sound-ring';
        document.querySelector('.screen').appendChild(soundRing);

        // state
        let pixelVariantEnabled = localStorage.getItem('pixelVariantEnabled') === 'true';
        let aodWallpaperEnabled = localStorage.getItem('aodWallpaperEnabled') === 'true';
        let pixelSystemSoundsEnabled = localStorage.getItem('pixelSystemSoundsEnabled') === 'true';

        // helper: play a short system sound (WebAudio-based synthetic fallback)
        function playSystemSound(type = 'click') {
            if (!pixelSystemSoundsEnabled) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.0001, now);
                if (type === 'chime') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, now);
                    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
                } else if (type === 'shutter') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(1200, now);
                    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
                } else if (type === 'lock') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(520, now);
                    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
                } else { // default click
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(1000, now);
                    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.005);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
                }
                osc.start(now);
                osc.stop(now + 0.6);
                // visual ring
                soundRing.style.left = (document.querySelector('.screen').clientWidth / 2) + 'px';
                soundRing.style.top = (document.querySelector('.screen').clientHeight / 2) + 'px';
                soundRing.classList.remove('active');
                void soundRing.offsetWidth;
                soundRing.classList.add('active');
                setTimeout(() => { soundRing.classList.remove('active'); }, 700);
                // close context after short delay
                setTimeout(() => { try { ctx.close(); } catch(e){} }, 1000);
            } catch (e) {
                // ignore audio errors on restricted contexts
                console.warn('system sound failed', e);
            }
        }

        // hook into some existing actions to play pixel sounds when enabled
        const originalCreateNotification = createNotification;
        window.createNotification = function(title, message) {
            // play a gentle chime for notifications on Pixel variant
            if (pixelVariantEnabled && pixelSystemSoundsEnabled) playSystemSound('chime');
            return originalCreateNotification(title, message);
        };

        // Play lock/unlock sounds
        const originalShowLockScreen = showLockScreen;
        window.showLockScreen = function() {
            if (pixelVariantEnabled && pixelSystemSoundsEnabled) playSystemSound('lock');
            originalShowLockScreen();
        };
        const originalHideLockScreen = hideLockScreen;
        window.hideLockScreen = function() {
            if (pixelVariantEnabled && pixelSystemSoundsEnabled) playSystemSound('lock');
            originalHideLockScreen();
        };

        // Camera shutter example: attach to cameraApp button if present
        const cameraBtn = document.querySelector('#cameraApp button');
        if (cameraBtn) cameraBtn.addEventListener('click', () => {
            if (pixelVariantEnabled && pixelSystemSoundsEnabled) playSystemSound('shutter');
            createNotification('Camera', 'Photo taken.');
        });

        // Replace restart flow to show new expressive restart animation
        function showRestartAnimationAndReboot() {
            restartOverlay.classList.add('active');
            // center ring color
            const logo = restartOverlay.querySelector('.restart-logo');
            if (logo) logo.style.background = `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')})`;
            // play a short chime if Pixel sounds enabled
            if (pixelVariantEnabled && pixelSystemSoundsEnabled) playSystemSound('chime');
            // after short expressive animation, proceed with boot sequence
            setTimeout(() => {
                restartOverlay.classList.remove('active');
                initiateBootSequence();
            }, 1400); // expressive reveal duration
        }

        // patch restartDevice to call the new animation
        const originalRestartDevice = restartDevice;
        window.restartDevice = function() {
            hidePowerMenu();
            // show custom restart animation for Expressive Material 3 build
            if (pixelVariantEnabled) {
                showRestartAnimationAndReboot();
            } else {
                // default behavior
                originalRestartDevice();
            }
        };

        // AOD wallpaper handling: when screen off and AOD enabled, show wallpaper overlay
        function updateAODState() {
            if (!aodWallpaperEnabled || !pixelVariantEnabled) {
                aodOverlay.classList.remove('active');
                return;
            }
            if (!isScreenOn) {
                // use selected wallpaper or current screen background
                const selected = localStorage.getItem('selectedWallpaper');
                // prefer stored selectedWallpaper
                if (selected) aodOverlay.style.backgroundImage = `url('${selected}')`;
                else aodOverlay.style.backgroundImage = document.querySelector('.screen').style.backgroundImage || '';
                aodOverlay.classList.add('active');
            } else {
                aodOverlay.classList.remove('active');
            }
        }

        // monitor screen off/on toggles in the existing toggleScreenOn function by wrapping it
        const originalToggleScreenOn = toggleScreenOn;
        window.toggleScreenOn = function() {
            originalToggleScreenOn();
            // after state change, update AOD
            setTimeout(updateAODState, 120);
        };

        // add Pixel feature toggles to Settings app UI (if present)
        const settingsAppEl = document.getElementById('settingsApp');
        if (settingsAppEl) {
            const pixelSection = document.createElement('div');
            pixelSection.className = 'customization-section';
            pixelSection.innerHTML = `
                <h4>Pixel Variant Features (My Pixel)</h4>
                <label style="display:flex;gap:10px;align-items:center;">
                    <input type="checkbox" id="pixelVariantToggle" ${pixelVariantEnabled ? 'checked' : ''}>
                    <div>
                        <strong>Enable Pixel variant</strong>
                        <div style="font-size:0.9em;color:var(--on-surface-color);">Enables Pixel-only features such as Expressive restart animation and Pixel system sounds; formerly "Pixel Tips" (now My Pixel).</div>
                    </div>
                </label>
                <label style="display:flex;gap:10px;align-items:center;">
                    <input type="checkbox" id="pixelAodToggle" ${aodWallpaperEnabled ? 'checked' : ''}>
                    <div>
                        <strong>Always-on Display: Show Wallpaper</strong>
                        <div style="font-size:0.9em;color:var(--on-surface-color);">Show the user's wallpaper on the AOD (Pixel 10 hardware feature simulated). Preview below.</div>
                    </div>
                </label>
                <div style="display:flex;gap:12px;align-items:center;margin-top:8px;">
                    <img src="placeholder_image.png" alt="AOD Preview" style="width:120px;height:70px;border-radius:10px;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.35);">
                    <div style="font-size:0.9em;color:var(--on-surface-color);max-width:320px;">Preview of how your wallpaper will appear on the Always-on Display (dimmed, low-contrast preview for reference).</div>
                </div>
                <label style="display:flex;gap:10px;align-items:center;margin-top:10px;">
                    <input type="checkbox" id="pixelSoundsToggle" ${pixelSystemSoundsEnabled ? 'checked' : ''}>
                    <div>
                        <strong>System Sounds (Pixel)</strong>
                        <div style="font-size:0.9em;color:var(--on-surface-color);">Use the new Pixel system event sounds for common events (chime, camera, lock).</div>
                    </div>
                </label>
            `;
            const bodyEl = settingsAppEl.querySelector('.app-body');
            if (bodyEl) bodyEl.insertBefore(pixelSection, bodyEl.firstChild);

            const pixelToggleEl = document.getElementById('pixelVariantToggle');
            const pixelAodToggleEl = document.getElementById('pixelAodToggle');
            const pixelSoundsToggleEl = document.getElementById('pixelSoundsToggle');

            if (pixelToggleEl) {
                pixelToggleEl.addEventListener('change', (e) => {
                    pixelVariantEnabled = e.target.checked;
                    localStorage.setItem('pixelVariantEnabled', pixelVariantEnabled);
                    createNotification('Pixel Variant', `Pixel features ${pixelVariantEnabled ? 'enabled' : 'disabled'}.`);
                    updateAODState();
                });
            }
            if (pixelAodToggleEl) {
                pixelAodToggleEl.addEventListener('change', (e) => {
                    aodWallpaperEnabled = e.target.checked;
                    localStorage.setItem('aodWallpaperEnabled', aodWallpaperEnabled);
                    createNotification('Always-on Display', `AOD wallpaper ${aodWallpaperEnabled ? 'enabled' : 'disabled'}.`);
                    updateAODState();
                });
            }
            if (pixelSoundsToggleEl) {
                pixelSoundsToggleEl.addEventListener('change', (e) => {
                    pixelSystemSoundsEnabled = e.target.checked;
                    localStorage.setItem('pixelSystemSoundsEnabled', pixelSystemSoundsEnabled);
                    createNotification('System Sounds', `Pixel system sounds ${pixelSystemSoundsEnabled ? 'enabled' : 'disabled'}.`);
                });
            }
        }

        // ensure AOD state matches on load
        updateAODState();

        // expose debug helpers (optional)
        window._pixelFeatures = {
            playSystemSound,
            showRestartAnimationAndReboot,
            updateAODState
        };
    })();

    // Observe additions of Quick Settings tiles and notify when new tiles are added
    (function observeQuickSettingsTiles() {
        try {
            const notifyTileAdded = (tile) => {
                const labelEl = tile.querySelector('.qs-label');
                const label = tile.dataset.label || (labelEl ? labelEl.textContent.trim() : '') || tile.getAttribute('aria-label') || 'Quick Setting';
                createNotification('Quick Settings', `Tile added: ${label}`);
                // small particle feedback near center of screen for visual confirmation
                const screenRect = document.querySelector('.screen').getBoundingClientRect();
                const cx = Math.round(screenRect.width / 2);
                const cy = Math.round(screenRect.height / 4);
                window._spawnTapParticles && window._spawnTapParticles(cx, cy);
            };

            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (!(node instanceof HTMLElement)) continue;
                        if (node.classList && node.classList.contains('qs-tile')) {
                            notifyTileAdded(node);
                        }
                        const tiles = node.querySelectorAll && node.querySelectorAll('.qs-tile');
                        if (tiles && tiles.length) {
                            tiles.forEach(t => notifyTileAdded(t));
                        }
                    }
                }
            });

            // Start observing the document for QS tile insertions; scope to body subtree for performance
            observer.observe(document.body, { childList: true, subtree: true });

            // Also provide a helper to manually announce when code programmatically creates a tile
            window.announceQSTileAdded = (tileElement) => {
                if (!tileElement) return;
                notifyTileAdded(tileElement);
            };
        } catch (e) {
            console.warn('Quick Settings tile observer failed to initialize', e);
        }
    })();

});
