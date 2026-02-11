document.addEventListener('DOMContentLoaded', () => {
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
    const systemMessageOverlay = document.getElementById('systemMessageOverlay');
    const systemMessageText = document.getElementById('systemMessageText');
    const screenOffOverlay = document.getElementById('screenOffOverlay');

    const screenElement = document.querySelector('.screen'); 
    const statusBar = document.querySelector('.status-bar');
    const navBar = document.querySelector('.nav-bar');

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
        orange: { primary: '#FF9800', onPrimary: '#1a1a1a' }
    };

    const modeColors = {
        dark: {
            backgroundRGB: '26, 26, 26', 
            surfaceRGB: '58, 58, 58',    
            onBackground: '#e0e0e0',
            onSurface: '#e0e0e0',
            outline: '68, 68, 68' 
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
                <button></button>
                <button></button>
                <button></button>
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
            { type: 'tint', label: 'Tint', color: `rgba(${modeColors[currentMode].primary}, 0.3)` },
            { type: 'overlay', label: 'Dark Overlay', color: `rgba(0, 0, 0, 0.5)` }
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
                            <p style="margin: 0;">OS: HawkOS 2.0</p>
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
                        <span class="setting-detail">Update OS</span>
                        <button id="updateOSButton">Download/Install Now</button>
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
                                    <strong>Warning:</strong> You are operating as root. You may harm your system. Unlocking the bootloader allows installing custom OS images — do not destroy or overwrite critical system files.
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

                appElement.querySelectorAll('.color-swatch').forEach(swatch => {
                    swatch.addEventListener('click', () => {
                        const themeName = swatch.dataset.theme;
                        applyTheme(themeName, currentMode); 
                    });
                });

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

                appElement.querySelectorAll('.language-switch').forEach(langButton => {
                    langButton.addEventListener('click', () => {
                        const langName = langButton.dataset.lang;
                        applyLanguage(langName);
                    });
                });

                const initialLang = appElement.querySelector(`.language-switch[data-lang="${currentLanguage}"]`);
                if (initialLang) {
                    initialLang.classList.add('selected');
                }

                // Bootloader controls
                const unlockBootloaderBtn = appElement.querySelector('#unlockBootloaderButton');
                const lockBootloaderBtn = appElement.querySelector('#lockBootloaderButton');
                const bootloaderWipeCheckbox = appElement.querySelector('#bootloaderFactoryWipe');
                const bootloaderStatusText = appElement.querySelector('#bootloaderStatusText');

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
                <div class="gallery-placeholder">
                    <img src="placeholder_image.png" alt="Placeholder Image 1">
                    <img src="placeholder_image.png" alt="Placeholder Image 2">
                    <img src="placeholder_image.png" alt="Placeholder Image 3">
                </div>
            `
        },
        {
            id: 'browserApp',
            name: 'Browser',
            icon: 'browser_icon.png',
            header: 'Browser',
            contentHTML: `
                <input type="text" class="url-bar" placeholder="Enter URL or search">
                <p class="browser-content">Welcome to the web!</p>
                <div class="browser-links">
                    <a href="#">Google</a>
                    <a href="#">Wikipedia</a>
                    <a href="#">YouTube</a>
                </div>
            `
        },
        {
            id: 'appStoreApp',
            name: 'App Store',
            icon: 'app_store_icon.png',
            header: 'App Store',
            contentHTML: `
                <input type="search" class="search-bar" placeholder="Search apps">
                <ul class="app-list">
                    <li>Cool Game <button>Get</button></li>
                    <li>Productivity Tool <button>Get</button></li>
                    <li>Social Media <button>Get</button></li>
                    <li>Weather App <button>Get</button></li>
                </ul>
            `
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
                const keyboardBtn = appElement.querySelector('#collab_keyboard');
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
                if (keyboardBtn) keyboardBtn.addEventListener('click', () => createNotification('CollabVM', 'Keyboard session requested (virtual keyboard).'));
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
                <p>Join your communities and friends.</p>
                <button>Open Chats</button>
            `
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
                <button>Browse</button>
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
                <div class="wallpaper-list" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:12px;">
                    <button class="wallpaper-btn" data-wp="xubuntu-mantic.png">xubuntu-mantic.png</button>
                    <button class="wallpaper-btn" data-wp="xubuntu-kinetic.png">xubuntu-kinetic.png</button>
                    <button class="wallpaper-btn" data-wp="xubuntu-lunar.png">xubuntu-lunar.png</button>
                    <button class="wallpaper-btn" data-wp="Greybird.png">Greybird.png</button>
                    <button class="wallpaper-btn" data-wp="img0 (11).jpg">img0 (11).jpg</button>
                    <button class="wallpaper-btn" data-wp="e png.png">e png.png</button>
                    <button class="wallpaper-btn" data-wp="WInPE.jpg">WInPE.jpg</button>
                    <button class="wallpaper-btn" data-wp="Azure.jpg">Azure.jpg</button>
                    <button class="wallpaper-btn" data-wp="Aero.jpg">Aero.jpg</button>
                    <button class="wallpaper-btn" data-wp="Purple.jpg">Purple.jpg</button>
                    <button class="wallpaper-btn" data-wp="Red Star OS 2.0.png">Red Star OS 2.0.png</button>
                    <button class="wallpaper-btn" data-wp="Dandelion North Korea.png">Dandelion North Korea.png</button>
                    <button class="wallpaper-btn" data-wp="Sunrise.jpg">Sunrise.jpg</button>
                    <button class="wallpaper-btn" data-wp="cool_wallpaper.png">cool_wallpaper.png</button>
                    <button class="wallpaper-btn" data-wp="Cool Version 4_3.png">Cool Version 4_3.png</button>
                </div>
                <p style="margin-top:12px;font-size:0.95em;color:var(--on-surface-color);">Tap any wallpaper to apply it immediately.</p>
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
                const keyboardBtn = appElement.querySelector('#vm0_keyboard');
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
                if (keyboardBtn) {
                    keyboardBtn.addEventListener('click', () => {
                        createNotification('VM0b0t', `Keyboard session requested for ${getSelectedVM()}.`);
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
            name: 'MEMZ Virus',
            icon: 'memz_virus_icon.png',
            header: 'MEMZ Virus',
            contentHTML: `
                <p>WARNING: This is a simulated virus. Do not interact unless you understand the risks.</p>
                <button>Simulate Infection</button>
            `
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
                <button>Open File Manager</button>
            `
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
            header: 'North Korean Apps',
            contentHTML: `
                <p>Access state-approved applications.</p>
                <button>Launch News App</button>
                <button style="margin-top: 15px;">Browse Approved Content</button>
            `
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
                <button>Start Emulator</button>
                <button style="margin-top: 15px;">Configuration</button>
            `
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
        }
    ];

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

    apps.forEach(app => {
        if (app.id === 'homeScreen' || app.id === 'recentAppsView' || app.id === 'allAppsView') {
            return;
        }

        const appIconDiv = document.createElement('div');
        appIconDiv.className = 'app-icon';
        appIconDiv.dataset.app = app.id;
        appIconDiv.innerHTML = `
            <img src="${app.icon}" alt="${app.name} Icon">
            <span>${app.name}</span>
        `;
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
        notificationIcon.addEventListener('click', toggleNotificationShade);
    }

    if (clearAllNotificationsBtn) {
        clearAllNotificationsBtn.addEventListener('click', clearNotifications);
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
            header: "HawkOS 2.0 • Android 17 • Debian 13 — What's New",
            contentHTML: `
                <div style="max-width:820px;margin:0 auto;text-align:left;">
                    <h3>HawkOS 2.0 Highlights</h3>
                    <ul>
                        <li>Refreshed Aero-inspired UI with Glass & Luminous icon options.</li>
                        <li>Lock screen customizer: presets, depth AI, widget toggles, profiles.</li>
                        <li>Bootloader controls with safe factory-wipe simulation and reboot flow.</li>
                        <li>Flux Themes: caption generator, AI depth, luminous icon toggle.</li>
                        <li>Improved notification shade & dynamic island for quick previews.</li>
                    </ul>
                    <h3>Android 17 Improvements</h3>
                    <ul>
                        <li>Privacy & sandbox enhancements, smoother background task handling.</li>
                        <li>New system APIs for contextual widgets & image-generation integration.</li>
                        <li>Enhanced media controls and improved power/menu flows.</li>
                    </ul>
                    <h3>Debian 13 Integration Notes</h3>
                    <ul>
                        <li>Compatibility tweaks for native packages & improved VM tooling.</li>
                        <li>Better container/VM support in CollabVM apps and system utilities.</li>
                        <li>Updated default toolchain and kernel-friendly config details.</li>
                    </ul>
                    <h3>Quick Actions</h3>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
                        <button id="whatsNewClose" style="flex:1;min-width:160px;">Close</button>
                        <button id="whatsNewApplyAero" style="flex:1;min-width:160px;">Apply Aero Theme</button>
                        <button id="whatsNewShowSummary" style="flex:1;min-width:160px;">Show Summary Notification</button>
                    </div>
                </div>
            `,
            init: (appElement) => {
                const closeBtn = appElement.querySelector('#whatsNewClose');
                const applyAeroBtn = appElement.querySelector('#whatsNewApplyAero');
                const showSummaryBtn = appElement.querySelector('#whatsNewShowSummary');

                if (closeBtn) closeBtn.addEventListener('click', () => showApp('homeScreen'));
                if (applyAeroBtn) applyAeroBtn.addEventListener('click', () => {
                    applyTheme(currentAccent, 'aero');
                    createNotification('Theme', 'Windows Aero applied.');
                });
                if (showSummaryBtn) showSummaryBtn.addEventListener('click', () => {
                    createNotification('Update Summary', 'HawkOS 2.0 + Android 17 + Debian 13: UI updates, Lock Screen AI, VM improvements.');
                    showDynamicIsland('Update installed: HawkOS 2.0 — view details in What\'s New', 3000);
                    window._spawnTapParticles && window._spawnTapParticles(200, 220);
                });
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

    initiateBootSequence();
});