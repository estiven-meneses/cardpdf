/**
 * CARDPDF 2.1 PRO - Motor de Renderizado, Manipulación Directa y Exportación
 * Optimizado para Smartphones, Cámara Nativa, Sincronización de Carnets y Exportación Limpia.
 */

// =============================================================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// =============================================================================

const FACTORY_DEFAULTS = {
    paper: {
        size: 'a4', // 'a4' | 'letter'
        orientation: 'portrait', // 'portrait' | 'landscape'
        widthMm: 210,
        heightMm: 297,
    },
    layout: {
        mode: 'both', // 'both' | 'front-only' | 'back-only' | 'multi-2' | 'multi-4'
        arrange: 'vertical', // 'vertical' | 'horizontal'
        showCutLines: false, // APAGADO por defecto para evitar rayas entrecortadas
        showBorder: false,   // APAGADO por defecto para bordes 100% limpios
    },
    syncCards: true, // Sincronización automática de tamaño y filtros entre caras
    cards: {
        frente: {
            id: 'frente',
            name: 'Front',
            rawImage: null,
            croppedCanvas: null,
            cropRect: null,
            cachedCanvas: null,
            widthMm: 85.6,
            heightMm: 53.98,
            xMm: 0,
            yMm: 21,
            scale: 150, // % (Configuración preferida del usuario)
            rotation: 0,
            flipH: false,
            flipV: false,
            borderRadiusMm: 5,
            filter: 'normal',
            brightness: 0,
            contrast: 0,
            dirty: true,
        },
        dorso: {
            id: 'dorso',
            name: 'Back',
            rawImage: null,
            croppedCanvas: null,
            cropRect: null,
            cachedCanvas: null,
            widthMm: 85.6,
            heightMm: 53.98,
            xMm: 0,
            yMm: -8,
            scale: 150, // % (Configuración preferida del usuario)
            rotation: 0,
            flipH: false,
            flipV: false,
            borderRadiusMm: 5,
            filter: 'normal',
            brightness: 0,
            contrast: 0,
            dirty: true,
        }
    },
    exportFormat: 'pdf',
    exportDpi: 300,
    exportLight: false,
    exportName: '',
};

// Estado mutable actual
const STATE = JSON.parse(JSON.stringify(FACTORY_DEFAULTS));
STATE.activeCardId = 'frente';
STATE.selectedCardId = null;
STATE.snapEnabled = true;
STATE.zoom = defaultSheetZoom();
STATE.theme = 'light';
STATE.darkPaper = false;
STATE.mobileView = 'canvas'; // 'canvas' | 'controls' | 'export'
STATE.appMode = 'simple'; // 'simple' | 'advanced'

const SVG_ICONS = {
    check: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    close: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    target: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>',
    moon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>',
    sun: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>',
    star: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    sparkle: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path></svg>',
    search: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    ruler: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 7.85-5.58-5.58a2.5 2.5 0 0 0-3.54 0L2.27 12.61a2.5 2.5 0 0 0 0 3.54l5.58 5.58a2.5 2.5 0 0 0 3.54 0l10.34-10.34a2.5 2.5 0 0 0 0-3.54z"></path><line x1="7.5" y1="10.5" x2="10.5" y2="7.5"></line><line x1="10.5" y1="13.5" x2="13.5" y2="10.5"></line><line x1="13.5" y1="16.5" x2="16.5" y2="13.5"></line></svg>',
    cards: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="12" height="8" rx="1.5"></rect><rect x="9" y="11" width="12" height="8" rx="1.5"></rect></svg>',
    flipH: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"></path><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"></path><line x1="12" y1="20" x2="12" y2="4"></line></svg>',
    flipV: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"></path><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>',
    maximize: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>',
    minimize: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6m0 0v6m0-6-7 7m17-11h-6m0 0V4m0 6 7-7m-7 17v-6m0 0h6m-6 0 7 7M10 4v6m0 0H4m0 0 7-7"></path></svg>',
};

// Historial para Deshacer / Rehacer
const HISTORY = {
    undoStack: [],
    redoStack: [],
    maxItems: 30,
    isApplyingHistory: false
};

// =============================================================================
// 2. REFERENCIAS AL DOM
// =============================================================================

const DOM = {
    // Header & Globales
    btnLoadDemo: document.getElementById('btn-load-demo'),
    btnEmptyDemo: document.getElementById('btn-empty-demo'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIconDark: document.getElementById('theme-icon-dark'),
    themeIconLight: document.getElementById('theme-icon-light'),
    btnResetAll: document.getElementById('btn-reset-all'),
    btnThemeToggleMobile: document.getElementById('btn-theme-toggle-mobile'),
    themeIconDarkMobile: document.getElementById('theme-icon-dark-mobile'),
    themeIconLightMobile: document.getElementById('theme-icon-light-mobile'),
    btnResetAllMobile: document.getElementById('btn-reset-all-mobile'),

    // Mobile View Switcher
    mobileTabCanvas: document.getElementById('mobile-tab-canvas'),
    mobileTabControls: document.getElementById('mobile-tab-controls'),
    mobileTabExport: document.getElementById('mobile-tab-export'),
    panelSidebar: document.getElementById('panel-sidebar'),
    panelControls: document.getElementById('panel-controls'),
    panelOutput: document.getElementById('panel-output'),
    panelExport: document.getElementById('panel-export'),
    panelCanvas: document.getElementById('panel-canvas'),
    exportSheetSummary: document.getElementById('export-sheet-summary'),

    // Dropzones & Carga
    dropzoneFrente: document.getElementById('dropzone-frente'),
    dropzoneDorso: document.getElementById('dropzone-dorso'),
    frenteInput: document.getElementById('frente-input'),
    dorsoInput: document.getElementById('dorso-input'),
    frenteCameraInput: document.getElementById('frente-camera-input'),
    dorsoCameraInput: document.getElementById('dorso-camera-input'),
    frentePreviewWrap: document.getElementById('frente-preview-wrap'),
    dorsoPreviewWrap: document.getElementById('dorso-preview-wrap'),
    frentePlaceholder: document.getElementById('frente-placeholder'),
    dorsoPlaceholder: document.getElementById('dorso-placeholder'),
    frenteImg: document.getElementById('frente-img'),
    dorsoImg: document.getElementById('dorso-img'),
    frenteActions: document.getElementById('frente-actions'),
    dorsoActions: document.getElementById('dorso-actions'),
    btnCropFrente: document.getElementById('btn-crop-frente'),
    btnRemoveFrente: document.getElementById('btn-remove-frente'),
    btnCropDorso: document.getElementById('btn-crop-dorso'),
    btnRemoveDorso: document.getElementById('btn-remove-dorso'),
    btnCameraFrente: document.getElementById('btn-camera-frente'),
    btnCameraDorso: document.getElementById('btn-camera-dorso'),
    btnSwapCards: document.getElementById('btn-swap-cards'),

    // Plantilla y Papel
    layoutModeSelect: document.getElementById('layout-mode-select'),
    layoutArrangeSelect: document.getElementById('layout-arrange-select'),
    paperSizeSelect: document.getElementById('paper-size-select'),
    btnOrientPortrait: document.getElementById('btn-orient-portrait'),
    btnOrientLandscape: document.getElementById('btn-orient-landscape'),
    checkCutLines: document.getElementById('check-cut-lines'),
    checkCardBorder: document.getElementById('check-card-border'),

    // Sincronización y Pestañas de Ajustes
    checkSyncCards: document.getElementById('check-sync-cards'),
    tabBtnFrente: document.getElementById('tab-btn-frente'),
    tabBtnDorso: document.getElementById('tab-btn-dorso'),
    tabBtnBoth: document.getElementById('tab-btn-both'),
    btnApplyCr80: document.getElementById('btn-apply-cr80'),
    activeCardDimensions: document.getElementById('active-card-dimensions'),
    cardScaleRange: document.getElementById('card-scale-range'),
    cardScaleNum: document.getElementById('card-scale-num'),
    cardXRange: document.getElementById('card-x-range'),
    cardXNum: document.getElementById('card-x-num'),
    cardYRange: document.getElementById('card-y-range'),
    cardYNum: document.getElementById('card-y-num'),
    btnAlignCenterBoth: document.getElementById('btn-align-center-both'),
    btnAlignCenterX: document.getElementById('btn-align-center-x'),
    btnAlignCenterY: document.getElementById('btn-align-center-y'),
    btnCopyToOther: document.getElementById('btn-copy-to-other'),
    cardRadiusRange: document.getElementById('card-radius-range'),
    cardRadiusNum: document.getElementById('card-radius-num'),
    btnResetRadius: document.getElementById('btn-reset-radius'),
    filterPresetBtns: document.querySelectorAll('.filter-preset-btn'),
    cardBrightnessRange: document.getElementById('card-brightness-range'),
    cardBrightnessNum: document.getElementById('card-brightness-num'),
    btnResetBrightness: document.getElementById('btn-reset-brightness'),
    cardContrastRange: document.getElementById('card-contrast-range'),
    cardContrastNum: document.getElementById('card-contrast-num'),
    btnResetContrast: document.getElementById('btn-reset-contrast'),
    cardRotationLabel: document.getElementById('card-rotation-label'),
    btnRotateActive90: document.getElementById('btn-rotate-active-90'),
    btnFlipH: document.getElementById('btn-flip-h'),
    btnFlipV: document.getElementById('btn-flip-v'),
    btnResetActiveCard: document.getElementById('btn-reset-active-card'),

    // Plantilla Predeterminada
    btnSaveCustomTemplate: document.getElementById('btn-save-custom-template'),
    btnRestoreFactoryTemplate: document.getElementById('btn-restore-factory-template'),
    defaultConfigBadge: document.getElementById('default-config-badge'),

    // Exportación
    exportFormatSelect: document.getElementById('export-format-select'),
    exportDpiSelect: document.getElementById('export-dpi-select'),
    exportDpiWrap: document.getElementById('export-dpi-wrap'),
    exportFields: document.getElementById('export-fields'),
    exportFilename: document.getElementById('export-filename'),
    checkExportLight: document.getElementById('check-export-light'),
    btnGenerateDownload: document.getElementById('btn-generate-download'),
    btnGenerateText: document.getElementById('btn-generate-text'),
    btnDirectPrint: document.getElementById('btn-direct-print'),
    btnCopyClipboard: document.getElementById('btn-copy-clipboard'),

    // Canvas Toolbar & Quick Bar
    btnUndo: document.getElementById('btn-undo'),
    btnRedo: document.getElementById('btn-redo'),
    selectedCardIndicator: document.getElementById('selected-card-indicator'),
    btnToggleSnap: document.getElementById('btn-toggle-snap'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomFit: document.getElementById('btn-zoom-fit'),
    zoomFitIcon: document.getElementById('zoom-fit-icon'),
    zoomFitLabel: document.getElementById('zoom-fit-label'),
    zoomLevelLabel: document.getElementById('zoom-level-label'),
    panelCanvas: document.getElementById('panel-canvas'),
    canvasQuickBar: document.getElementById('canvas-quick-bar'),
    hojaPickFrente: document.getElementById('hoja-pick-frente'),
    hojaPickDorso: document.getElementById('hoja-pick-dorso'),
    quickCardBadge: document.getElementById('quick-card-badge'),
    btnQuickSelectBoth: document.getElementById('btn-quick-select-both'),
    quickSelectBothLabel: document.getElementById('quick-select-both-label'),
    quickScaleLabel: document.getElementById('quick-scale-label'),
    btnQuickScaleDown: document.getElementById('btn-quick-scale-down'),
    btnQuickScaleUp: document.getElementById('btn-quick-scale-up'),
    btnQuickRotate: document.getElementById('btn-quick-rotate'),
    btnQuickCrop: document.getElementById('btn-quick-crop'),
    btnQuickCenterX: document.getElementById('btn-quick-center-x'),
    btnQuickCenterY: document.getElementById('btn-quick-center-y'),
    btnQuickCenter: document.getElementById('btn-quick-center'),
    btnQuickToSettings: document.getElementById('btn-quick-to-settings'),
    btnQuickDeselect: document.getElementById('btn-quick-deselect'),
    viewportContainer: document.getElementById('viewport-container'),
    viewportScroller: document.getElementById('viewport-scroller'),
    previewCanvas: document.getElementById('preview-canvas'),
    emptyState: document.getElementById('empty-state'),
    canvasStatusHint: document.getElementById('canvas-status-hint'),
    sheetInfoBadge: document.getElementById('sheet-info-badge'),
    btnTogglePaperTheme: document.getElementById('btn-toggle-paper-theme'),
    paperThemeIcon: document.getElementById('paper-theme-icon'),
    paperThemeLabel: document.getElementById('paper-theme-label'),

    // Modales y Herramientas de Recorte Avanzado
    cropModal: document.getElementById('crop-modal'),
    cropCanvas: document.getElementById('crop-canvas'),
    cropLoupe: document.getElementById('crop-loupe'),
    cropLoupeCanvas: document.getElementById('crop-loupe-canvas'),
    btnCropTabBox: document.getElementById('btn-crop-tab-box'),
    btnCropTabQuad: document.getElementById('btn-crop-tab-quad'),
    btnCropTabRotate: document.getElementById('btn-crop-tab-rotate'),
    cropBoxControls: document.getElementById('crop-box-controls'),
    cropQuadControls: document.getElementById('crop-quad-controls'),
    cropRotateControls: document.getElementById('crop-rotate-controls'),
    btnCloseCrop: document.getElementById('btn-close-crop'),
    btnCancelCrop: document.getElementById('btn-cancel-crop'),
    btnApplyCrop: document.getElementById('btn-apply-crop'),
    btnCropAspectFree: document.getElementById('btn-crop-aspect-free'),
    btnCropAspectCr80: document.getElementById('btn-crop-aspect-cr80'),
    btnCropAutoDetect: document.getElementById('btn-crop-auto-detect'),
    btnCropQuadAuto: document.getElementById('btn-crop-quad-auto'),
    btnCropQuadRotLeft: document.getElementById('btn-crop-quad-rot-left'),
    btnCropQuadRotRight: document.getElementById('btn-crop-quad-rot-right'),
    btnCropQuadReset: document.getElementById('btn-crop-quad-reset'),
    btnCropRotateLeft: document.getElementById('btn-crop-rotate-left'),
    btnCropRotateRight: document.getElementById('btn-crop-rotate-right'),
    cropAngleSlider: document.getElementById('crop-angle-slider'),
    cropAngleLabel: document.getElementById('crop-angle-label'),
    btnCropAngleReset: document.getElementById('btn-crop-angle-reset'),
    btnCropToggleGrid: document.getElementById('btn-crop-toggle-grid'),
    btnLoupeZoom1: document.getElementById('btn-loupe-zoom-1'),
    btnLoupeZoom15: document.getElementById('btn-loupe-zoom-15'),
    btnLoupeZoom2: document.getElementById('btn-loupe-zoom-2'),
    btnLoupeZoom3: document.getElementById('btn-loupe-zoom-3'),
    cropLoupeBadge: document.getElementById('crop-loupe-badge'),
    cameraModal: document.getElementById('camera-modal'),
    cameraVideo: document.getElementById('camera-video'),
    cameraGuideBox: document.getElementById('camera-guide-box'),
    btnSwitchCamera: document.getElementById('btn-switch-camera'),
    btnCameraUseNative: document.getElementById('btn-camera-use-native'),
    btnCloseCamera: document.getElementById('btn-close-camera'),
    btnCancelCamera: document.getElementById('btn-cancel-camera'),
    btnSnapCamera: document.getElementById('btn-snap-camera'),
    bannerScanDorso: document.getElementById('banner-scan-dorso'),
    btnBannerScanDorso: document.getElementById('btn-banner-scan-dorso'),
    btnBannerDismissDorso: document.getElementById('btn-banner-dismiss-dorso'),
    loaderOverlay: document.getElementById('loader-overlay'),
    loaderTitle: document.getElementById('loader-title'),
    loaderSubtitle: document.getElementById('loader-subtitle'),
    toastContainer: document.getElementById('toast-container'),
    printArea: document.getElementById('print-area'),
    printImg: document.getElementById('print-img')
};

const previewCtx = DOM.previewCanvas.getContext('2d');
let renderScheduled = false;
let cameraStream = null;
let targetCameraCard = 'frente';
let cameraFacingMode = 'environment'; // 'environment' (trasera) o 'user' (frontal)

const INTERACTION = {
    isDragging: false,
    isResizing: false,
    isPanning: false,
    panMoved: false,
    panStart: { x: 0, y: 0, sl: 0, st: 0 },
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    cardInitialPos: { x: 0, y: 0 },
    cardInitialScale: 150,
    activeSnapLines: [],
};

// =============================================================================
// 2B. REGISTRO DE ERRORES (local → tools/dev-server.py → logs/local)
// =============================================================================

function isLocalHost() {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function reportClientError(payload) {
    const body = {
        level: payload.level || 'error',
        message: String(payload.message || 'Error desconocido').slice(0, 2000),
        stack: payload.stack ? String(payload.stack).slice(0, 8000) : '',
        source: payload.source || 'client',
        url: window.location.href,
        userAgent: navigator.userAgent
    };
    const endpoint = isLocalHost() ? '/__log__' : '/api/logs';
    try {
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true
        }).catch(() => {});
    } catch (_) {}
}

function registerPwa() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
}

function installErrorLogger() {
    window.addEventListener('error', (e) => {
        const msg = e.message || (e.error && e.error.message) || 'Error de script';
        const stack = (e.error && e.error.stack) || `${e.filename || ''}:${e.lineno || 0}`;
        reportClientError({ level: 'error', message: msg, stack, source: 'window.onerror' });
    });
    window.addEventListener('unhandledrejection', (e) => {
        const reason = e.reason;
        const msg = (reason && (reason.message || String(reason))) || 'Promesa rechazada';
        const stack = (reason && reason.stack) || '';
        reportClientError({ level: 'error', message: msg, stack, source: 'unhandledrejection' });
    });
}

// =============================================================================
// 3. INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    installErrorLogger();
    registerPwa();
    initTheme();
    initLang();
    initAppMode();
    if (STATE.appMode === 'advanced') loadCustomDefaults();
    setupPaperDimensions();
    setupEventListeners();
    setupSheetZoomWheel();
    updateUIFromState();
    setupResponsiveMobile();
    updateZoomLabel();
    resizeCanvasViewport();
    saveHistoryState('Inicial');
    scheduleRender();
    syncConfigTelemetry('init');
    preloadHeicDecoder();
});

window.addEventListener('resize', () => {
    setupResponsiveMobile();
    resizeCanvasViewport();
    scheduleRender();
});

// Prevención radical de zoom de doble toque y gestos accidentales en móviles
let lastTouchEndTime = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEndTime <= 300) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('input, select, textarea'))) {
            return;
        }
        e.preventDefault();
        if (e.target) {
            const clickable = e.target.closest('button, a, label');
            if (clickable) clickable.click();
        }
    }
    lastTouchEndTime = now;
}, { passive: false });

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// =============================================================================
// 4. RESPONSIVE Y VISTA MÓVIL (Edge-to-Edge con Lienzo en Vivo Continuo)
// =============================================================================

function setupResponsiveMobile() {
    const isMobile = window.innerWidth < 1024;
    const showSidebar = STATE.appMode !== 'simple';
    if (isMobile) {
        setMobileView(STATE.mobileView);
    } else {
        if (DOM.panelSidebar) DOM.panelSidebar.style.display = showSidebar ? 'flex' : 'none';
        if (DOM.panelControls) DOM.panelControls.style.display = showSidebar ? 'flex' : 'none';
        if (DOM.panelOutput) DOM.panelOutput.style.display = 'flex';
        if (DOM.panelExport) DOM.panelExport.style.display = 'flex';
        if (DOM.panelCanvas) DOM.panelCanvas.style.display = 'flex';
        DOM.panelCanvas.classList.remove('mobile-compact-view');
        if (DOM.viewportContainer) DOM.viewportContainer.classList.remove('compact-mobile-viewport');
        document.body.dataset.mobileView = 'desktop';
        resizeCanvasViewport();
    }
}

function applyMobileTabStyles(active) {
    const tabs = [
        [DOM.mobileTabCanvas, 'canvas'],
        [DOM.mobileTabControls, 'controls'],
        [DOM.mobileTabExport, 'export']
    ];
    tabs.forEach(([el, id]) => {
        if (!el) return;
        el.className = active === id ? 'mobile-tab is-active' : 'mobile-tab';
    });
}

function setMobileView(view) {
    if (STATE.appMode === 'simple' && view === 'controls') view = 'canvas';
    STATE.mobileView = view;
    const isMobile = window.innerWidth < 1024;
    document.body.dataset.mobileView = isMobile ? view : 'desktop';
    const showSidebar = STATE.appMode !== 'simple';

    if (!isMobile) {
        if (DOM.panelSidebar) DOM.panelSidebar.style.display = showSidebar ? 'flex' : 'none';
        if (DOM.panelControls) DOM.panelControls.style.display = showSidebar ? 'flex' : 'none';
        if (DOM.panelOutput) DOM.panelOutput.style.display = 'flex';
        if (DOM.panelExport) DOM.panelExport.style.display = 'flex';
        if (DOM.panelCanvas) DOM.panelCanvas.style.display = 'flex';
        return;
    }

    const showCanvas = view === 'canvas';
    const showControls = view === 'controls';
    const showExport = view === 'export';

    if (DOM.panelCanvas) DOM.panelCanvas.style.display = showCanvas ? 'flex' : 'none';
    if (DOM.panelSidebar) DOM.panelSidebar.style.display = showControls ? 'flex' : 'none';
    if (DOM.panelControls) DOM.panelControls.style.display = showControls ? 'flex' : 'none';
    if (DOM.panelOutput) DOM.panelOutput.style.display = showExport ? 'flex' : 'none';
    if (DOM.panelExport) DOM.panelExport.style.display = showExport ? 'flex' : 'none';
    // Cada panel tiene su propio scroll dentro del shell fijo.
    const activePanel = showControls ? DOM.panelSidebar : showExport ? DOM.panelOutput : null;
    if (activePanel) activePanel.scrollTop = 0;

    applyMobileTabStyles(view);

    if (showCanvas) {
        resizeCanvasViewport();
        scheduleRender();
    }
}

// =============================================================================
// 5. GESTIÓN DE CONFIGURACIÓN PREDETERMINADA PERSONALIZADA (Favoritos)
// =============================================================================

function updateDefaultConfigBadge() {
    const hasCustom = !!localStorage.getItem('cardpdf-custom-defaults');
    if (DOM.defaultConfigBadge) {
        if (hasCustom) {
            DOM.defaultConfigBadge.innerHTML = `<span>${t('custom')}</span>${SVG_ICONS.star}`;
            DOM.defaultConfigBadge.className = 'inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
        } else {
            DOM.defaultConfigBadge.textContent = t('factory');
            DOM.defaultConfigBadge.className = 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        }
    }
}

let telemetryTimeout = null;
function syncConfigTelemetry(trigger = 'live') {
    try {
        const customSaved = localStorage.getItem('cardpdf-custom-defaults');
        const payload = {
            trigger,
            time: new Date().toISOString(),
            paper: STATE.paper,
            layout: STATE.layout,
            syncCards: STATE.syncCards,
            cards: {
                frente: {
                    scale: STATE.cards.frente.scale,
                    xMm: STATE.cards.frente.xMm,
                    yMm: STATE.cards.frente.yMm,
                    borderRadiusMm: STATE.cards.frente.borderRadiusMm,
                    rotation: STATE.cards.frente.rotation || 0,
                    flipH: !!STATE.cards.frente.flipH,
                    flipV: !!STATE.cards.frente.flipV,
                    filter: STATE.cards.frente.filter,
                    brightness: STATE.cards.frente.brightness,
                    contrast: STATE.cards.frente.contrast,
                },
                dorso: {
                    scale: STATE.cards.dorso.scale,
                    xMm: STATE.cards.dorso.xMm,
                    yMm: STATE.cards.dorso.yMm,
                    borderRadiusMm: STATE.cards.dorso.borderRadiusMm,
                    rotation: STATE.cards.dorso.rotation || 0,
                    flipH: !!STATE.cards.dorso.flipH,
                    flipV: !!STATE.cards.dorso.flipV,
                    filter: STATE.cards.dorso.filter,
                    brightness: STATE.cards.dorso.brightness,
                    contrast: STATE.cards.dorso.contrast,
                }
            },
            exportFormat: STATE.exportFormat,
            exportDpi: STATE.exportDpi,
            exportLight: !!STATE.exportLight,
            savedCustom: customSaved ? JSON.parse(customSaved) : null
        };
        fetch('/__sync_defaults__?payload=' + encodeURIComponent(JSON.stringify(payload))).catch(() => {});
    } catch (err) {}
}

function debouncedTelemetrySync() {
    if (telemetryTimeout) clearTimeout(telemetryTimeout);
    telemetryTimeout = setTimeout(() => syncConfigTelemetry('user_change'), 800);
}

function saveCustomDefaults() {
    const customConfig = {
        paper: STATE.paper,
        layout: STATE.layout,
        syncCards: STATE.syncCards,
        cards: {
            frente: {
                scale: STATE.cards.frente.scale,
                xMm: STATE.cards.frente.xMm,
                yMm: STATE.cards.frente.yMm,
                borderRadiusMm: STATE.cards.frente.borderRadiusMm,
                filter: STATE.cards.frente.filter,
                brightness: STATE.cards.frente.brightness,
                contrast: STATE.cards.frente.contrast,
                rotation: STATE.cards.frente.rotation || 0,
                flipH: !!STATE.cards.frente.flipH,
                flipV: !!STATE.cards.frente.flipV,
            },
            dorso: {
                scale: STATE.cards.dorso.scale,
                xMm: STATE.cards.dorso.xMm,
                yMm: STATE.cards.dorso.yMm,
                borderRadiusMm: STATE.cards.dorso.borderRadiusMm,
                filter: STATE.cards.dorso.filter,
                brightness: STATE.cards.dorso.brightness,
                contrast: STATE.cards.dorso.contrast,
                rotation: STATE.cards.dorso.rotation || 0,
                flipH: !!STATE.cards.dorso.flipH,
                flipV: !!STATE.cards.dorso.flipV,
            }
        },
        exportFormat: STATE.exportFormat,
        exportDpi: STATE.exportDpi,
        exportLight: !!STATE.exportLight
    };

    localStorage.setItem('cardpdf-custom-defaults', JSON.stringify(customConfig));
    syncConfigTelemetry('save_defaults');
    updateDefaultConfigBadge();
    triggerSuccessCelebration();
    showToast(t('savedDefault'), 'success', 'star');
}

function loadCustomDefaults() {
    try {
        const saved = localStorage.getItem('cardpdf-custom-defaults');
        if (!saved) return;
        const config = JSON.parse(saved);

        if (config.paper) Object.assign(STATE.paper, config.paper);
        if (config.layout) Object.assign(STATE.layout, config.layout);
        if (config.syncCards !== undefined) STATE.syncCards = config.syncCards;
        if (config.exportFormat) STATE.exportFormat = config.exportFormat;
        if (config.exportDpi) STATE.exportDpi = config.exportDpi;
        if (config.exportLight !== undefined) STATE.exportLight = !!config.exportLight;

        if (config.cards) {
            ['frente', 'dorso'].forEach(key => {
                if (config.cards[key]) {
                    Object.assign(STATE.cards[key], config.cards[key]);
                }
            });
        }
        updateDefaultConfigBadge();
    } catch (e) {
        console.warn('No se pudo cargar configuración personalizada:', e);
    }
}

function restoreFactoryDefaults() {
    localStorage.removeItem('cardpdf-custom-defaults');
    STATE.paper = JSON.parse(JSON.stringify(FACTORY_DEFAULTS.paper));
    STATE.layout = JSON.parse(JSON.stringify(FACTORY_DEFAULTS.layout));
    STATE.syncCards = FACTORY_DEFAULTS.syncCards;
    
    ['frente', 'dorso'].forEach(id => {
        const f = FACTORY_DEFAULTS.cards[id];
        STATE.cards[id].scale = f.scale;
        STATE.cards[id].xMm = f.xMm;
        STATE.cards[id].yMm = f.yMm;
        STATE.cards[id].borderRadiusMm = f.borderRadiusMm;
        STATE.cards[id].filter = f.filter;
        STATE.cards[id].brightness = f.brightness;
        STATE.cards[id].contrast = f.contrast;
        STATE.cards[id].rotation = 0;
        STATE.cards[id].flipH = false;
        STATE.cards[id].flipV = false;
        STATE.cards[id].dirty = true;
    });

    updateDefaultConfigBadge();
    setupPaperDimensions();
    updateUIFromState();
    syncControlsFromActiveCard();
    resizeCanvasViewport();
    scheduleRender();
    showToast(t('factoryRestored'), 'info');
}

function flipCard(cardId, axis = 'h') {
    if (cardId === 'both' || STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        flipSingleCard('frente', axis);
        flipSingleCard('dorso', axis);
        syncControlsFromActiveCard();
        scheduleRender();
        saveHistoryState(`Voltear Ambos ${axis.toUpperCase()}`);
        showToast(t('flipBoth', { axis: t(axis === 'h' ? 'axisH' : 'axisV') }), 'info');
        return;
    }
    flipSingleCard(cardId, axis);
    syncControlsFromActiveCard();
    scheduleRender();
    saveHistoryState(`Voltear ${axis.toUpperCase()} ${STATE.cards[cardId].name}`);
    showToast(t('flipOne', { name: STATE.cards[cardId].name, axis: t(axis === 'h' ? 'axisH' : 'axisV') }), 'info');
}

function flipSingleCard(cardId, axis = 'h') {
    const card = STATE.cards[cardId];
    if (!card) return;
    if (axis === 'h') {
        card.flipH = !card.flipH;
    } else {
        card.flipV = !card.flipV;
    }
    card.dirty = true;
}

function resetActiveCardAdjustments() {
    if (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        resetCardToFactory('frente');
        resetCardToFactory('dorso');
        saveHistoryState('Restablecer Ambos Carnets');
        showToast(t('resetBoth'), 'info');
    } else {
        resetCardToFactory(STATE.activeCardId);
        saveHistoryState(`Restablecer ${STATE.cards[STATE.activeCardId].name}`);
        showToast(t('resetOne', { name: STATE.cards[STATE.activeCardId].name }), 'info');
    }
    syncControlsFromActiveCard();
    scheduleRender();
}

function resetCardToFactory(cardId) {
    const card = STATE.cards[cardId];
    if (!card) return;
    const def = FACTORY_DEFAULTS.cards[cardId];
    card.scale = def.scale;
    card.xMm = def.xMm;
    card.yMm = def.yMm;
    card.borderRadiusMm = def.borderRadiusMm;
    card.filter = def.filter;
    card.brightness = def.brightness;
    card.contrast = def.contrast;
    card.rotation = 0;
    card.flipH = false;
    card.flipV = false;
    card.dirty = true;
}

// =============================================================================
// 6. GESTIÓN DE TEMA
// =============================================================================

function migrateLegacyStorage() {
    const pairs = [
        ['cardify-theme', 'cardpdf-theme'],
        ['cardify-custom-defaults', 'cardpdf-custom-defaults']
    ];
    try {
        for (const [from, to] of pairs) {
            if (localStorage.getItem(to) == null) {
                const prev = localStorage.getItem(from);
                if (prev != null) localStorage.setItem(to, prev);
            }
            localStorage.removeItem(from);
        }
    } catch (_) {}
}

function initAppMode() {
    const saved = localStorage.getItem('cardpdf-app-mode');
    STATE.appMode = saved === 'advanced' ? 'advanced' : 'simple';
    applyAppMode(STATE.appMode, { persist: false, applyLayout: false });
}

function applyFactoryMetricsKeepImages() {
    STATE.paper = JSON.parse(JSON.stringify(FACTORY_DEFAULTS.paper));
    STATE.layout = JSON.parse(JSON.stringify(FACTORY_DEFAULTS.layout));
    STATE.syncCards = FACTORY_DEFAULTS.syncCards;
    ['frente', 'dorso'].forEach((id) => {
        const f = FACTORY_DEFAULTS.cards[id];
        const card = STATE.cards[id];
        card.scale = f.scale;
        card.xMm = f.xMm;
        card.yMm = f.yMm;
        card.borderRadiusMm = f.borderRadiusMm;
        card.filter = f.filter;
        card.brightness = f.brightness;
        card.contrast = f.contrast;
        card.dirty = true;
    });
    setupPaperDimensions();
    updateUIFromState();
    if (typeof syncControlsFromActiveCard === 'function') syncControlsFromActiveCard();
}

function applyAppMode(mode, opts = {}) {
    const persist = opts.persist !== false;
    const applyLayout = opts.applyLayout !== false;
    const next = mode === 'advanced' ? 'advanced' : 'simple';
    const prev = STATE.appMode;
    STATE.appMode = next;
    document.body.dataset.appMode = next;
    if (persist) localStorage.setItem('cardpdf-app-mode', next);
    document.querySelectorAll('[data-app-mode-btn]').forEach((btn) => {
        btn.classList.toggle('is-on', btn.getAttribute('data-app-mode-btn') === next);
    });
    if (applyLayout) {
        if (next === 'simple') applyFactoryMetricsKeepImages();
        else if (prev === 'simple') {
            loadCustomDefaults();
            updateUIFromState();
            if (typeof syncControlsFromActiveCard === 'function') syncControlsFromActiveCard();
        }
    }
    if (next === 'simple' && STATE.mobileView === 'controls') STATE.mobileView = 'canvas';
    setupResponsiveMobile();
    resizeCanvasViewport();
    scheduleRender();
}

function setAppMode(mode) {
    if (mode === STATE.appMode) return;
    applyAppMode(mode);
}

function initTheme() {
    migrateLegacyStorage();
    const savedTheme = localStorage.getItem('cardpdf-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    STATE.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(STATE.theme);
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    if (DOM.themeIconDark) DOM.themeIconDark.classList.toggle('hidden', !isDark);
    if (DOM.themeIconLight) DOM.themeIconLight.classList.toggle('hidden', isDark);
    if (DOM.themeIconDarkMobile) DOM.themeIconDarkMobile.classList.toggle('hidden', !isDark);
    if (DOM.themeIconLightMobile) DOM.themeIconLightMobile.classList.toggle('hidden', isDark);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', isDark ? '#0f172a' : '#f1f5f9');
    STATE.darkPaper = isDark;
    localStorage.setItem('cardpdf-theme', theme);
    updatePaperThemeUI();
    scheduleRender();
}

function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    applyTheme(STATE.theme);
}

function togglePaperTheme() {
    STATE.darkPaper = !STATE.darkPaper;
    updatePaperThemeUI();
    scheduleRender();
    showToast(STATE.darkPaper ? t('paperDarkOn') : t('paperLightOn'), 'info', STATE.darkPaper ? 'moon' : 'sun');
}

function updatePaperThemeUI() {
    if (!DOM.btnTogglePaperTheme) return;
    if (STATE.darkPaper) {
        if (DOM.paperThemeIcon) DOM.paperThemeIcon.innerHTML = SVG_ICONS.sun;
        if (DOM.paperThemeLabel) DOM.paperThemeLabel.textContent = t('paperLight');
        DOM.btnTogglePaperTheme.title = 'Cambiar vista previa a hoja blanca';
    } else {
        if (DOM.paperThemeIcon) DOM.paperThemeIcon.innerHTML = SVG_ICONS.moon;
        if (DOM.paperThemeLabel) DOM.paperThemeLabel.textContent = t('paperDark');
        DOM.btnTogglePaperTheme.title = 'Cambiar vista previa a hoja oscura (anti-deslumbramiento)';
    }
}

// =============================================================================
// 7. PAPEL Y DIMENSIONES
// =============================================================================

function setupPaperDimensions() {
    const isPortrait = STATE.paper.orientation === 'portrait';
    let w = 210;
    let h = 297;

    if (STATE.paper.size === 'letter') {
        w = 215.9;
        h = 279.4;
    }

    STATE.paper.widthMm = isPortrait ? w : h;
    STATE.paper.heightMm = isPortrait ? h : w;

    const sheetLabel = `${STATE.paper.size.toUpperCase()} • ${STATE.paper.widthMm.toFixed(1)} × ${STATE.paper.heightMm.toFixed(1)} mm`;
    if (DOM.sheetInfoBadge) DOM.sheetInfoBadge.textContent = sheetLabel;
    if (DOM.exportSheetSummary) DOM.exportSheetSummary.textContent = sheetLabel;
}

// =============================================================================
// 8. EVENT LISTENERS
// =============================================================================

function openCardFilePicker(cardId) {
    const input = cardId === 'dorso' ? DOM.dorsoInput : DOM.frenteInput;
    if (!input) return;
    input.value = '';
    input.click();
}

function syncHojaPickHits() {
    const canvas = DOM.previewCanvas;
    const host = DOM.viewportContainer;
    if (!canvas || !host) return;
    const hits = [
        [DOM.hojaPickFrente, 'frente'],
        [DOM.hojaPickDorso, 'dorso']
    ];
    const rect = canvas.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) {
        hits.forEach(([el]) => { if (el) el.classList.add('is-off'); });
        return;
    }
    const dpr = window.devicePixelRatio || 1;
    const canvasW = canvas.width / dpr;
    const canvasH = canvas.height / dpr;
    const scale = rect.width / Math.max(1, canvasW);
    const mmToPx = canvasW / STATE.paper.widthMm;
    const placeholders = getBlueprintPlaceholders(mmToPx, canvasW, canvasH);

    for (const [el, cardId] of hits) {
        if (!el) continue;
        const bp = placeholders.find((p) => p.cardId === cardId);
        if (!bp) {
            el.classList.add('is-off');
            continue;
        }
        el.classList.remove('is-off');
        el.style.left = `${rect.left - hostRect.left + bp.pxX * scale}px`;
        el.style.top = `${rect.top - hostRect.top + bp.pxY * scale}px`;
        el.style.width = `${bp.pxW * scale}px`;
        el.style.height = `${bp.pxH * scale}px`;
    }
}

function handleCameraTrigger(cardId) {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 768);
    if (isTouch) {
        if (cardId === 'frente' && DOM.frenteCameraInput) DOM.frenteCameraInput.click();
        else if (cardId === 'dorso' && DOM.dorsoCameraInput) DOM.dorsoCameraInput.click();
        else openCameraModal(cardId);
    } else {
        openCameraModal(cardId);
    }
}

function setupEventListeners() {
    // Header & Mobile Switcher
    if (DOM.btnThemeToggle) DOM.btnThemeToggle.addEventListener('click', toggleTheme);
    if (DOM.btnThemeToggleMobile) DOM.btnThemeToggleMobile.addEventListener('click', toggleTheme);
    if (DOM.btnResetAll) DOM.btnResetAll.addEventListener('click', resetAllDefaults);
    if (DOM.btnResetAllMobile) DOM.btnResetAllMobile.addEventListener('click', resetAllDefaults);
    document.querySelectorAll('[data-app-mode-btn]').forEach((btn) => {
        btn.addEventListener('click', () => setAppMode(btn.getAttribute('data-app-mode-btn')));
    });
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
    });
    if (DOM.mobileTabCanvas) DOM.mobileTabCanvas.addEventListener('click', () => setMobileView('canvas'));
    if (DOM.mobileTabControls) DOM.mobileTabControls.addEventListener('click', () => setMobileView('controls'));
    if (DOM.mobileTabExport) DOM.mobileTabExport.addEventListener('click', () => setMobileView('export'));

    // Carga de Archivos
    if (DOM.dropzoneFrente && DOM.frenteInput) setupDropzone(DOM.dropzoneFrente, DOM.frenteInput, 'frente');
    if (DOM.dropzoneDorso && DOM.dorsoInput) setupDropzone(DOM.dropzoneDorso, DOM.dorsoInput, 'dorso');

    // Inputs de Cámara
    if (DOM.frenteCameraInput) {
        DOM.frenteCameraInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            if (file) loadFileIntoCard(file, 'frente');
        });
    }
    if (DOM.dorsoCameraInput) {
        DOM.dorsoCameraInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            if (file) loadFileIntoCard(file, 'dorso');
        });
    }

    // Botones Únicos de Cámara
    if (DOM.btnCameraFrente) {
        DOM.btnCameraFrente.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCameraTrigger('frente');
        });
    }
    if (DOM.btnCameraDorso) {
        DOM.btnCameraDorso.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCameraTrigger('dorso');
        });
    }

    // Acciones de Tarjetas
    if (DOM.btnRemoveFrente) DOM.btnRemoveFrente.addEventListener('click', (e) => { e.stopPropagation(); removeCard('frente'); });
    if (DOM.btnRemoveDorso) DOM.btnRemoveDorso.addEventListener('click', (e) => { e.stopPropagation(); removeCard('dorso'); });
    if (DOM.btnCropFrente) DOM.btnCropFrente.addEventListener('click', (e) => { e.stopPropagation(); openCropModal('frente'); });
    if (DOM.btnCropDorso) DOM.btnCropDorso.addEventListener('click', (e) => { e.stopPropagation(); openCropModal('dorso'); });

    // Cámara Web en Vivo (Modal)
    if (DOM.btnCloseCamera) DOM.btnCloseCamera.addEventListener('click', closeCameraModal);
    if (DOM.btnCancelCamera) DOM.btnCancelCamera.addEventListener('click', closeCameraModal);
    if (DOM.btnSnapCamera) DOM.btnSnapCamera.addEventListener('click', captureCameraPhoto);
    if (DOM.btnSwitchCamera) DOM.btnSwitchCamera.addEventListener('click', switchCameraFacingMode);
    if (DOM.btnCameraUseNative) {
        DOM.btnCameraUseNative.addEventListener('click', () => {
            closeCameraModal();
            if (targetCameraCard === 'frente' && DOM.frenteCameraInput) DOM.frenteCameraInput.click();
            else if (DOM.dorsoCameraInput) DOM.dorsoCameraInput.click();
        });
    }

    // Banner Prompt para Dorso Automático
    if (DOM.btnBannerScanDorso) {
        DOM.btnBannerScanDorso.addEventListener('click', () => {
            dismissDorsoPrompt();
            handleCameraTrigger('dorso');
        });
    }
    if (DOM.btnBannerDismissDorso) {
        DOM.btnBannerDismissDorso.addEventListener('click', () => {
            dismissDorsoPrompt();
        });
    }

    // Swap Cards
    DOM.btnSwapCards.addEventListener('click', swapCards);

    // Sincronización Automática
    DOM.checkSyncCards.addEventListener('change', (e) => {
        STATE.syncCards = e.target.checked;
        updateCopyButtonVisibility();
        showToast(STATE.syncCards ? t('syncOn') : t('syncOff'), 'info');
    });

    // Plantilla y Papel
    DOM.layoutModeSelect.addEventListener('change', (e) => {
        STATE.layout.mode = e.target.value;
        saveHistoryState('Modo de Caras');
        scheduleRender();
    });

    DOM.layoutArrangeSelect.addEventListener('change', (e) => {
        STATE.layout.arrange = e.target.value;
        saveHistoryState('Disposición');
        scheduleRender();
    });

    DOM.paperSizeSelect.addEventListener('change', (e) => {
        STATE.paper.size = e.target.value;
        setupPaperDimensions();
        resizeCanvasViewport();
        saveHistoryState('Tamaño de Papel');
        scheduleRender();
    });

    DOM.btnOrientPortrait.addEventListener('click', () => setOrientation('portrait'));
    DOM.btnOrientLandscape.addEventListener('click', () => setOrientation('landscape'));

    DOM.checkCutLines.addEventListener('change', (e) => {
        STATE.layout.showCutLines = e.target.checked;
        scheduleRender();
    });

    DOM.checkCardBorder.addEventListener('change', (e) => {
        STATE.layout.showBorder = e.target.checked;
        scheduleRender();
    });

    // Pestañas y Controles de Tarjeta
    DOM.tabBtnFrente.addEventListener('click', () => setActiveTab('frente'));
    DOM.tabBtnDorso.addEventListener('click', () => setActiveTab('dorso'));
    if (DOM.tabBtnBoth) DOM.tabBtnBoth.addEventListener('click', () => setActiveTab('both'));
    DOM.btnApplyCr80.addEventListener('click', applyCr80Preset);
    DOM.btnCopyToOther.addEventListener('click', copyActiveCardSettingsToOther);

    setupCardControls();

    // Exportación
    DOM.exportFormatSelect.addEventListener('change', (e) => {
        STATE.exportFormat = e.target.value;
        updateExportOptionsUI();
    });
    DOM.exportDpiSelect.addEventListener('change', (e) => STATE.exportDpi = parseInt(e.target.value, 10));
    if (DOM.checkExportLight) {
        DOM.checkExportLight.addEventListener('change', (e) => {
            STATE.exportLight = e.target.checked;
            updateExportOptionsUI();
        });
    }
    if (DOM.exportFilename) {
        DOM.exportFilename.addEventListener('input', (e) => {
            STATE.exportName = e.target.value;
        });
    }
    DOM.btnGenerateDownload.addEventListener('click', generateAndDownload);
    DOM.btnDirectPrint.addEventListener('click', directPrintDocument);
    DOM.btnCopyClipboard.addEventListener('click', copyToClipboard);

    // Plantilla Predeterminada
    if (DOM.btnSaveCustomTemplate) {
        DOM.btnSaveCustomTemplate.addEventListener('click', saveCustomDefaults);
    }
    if (DOM.btnRestoreFactoryTemplate) {
        DOM.btnRestoreFactoryTemplate.addEventListener('click', restoreFactoryDefaults);
    }

    // Canvas Toolbar & Barra Rápida (Agrandar con 1 toque)
    DOM.btnUndo.addEventListener('click', undo);
    DOM.btnRedo.addEventListener('click', redo);
    DOM.btnToggleSnap.addEventListener('click', toggleSnap);
    DOM.btnZoomIn.addEventListener('click', () => changeZoom(0.15));
    DOM.btnZoomOut.addEventListener('click', () => changeZoom(-0.15));
    if (DOM.btnZoomFit) {
        DOM.btnZoomFit.addEventListener('click', () => toggleCanvasFullscreen());
    }
    if (DOM.zoomLevelLabel) {
        DOM.zoomLevelLabel.addEventListener('click', resetZoomTo100);
    }

    if (DOM.btnQuickSelectBoth) {
        DOM.btnQuickSelectBoth.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelectBoth();
        });
    }

    if (DOM.btnQuickScaleDown) {
        DOM.btnQuickScaleDown.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId === 'both') {
                STATE.cards.frente.scale = Math.max(30, STATE.cards.frente.scale - 5);
                STATE.cards.dorso.scale = Math.max(30, STATE.cards.dorso.scale - 5);
            } else if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.scale = Math.max(30, c.scale - 5);
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = c.scale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    if (DOM.btnQuickScaleUp) {
        DOM.btnQuickScaleUp.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId === 'both') {
                STATE.cards.frente.scale = Math.min(180, STATE.cards.frente.scale + 5);
                STATE.cards.dorso.scale = Math.min(180, STATE.cards.dorso.scale + 5);
            } else if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.scale = Math.min(180, c.scale + 5);
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = c.scale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    if (DOM.btnQuickRotate) {
        DOM.btnQuickRotate.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId === 'both') {
                rotateCard('frente', 90);
                rotateCard('dorso', 90);
            } else if (STATE.selectedCardId) {
                rotateCard(STATE.selectedCardId, 90);
            }
        });
    }

    if (DOM.btnQuickCrop) {
        DOM.btnQuickCrop.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = STATE.selectedCardId === 'both' ? 'frente' : STATE.selectedCardId;
            if (id) openCropModal(id);
        });
    }

    if (DOM.btnQuickCenterX) {
        DOM.btnQuickCenterX.addEventListener('click', (e) => {
            e.stopPropagation();
            centerCardsHorizontal();
        });
    }

    if (DOM.btnQuickCenterY) {
        DOM.btnQuickCenterY.addEventListener('click', (e) => {
            e.stopPropagation();
            centerCardsVertical();
        });
    }

    if (DOM.btnQuickCenter) {
        DOM.btnQuickCenter.addEventListener('click', (e) => {
            e.stopPropagation();
            centerCardsBoth();
        });
    }

    if (DOM.btnTogglePaperTheme) {
        DOM.btnTogglePaperTheme.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePaperTheme();
        });
    }

    if (DOM.btnQuickToSettings) {
        DOM.btnQuickToSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.appMode === 'simple') return;
            setMobileView('controls');
        });
    }

    if (DOM.btnQuickDeselect) {
        DOM.btnQuickDeselect.addEventListener('click', (e) => {
            e.stopPropagation();
            deselectCards();
        });
    }

    setupCanvasPointerEvents();

    window.addEventListener('paste', handleGlobalPaste);
    window.addEventListener('keydown', handleGlobalKeydown);
}

// =============================================================================
// 9. CARGA DE ARCHIVOS
// =============================================================================

function setupDropzone(dropzoneEl, inputEl, cardId) {
    dropzoneEl.addEventListener('click', () => inputEl.click());

    inputEl.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (file) loadFileIntoCard(file, cardId);
    });

    dropzoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneEl.classList.add('dragover');
    });

    dropzoneEl.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove('dragover');
    });

    dropzoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove('dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) loadFileIntoCard(file, cardId);
    });
}

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'miaf']);
const HEIC_TO_URLS = [
    'https://cdn.jsdelivr.net/npm/heic-to@1.5.2/dist/iife/heic-to.js',
    'https://unpkg.com/heic-to@1.5.2/dist/iife/heic-to.js'
];
const HEIC2ANY_URLS = [
    'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js'
];
let heicToLoader = null;
let heic2anyLoader = null;

function isHeicFile(file) {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return type.includes('heic') || type.includes('heif')
        || /\.(heic|heif|heics|hif)$/i.test(name);
}

function isSupportedImageFile(file) {
    if (!file) return false;
    if (isHeicFile(file)) return true;
    if ((file.type || '').startsWith('image/')) return true;
    return /\.(jpe?g|jfif|png|webp|gif|bmp|tiff?|avif|heic|heif|hif)$/i.test(file.name || '');
}

function canDecodeHeicNative() {
    const ua = navigator.userAgent;
    return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox|Android/i.test(ua);
}

async function fileLooksLikeHeic(file) {
    if (isHeicFile(file)) return true;
    try {
        const buf = await file.slice(0, 16).arrayBuffer();
        const u8 = new Uint8Array(buf);
        const tag = String.fromCharCode(u8[4], u8[5], u8[6], u8[7]);
        if (tag !== 'ftyp') return false;
        const brand = String.fromCharCode(u8[8], u8[9], u8[10], u8[11]).toLowerCase();
        return HEIC_BRANDS.has(brand);
    } catch (_) {
        return false;
    }
}

function loadImageFromUrl(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (!img.width || !img.height) reject(new Error('decode'));
            else resolve(img);
        };
        img.onerror = () => reject(new Error('decode'));
        img.src = src;
    });
}

function loadScriptOnce(src, isReady) {
    return new Promise((resolve, reject) => {
        if (typeof isReady === 'function' && isReady()) return resolve();
        const existing = document.querySelector(`script[data-cardpdf-src="${src}"]`);
        if (existing) {
            if (typeof isReady === 'function' && isReady()) return resolve();
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('script')));
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.cardpdfSrc = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('script'));
        document.head.appendChild(script);
    });
}

function getHeicToFn() {
    const api = window.HeicTo;
    if (typeof api === 'function') return api;
    if (api && typeof api.heicTo === 'function') return api.heicTo;
    return null;
}

function preloadHeicDecoder() {
    const run = () => { ensureHeicTo().catch(() => {}); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 800);
}

async function ensureHeicTo() {
    const existing = getHeicToFn();
    if (existing) return existing;
    if (heicToLoader) return heicToLoader;
    heicToLoader = (async () => {
        let lastErr = null;
        for (const url of HEIC_TO_URLS) {
            try {
                await loadScriptOnce(url, () => !!getHeicToFn());
                const fn = getHeicToFn();
                if (fn) return fn;
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error('HeicTo');
    })().catch((err) => {
        heicToLoader = null;
        throw err;
    });
    return heicToLoader;
}

async function ensureHeic2Any() {
    if (typeof window.heic2any === 'function') return window.heic2any;
    if (heic2anyLoader) return heic2anyLoader;
    heic2anyLoader = (async () => {
        let lastErr = null;
        for (const url of HEIC2ANY_URLS) {
            try {
                await loadScriptOnce(url, () => typeof window.heic2any === 'function');
                if (typeof window.heic2any === 'function') return window.heic2any;
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error('heic2any');
    })().catch((err) => {
        heic2anyLoader = null;
        throw err;
    });
    return heic2anyLoader;
}

async function jpegBlobFromBitmap(source) {
    const bitmap = await createImageBitmap(source);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    if (bitmap.close) bitmap.close();
    const nativeBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (nativeBlob && nativeBlob.size > 32) return nativeBlob;
    throw new Error('bitmap');
}

async function convertHeicToJpegBlob(file) {
    const blob = file instanceof Blob ? file : new Blob([await file.arrayBuffer()]);

    try {
        return await jpegBlobFromBitmap(blob);
    } catch (_) { /* Chrome/Firefox no decodifican HEIC nativo */ }

    try {
        const HeicTo = await ensureHeicTo();
        const out = await HeicTo({ blob, type: 'image/jpeg', quality: 0.92 });
        if (out) return out;
    } catch (err) {
        console.warn('HEIC HeicTo:', err);
    }

    try {
        const heic2any = await ensureHeic2Any();
        let converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 });
        if (Array.isArray(converted)) converted = converted[0];
        if (converted) return converted;
    } catch (err) {
        console.warn('HEIC heic2any:', err);
    }

    throw new Error('heic');
}

function applyLoadedImage(img, cardId) {
    const card = STATE.cards[cardId];
    card.rawImage = img;
    card.croppedCanvas = null;
    card.cachedCanvas = null;
    card.dirty = true;

    updateDropzoneUI(cardId, img.src);
    setActiveTab(cardId);
    openCropModal(cardId, { autoDetect: true, defaultMode: 'quad' });

    if (window.innerWidth < 1024) {
        setMobileView('canvas');
    }
    if (cardId === 'dorso' || hasDorsoImage()) dismissDorsoPrompt();
}

async function loadFileIntoCard(file, cardId) {
    if (!file) return;

    const looksHeic = await fileLooksLikeHeic(file);
    if (!looksHeic && !isSupportedImageFile(file)) {
        showToast(t('badImage'), 'warning');
        return;
    }

    try {
        try {
            const img = await loadImageFromUrl(URL.createObjectURL(file));
            applyLoadedImage(img, cardId);
            if (cardId === 'dorso' || hasDorsoImage()) dismissDorsoPrompt();
            return;
        } catch (_) { /* HEIC en Chrome/Firefox no se abre nativo */ }

        showToast(t('readingHeic'), 'info');
        const jpeg = await convertHeicToJpegBlob(file);
        const img = await loadImageFromUrl(URL.createObjectURL(jpeg));
        applyLoadedImage(img, cardId);
        if (cardId === 'dorso' || hasDorsoImage()) dismissDorsoPrompt();
    } catch (err) {
        console.error('Carga de imagen:', err);
        showToast(looksHeic
            ? 'No se pudo leer el HEIC. Recarga e intenta otra vez.'
            : 'No se pudo abrir esa imagen.', 'error');
    }
}

function updateDropzoneUI(cardId, src) {
    const isFrente = cardId === 'frente';
    const previewWrap = isFrente ? DOM.frentePreviewWrap : DOM.dorsoPreviewWrap;
    const placeholder = isFrente ? DOM.frentePlaceholder : DOM.dorsoPlaceholder;
    const imgEl = isFrente ? DOM.frenteImg : DOM.dorsoImg;
    const dropzone = isFrente ? DOM.dropzoneFrente : DOM.dropzoneDorso;
    const actions = isFrente ? DOM.frenteActions : DOM.dorsoActions;

    if (src) {
        imgEl.src = src;
        previewWrap.classList.remove('hidden');
        placeholder.classList.add('hidden');
        dropzone.classList.add('has-file');
        actions.style.display = 'flex';
    } else {
        imgEl.src = '';
        previewWrap.classList.add('hidden');
        placeholder.classList.remove('hidden');
        dropzone.classList.remove('has-file');
        actions.style.display = 'none';
    }

    updateEmptyStateVisibility();
}

function removeCard(cardId) {
    const card = STATE.cards[cardId];
    card.rawImage = null;
    card.croppedCanvas = null;
    card.cropRect = null;
    card.cachedCanvas = null;
    card.dirty = true;

    if (cardId === 'frente') {
        if (DOM.frenteInput) DOM.frenteInput.value = '';
        if (DOM.frenteCameraInput) DOM.frenteCameraInput.value = '';
    } else {
        if (DOM.dorsoInput) DOM.dorsoInput.value = '';
        if (DOM.dorsoCameraInput) DOM.dorsoCameraInput.value = '';
    }

    updateDropzoneUI(cardId, null);
    if (STATE.selectedCardId === cardId) STATE.selectedCardId = null;

    updateEmptyStateVisibility();
    saveHistoryState(`Eliminar ${card.name}`);
    scheduleRender();
    showToast(t('cardRemoved', { name: card.name }), 'info');
}

function rotateCard(cardId, angleDeg = 90) {
    if (cardId === 'both' || STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        const f = STATE.cards.frente;
        const d = STATE.cards.dorso;
        if (f.rawImage) rotateSingleCard('frente', angleDeg);
        if (d.rawImage) rotateSingleCard('dorso', angleDeg);
        syncControlsFromActiveCard();
        saveHistoryState(`Rotar Ambos ${angleDeg}°`);
        scheduleRender();
        showToast(t('rotatedBoth', { deg: angleDeg }), 'info');
        return;
    }
    rotateSingleCard(cardId, angleDeg);
    syncControlsFromActiveCard();
    saveHistoryState(`Rotar ${STATE.cards[cardId].name} ${angleDeg}°`);
    scheduleRender();
    showToast(t('rotatedOne', { name: STATE.cards[cardId].name }), 'info');
}

function rotateSingleCard(cardId, angleDeg = 90) {
    const card = STATE.cards[cardId];
    if (!card || !card.rawImage) return;

    card.rotation = (card.rotation + angleDeg) % 360;
    if (angleDeg === 90 || angleDeg === 270) {
        const temp = card.widthMm;
        card.widthMm = card.heightMm;
        card.heightMm = temp;
    }

    card.dirty = true;
}

function swapCards() {
    if (!STATE.cards.frente.rawImage && !STATE.cards.dorso.rawImage) {
        showToast(t('swapNeed'), 'warning');
        return;
    }

    const f = STATE.cards.frente;
    const d = STATE.cards.dorso;

    const tempRaw = f.rawImage;
    const tempCropped = f.croppedCanvas;
    const tempCropRect = f.cropRect;
    const tempRotation = f.rotation;
    const tempFilter = f.filter;
    const tempBrightness = f.brightness;
    const tempContrast = f.contrast;
    const tempW = f.widthMm;
    const tempH = f.heightMm;

    f.rawImage = d.rawImage;
    f.croppedCanvas = d.croppedCanvas;
    f.cropRect = d.cropRect;
    f.rotation = d.rotation;
    f.filter = d.filter;
    f.brightness = d.brightness;
    f.contrast = d.contrast;
    f.widthMm = d.widthMm;
    f.heightMm = d.heightMm;
    f.dirty = true;

    d.rawImage = tempRaw;
    d.croppedCanvas = tempCropped;
    d.cropRect = tempCropRect;
    d.rotation = tempRotation;
    d.filter = tempFilter;
    d.brightness = tempBrightness;
    d.contrast = tempContrast;
    d.widthMm = tempW;
    d.heightMm = tempH;
    d.dirty = true;

    updateDropzoneUI('frente', f.rawImage ? f.rawImage.src : null);
    updateDropzoneUI('dorso', d.rawImage ? d.rawImage.src : null);

    saveHistoryState('Intercambiar Frente y Dorso');
    scheduleRender();
    showToast(t('swapped'), 'success');
}

function handleGlobalPaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (!STATE.cards.frente.rawImage) {
                loadFileIntoCard(blob, 'frente');
            } else if (!STATE.cards.dorso.rawImage) {
                loadFileIntoCard(blob, 'dorso');
            } else {
                const targetId = (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') ? 'frente' : STATE.activeCardId;
                loadFileIntoCard(blob, targetId);
            }
            break;
        }
    }
}

function isBlockingModalOpen() {
    return (DOM.cropModal && !DOM.cropModal.classList.contains('hidden'))
        || (DOM.cameraModal && !DOM.cameraModal.classList.contains('hidden'));
}

function deselectCards() {
    if (!STATE.selectedCardId) {
        if (DOM.canvasQuickBar) DOM.canvasQuickBar.classList.add('hidden');
        if (hasFrenteImage() && !hasDorsoImage()) showDorsoPrompt();
        return;
    }
    STATE.selectedCardId = null;
    if (DOM.selectedCardIndicator) DOM.selectedCardIndicator.textContent = t('dragToMove');
    syncControlsFromActiveCard();
    scheduleRender();
    if (hasFrenteImage() && !hasDorsoImage()) showDorsoPrompt();
}

function handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
        if (isBlockingModalOpen()) return;
        const panel = DOM.panelCanvas || document.getElementById('panel-canvas');
        if (panel && panel.classList.contains('canvas-fullscreen')) {
            e.preventDefault();
            toggleCanvasFullscreen(false);
            return;
        }
        if (STATE.selectedCardId) {
            e.preventDefault();
            deselectCards();
        }
        return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.key === '-')) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
        e.preventDefault();
        changeZoom(e.key === '-' ? -0.1 : 0.1);
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
        e.preventDefault();
        resetZoomTo100();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
    }

    if (STATE.selectedCardId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const targetCards = (STATE.selectedCardId === 'both')
            ? [STATE.cards.frente, STATE.cards.dorso]
            : [STATE.cards[STATE.selectedCardId]];

        targetCards.forEach(card => {
            if (e.key === 'ArrowUp') card.yMm -= step;
            if (e.key === 'ArrowDown') card.yMm += step;
            if (e.key === 'ArrowLeft') card.xMm -= step;
            if (e.key === 'ArrowRight') card.xMm += step;
        });

        syncControlsFromActiveCard();
        scheduleRender();
        return;
    }

    if (STATE.selectedCardId && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (document.activeElement.tagName !== 'INPUT') {
            if (STATE.selectedCardId === 'both') {
                removeCard('frente');
                removeCard('dorso');
            } else {
                removeCard(STATE.selectedCardId);
            }
        }
    }
}

// =============================================================================
// 10. CONTROLES Y SINCRONIZACIÓN REACTIVA
// =============================================================================

function editingBothCards() {
    return STATE.activeCardId === 'both' || STATE.selectedCardId === 'both';
}

function setActiveTab(cardId) {
    STATE.activeCardId = cardId;
    STATE.selectedCardId = cardId;

    const inactiveClass = 'flex-1 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 transition-all';
    const activeClass = 'flex-1 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 transition-all';

    if (DOM.tabBtnFrente) DOM.tabBtnFrente.className = (cardId === 'frente') ? activeClass : inactiveClass;
    if (DOM.tabBtnDorso) DOM.tabBtnDorso.className = (cardId === 'dorso') ? activeClass : inactiveClass;
    if (DOM.tabBtnBoth) DOM.tabBtnBoth.className = (cardId === 'both') ? activeClass : inactiveClass;

    updateCopyButtonVisibility();
    syncControlsFromActiveCard();
    scheduleRender();
}

function updateCopyButtonVisibility() {
    if (!DOM.btnCopyToOther) return;
    const hide = STATE.syncCards || editingBothCards();
    DOM.btnCopyToOther.classList.toggle('hidden', hide);
    DOM.btnCopyToOther.classList.toggle('flex', !hide);
}

function applyToActiveCards(mutator, options) {
    const mirror = !!(options && options.mirror && STATE.syncCards);
    if (editingBothCards()) {
        mutator(STATE.cards.frente, 'frente');
        mutator(STATE.cards.dorso, 'dorso');
        return;
    }
    const id = STATE.activeCardId === 'dorso' ? 'dorso' : 'frente';
    mutator(STATE.cards[id], id);
    if (mirror) {
        const otherId = id === 'frente' ? 'dorso' : 'frente';
        mutator(STATE.cards[otherId], otherId);
    }
}

function syncControlsFromActiveCard() {
    if (hasDorsoImage()) dismissDorsoPrompt();
    const isBoth = (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both');
    const card = (STATE.activeCardId === 'dorso' && !isBoth) ? STATE.cards.dorso : STATE.cards.frente;

    DOM.cardScaleRange.value = card.scale;
    DOM.cardScaleNum.value = card.scale;
    DOM.cardXRange.value = card.xMm;
    DOM.cardXNum.value = card.xMm;
    DOM.cardYRange.value = card.yMm;
    DOM.cardYNum.value = card.yMm;
    DOM.cardRadiusRange.value = card.borderRadiusMm;
    if (DOM.cardRadiusNum) DOM.cardRadiusNum.value = card.borderRadiusMm;
    DOM.cardBrightnessRange.value = card.brightness;
    if (DOM.cardBrightnessNum) DOM.cardBrightnessNum.value = card.brightness;
    DOM.cardContrastRange.value = card.contrast;
    if (DOM.cardContrastNum) DOM.cardContrastNum.value = card.contrast;
    if (DOM.cardRotationLabel) DOM.cardRotationLabel.textContent = `${card.rotation || 0}°`;

    const currentW = (card.widthMm * card.scale / 100).toFixed(1);
    const currentH = (card.heightMm * card.scale / 100).toFixed(1);
    DOM.activeCardDimensions.textContent = isBoth 
        ? `(Ambos: ~${currentW} × ${currentH} mm)` 
        : `(${currentW} × ${currentH} mm)`;

    DOM.filterPresetBtns.forEach(btn => {
        let targetFilter = card.filter;
        if (targetFilter === 'scan') targetFilter = 'sharp_scan';
        if (targetFilter === 'bw') targetFilter = 'photocopy';

        if (btn.dataset.filter === targetFilter) {
            btn.className = 'filter-preset-btn min-h-[32px] py-1 px-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center gap-0.5 transition-all shadow-sm';
        } else {
            btn.className = 'filter-preset-btn min-h-[32px] py-1 px-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex flex-col items-center justify-center gap-0.5 transition-all';
        }
    });
    updateCopyButtonVisibility();

    if (STATE.selectedCardId === 'both') {
        DOM.selectedCardIndicator.textContent = t('editingBoth');
    } else if (STATE.selectedCardId) {
        DOM.selectedCardIndicator.textContent = t('editingCard', { name: STATE.cards[STATE.selectedCardId].name });
    } else {
        DOM.selectedCardIndicator.textContent = t('dragToMove');
    }

    // Barra Rápida: solo visible si hay un carnet seleccionado en el lienzo
    if (DOM.canvasQuickBar) {
        const hasAnyImage = !!(STATE.cards.frente.rawImage || STATE.cards.dorso.rawImage);
        const barOpen = !!(STATE.selectedCardId && hasAnyImage);
        const isMobile = window.innerWidth < 1024;
        if (barOpen) {
            DOM.canvasQuickBar.classList.remove('hidden');
            if (isMobile || hasDorsoImage()) dismissDorsoPrompt();
            if (DOM.quickCardBadge) {
                DOM.quickCardBadge.textContent = STATE.selectedCardId === 'both'
                    ? t('both')
                    : STATE.selectedCardId === 'dorso' ? t('back') : t('front');
            }
            if (DOM.quickSelectBothLabel) {
                DOM.quickSelectBothLabel.textContent = isBoth ? t('onlyOne') : t('both');
            }
            if (DOM.quickScaleLabel) {
                DOM.quickScaleLabel.textContent = `${card.scale}%`;
            }
        } else {
            DOM.canvasQuickBar.classList.add('hidden');
        }
        const quickBarWasOpen = document.body.classList.contains('quick-bar-open');
        document.body.classList.toggle('quick-bar-open', barOpen && isMobile);
        // La clase cambia el hueco de la hoja (reserva sitio para la barra).
        // Sin recalcular, la hoja se quedaba con el tamano del estado anterior:
        // p. ej. chica tras aplicar un recorte, cuando la barra ya se cerro.
        if (quickBarWasOpen !== (barOpen && isMobile)) {
            resizeCanvasViewport();
            scheduleRender();
        }
    }

    updateDefaultConfigBadge();
}

function centerCardsHorizontal() {
    const isBoth = editingBothCards();
    if (isBoth) {
        STATE.cards.frente.xMm = 0;
        STATE.cards.dorso.xMm = 0;
    } else {
        const id = STATE.selectedCardId || STATE.activeCardId || 'frente';
        STATE.cards[id].xMm = 0;
    }
    syncControlsFromActiveCard();
    saveHistoryState('Centrar Horizontalmente (X=0)');
    scheduleRender();
    showToast(t('centeredX'), 'success', 'flipH');
}

function centerCardsVertical() {
    const isBoth = editingBothCards();
    if (isBoth) {
        if (STATE.layout.arrange === 'horizontal') {
            STATE.cards.frente.yMm = 0;
            STATE.cards.dorso.yMm = 0;
        } else {
            STATE.cards.frente.yMm = FACTORY_DEFAULTS.cards.frente.yMm;
            STATE.cards.dorso.yMm = FACTORY_DEFAULTS.cards.dorso.yMm;
        }
    } else {
        const id = STATE.selectedCardId || STATE.activeCardId || 'frente';
        STATE.cards[id].yMm = (STATE.layout.mode === 'single' ? 0 : FACTORY_DEFAULTS.cards[id].yMm);
    }
    syncControlsFromActiveCard();
    saveHistoryState('Centrar Verticalmente (Eje Y)');
    scheduleRender();
    showToast(t('centeredY'), 'success', 'flipV');
}

function centerCardsBoth() {
    const isBoth = editingBothCards();
    if (isBoth) {
        STATE.cards.frente.xMm = 0;
        STATE.cards.dorso.xMm = 0;
        if (STATE.layout.arrange === 'horizontal') {
            STATE.cards.frente.yMm = 0;
            STATE.cards.dorso.yMm = 0;
        } else {
            STATE.cards.frente.yMm = FACTORY_DEFAULTS.cards.frente.yMm;
            STATE.cards.dorso.yMm = FACTORY_DEFAULTS.cards.dorso.yMm;
        }
    } else {
        const id = STATE.selectedCardId || STATE.activeCardId || 'frente';
        STATE.cards[id].xMm = 0;
        STATE.cards[id].yMm = (STATE.layout.mode === 'single' ? 0 : FACTORY_DEFAULTS.cards[id].yMm);
    }
    syncControlsFromActiveCard();
    saveHistoryState('Centrar Ambos Ejes (X/Y)');
    scheduleRender();
    showToast(t('centeredXY'), 'success', 'target');
}

function centerCard(cardId) {
    centerCardsBoth();
}

function toggleSelectBoth() {
    if (STATE.selectedCardId === 'both' || STATE.activeCardId === 'both') {
        STATE.selectedCardId = 'frente';
        setActiveTab('frente');
        showToast(t('editingFrontOnly'), 'info');
    } else {
        STATE.selectedCardId = 'both';
        setActiveTab('both');
        showToast(t('bothSelected'), 'info', 'cards');
    }
}

function setupCardControls() {
    // Escala
    const onScaleChange = (val) => {
        applyToActiveCards((c) => { c.scale = val; }, { mirror: true });
        syncControlsFromActiveCard();
        scheduleRender();
    };

    DOM.cardScaleRange.addEventListener('input', (e) => onScaleChange(parseFloat(e.target.value)));
    DOM.cardScaleNum.addEventListener('input', (e) => onScaleChange(Math.min(180, Math.max(30, parseFloat(e.target.value) || 70))));

    // Posición X
    const onXChange = (val) => {
        applyToActiveCards((c) => { c.xMm = val; });
        scheduleRender();
    };
    DOM.cardXRange.addEventListener('input', (e) => onXChange(parseFloat(e.target.value)));
    DOM.cardXNum.addEventListener('input', (e) => onXChange(parseFloat(e.target.value) || 0));

    // Posición Y
    const onYChange = (val) => {
        applyToActiveCards((c) => { c.yMm = val; });
        scheduleRender();
    };
    DOM.cardYRange.addEventListener('input', (e) => onYChange(parseFloat(e.target.value)));
    DOM.cardYNum.addEventListener('input', (e) => onYChange(parseFloat(e.target.value) || 0));

    // Alineaciones
    if (DOM.btnAlignCenterBoth) {
        DOM.btnAlignCenterBoth.addEventListener('click', centerCardsBoth);
    }
    if (DOM.btnAlignCenterX) {
        DOM.btnAlignCenterX.addEventListener('click', centerCardsHorizontal);
    }
    if (DOM.btnAlignCenterY) {
        DOM.btnAlignCenterY.addEventListener('click', centerCardsVertical);
    }

    // Rotación y Volteo
    if (DOM.btnRotateActive90) {
        DOM.btnRotateActive90.addEventListener('click', () => rotateCard(STATE.activeCardId, 90));
    }
    if (DOM.btnFlipH) {
        DOM.btnFlipH.addEventListener('click', () => flipCard(STATE.activeCardId, 'h'));
    }
    if (DOM.btnFlipV) {
        DOM.btnFlipV.addEventListener('click', () => flipCard(STATE.activeCardId, 'v'));
    }
    if (DOM.btnResetActiveCard) {
        DOM.btnResetActiveCard.addEventListener('click', resetActiveCardAdjustments);
    }

    // Esquinas Redondeadas con Input Numérico y Reset
    DOM.cardRadiusRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        applyToActiveCards((c) => { c.borderRadiusMm = val; }, { mirror: true });
        if (DOM.cardRadiusNum) DOM.cardRadiusNum.value = val;
        scheduleRender();
    });

    if (DOM.cardRadiusNum) {
        DOM.cardRadiusNum.addEventListener('input', (e) => {
            const val = Math.min(15, Math.max(0, parseFloat(e.target.value) || 0));
            applyToActiveCards((c) => { c.borderRadiusMm = val; }, { mirror: true });
            DOM.cardRadiusRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetRadius) {
        DOM.btnResetRadius.addEventListener('click', () => {
            applyToActiveCards((c, id) => {
                c.borderRadiusMm = FACTORY_DEFAULTS.cards[id].borderRadiusMm;
            }, { mirror: true });
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    // Filtros Presets
    DOM.filterPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterMode = btn.dataset.filter;
            applyToActiveCards((c) => {
                c.filter = filterMode;
                c.dirty = true;
            }, { mirror: true });
            syncControlsFromActiveCard();
            const filterNames = {
                normal: t('filterOriginal'),
                magic: t('filterMagic'),
                portrait: t('filterPortrait'),
                sharp_scan: t('filterSharp'),
                photocopy: t('filterCopy'),
                contrast_bw: t('filterBw')
            };
            showToast(t('filterApplied', { name: filterNames[filterMode] || filterMode }), 'info');
            saveHistoryState(`Filtro ${filterNames[filterMode] || filterMode}`);
            scheduleRender();
        });
    });

    // Brillo con Input Numérico y Reset
    DOM.cardBrightnessRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        applyToActiveCards((c) => {
            c.brightness = val;
            c.dirty = true;
        }, { mirror: true });
        if (DOM.cardBrightnessNum) DOM.cardBrightnessNum.value = val;
        scheduleRender();
    });

    if (DOM.cardBrightnessNum) {
        DOM.cardBrightnessNum.addEventListener('input', (e) => {
            const val = Math.min(50, Math.max(-50, parseInt(e.target.value, 10) || 0));
            applyToActiveCards((c) => {
                c.brightness = val;
                c.dirty = true;
            }, { mirror: true });
            DOM.cardBrightnessRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetBrightness) {
        DOM.btnResetBrightness.addEventListener('click', () => {
            applyToActiveCards((c) => {
                c.brightness = 0;
                c.dirty = true;
            }, { mirror: true });
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    // Contraste con Input Numérico y Reset
    DOM.cardContrastRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        applyToActiveCards((c) => {
            c.contrast = val;
            c.dirty = true;
        }, { mirror: true });
        if (DOM.cardContrastNum) DOM.cardContrastNum.value = val;
        scheduleRender();
    });

    if (DOM.cardContrastNum) {
        DOM.cardContrastNum.addEventListener('input', (e) => {
            const val = Math.min(50, Math.max(-50, parseInt(e.target.value, 10) || 0));
            applyToActiveCards((c) => {
                c.contrast = val;
                c.dirty = true;
            }, { mirror: true });
            DOM.cardContrastRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetContrast) {
        DOM.btnResetContrast.addEventListener('click', () => {
            applyToActiveCards((c) => {
                c.contrast = 0;
                c.dirty = true;
            }, { mirror: true });
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }
}

function copyActiveCardSettingsToOther() {
    const srcId = (STATE.activeCardId === 'dorso') ? 'dorso' : 'frente';
    const otherId = srcId === 'frente' ? 'dorso' : 'frente';
    const current = STATE.cards[srcId];
    const other = STATE.cards[otherId];

    other.scale = current.scale;
    other.xMm = current.xMm;
    other.borderRadiusMm = current.borderRadiusMm;
    other.filter = current.filter;
    other.brightness = current.brightness;
    other.contrast = current.contrast;
    other.rotation = current.rotation;
    other.flipH = current.flipH;
    other.flipV = current.flipV;
    other.dirty = true;

    saveHistoryState(`Copiar ajustes a ${other.name}`);
    scheduleRender();
    showToast(t('copiedTo', { from: current.name, to: other.name }), 'success');
}

function applyCr80Preset() {
    applyToActiveCards((card) => {
        card.widthMm = 85.6;
        card.heightMm = 53.98;
        card.scale = 100;
        card.borderRadiusMm = 3.18;
    }, { mirror: true });

    syncControlsFromActiveCard();
    saveHistoryState('Aplicar Estándar CR80');
    scheduleRender();
    showToast(t('cr80Applied'), 'success');
}

function setOrientation(orientation) {
    if (STATE.paper.orientation === orientation) return;
    STATE.paper.orientation = orientation;

    if (orientation === 'portrait') {
        DOM.btnOrientPortrait.className = 'py-0.5 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-300';
        DOM.btnOrientLandscape.className = 'py-0.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-400';
    } else {
        DOM.btnOrientLandscape.className = 'py-0.5 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-300';
        DOM.btnOrientPortrait.className = 'py-0.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-400';
    }

    setupPaperDimensions();
    resizeCanvasViewport();
    saveHistoryState(`Orientación ${orientation}`);
    scheduleRender();
}

function resetAllDefaults() {
    const hasCustom = !!localStorage.getItem('cardpdf-custom-defaults');
    if (hasCustom) {
        localStorage.removeItem('cardpdf-custom-defaults');
    }

    ['frente', 'dorso'].forEach(k => {
        const card = STATE.cards[k];
        card.rawImage = null;
        card.croppedCanvas = null;
        card.cachedCanvas = null;
        card.cropRect = null;
        card.cropQuad = null;
        card.widthMm = 85.6;
        card.heightMm = 53.98;
        card.scale = 150;
        card.xMm = 0;
        card.yMm = (k === 'frente' ? 21 : -8);
        card.rotation = 0;
        card.flipH = false;
        card.flipV = false;
        card.borderRadiusMm = 5;
        card.filter = 'normal';
        card.brightness = 0;
        card.contrast = 0;
        card.dirty = true;
    });

    if (DOM.frenteInput) DOM.frenteInput.value = '';
    if (DOM.dorsoInput) DOM.dorsoInput.value = '';
    if (DOM.frenteCameraInput) DOM.frenteCameraInput.value = '';
    if (DOM.dorsoCameraInput) DOM.dorsoCameraInput.value = '';

    updateDropzoneUI('frente', null);
    updateDropzoneUI('dorso', null);

    STATE.selectedCardId = null;
    STATE.activeCardId = 'frente';

    if (DOM.canvasQuickBar) DOM.canvasQuickBar.classList.add('hidden');
    if (DOM.bannerScanDorso) DOM.bannerScanDorso.classList.add('hidden');

    Object.assign(STATE.paper, FACTORY_DEFAULTS.paper);
    Object.assign(STATE.layout, FACTORY_DEFAULTS.layout);
    STATE.syncCards = FACTORY_DEFAULTS.syncCards;

    setupPaperDimensions();
    updateUIFromState();
    updateEmptyStateVisibility();
    saveHistoryState('Reiniciar aplicación');
    scheduleRender();
    showToast(t('appReset'), 'info');
}

function updateUIFromState() {
    DOM.layoutModeSelect.value = STATE.layout.mode;
    DOM.layoutArrangeSelect.value = STATE.layout.arrange;
    DOM.paperSizeSelect.value = STATE.paper.size;
    DOM.checkCutLines.checked = STATE.layout.showCutLines;
    DOM.checkCardBorder.checked = STATE.layout.showBorder;
    DOM.checkSyncCards.checked = STATE.syncCards;
    if (DOM.exportFormatSelect) DOM.exportFormatSelect.value = STATE.exportFormat;
    if (DOM.exportDpiSelect) DOM.exportDpiSelect.value = String(STATE.exportDpi);
    if (DOM.checkExportLight) DOM.checkExportLight.checked = !!STATE.exportLight;
    if (DOM.exportFilename) DOM.exportFilename.value = STATE.exportName || '';
    updateExportOptionsUI();
    setActiveTab(STATE.activeCardId);
    syncControlsFromActiveCard();
}

// =============================================================================
// 11. PROCESAMIENTO DE IMAGEN (Offscreen Cache)
// =============================================================================

function processCardImage(card) {
    const sourceImg = card.croppedCanvas || card.rawImage;
    if (!sourceImg) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const isSideways = card.rotation === 90 || card.rotation === 270;
    const srcW = sourceImg.width;
    const srcH = sourceImg.height;

    canvas.width = isSideways ? srcH : srcW;
    canvas.height = isSideways ? srcW : srcH;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((card.rotation * Math.PI) / 180);
    ctx.scale(card.flipH ? -1 : 1, card.flipV ? -1 : 1);
    ctx.drawImage(sourceImg, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();

    if (card.filter !== 'normal' || card.brightness !== 0 || card.contrast !== 0) {
        applyPixelFilters(ctx, canvas.width, canvas.height, card.filter, card.brightness, card.contrast);
    }

    card.cachedCanvas = canvas;
    card.dirty = false;
    return canvas;
}

function applyPixelFilters(ctx, width, height, filterType, brightness, contrast) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    const totalPixels = width * height;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    // Compatibilidad hacia atrás para plantillas existentes
    let mode = filterType;
    if (mode === 'scan') mode = 'sharp_scan';
    if (mode === 'bw') mode = 'photocopy';

    // Para filtros que requieren estiramiento de histograma o auto-niveles (magic, sharp_scan, contrast_bw)
    let minLum = 0;
    let maxLum = 255;
    if (mode === 'magic' || mode === 'sharp_scan' || mode === 'contrast_bw') {
        const hist = new Uint32Array(256);
        let sampleCount = 0;
        const step = Math.max(1, Math.floor(totalPixels / 15000));
        for (let i = 0; i < d.length; i += 4 * step) {
            const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
            hist[l]++;
            sampleCount++;
        }

        let acc = 0;
        const lowCut = sampleCount * 0.03;
        const highCut = sampleCount * 0.96;
        for (let j = 0; j < 256; j++) {
            acc += hist[j];
            if (minLum === 0 && acc >= lowCut) minLum = j;
            if (acc >= highCut) { maxLum = j; break; }
        }
        if (maxLum <= minLum + 20) {
            minLum = 10;
            maxLum = 245;
        }
    }

    const lumRange = Math.max(1, maxLum - minLum);

    // Buffer para máscara de enfoque espacial en 'sharp_scan' y 'magic'
    let origData = null;
    if (mode === 'sharp_scan' || mode === 'magic') {
        origData = new Uint8ClampedArray(d);
    }

    for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (mode === 'magic') {
            // 1. Color Mágico: Blanqueamiento inteligente de fondo + realce de color
            const normLum = Math.min(255, Math.max(0, ((lum - minLum) / lumRange) * 255));
            const lumRatio = lum > 0 ? normLum / lum : 1;
            const whiten = lum > maxLum * 0.84 ? 1.12 : 1.0;
            r = Math.min(255, r * lumRatio * whiten);
            g = Math.min(255, g * lumRatio * whiten);
            b = Math.min(255, b * lumRatio * whiten);

            // Realce de saturación selectiva para sellos, escudos y texto
            const newLum = 0.299 * r + 0.587 * g + 0.114 * b;
            r = newLum + (r - newLum) * 1.25;
            g = newLum + (g - newLum) * 1.25;
            b = newLum + (b - newLum) * 1.25;

        } else if (mode === 'portrait') {
            // 2. Retrato Vívido: Optimizado para fotografía facial en credenciales
            const midBoost = Math.sin((lum / 255) * Math.PI) * 14;
            r = r + midBoost + 4;
            g = g + midBoost + 2;
            b = b + (midBoost * 0.6) - 1;

            const pLum = 0.299 * r + 0.587 * g + 0.114 * b;
            r = pLum + (r - pLum) * 1.14;
            g = pLum + (g - pLum) * 1.14;
            b = pLum + (b - pLum) * 1.14;

        } else if (mode === 'sharp_scan') {
            // 3. Texto Nítido: Máximo contraste tipográfico y microtextos limpios
            const normLum = Math.min(255, Math.max(0, ((lum - minLum) / lumRange) * 255));
            if (normLum > 185) {
                const boost = 1 + (normLum - 185) / 140;
                r = Math.min(255, r * boost);
                g = Math.min(255, g * boost);
                b = Math.min(255, b * boost);
            } else if (normLum < 110) {
                const dip = normLum / 110;
                r = r * dip * 0.9;
                g = g * dip * 0.9;
                b = b * dip * 0.9;
            }

        } else if (mode === 'photocopy') {
            // 4. Fotocopia B/N: Escala de grises calibrada para impresión formal de cédulas
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            let tone = gray;
            if (gray < 128) {
                tone = Math.pow(gray / 128, 1.2) * 128;
            } else {
                tone = 128 + Math.pow((gray - 128) / 127, 0.9) * 127;
            }
            r = g = b = tone;

        } else if (mode === 'contrast_bw') {
            // 5. B/N Puro: Binarización limpia sin grises ni reflejos de plástico
            const threshold = (minLum + maxLum) * 0.48;
            const bin = lum < threshold ? 0 : 255;
            r = g = b = bin;
        }

        // Ajustes manuales del usuario (Brillo)
        if (brightness !== 0) {
            const bDelta = brightness * 2;
            r += bDelta;
            g += bDelta;
            b += bDelta;
        }

        // Ajustes manuales del usuario (Contraste)
        if (contrast !== 0) {
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;
        }

        d[i] = Math.min(255, Math.max(0, r));
        d[i + 1] = Math.min(255, Math.max(0, g));
        d[i + 2] = Math.min(255, Math.max(0, b));
    }

    // Paso de convolución espacial para Nitidez (Laplacian unsharp mask)
    if (origData && (mode === 'sharp_scan' || mode === 'magic')) {
        const sharpenWeight = mode === 'sharp_scan' ? 0.35 : 0.22;
        for (let y = 1; y < height - 1; y++) {
            const rowOffset = y * width;
            for (let x = 1; x < width - 1; x++) {
                const idx = (rowOffset + x) * 4;
                const topIdx = ((y - 1) * width + x) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;
                const leftIdx = (rowOffset + x - 1) * 4;
                const rightIdx = (rowOffset + x + 1) * 4;

                for (let c = 0; c < 3; c++) {
                    const center = origData[idx + c];
                    const laplacian = 4 * center - origData[topIdx + c] - origData[bottomIdx + c] - origData[leftIdx + c] - origData[rightIdx + c];
                    d[idx + c] = Math.min(255, Math.max(0, d[idx + c] + laplacian * sharpenWeight));
                }
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

// =============================================================================
// 12. MOTOR DE RENDERIZADO CANVAS A 60 FPS
// =============================================================================

function scheduleRender() {
    if (hasDorsoImage()) dismissDorsoPrompt();
    if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(renderLoop);
    }
    debouncedTelemetrySync();
}

function resizeCanvasViewport() {
    const container = DOM.viewportContainer;
    if (!container) return;

    const isMobile = window.innerWidth < 1024;
    const measureEl = getViewportScroller() || container;

    const cWidth = measureEl.clientWidth || container.clientWidth || (isMobile ? window.innerWidth - 12 : 800);
    const cHeight = measureEl.clientHeight || container.clientHeight || (isMobile ? window.innerHeight - 200 : 700);

    const toolbar = document.getElementById('canvas-toolbar');
    const footer = document.getElementById('canvas-footer');

    const toolbarH = toolbar ? Math.ceil(toolbar.getBoundingClientRect().height) : (isMobile ? 40 : 44);
    const footerVisible = footer && getComputedStyle(footer).display !== 'none';
    const footerH = footerVisible ? Math.ceil(footer.getBoundingClientRect().height) : (isMobile ? 40 : 36);
    const paddingX = isMobile ? 20 : 28;
    const paddingY = toolbarH + footerH + (isMobile ? 36 : 32);
    let availWidth = Math.max(80, cWidth - paddingX);
    let availHeight = Math.max(100, cHeight - paddingY);

    // Movil: se mide el hueco real en vez de restar alturas a ojo.
    // La barra rapida entra sola en la medida: reserva su sitio por CSS
    // (body.quick-bar-open), y syncControlsFromActiveCard vuelve a llamar aqui
    // cada vez que esa clase cambia.
    // Antes se restaban la barra de arriba y 12px de "area segura", que ya
    // estan fuera del contenedor, y 72px de barra rapida aunque no estuviera
    // abierta. La hoja quedaba en el 40-60% del hueco en un iPhone chico, y
    // el zoom de arranque al 85% lo tapaba solo para un tamano de pantalla.
    const box = measureEl.getBoundingClientRect();
    if (isMobile && box.height > 50) {
        const stage = document.getElementById('viewport-stage');
        const cs = stage ? getComputedStyle(stage) : null;
        const boxTop = box.top + (cs ? parseFloat(cs.paddingTop) || 0 : 0);
        const boxBottom = box.bottom - (cs ? parseFloat(cs.paddingBottom) || 0 : 0);

        let topLimit = boxTop;
        let bottomLimit = boxBottom;
        if (toolbar && getComputedStyle(toolbar).display !== 'none') {
            topLimit = Math.max(topLimit, toolbar.getBoundingClientRect().bottom);
        }
        if (footerVisible) {
            bottomLimit = Math.min(bottomLimit, footer.getBoundingClientRect().top);
        }
        // La reserva de CSS para la barra rapida es fija (132px) pero la barra
        // mide lo que midan sus botones: se usa su borde real.
        const quickBar = DOM.canvasQuickBar;
        if (quickBar && document.body.classList.contains('quick-bar-open')
            && getComputedStyle(quickBar).display !== 'none') {
            bottomLimit = Math.min(bottomLimit, quickBar.getBoundingClientRect().top);
        }

        // La hoja va centrada en la caja del stage: cabe lo que permita el
        // lado mas estrecho respecto al centro, no la suma de los dos.
        const center = (boxTop + boxBottom) / 2;
        const halfFree = Math.min(center - topLimit, bottomLimit - center);
        const margin = 12;
        availWidth = Math.max(80, cWidth - 2 * margin);
        availHeight = Math.max(100, 2 * halfFree - 2 * margin);
    }

    const sheetAspect = STATE.paper.heightMm / STATE.paper.widthMm;

    let displayWidth, displayHeight;

    if (isMobile) {
        displayWidth = availWidth;
        displayHeight = displayWidth * sheetAspect;

        if (displayHeight > availHeight && availHeight > 150) {
            displayHeight = availHeight;
            displayWidth = displayHeight / sheetAspect;
        }

        const maxAllowed = Math.min(container.clientWidth - 2, window.innerWidth - 6);
        if (displayWidth > maxAllowed) {
            displayWidth = maxAllowed;
            displayHeight = displayWidth * sheetAspect;
        }
    } else {
        // EN ESCRITORIO: Maximizar tamaño dentro del contenedor disponible sin tope artificial
        // Primero ajustamos para aprovechar toda la altura disponible
        displayHeight = availHeight;
        displayWidth = displayHeight / sheetAspect;

        // Si el ancho calculado supera el ancho disponible del contenedor, ajustar por ancho
        if (displayWidth > availWidth) {
            displayWidth = availWidth;
            displayHeight = displayWidth * sheetAspect;
        }
    }

    const dpr = window.devicePixelRatio || 1;
    DOM.previewCanvas.width = Math.round(displayWidth * STATE.zoom * dpr);
    DOM.previewCanvas.height = Math.round(displayHeight * STATE.zoom * dpr);

    DOM.previewCanvas.style.width = `${Math.round(displayWidth * STATE.zoom)}px`;
    DOM.previewCanvas.style.height = `${Math.round(displayHeight * STATE.zoom)}px`;
    updateViewportScrollMode();
    requestAnimationFrame(() => {
        updateViewportScrollMode();
        syncHojaPickHits();
    });
}

function renderLoop() {
    renderScheduled = false;
    const canvas = DOM.previewCanvas;
    const ctx = previewCtx;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Fondo de la hoja (Blanco o Modo Papel Oscuro según preferencia)
    ctx.fillStyle = STATE.darkPaper ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const mmToPx = canvasWidth / STATE.paper.widthMm;
    const cardInstances = getCardInstances(mmToPx, canvasWidth, canvasHeight);

    for (const inst of cardInstances) {
        drawCardInstance(ctx, inst, mmToPx);
    }

    // Guías visuales Blueprint para carnets aún no cargados
    const placeholders = getBlueprintPlaceholders(mmToPx, canvasWidth, canvasHeight);
    if (placeholders.length > 0) {
        drawBlueprintPlaceholders(ctx, placeholders, mmToPx);
    }

    if (INTERACTION.isDragging && INTERACTION.activeSnapLines.length > 0) {
        drawSnapLines(ctx, canvasWidth, canvasHeight, mmToPx);
    }

    if (STATE.selectedCardId === 'both') {
        for (const inst of cardInstances) {
            drawSelectionBox(ctx, inst);
        }
    } else if (STATE.selectedCardId) {
        const selectedInst = cardInstances.find(i => i.card.id === STATE.selectedCardId);
        if (selectedInst) {
            drawSelectionBox(ctx, selectedInst);
        }
    }

    ctx.restore();
    syncHojaPickHits();
}

function getCardInstances(mmToPx, canvasWidth, canvasHeight) {
    const instances = [];
    const mode = STATE.layout.mode;
    const arrange = STATE.layout.arrange;
    const paperW = STATE.paper.widthMm;
    const paperH = STATE.paper.heightMm;

    const f = STATE.cards.frente;
    const d = STATE.cards.dorso;

    if (mode === 'both') {
        if (arrange === 'vertical') {
            if (f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = (paperW - wMm) / 2 + f.xMm;
                const yMm = 30 + f.yMm;
                instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
            if (d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = (paperW - wMm) / 2 + d.xMm;
                const yMm = (paperH / 2) + 15 + d.yMm;
                instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        } else {
            const halfW = paperW / 2;
            if (f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = (halfW - wMm) / 2 + f.xMm + 4;
                const yMm = (paperH - hMm) / 2 + f.yMm;
                instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
            if (d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = halfW + (halfW - wMm) / 2 + d.xMm - 4;
                const yMm = (paperH - hMm) / 2 + d.yMm;
                instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        }
    } else if (mode === 'front-only') {
        if (f.rawImage) {
            const wMm = f.widthMm * (f.scale / 100);
            const hMm = f.heightMm * (f.scale / 100);
            const xMm = (paperW - wMm) / 2 + f.xMm;
            const yMm = (paperH - hMm) / 2 + f.yMm;
            instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
        }
    } else if (mode === 'back-only') {
        if (d.rawImage) {
            const wMm = d.widthMm * (d.scale / 100);
            const hMm = d.heightMm * (d.scale / 100);
            const xMm = (paperW - wMm) / 2 + d.xMm;
            const yMm = (paperH - hMm) / 2 + d.yMm;
            instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
        }
    } else if (mode === 'multi-2') {
        const halfH = paperH / 2;
        [0, halfH].forEach((offsetY) => {
            if (f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = 15 + f.xMm;
                const yMm = offsetY + 15 + f.yMm;
                instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
            if (d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = paperW - wMm - 15 + d.xMm;
                const yMm = offsetY + 15 + d.yMm;
                instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        });
    } else if (mode === 'multi-4') {
        const colW = paperW / 2;
        const rowH = paperH / 2;
        [
            { cx: 0, cy: 0 },
            { cx: colW, cy: 0 },
            { cx: 0, cy: rowH },
            { cx: colW, cy: rowH }
        ].forEach((pos) => {
            const targetCard = f.rawImage ? f : d;
            if (targetCard.rawImage) {
                const wMm = targetCard.widthMm * (targetCard.scale / 100);
                const hMm = targetCard.heightMm * (targetCard.scale / 100);
                const xMm = pos.cx + (colW - wMm) / 2 + targetCard.xMm;
                const yMm = pos.cy + (rowH - hMm) / 2 + targetCard.yMm;
                instances.push({ card: targetCard, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        });
    }

    return instances;
}

function drawCardInstance(ctx, inst, mmToPx) {
    const card = inst.card;
    if (card.dirty || !card.cachedCanvas) {
        processCardImage(card);
    }

    const img = card.cachedCanvas;
    if (!img) return;

    const x = inst.pxX;
    const y = inst.pxY;
    const w = inst.pxW;
    const h = inst.pxH;
    const r = card.borderRadiusMm * mmToPx;

    // Solo dibujar líneas de corte si está EXPLÍCITAMENTE activado por el usuario
    if (STATE.layout.showCutLines) {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.restore();
    }

    // Dibujar tarjeta con esquinas redondeadas limpias
    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Solo dibujar borde sutil si está EXPLÍCITAMENTE activado
    if (STATE.layout.showBorder) {
        ctx.save();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundedRectPath(ctx, x, y, w, h, r);
        ctx.stroke();
        ctx.restore();
    }
}

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawSelectionBox(ctx, inst) {
    const x = inst.pxX;
    const y = inst.pxY;
    const w = inst.pxW;
    const h = inst.pxH;

    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.setLineDash([]);

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 1024;
    const handleRadius = isTouch ? 9 : 6;

    const handles = [
        { x: x - 2, y: y - 2 },
        { x: x + w + 2, y: y - 2 },
        { x: x - 2, y: y + h + 2 },
        { x: x + w + 2, y: y + h + 2 }
    ];

    for (const hPos of handles) {
        ctx.beginPath();
        ctx.arc(hPos.x, hPos.y, handleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();
}

function drawSnapLines(ctx, canvasWidth, canvasHeight, mmToPx) {
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (const snap of INTERACTION.activeSnapLines) {
        ctx.beginPath();
        if (snap.orientation === 'v') {
            const pxX = snap.posMm * mmToPx;
            ctx.moveTo(pxX, 0);
            ctx.lineTo(pxX, canvasHeight);
        } else {
            const pxY = snap.posMm * mmToPx;
            ctx.moveTo(0, pxY);
            ctx.lineTo(canvasWidth, pxY);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function getBlueprintPlaceholders(mmToPx, canvasWidth, canvasHeight) {
    const placeholders = [];
    const mode = STATE.layout.mode;
    const arrange = STATE.layout.arrange;
    const paperW = STATE.paper.widthMm;
    const paperH = STATE.paper.heightMm;

    const f = STATE.cards.frente;
    const d = STATE.cards.dorso;

    if (mode === 'both') {
        if (arrange === 'vertical') {
            if (!f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = (paperW - wMm) / 2 + f.xMm;
                const yMm = 30 + f.yMm;
                placeholders.push({
                    cardId: 'frente',
                    title: t('idFront', { pct: Math.round(f.scale || 150) }),
                    sub: t('tapUpload'),
                    tag: '85.6 × 54 mm • R5 mm',
                    borderRadiusMm: f.borderRadiusMm || 5,
                    xMm, yMm, wMm, hMm,
                    pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
                });
            }
            if (!d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = (paperW - wMm) / 2 + d.xMm;
                const yMm = (paperH / 2) + 15 + d.yMm;
                placeholders.push({
                    cardId: 'dorso',
                    title: t('idBack', { pct: Math.round(d.scale || 150) }),
                    sub: t('tapUpload'),
                    tag: '85.6 × 54 mm • R5 mm',
                    borderRadiusMm: d.borderRadiusMm || 5,
                    xMm, yMm, wMm, hMm,
                    pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
                });
            }
        } else {
            const halfW = paperW / 2;
            if (!f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = (halfW - wMm) / 2 + f.xMm + 4;
                const yMm = (paperH - hMm) / 2 + f.yMm;
                placeholders.push({
                    cardId: 'frente',
                    title: t('idFront', { pct: Math.round(f.scale || 150) }),
                    sub: t('tapUpload'),
                    tag: '85.6 × 54 mm • R5 mm',
                    borderRadiusMm: f.borderRadiusMm || 5,
                    xMm, yMm, wMm, hMm,
                    pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
                });
            }
            if (!d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = halfW + (halfW - wMm) / 2 + d.xMm - 4;
                const yMm = (paperH - hMm) / 2 + d.yMm;
                placeholders.push({
                    cardId: 'dorso',
                    title: t('idBack', { pct: Math.round(d.scale || 150) }),
                    sub: t('tapUpload'),
                    tag: '85.6 × 54 mm • R5 mm',
                    borderRadiusMm: d.borderRadiusMm || 5,
                    xMm, yMm, wMm, hMm,
                    pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
                });
            }
        }
    } else if (mode === 'front-only') {
        if (!f.rawImage) {
            const wMm = f.widthMm * (f.scale / 100);
            const hMm = f.heightMm * (f.scale / 100);
            const xMm = (paperW - wMm) / 2 + f.xMm;
            const yMm = (paperH - hMm) / 2 + f.yMm;
            placeholders.push({
                cardId: 'frente',
                title: t('idFront', { pct: Math.round(f.scale || 150) }),
                sub: t('tapUpload'),
                tag: '85.6 × 54 mm • R5 mm',
                borderRadiusMm: f.borderRadiusMm || 5,
                xMm, yMm, wMm, hMm,
                pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
            });
        }
    } else if (mode === 'back-only') {
        if (!d.rawImage) {
            const wMm = d.widthMm * (d.scale / 100);
            const hMm = d.heightMm * (d.scale / 100);
            const xMm = (paperW - wMm) / 2 + d.xMm;
            const yMm = (paperH - hMm) / 2 + d.yMm;
            placeholders.push({
                cardId: 'dorso',
                title: t('idBack', { pct: Math.round(d.scale || 150) }),
                sub: t('tapUpload'),
                tag: '85.6 × 54 mm • R5 mm',
                borderRadiusMm: d.borderRadiusMm || 5,
                xMm, yMm, wMm, hMm,
                pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
            });
        }
    } else if (mode === 'multi-2' || mode === 'multi-4') {
        if (!f.rawImage) {
            const wMm = f.widthMm * (f.scale / 100);
            const hMm = f.heightMm * (f.scale / 100);
            const xMm = 15 + f.xMm;
            const yMm = 15 + f.yMm;
            placeholders.push({
                cardId: 'frente',
                title: t('idFront', { pct: Math.round(f.scale || 150) }),
                sub: t('tapUpload'),
                tag: '85.6 × 54 mm • R5 mm',
                borderRadiusMm: f.borderRadiusMm || 5,
                xMm, yMm, wMm, hMm,
                pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
            });
        }
        if (!d.rawImage) {
            const wMm = d.widthMm * (d.scale / 100);
            const hMm = d.heightMm * (d.scale / 100);
            const xMm = paperW - wMm - 15 + d.xMm;
            const yMm = 15 + d.yMm;
            placeholders.push({
                cardId: 'dorso',
                title: t('idBack', { pct: Math.round(d.scale || 150) }),
                sub: t('tapUpload'),
                tag: '85.6 × 54 mm • R5 mm',
                borderRadiusMm: d.borderRadiusMm || 5,
                xMm, yMm, wMm, hMm,
                pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx
            });
        }
    }

    return placeholders;
}

function drawBlueprintPlaceholders(ctx, placeholders, mmToPx) {
    for (const bp of placeholders) {
        const x = bp.pxX;
        const y = bp.pxY;
        const w = bp.pxW;
        const h = bp.pxH;
        const r = (bp.borderRadiusMm || 5) * mmToPx;

        ctx.save();

        // 1. Fondo sutil del carnet en el lienzo
        ctx.beginPath();
        drawRoundedRectPath(ctx, x, y, w, h, r);
        ctx.fillStyle = STATE.darkPaper ? 'rgba(30, 41, 59, 0.75)' : 'rgba(248, 250, 252, 0.85)';
        ctx.fill();

        // 2. Borde punteado
        ctx.strokeStyle = STATE.darkPaper ? '#475569' : '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        const cx = x + w / 2;
        const cy = y + h / 2;

        // 3. Icono centrado sutil
        const iconW = Math.min(32, w * 0.15);
        const iconH = iconW * 0.65;
        const iconY = cy - 22;

        ctx.strokeStyle = STATE.darkPaper ? '#64748b' : '#94a3b8';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.strokeRect(cx - iconW / 2, iconY - iconH / 2, iconW, iconH);

        ctx.beginPath();
        ctx.arc(cx - iconW * 0.22, iconY, iconH * 0.28, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, iconY - iconH * 0.18);
        ctx.lineTo(cx + iconW * 0.35, iconY - iconH * 0.18);
        ctx.moveTo(cx, iconY + iconH * 0.18);
        ctx.lineTo(cx + iconW * 0.25, iconY + iconH * 0.18);
        ctx.stroke();

        // 4. Título
        const titleFontSize = Math.max(12, Math.min(16, Math.round(w * 0.04)));
        ctx.font = `700 ${titleFontSize}px Inter, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = STATE.darkPaper ? '#f1f5f9' : '#1e293b';
        ctx.fillText(bp.title, cx, cy + 10);

        // 5. Subtítulo interactivo
        const subFontSize = Math.max(10, Math.min(13, Math.round(w * 0.028)));
        ctx.font = `500 ${subFontSize}px Inter, -apple-system, sans-serif`;
        ctx.fillStyle = STATE.darkPaper ? '#94a3b8' : '#64748b';
        ctx.fillText(bp.sub, cx, cy + 28);

        // 6. Badge de dimensiones
        const tagFontSize = Math.max(9, Math.min(11, Math.round(w * 0.024)));
        ctx.font = `600 ${tagFontSize}px Inter, -apple-system, sans-serif`;
        ctx.fillStyle = '#2563eb';
        ctx.fillText(bp.tag, cx, cy + 45);

        ctx.restore();
    }
}

function updateEmptyStateVisibility() {
    const hasAnyImage = !!(STATE.cards.frente.rawImage || STATE.cards.dorso.rawImage);
    if (DOM.emptyState) {
        if (hasAnyImage) {
            DOM.emptyState.classList.add('hidden');
        } else {
            DOM.emptyState.classList.remove('hidden');
        }
    }
    if (DOM.btnGenerateDownload) {
        DOM.btnGenerateDownload.disabled = !hasAnyImage;
    }
}

// =============================================================================
// 13. MANIPULACIÓN DIRECTA EN EL CANVAS
// =============================================================================

function setupCanvasPointerEvents() {
    const canvas = DOM.previewCanvas;

    canvas.addEventListener('pointerdown', (e) => {
        const coords = getCanvasPointerCoords(e);
        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;
        const mmToPx = canvasW / STATE.paper.widthMm;
        const instances = getCardInstances(mmToPx, canvasW, canvasH);

        if (STATE.selectedCardId) {
            if (STATE.selectedCardId === 'both') {
                for (const inst of instances) {
                    const handle = hitTestHandles(coords.x, coords.y, inst);
                    if (handle) {
                        INTERACTION.isResizing = true;
                        INTERACTION.resizeHandle = handle;
                        INTERACTION.dragStart = { x: coords.x, y: coords.y };
                        INTERACTION.cardInitialScale = {
                            frente: STATE.cards.frente.scale,
                            dorso: STATE.cards.dorso.scale
                        };
                        canvas.setPointerCapture(e.pointerId);
                        return;
                    }
                }
            } else {
                const selectedInst = instances.find(i => i.card.id === STATE.selectedCardId);
                if (selectedInst) {
                    const handle = hitTestHandles(coords.x, coords.y, selectedInst);
                    if (handle) {
                        INTERACTION.isResizing = true;
                        INTERACTION.resizeHandle = handle;
                        INTERACTION.dragStart = { x: coords.x, y: coords.y };
                        INTERACTION.cardInitialScale = selectedInst.card.scale;
                        canvas.setPointerCapture(e.pointerId);
                        return;
                    }
                }
            }
        }

        let clickedInst = null;
        for (let i = instances.length - 1; i >= 0; i--) {
            const inst = instances[i];
            if (coords.x >= inst.pxX && coords.x <= inst.pxX + inst.pxW &&
                coords.y >= inst.pxY && coords.y <= inst.pxY + inst.pxH) {
                clickedInst = inst;
                break;
            }
        }

        if (clickedInst) {
            if (STATE.selectedCardId === 'both') {
                INTERACTION.isDragging = true;
                INTERACTION.dragStart = { x: coords.x, y: coords.y };
                INTERACTION.cardInitialPos = {
                    frente: { x: STATE.cards.frente.xMm, y: STATE.cards.frente.yMm },
                    dorso: { x: STATE.cards.dorso.xMm, y: STATE.cards.dorso.yMm }
                };
                canvas.setPointerCapture(e.pointerId);
                scheduleRender();
                return;
            }

            STATE.selectedCardId = clickedInst.card.id;
            setActiveTab(clickedInst.card.id);
            INTERACTION.isDragging = true;
            INTERACTION.dragStart = { x: coords.x, y: coords.y };
            INTERACTION.cardInitialPos = { x: clickedInst.card.xMm, y: clickedInst.card.yMm };
            canvas.setPointerCapture(e.pointerId);
            syncControlsFromActiveCard();
            scheduleRender();
        } else {
            const placeholders = getBlueprintPlaceholders(mmToPx, canvasW, canvasH);
            const clickedBp = placeholders.find(bp =>
                coords.x >= bp.pxX && coords.x <= bp.pxX + bp.pxW &&
                coords.y >= bp.pxY && coords.y <= bp.pxY + bp.pxH
            );
            if (clickedBp) {
                openCardFilePicker(clickedBp.cardId);
                return;
            }
            if (STATE.zoom > 1.0) {
                beginViewportPan(e);
                return;
            }
            deselectCards();
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        const coords = getCanvasPointerCoords(e);
        const mmToPx = (canvas.width / (window.devicePixelRatio || 1)) / STATE.paper.widthMm;
        const instances = getCardInstances(mmToPx, canvas.width, canvas.height);

        if (INTERACTION.isPanning) {
            updateViewportPan(e);
            return;
        }

        if (INTERACTION.isResizing) {
            const deltaX = (coords.x - INTERACTION.dragStart.x) / mmToPx;
            const deltaY = (coords.y - INTERACTION.dragStart.y) / mmToPx;

            let effectiveDelta = 0;
            switch (INTERACTION.resizeHandle) {
                case 'br':
                    effectiveDelta = (deltaX + deltaY) / 2;
                    break;
                case 'tl':
                    effectiveDelta = (-deltaX - deltaY) / 2;
                    break;
                case 'tr':
                    effectiveDelta = (deltaX - deltaY) / 2;
                    break;
                case 'bl':
                    effectiveDelta = (-deltaX + deltaY) / 2;
                    break;
                default:
                    effectiveDelta = deltaX;
            }

            if (STATE.selectedCardId === 'both') {
                const initF = (typeof INTERACTION.cardInitialScale === 'object') ? INTERACTION.cardInitialScale.frente : INTERACTION.cardInitialScale;
                const initD = (typeof INTERACTION.cardInitialScale === 'object') ? INTERACTION.cardInitialScale.dorso : INTERACTION.cardInitialScale;
                const scaleDeltaF = (effectiveDelta / (STATE.cards.frente.widthMm / 100));
                const scaleDeltaD = (effectiveDelta / (STATE.cards.dorso.widthMm / 100));
                STATE.cards.frente.scale = Math.min(180, Math.max(30, Math.round(initF + scaleDeltaF)));
                STATE.cards.dorso.scale = Math.min(180, Math.max(30, Math.round(initD + scaleDeltaD)));
            } else {
                const card = STATE.cards[STATE.selectedCardId];
                const initScale = (typeof INTERACTION.cardInitialScale === 'number') ? INTERACTION.cardInitialScale : (INTERACTION.cardInitialScale[STATE.selectedCardId] || card.scale);
                const scaleChange = (effectiveDelta / (card.widthMm / 100));
                card.scale = Math.min(180, Math.max(30, Math.round(initScale + scaleChange)));
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = card.scale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        if (INTERACTION.isDragging) {
            const deltaX = (coords.x - INTERACTION.dragStart.x) / mmToPx;
            const deltaY = (coords.y - INTERACTION.dragStart.y) / mmToPx;

            if (STATE.selectedCardId === 'both') {
                const initF = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.frente) || { x: STATE.cards.frente.xMm, y: STATE.cards.frente.yMm };
                const initD = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.dorso) || { x: STATE.cards.dorso.xMm, y: STATE.cards.dorso.yMm };

                STATE.cards.frente.xMm = Math.min(100, Math.max(-100, Math.round(initF.x + deltaX)));
                STATE.cards.frente.yMm = Math.min(100, Math.max(-100, Math.round(initF.y + deltaY)));
                STATE.cards.dorso.xMm = Math.min(100, Math.max(-100, Math.round(initD.x + deltaX)));
                STATE.cards.dorso.yMm = Math.min(100, Math.max(-100, Math.round(initD.y + deltaY)));
            } else {
                const card = STATE.cards[STATE.selectedCardId];
                const initX = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.x !== undefined) ? INTERACTION.cardInitialPos.x : card.xMm;
                const initY = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.y !== undefined) ? INTERACTION.cardInitialPos.y : card.yMm;

                let newX = Math.round(initX + deltaX);
                let newY = Math.round(initY + deltaY);

                INTERACTION.activeSnapLines = [];
                if (STATE.snapEnabled) {
                    if (Math.abs(newX) <= 2) {
                        newX = 0;
                        INTERACTION.activeSnapLines.push({ orientation: 'v', posMm: STATE.paper.widthMm / 2 });
                    }

                    const otherCard = STATE.selectedCardId === 'frente' ? STATE.cards.dorso : STATE.cards.frente;
                    if (otherCard && otherCard.rawImage) {
                        if (Math.abs(newX - otherCard.xMm) <= 2) {
                            newX = otherCard.xMm;
                            INTERACTION.activeSnapLines.push({ orientation: 'v', posMm: (STATE.paper.widthMm / 2) + newX });
                        }
                    }
                }

                card.xMm = Math.min(100, Math.max(-100, newX));
                card.yMm = Math.min(100, Math.max(-100, newY));
            }

            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        if (STATE.selectedCardId === 'both') {
            for (const inst of instances) {
                const handle = hitTestHandles(coords.x, coords.y, inst);
                if (handle) {
                    canvas.style.cursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                    return;
                }
            }
        } else if (STATE.selectedCardId) {
            const selectedInst = instances.find(i => i.card.id === STATE.selectedCardId);
            if (selectedInst) {
                const handle = hitTestHandles(coords.x, coords.y, selectedInst);
                if (handle) {
                    canvas.style.cursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                    return;
                }
            }
        }

        const isOverCard = instances.some(i => coords.x >= i.pxX && coords.x <= i.pxX + i.pxW && coords.y >= i.pxY && coords.y <= i.pxY + i.pxH);
        if (isOverCard) {
            canvas.style.cursor = 'grab';
        } else {
            const dpr = window.devicePixelRatio || 1;
            const canvasW = canvas.width / dpr;
            const canvasH = canvas.height / dpr;
            const placeholders = getBlueprintPlaceholders(mmToPx, canvasW, canvasH);
            const isOverBp = placeholders.some(bp => coords.x >= bp.pxX && coords.x <= bp.pxX + bp.pxW && coords.y >= bp.pxY && coords.y <= bp.pxY + bp.pxH);
            canvas.style.cursor = isOverBp ? 'pointer' : 'default';
        }
    });

    // Soporte nativo de pellizco multitáctil (Pinch-to-Resize) para agrandar en celulares
    let pinchStartDist = 0;
    let pinchInitialScale = { frente: 70, dorso: 70 };
    let pinchInitialZoom = 1;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 2) return;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        pinchInitialScale = {
            frente: STATE.cards.frente.scale,
            dorso: STATE.cards.dorso.scale
        };
        pinchInitialZoom = STATE.zoom;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 2 || pinchStartDist <= 0) return;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const factor = currentDist / pinchStartDist;

        if (STATE.selectedCardId) {
            if (STATE.selectedCardId === 'both') {
                STATE.cards.frente.scale = Math.min(180, Math.max(30, Math.round(pinchInitialScale.frente * factor)));
                STATE.cards.dorso.scale = Math.min(180, Math.max(30, Math.round(pinchInitialScale.dorso * factor)));
            } else {
                const card = STATE.cards[STATE.selectedCardId];
                const initScale = pinchInitialScale[STATE.selectedCardId] || card.scale;
                const newScale = Math.min(180, Math.max(30, Math.round(initScale * factor)));
                card.scale = newScale;
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = newScale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        STATE.zoom = Math.min(3, Math.max(0.4, +(pinchInitialZoom * factor).toFixed(2)));
        updateZoomLabel();
        resizeCanvasViewport();
        scheduleRender();
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            pinchStartDist = 0;
        }
    }, { passive: true });

    const endInteraction = (e) => {
        if (INTERACTION.isPanning) {
            const moved = INTERACTION.panMoved;
            INTERACTION.isPanning = false;
            INTERACTION.panMoved = false;
            canvas.style.cursor = 'default';
            if (!moved) deselectCards();
            return;
        }
        if (INTERACTION.isDragging || INTERACTION.isResizing) {
            INTERACTION.isDragging = false;
            INTERACTION.isResizing = false;
            INTERACTION.activeSnapLines = [];
            canvas.style.cursor = 'default';
            saveHistoryState('Mover / Redimensionar carnet');
            scheduleRender();
        }
    };

    canvas.addEventListener('pointerup', endInteraction);
    canvas.addEventListener('pointercancel', endInteraction);

    setupViewportEmptyDeselect();
}

function getViewportScroller() {
    return DOM.viewportScroller || DOM.viewportContainer;
}

function beginViewportPan(e) {
    const scroller = getViewportScroller();
    if (!scroller) return;
    INTERACTION.isPanning = true;
    INTERACTION.panMoved = false;
    INTERACTION.panStart = {
        x: e.clientX,
        y: e.clientY,
        sl: scroller.scrollLeft,
        st: scroller.scrollTop
    };
    if (DOM.previewCanvas) DOM.previewCanvas.style.cursor = 'grabbing';
    if (e.currentTarget && e.currentTarget.setPointerCapture && e.pointerId != null) {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
}

function updateViewportPan(e) {
    const scroller = getViewportScroller();
    if (!scroller) return;
    const dx = e.clientX - INTERACTION.panStart.x;
    const dy = e.clientY - INTERACTION.panStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) INTERACTION.panMoved = true;
    scroller.scrollLeft = INTERACTION.panStart.sl - dx;
    scroller.scrollTop = INTERACTION.panStart.st - dy;
}

function setupViewportEmptyDeselect() {
    const container = DOM.viewportContainer;
    const scroller = getViewportScroller();
    if (!container) return;

    const onEmptyPointerDown = (e) => {
        if (e.target.closest('#canvas-quick-bar')) return;
        if (e.target.closest('.hoja-pick-hit')) return;
        if (e.target.closest('#empty-state')) return;
        if (e.target === DOM.previewCanvas) return;

        if (scroller && scroller.classList.contains('is-zoomed') && (e.target === scroller || e.target.id === 'viewport-stage' || e.target === container)) {
            beginViewportPan(e);
            return;
        }

        deselectCards();
    };

    const onEmptyPointerMove = (e) => {
        if (INTERACTION.isPanning) updateViewportPan(e);
    };

    const onEmptyPointerUp = (e) => {
        if (!INTERACTION.isPanning) return;
        const moved = INTERACTION.panMoved;
        INTERACTION.isPanning = false;
        INTERACTION.panMoved = false;
        if (DOM.previewCanvas) DOM.previewCanvas.style.cursor = 'default';
        if (!moved) deselectCards();
    };

    container.addEventListener('pointerdown', onEmptyPointerDown);
    container.addEventListener('pointermove', onEmptyPointerMove);
    container.addEventListener('pointerup', onEmptyPointerUp);
    container.addEventListener('pointercancel', onEmptyPointerUp);
}

function updateViewportScrollMode() {
    const scroller = getViewportScroller();
    if (!scroller) return;
    const canvas = DOM.previewCanvas;
    const overflow = STATE.zoom > 1.0 || !!(canvas && (
        canvas.offsetWidth > scroller.clientWidth + 2 ||
        canvas.offsetHeight > scroller.clientHeight + 2
    ));
    scroller.classList.toggle('is-zoomed', overflow);
    if (!overflow) {
        scroller.scrollLeft = 0;
        scroller.scrollTop = 0;
    }
}

function getCanvasPointerCoords(e) {
    const canvas = DOM.previewCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function hitTestHandles(x, y, inst) {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 1024;
    // Zona de toque cómoda de 32px para dedos humanos en smartphones
    const handleHitRadius = isTouch ? 32 : 14;
    const hList = [
        { name: 'tl', x: inst.pxX, y: inst.pxY },
        { name: 'tr', x: inst.pxX + inst.pxW, y: inst.pxY },
        { name: 'bl', x: inst.pxX, y: inst.pxY + inst.pxH },
        { name: 'br', x: inst.pxX + inst.pxW, y: inst.pxY + inst.pxH }
    ];

    for (const h of hList) {
        const dist = Math.hypot(x - h.x, y - h.y);
        if (dist <= handleHitRadius) {
            return h.name;
        }
    }
    return null;
}

function toggleSnap() {
    STATE.snapEnabled = !STATE.snapEnabled;
    DOM.btnToggleSnap.className = STATE.snapEnabled
        ? 'p-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80'
        : 'p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
    showToast(STATE.snapEnabled ? t('snapOn') : t('snapOff'), 'info');
}

function defaultSheetZoom() {
    // 1.0 ya es "la hoja entera en el hueco disponible" (resizeCanvasViewport).
    // Hubo un 0.85 fijo en movil porque ese calculo sobraba espacio; al medir
    // el hueco real, 1.0 encaja en cualquier pantalla y el 85% solo la achica.
    return 1.0;
}

function updateZoomLabel() {
    if (DOM.zoomLevelLabel) DOM.zoomLevelLabel.textContent = `${Math.round(STATE.zoom * 100)}%`;
}

function setupSheetZoomWheel() {
    const scroller = getViewportScroller();
    if (!scroller || scroller.dataset.zoomWheel === '1') return;
    scroller.dataset.zoomWheel = '1';
    scroller.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        changeZoom(e.deltaY > 0 ? -0.1 : 0.1);
    }, { passive: false });
}

function changeZoom(delta) {
    STATE.zoom = Math.min(3, Math.max(0.4, +(STATE.zoom + delta).toFixed(2)));
    updateZoomLabel();
    resizeCanvasViewport();
    scheduleRender();
}

function resetZoomTo100() {
    STATE.zoom = defaultSheetZoom();
    updateZoomLabel();
    resizeCanvasViewport();
    scheduleRender();
    showToast(t('zoomReset', { pct: Math.round(STATE.zoom * 100) }), 'info');
}

function toggleCanvasFullscreen(forceState) {
    const panel = DOM.panelCanvas || document.getElementById('panel-canvas');
    if (!panel) return;

    const isFullscreen = forceState !== undefined ? forceState : !panel.classList.contains('canvas-fullscreen');
    panel.classList.toggle('canvas-fullscreen', isFullscreen);

    if (DOM.zoomFitIcon) {
        DOM.zoomFitIcon.innerHTML = isFullscreen ? SVG_ICONS.minimize : SVG_ICONS.maximize;
    }
    if (DOM.zoomFitLabel) {
        DOM.zoomFitLabel.textContent = isFullscreen ? t('restore') : t('maximize');
    }
    if (DOM.btnZoomFit) {
        DOM.btnZoomFit.title = isFullscreen ? 'Restaurar vista y zoom al 100%' : 'Expandir hoja a pantalla completa';
    }

    if (!isFullscreen) {
        STATE.zoom = defaultSheetZoom();
        updateZoomLabel();
        showToast(t('viewRestored', { pct: Math.round(STATE.zoom * 100) }), 'info');
    } else {
        showToast(t('sheetFull', { pct: Math.round(defaultSheetZoom() * 100) }), 'info');
    }

    setTimeout(() => {
        resizeCanvasViewport();
        scheduleRender();
    }, 60);
}

function fitZoomToContainer() {
    toggleCanvasFullscreen();
}

// =============================================================================
// 14. HISTORIAL: UNDO / REDO
// =============================================================================

function saveHistoryState(actionName) {
    if (HISTORY.isApplyingHistory) return;

    const snapshot = JSON.stringify({
        paper: STATE.paper,
        layout: STATE.layout,
        syncCards: STATE.syncCards,
        cards: {
            frente: { ...STATE.cards.frente, rawImage: null, croppedCanvas: null, cachedCanvas: null },
            dorso: { ...STATE.cards.dorso, rawImage: null, croppedCanvas: null, cachedCanvas: null }
        },
        actionName
    });

    HISTORY.undoStack.push(snapshot);
    if (HISTORY.undoStack.length > HISTORY.maxItems) {
        HISTORY.undoStack.shift();
    }
    HISTORY.redoStack = [];

    updateHistoryButtons();
}

function undo() {
    if (HISTORY.undoStack.length <= 1) return;

    HISTORY.isApplyingHistory = true;
    const currentState = HISTORY.undoStack.pop();
    HISTORY.redoStack.push(currentState);

    const prevState = JSON.parse(HISTORY.undoStack[HISTORY.undoStack.length - 1]);
    applySnapshot(prevState);
    HISTORY.isApplyingHistory = false;

    updateHistoryButtons();
    scheduleRender();
    showToast(t('undone', { name: prevState.actionName || '' }), 'info');
}

function redo() {
    if (HISTORY.redoStack.length === 0) return;

    HISTORY.isApplyingHistory = true;
    const nextStateStr = HISTORY.redoStack.pop();
    HISTORY.undoStack.push(nextStateStr);

    const nextState = JSON.parse(nextStateStr);
    applySnapshot(nextState);
    HISTORY.isApplyingHistory = false;

    updateHistoryButtons();
    scheduleRender();
    showToast(t('redone', { name: nextState.actionName || '' }), 'info');
}

function applySnapshot(snap) {
    Object.assign(STATE.paper, snap.paper);
    Object.assign(STATE.layout, snap.layout);
    if (snap.syncCards !== undefined) STATE.syncCards = snap.syncCards;

    ['frente', 'dorso'].forEach(key => {
        const currentCard = STATE.cards[key];
        const snapCard = snap.cards[key];
        Object.assign(currentCard, {
            scale: snapCard.scale,
            xMm: snapCard.xMm,
            yMm: snapCard.yMm,
            rotation: snapCard.rotation,
            borderRadiusMm: snapCard.borderRadiusMm,
            filter: snapCard.filter,
            brightness: snapCard.brightness,
            contrast: snapCard.contrast,
            dirty: true
        });
    });

    updateUIFromState();
}

function updateHistoryButtons() {
    DOM.btnUndo.disabled = HISTORY.undoStack.length <= 1;
    DOM.btnRedo.disabled = HISTORY.redoStack.length === 0;
}

// =============================================================================
// 15. MODAL DE RECORTE INTERACTIVO (CROP TOOL MULTI-TÁCTIL)
// =============================================================================

let cropState = {
    cardId: 'frente',
    sourceImg: null,
    cachedRotatedImg: null,
    mode: 'quad', // 'quad' (Perspectiva por defecto) | 'straighten' | 'box'
    aspect: 'cr80', // 'cr80' | 'free'
    fineAngle: 0, // Inclinación fina en grados (-45 a +45)
    rotation90: 0, // Rotación de 90° acumulada (0, 90, 180, 270)
    loupeZoom: 1.0, // Zoom de lupa por defecto 1X (resolución nativa 1:1)
    showGrid: false,
    cropBox: { x: 20, y: 20, w: 200, h: 140 },
    quadPoints: {
        tl: { x: 20, y: 20 },
        tr: { x: 220, y: 20 },
        br: { x: 220, y: 160 },
        bl: { x: 20, y: 160 }
    },
    dragHandle: null, // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'tl' | 'tr' | 'br' | 'bl'
    startPointer: { x: 0, y: 0 },
    startBox: { x: 0, y: 0, w: 0, h: 0 },
    startQuad: null
};

function setLoupeZoom(zoom) {
    cropState.loupeZoom = zoom;
    const badge = DOM.cropLoupeBadge || document.getElementById('crop-loupe-badge');
    if (badge) badge.textContent = `${zoom}X`;

    const zBtns = [
        { el: DOM.btnLoupeZoom1, val: 1.0 },
        { el: DOM.btnLoupeZoom15, val: 1.5 },
        { el: DOM.btnLoupeZoom2, val: 2.0 },
        { el: DOM.btnLoupeZoom3, val: 3.0 }
    ];
    zBtns.forEach(b => {
        if (!b.el) return;
        if (Math.abs(b.val - zoom) < 0.05) {
            b.el.className = 'min-w-[34px] min-h-[34px] px-2 py-1 text-xs font-black rounded-xl bg-blue-600 text-white shadow-sm transition-all';
        } else {
            b.el.className = 'min-w-[34px] min-h-[34px] px-2 py-1 text-xs font-bold rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all';
        }
    });
}

function cycleLoupeZoom() {
    const cur = cropState.loupeZoom || 1.0;
    let next = 1.0;
    if (cur < 1.2) next = 1.5;
    else if (cur < 1.8) next = 2.0;
    else if (cur < 2.5) next = 3.0;
    else next = 1.0;
    setLoupeZoom(next);
    showToast(t('loupeZoom', { n: next }), 'info', 'search');
}

function openCropModal(cardId, options = {}) {
    const card = STATE.cards[cardId];
    if (!card || (!card.rawImage && !card.croppedCanvas)) {
        showToast(t('cropNeedImage'), 'warning');
        return;
    }

    cropState.cardId = cardId;
    cropState.sourceImg = card.rawImage || card.croppedCanvas;
    cropState.fineAngle = card.cropFineAngle || 0;
    cropState.rotation90 = card.cropRotation90 || 0;
    cropState.showGrid = false;
    setLoupeZoom(1.0); // 1X POR DEFECTO

    if (DOM.cropAngleSlider) DOM.cropAngleSlider.value = cropState.fineAngle;
    if (DOM.cropAngleLabel) DOM.cropAngleLabel.textContent = `${cropState.fineAngle >= 0 ? '+' : ''}${cropState.fineAngle.toFixed(1)}°`;

    updateRotatedCropCanvas();
    DOM.cropModal.classList.remove('hidden');

    const canvas = DOM.cropCanvas;
    canvas.width = cropState.cachedRotatedImg.width;
    canvas.height = cropState.cachedRotatedImg.height;

    if (card.cropQuad && !options.autoDetect) {
        cropState.quadPoints = {
            tl: { ...card.cropQuad.tl },
            tr: { ...card.cropQuad.tr },
            br: { ...card.cropQuad.br },
            bl: { ...card.cropQuad.bl }
        };
        if (card.cropRect) cropState.cropBox = { ...card.cropRect };
    } else {
        resetBoxAndQuadBounds();
        // Detección de esquinas automática
        detectDocumentQuad(false);
    }

    const startMode = options.defaultMode || 'quad';
    setCropMode(startMode);
}

function setCropMode(mode) {
    cropState.mode = mode;
    const activeTabClass = 'px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-black rounded-xl bg-blue-600 text-white transition-all shadow-sm flex items-center gap-1';
    const inactiveTabClass = 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1';

    if (DOM.btnCropTabQuad) DOM.btnCropTabQuad.className = (mode === 'quad') ? activeTabClass : inactiveTabClass;
    if (DOM.btnCropTabRotate) DOM.btnCropTabRotate.className = (mode === 'straighten') ? activeTabClass : inactiveTabClass;
    if (DOM.btnCropTabBox) DOM.btnCropTabBox.className = (mode === 'box') ? activeTabClass : inactiveTabClass;

    if (DOM.cropQuadControls) DOM.cropQuadControls.classList.toggle('hidden', mode !== 'quad');
    if (DOM.cropRotateControls) DOM.cropRotateControls.classList.toggle('hidden', mode !== 'straighten');
    if (DOM.cropBoxControls) DOM.cropBoxControls.classList.toggle('hidden', mode !== 'box');

    if (mode === 'straighten') {
        cropState.showGrid = true;
    }

    hideCropLoupe();
    drawCropCanvas();
}

function updateRotatedCropCanvas() {
    if (!cropState.sourceImg) return;

    const totalAngle = (cropState.rotation90 + cropState.fineAngle);
    const rad = totalAngle * Math.PI / 180;
    const srcW = cropState.sourceImg.width;
    const srcH = cropState.sourceImg.height;

    if (Math.abs(totalAngle % 360) < 0.05) {
        cropState.cachedRotatedImg = cropState.sourceImg;
        DOM.cropCanvas.width = srcW;
        DOM.cropCanvas.height = srcH;
        return;
    }

    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const newW = Math.max(10, Math.round(srcW * cos + srcH * sin));
    const newH = Math.max(10, Math.round(srcW * sin + srcH * cos));

    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = newW;
    rotCanvas.height = newH;
    const rCtx = rotCanvas.getContext('2d');
    rCtx.imageSmoothingEnabled = true;
    rCtx.imageSmoothingQuality = 'high';
    rCtx.translate(newW / 2, newH / 2);
    rCtx.rotate(rad);
    rCtx.drawImage(cropState.sourceImg, -srcW / 2, -srcH / 2);

    cropState.cachedRotatedImg = rotCanvas;
    DOM.cropCanvas.width = newW;
    DOM.cropCanvas.height = newH;
}

function rotateCrop90(angleDelta = 90) {
    const oldW = DOM.cropCanvas.width;
    const oldH = DOM.cropCanvas.height;

    cropState.rotation90 = (cropState.rotation90 + angleDelta) % 360;
    if (cropState.rotation90 < 0) cropState.rotation90 += 360;
    updateRotatedCropCanvas();

    // Transformar los 4 puntos de perspectiva para que acompañen el giro de 90° sin perderse
    const qp = cropState.quadPoints;
    if (angleDelta === 90 || angleDelta === -270) {
        // Giro 90° Horario: (x, y) -> (oldH - y, x)
        const ntl = { x: oldH - qp.bl.y, y: qp.bl.x };
        const ntr = { x: oldH - qp.tl.y, y: qp.tl.x };
        const nbr = { x: oldH - qp.tr.y, y: qp.tr.x };
        const nbl = { x: oldH - qp.br.y, y: qp.br.x };
        cropState.quadPoints = { tl: ntl, tr: ntr, br: nbr, bl: nbl };
    } else if (angleDelta === -90 || angleDelta === 270) {
        // Giro 90° Antihorario: (x, y) -> (y, oldW - x)
        const ntl = { x: qp.tr.y, y: oldW - qp.tr.x };
        const ntr = { x: qp.br.y, y: oldW - qp.br.x };
        const nbr = { x: qp.bl.y, y: oldW - qp.bl.x };
        const nbl = { x: qp.tl.y, y: oldW - qp.tl.x };
        cropState.quadPoints = { tl: ntl, tr: ntr, br: nbr, bl: nbl };
    } else {
        resetBoxAndQuadBounds();
    }

    drawCropCanvas();
    showToast(t('rotated90', { deg: cropState.rotation90 }), 'info');
}

function setFineCropAngle(angleDeg) {
    cropState.fineAngle = Math.max(-45, Math.min(45, angleDeg));
    if (DOM.cropAngleSlider) DOM.cropAngleSlider.value = cropState.fineAngle;
    if (DOM.cropAngleLabel) DOM.cropAngleLabel.textContent = `${cropState.fineAngle >= 0 ? '+' : ''}${cropState.fineAngle.toFixed(1)}°`;
    updateRotatedCropCanvas();
    drawCropCanvas();
}

function resetBoxAndQuadBounds() {
    const cw = DOM.cropCanvas.width;
    const ch = DOM.cropCanvas.height;
    const ratio = 85.6 / 53.98;
    let w = cw * 0.84;
    let h = (cropState.aspect === 'cr80') ? (w / ratio) : (ch * 0.84);
    if (h > ch * 0.86) {
        h = ch * 0.84;
        w = h * ratio;
    }
    const bx = (cw - w) / 2;
    const by = (ch - h) / 2;
    cropState.cropBox = { x: bx, y: by, w, h };
    cropState.quadPoints = {
        tl: { x: bx, y: by },
        tr: { x: bx + w, y: by },
        br: { x: bx + w, y: by + h },
        bl: { x: bx, y: by + h }
    };
}

function updateCropLoupe(pxX, pxY, clientX, clientY) {
    if (!DOM.cropLoupe || !DOM.cropLoupeCanvas || !cropState.cachedRotatedImg) return;

    const loupe = DOM.cropLoupe;
    const lCanvas = DOM.cropLoupeCanvas;
    const lCtx = lCanvas.getContext('2d');
    const zoom = cropState.loupeZoom || 1.0;
    const lW = lCanvas.width;
    const lH = lCanvas.height;

    // Posicionar la lupa flotante ~150px por encima del dedo para no tapar con el pulgar
    const loupeSize = 136;
    let top = clientY - 155;
    let left = clientX - (loupeSize / 2);

    // Si el dedo está cerca del borde superior, ubicar la lupa por debajo
    if (top < 15) {
        top = clientY + 50;
    }
    if (left < 10) left = 10;
    if (left + loupeSize > window.innerWidth - 10) {
        left = window.innerWidth - loupeSize - 10;
    }

    loupe.style.top = `${top}px`;
    loupe.style.left = `${left}px`;
    loupe.classList.remove('hidden');

    lCtx.clearRect(0, 0, lW, lH);
    lCtx.fillStyle = '#020617';
    lCtx.fillRect(0, 0, lW, lH);

    lCtx.imageSmoothingEnabled = true;
    lCtx.imageSmoothingQuality = 'high';

    const srcSize = lW / zoom;
    const srcX = pxX - srcSize / 2;
    const srcY = pxY - srcSize / 2;

    lCtx.drawImage(
        cropState.cachedRotatedImg,
        srcX, srcY, srcSize, srcSize,
        0, 0, lW, lH
    );
}

function hideCropLoupe() {
    if (DOM.cropLoupe) {
        DOM.cropLoupe.classList.add('hidden');
    }
}

function drawCropCanvas() {
    const canvas = DOM.cropCanvas;
    const ctx = canvas.getContext('2d');
    if (!cropState.cachedRotatedImg) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cropState.cachedRotatedImg, 0, 0);

    // 1. Rejilla de nivelación (para enderezado o asistencia visual)
    if (cropState.showGrid || cropState.mode === 'straighten') {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 1;
        const gridSize = Math.max(30, Math.round(canvas.width / 14));
        for (let gx = gridSize; gx < canvas.width; gx += gridSize) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, canvas.height);
            ctx.stroke();
        }
        for (let gy = gridSize; gy < canvas.height; gy += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(canvas.width, gy);
            ctx.stroke();
        }
        ctx.restore();
    }

    // 2. Modo Encuadre Rectangular
    if (cropState.mode === 'box') {
        const box = cropState.cropBox;

        // Viñeta oscura exterior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, canvas.width, Math.max(0, box.y));
        ctx.fillRect(0, box.y + box.h, canvas.width, Math.max(0, canvas.height - (box.y + box.h)));
        ctx.fillRect(0, box.y, Math.max(0, box.x), box.h);
        ctx.fillRect(box.x + box.w, box.y, Math.max(0, canvas.width - (box.x + box.w)), box.h);

        // Borde azul brillante
        const strokeW = Math.max(2, Math.round(canvas.width * 0.0028));
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = strokeW;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        // Regla de tercios
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(box.x + box.w / 3, box.y);
        ctx.lineTo(box.x + box.w / 3, box.y + box.h);
        ctx.moveTo(box.x + (box.w * 2) / 3, box.y);
        ctx.lineTo(box.x + (box.w * 2) / 3, box.y + box.h);
        ctx.moveTo(box.x, box.y + box.h / 3);
        ctx.lineTo(box.x + box.w, box.y + box.h / 3);
        ctx.moveTo(box.x, box.y + (box.h * 2) / 3);
        ctx.lineTo(box.x + box.w, box.y + (box.h * 2) / 3);
        ctx.stroke();

        // Tiradores de esquina táctiles
        const handleR = Math.max(9, Math.round(canvas.width * 0.014));
        const corners = [
            { x: box.x, y: box.y },
            { x: box.x + box.w, y: box.y },
            { x: box.x + box.w, y: box.y + box.h },
            { x: box.x, y: box.y + box.h }
        ];

        corners.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, handleR, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = Math.max(2.5, handleR * 0.28);
            ctx.stroke();
        });

        // Tiradores laterales en modo libre
        if (cropState.aspect === 'free') {
            const sides = [
                { x: box.x + box.w / 2, y: box.y },
                { x: box.x + box.w / 2, y: box.y + box.h },
                { x: box.x, y: box.y + box.h / 2 },
                { x: box.x + box.w, y: box.y + box.h / 2 }
            ];
            const sideR = Math.max(6, handleR * 0.7);
            sides.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, sideR, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        // Etiqueta de dimensiones
        const label = `${Math.round(box.w)} × ${Math.round(box.h)} px ${cropState.aspect === 'cr80' ? '(CR80)' : ''}`;
        const fontSize = Math.max(11, Math.round(canvas.width * 0.017));
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        const textW = ctx.measureText(label).width;
        const tagX = box.x + 8;
        const tagY = box.y + box.h - 8;
        if (tagY > box.y + 24) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.fillRect(tagX - 4, tagY - fontSize - 2, textW + 8, fontSize + 6);
            ctx.fillStyle = '#60a5fa';
            ctx.fillText(label, tagX, tagY);
        }
    }

    // 3. Modo Perspectiva 4 Puntos Libres
    if (cropState.mode === 'quad') {
        const qp = cropState.quadPoints;

        // Oscurecer área exterior del cuadrilátero
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.moveTo(qp.tl.x, qp.tl.y);
        ctx.lineTo(qp.bl.x, qp.bl.y);
        ctx.lineTo(qp.br.x, qp.br.y);
        ctx.lineTo(qp.tr.x, qp.tr.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();
        ctx.restore();

        // Borde perimetral del cuadrilátero
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2.5, Math.round(canvas.width * 0.0032));
        ctx.beginPath();
        ctx.moveTo(qp.tl.x, qp.tl.y);
        ctx.lineTo(qp.tr.x, qp.tr.y);
        ctx.lineTo(qp.br.x, qp.br.y);
        ctx.lineTo(qp.bl.x, qp.bl.y);
        ctx.closePath();
        ctx.stroke();

        // Guías diagonales de perspectiva
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo((qp.tl.x + qp.tr.x) / 2, (qp.tl.y + qp.tr.y) / 2);
        ctx.lineTo((qp.bl.x + qp.br.x) / 2, (qp.bl.y + qp.br.y) / 2);
        ctx.moveTo((qp.tl.x + qp.bl.x) / 2, (qp.tl.y + qp.bl.y) / 2);
        ctx.lineTo((qp.tr.x + qp.br.x) / 2, (qp.tr.y + qp.br.y) / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 4 Tiradores grandes de esquina numerados
        const qCorners = [
            { name: 'tl', label: '1', pt: qp.tl },
            { name: 'tr', label: '2', pt: qp.tr },
            { name: 'br', label: '3', pt: qp.br },
            { name: 'bl', label: '4', pt: qp.bl }
        ];
        const qHandleR = Math.max(12, Math.round(canvas.width * 0.016));

        qCorners.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.pt.x, c.pt.y, qHandleR, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = Math.max(3, qHandleR * 0.28);
            ctx.stroke();

            ctx.fillStyle = '#0369a1';
            ctx.font = `bold ${Math.round(qHandleR * 0.95)}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(c.label, c.pt.x, c.pt.y + 0.5);
        });
    }

    // 4. Modo Enderezado Fino
    if (cropState.mode === 'straighten') {
        const box = cropState.cropBox;
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.restore();

        // Indicador central de ángulo
        const angText = `${cropState.fineAngle >= 0 ? '+' : ''}${cropState.fineAngle.toFixed(1)}° (${cropState.rotation90 + cropState.fineAngle}°)`;
        ctx.font = 'bold 13px system-ui, sans-serif';
        const tw = ctx.measureText(angText).width;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(cx - (tw / 2) - 8, cy - 14, tw + 16, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(angText, cx, cy);
    }
}

function getCropPointerCanvasCoords(e) {
    const canvas = DOM.cropCanvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        clientX: e.clientX,
        clientY: e.clientY
    };
}

function isPointInQuad(px, py, qp) {
    const pts = [qp.tl, qp.tr, qp.br, qp.bl];
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y;
        const xj = pts[j].x, yj = pts[j].y;
        const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getCropHandleAt(px, py) {
    const canvas = DOM.cropCanvas;
    const rect = canvas.getBoundingClientRect();
    const screenScale = canvas.width / Math.max(1, rect.width);
    const hitR = Math.max(32, 38 * screenScale);

    if (cropState.mode === 'quad') {
        const qp = cropState.quadPoints;
        if (Math.hypot(px - qp.tl.x, py - qp.tl.y) <= hitR) return 'tl';
        if (Math.hypot(px - qp.tr.x, py - qp.tr.y) <= hitR) return 'tr';
        if (Math.hypot(px - qp.br.x, py - qp.br.y) <= hitR) return 'br';
        if (Math.hypot(px - qp.bl.x, py - qp.bl.y) <= hitR) return 'bl';
        if (isPointInQuad(px, py, qp)) return 'move';
        return null;
    }

    const box = cropState.cropBox;
    if (Math.hypot(px - box.x, py - box.y) <= hitR) return 'nw';
    if (Math.hypot(px - (box.x + box.w), py - box.y) <= hitR) return 'ne';
    if (Math.hypot(px - (box.x + box.w), py - (box.y + box.h)) <= hitR) return 'se';
    if (Math.hypot(px - box.x, py - (box.y + box.h)) <= hitR) return 'sw';

    if (cropState.aspect === 'free' && cropState.mode === 'box') {
        if (Math.abs(py - box.y) <= hitR && px >= box.x && px <= box.x + box.w) return 'n';
        if (Math.abs(py - (box.y + box.h)) <= hitR && px >= box.x && px <= box.x + box.w) return 's';
        if (Math.abs(px - box.x) <= hitR && py >= box.y && py <= box.y + box.h) return 'w';
        if (Math.abs(px - (box.x + box.w)) <= hitR && py >= box.y && py <= box.y + box.h) return 'e';
    }

    if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
        return 'move';
    }

    return null;
}

function updateCropCursor(handle) {
    const canvas = DOM.cropCanvas;
    if (!canvas) return;
    switch (handle) {
        case 'move': canvas.style.cursor = 'move'; break;
        case 'nw':
        case 'se':
        case 'tl':
        case 'br': canvas.style.cursor = 'nwse-resize'; break;
        case 'ne':
        case 'sw':
        case 'tr':
        case 'bl': canvas.style.cursor = 'nesw-resize'; break;
        case 'n':
        case 's': canvas.style.cursor = 'ns-resize'; break;
        case 'e':
        case 'w': canvas.style.cursor = 'ew-resize'; break;
        default: canvas.style.cursor = 'crosshair'; break;
    }
}

function onCropPointerDown(e) {
    e.preventDefault();
    const pt = getCropPointerCanvasCoords(e);
    const handle = getCropHandleAt(pt.x, pt.y);
    if (!handle) return;

    cropState.dragHandle = handle;
    cropState.startPointer = { x: pt.x, y: pt.y };
    cropState.startBox = { ...cropState.cropBox };
    cropState.startQuad = {
        tl: { ...cropState.quadPoints.tl },
        tr: { ...cropState.quadPoints.tr },
        br: { ...cropState.quadPoints.br },
        bl: { ...cropState.quadPoints.bl }
    };

    try { DOM.cropCanvas.setPointerCapture(e.pointerId); } catch (_) {}

    // Activar lupa de inmediato al tocar una esquina
    if (['nw', 'ne', 'se', 'sw', 'tl', 'tr', 'br', 'bl'].includes(handle)) {
        let cornerX = pt.x, cornerY = pt.y;
        if (cropState.mode === 'quad' && cropState.quadPoints[handle]) {
            cornerX = cropState.quadPoints[handle].x;
            cornerY = cropState.quadPoints[handle].y;
        }
        updateCropLoupe(cornerX, cornerY, e.clientX, e.clientY);
    }
}

function onCropPointerMove(e) {
    const pt = getCropPointerCanvasCoords(e);
    if (!cropState.dragHandle) {
        const handle = getCropHandleAt(pt.x, pt.y);
        updateCropCursor(handle);
        return;
    }

    e.preventDefault();
    const dx = pt.x - cropState.startPointer.x;
    const dy = pt.y - cropState.startPointer.y;
    const cw = DOM.cropCanvas.width;
    const ch = DOM.cropCanvas.height;

    // 1. Manejo en Modo Perspectiva 4 Puntos Libres
    if (cropState.mode === 'quad') {
        const sq = cropState.startQuad;
        const qp = cropState.quadPoints;

        if (cropState.dragHandle === 'move') {
            const minX = Math.min(sq.tl.x, sq.tr.x, sq.br.x, sq.bl.x);
            const maxX = Math.max(sq.tl.x, sq.tr.x, sq.br.x, sq.bl.x);
            const minY = Math.min(sq.tl.y, sq.tr.y, sq.br.y, sq.bl.y);
            const maxY = Math.max(sq.tl.y, sq.tr.y, sq.br.y, sq.bl.y);

            const clampDx = Math.max(-minX, Math.min(cw - maxX, dx));
            const clampDy = Math.max(-minY, Math.min(ch - maxY, dy));

            qp.tl = { x: sq.tl.x + clampDx, y: sq.tl.y + clampDy };
            qp.tr = { x: sq.tr.x + clampDx, y: sq.tr.y + clampDy };
            qp.br = { x: sq.br.x + clampDx, y: sq.br.y + clampDy };
            qp.bl = { x: sq.bl.x + clampDx, y: sq.bl.y + clampDy };
            hideCropLoupe();
        } else if (['tl', 'tr', 'br', 'bl'].includes(cropState.dragHandle)) {
            const targetHandle = cropState.dragHandle;
            qp[targetHandle].x = Math.max(0, Math.min(cw, sq[targetHandle].x + dx));
            qp[targetHandle].y = Math.max(0, Math.min(ch, sq[targetHandle].y + dy));
            updateCropLoupe(qp[targetHandle].x, qp[targetHandle].y, e.clientX, e.clientY);
        }

        drawCropCanvas();
        return;
    }

    // 2. Manejo en Modo Encuadre Rectangular / Enderezado
    const sb = cropState.startBox;
    const isCr80 = (cropState.aspect === 'cr80');
    const ratio = 85.6 / 53.98;
    const minW = Math.max(30, cw * 0.05);
    const minH = Math.max(20, ch * 0.05);

    let { x, y, w, h } = sb;

    switch (cropState.dragHandle) {
        case 'move': {
            x = Math.max(0, Math.min(cw - w, sb.x + dx));
            y = Math.max(0, Math.min(ch - h, sb.y + dy));
            hideCropLoupe();
            break;
        }
        case 'se': {
            w = Math.max(minW, Math.min(cw - sb.x, sb.w + dx));
            if (isCr80) {
                h = w / ratio;
                if (sb.y + h > ch) {
                    h = ch - sb.y;
                    w = h * ratio;
                }
            } else {
                h = Math.max(minH, Math.min(ch - sb.y, sb.h + dy));
            }
            updateCropLoupe(sb.x + w, sb.y + h, e.clientX, e.clientY);
            break;
        }
        case 'sw': {
            let targetW = Math.max(minW, sb.w - dx);
            let targetX = sb.x + (sb.w - targetW);
            if (targetX < 0) {
                targetW = sb.x + sb.w;
                targetX = 0;
            }
            w = targetW;
            x = targetX;
            if (isCr80) {
                h = w / ratio;
                if (sb.y + h > ch) {
                    h = ch - sb.y;
                    w = h * ratio;
                    x = sb.x + (sb.w - w);
                }
            } else {
                h = Math.max(minH, Math.min(ch - sb.y, sb.h + dy));
            }
            updateCropLoupe(x, sb.y + h, e.clientX, e.clientY);
            break;
        }
        case 'ne': {
            w = Math.max(minW, Math.min(cw - sb.x, sb.w + dx));
            if (isCr80) {
                h = w / ratio;
                y = sb.y + (sb.h - h);
                if (y < 0) {
                    h = sb.y + sb.h;
                    y = 0;
                    w = h * ratio;
                }
            } else {
                let targetH = Math.max(minH, sb.h - dy);
                let targetY = sb.y + (sb.h - targetH);
                if (targetY < 0) {
                    targetH = sb.y + sb.h;
                    targetY = 0;
                }
                h = targetH;
                y = targetY;
            }
            updateCropLoupe(sb.x + w, y, e.clientX, e.clientY);
            break;
        }
        case 'nw': {
            let targetW = Math.max(minW, sb.w - dx);
            let targetX = sb.x + (sb.w - targetW);
            if (targetX < 0) {
                targetW = sb.x + sb.w;
                targetX = 0;
            }
            w = targetW;
            x = targetX;
            if (isCr80) {
                h = w / ratio;
                y = sb.y + (sb.h - h);
                if (y < 0) {
                    h = sb.y + sb.h;
                    y = 0;
                    w = h * ratio;
                    x = sb.x + (sb.w - w);
                }
            } else {
                let targetH = Math.max(minH, sb.h - dy);
                let targetY = sb.y + (sb.h - targetH);
                if (targetY < 0) {
                    targetH = sb.y + sb.h;
                    targetY = 0;
                }
                h = targetH;
                y = targetY;
            }
            updateCropLoupe(x, y, e.clientX, e.clientY);
            break;
        }
        case 'n': {
            if (!isCr80) {
                let targetH = Math.max(minH, sb.h - dy);
                let targetY = sb.y + (sb.h - targetH);
                if (targetY < 0) { targetH = sb.y + sb.h; targetY = 0; }
                h = targetH; y = targetY;
            }
            break;
        }
        case 's': {
            if (!isCr80) {
                h = Math.max(minH, Math.min(ch - sb.y, sb.h + dy));
            }
            break;
        }
        case 'e': {
            if (!isCr80) {
                w = Math.max(minW, Math.min(cw - sb.x, sb.w + dx));
            }
            break;
        }
        case 'w': {
            if (!isCr80) {
                let targetW = Math.max(minW, sb.w - dx);
                let targetX = sb.x + (sb.w - targetW);
                if (targetX < 0) { targetW = sb.x + sb.w; targetX = 0; }
                w = targetW; x = targetX;
            }
            break;
        }
    }

    cropState.cropBox = { x, y, w, h };
    drawCropCanvas();
}

function onCropPointerUp(e) {
    if (cropState.dragHandle) {
        cropState.dragHandle = null;
        try { DOM.cropCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
        updateCropCursor(null);
        hideCropLoupe();
        drawCropCanvas();
    }
}

function detectDocumentBounds() {
    if (!cropState.cachedRotatedImg) return;
    const canvas = DOM.cropCanvas;
    const cw = canvas.width;
    const ch = canvas.height;

    const sw = 240;
    const sh = Math.round(sw * (ch / cw));
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sw;
    sampleCanvas.height = sh;
    const sCtx = sampleCanvas.getContext('2d');
    sCtx.drawImage(cropState.cachedRotatedImg, 0, 0, sw, sh);

    const imgData = sCtx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    const lum = new Uint8Array(sw * sh);
    for (let i = 0; i < data.length; i += 4) {
        lum[i / 4] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    }

    let borderSum = 0, borderCount = 0;
    for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
            if (x < 6 || x >= sw - 6 || y < 6 || y >= sh - 6) {
                borderSum += lum[y * sw + x];
                borderCount++;
            }
        }
    }
    const borderAvg = borderSum / Math.max(1, borderCount);

    let minX = sw, maxX = 0, minY = sh, maxY = 0;
    const threshold = 18;

    for (let y = 6; y < sh - 6; y++) {
        for (let x = 6; x < sw - 6; x++) {
            if (Math.abs(lum[y * sw + x] - borderAvg) > threshold) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    const scaleX = cw / sw;
    const scaleY = ch / sh;
    let detectedW = (maxX - minX) * scaleX;
    let detectedH = (maxY - minY) * scaleY;

    if (detectedW > cw * 0.25 && detectedH > ch * 0.25 && minX < maxX && minY < maxY) {
        let boxX = minX * scaleX;
        let boxY = minY * scaleY;

        if (cropState.aspect === 'cr80') {
            const ratio = 85.6 / 53.98;
            detectedH = detectedW / ratio;
            if (boxY + detectedH > ch) {
                detectedH = ch - boxY;
                detectedW = detectedH * ratio;
            }
        }

        cropState.cropBox = {
            x: Math.max(0, Math.min(cw - detectedW, boxX)),
            y: Math.max(0, Math.min(ch - detectedH, boxY)),
            w: detectedW,
            h: detectedH
        };
        showToast(t('outlineFound'), 'success', 'target');
    } else {
        resetBoxAndQuadBounds();
        showToast(t('cr80Centered'), 'info');
    }

    drawCropCanvas();
}

function convexHullPoints(points) {
    if (points.length < 3) return points.slice();
    const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
        upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

function orderQuadCorners(pts) {
    let tl = pts[0], tr = pts[0], br = pts[0], bl = pts[0];
    let minTL = Infinity, maxTR = -Infinity, maxBR = -Infinity, minBL = Infinity;
    for (const p of pts) {
        const sum = p.x + p.y;
        const diff = p.x - p.y;
        if (sum < minTL) { minTL = sum; tl = p; }
        if (diff > maxTR) { maxTR = diff; tr = p; }
        if (sum > maxBR) { maxBR = sum; br = p; }
        if (diff < minBL) { minBL = diff; bl = p; }
    }
    return { tl: { ...tl }, tr: { ...tr }, br: { ...br }, bl: { ...bl } };
}

function minAreaRectCorners(hull) {
    if (hull.length < 3) return null;
    let best = null;
    const n = hull.length;
    for (let i = 0; i < n; i++) {
        const a = hull[i];
        const b = hull[(i + 1) % n];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const vx = -uy;
        const vy = ux;
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
        for (const p of hull) {
            const u = p.x * ux + p.y * uy;
            const v = p.x * vx + p.y * vy;
            if (u < minU) minU = u;
            if (u > maxU) maxU = u;
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        }
        const area = (maxU - minU) * (maxV - minV);
        if (!best || area < best.area) best = { area, minU, maxU, minV, maxV, ux, uy, vx, vy };
    }
    const corner = (u, v) => ({ x: u * best.ux + v * best.vx, y: u * best.uy + v * best.vy });
    return orderQuadCorners([
        corner(best.minU, best.minV),
        corner(best.maxU, best.minV),
        corner(best.maxU, best.maxV),
        corner(best.minU, best.maxV)
    ]);
}

function leastSquaresLine(points) {
    if (!points || points.length < 2) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    const n = points.length;
    for (const p of points) {
        sx += p.x;
        sy += p.y;
        sxx += p.x * p.x;
        sxy += p.x * p.y;
    }
    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-6) {
        return { vertical: true, x: sx / n };
    }
    const m = (n * sxy - sx * sy) / denom;
    const b = (sy - m * sx) / n;
    return { vertical: false, m, b };
}

function intersectLines(l1, l2) {
    if (!l1 || !l2) return null;
    if (l1.vertical && l2.vertical) return null;
    if (l1.vertical) return { x: l1.x, y: l2.m * l1.x + l2.b };
    if (l2.vertical) return { x: l2.x, y: l1.m * l2.x + l1.b };
    const denom = l1.m - l2.m;
    if (Math.abs(denom) < 1e-6) return null;
    const x = (l2.b - l1.b) / denom;
    return { x, y: l1.m * x + l1.b };
}

function fitEdgeLine(p, q, mag, w, h) {
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const pts = [];
    const steps = Math.max(36, Math.round(len * 1.4));
    const band = 12;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = p.x + dx * t;
        const cy = p.y + dy * t;
        let best = null;
        let bestM = 0;
        for (let k = -band; k <= band; k++) {
            const x = Math.round(cx + nx * k);
            const y = Math.round(cy + ny * k);
            if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
            const m = mag[y * w + x];
            if (m > bestM) {
                bestM = m;
                best = { x, y };
            }
        }
        if (best && bestM > 8) pts.push(best);
    }
    return leastSquaresLine(pts);
}

function refineQuadOnEdges(quad, mag, w, h) {
    const sides = [
        [quad.tl, quad.tr],
        [quad.tr, quad.br],
        [quad.br, quad.bl],
        [quad.bl, quad.tl]
    ];
    const lines = sides.map(([a, b]) => fitEdgeLine(a, b, mag, w, h) || leastSquaresLine([a, b]));
    const tl = intersectLines(lines[3], lines[0]);
    const tr = intersectLines(lines[0], lines[1]);
    const br = intersectLines(lines[1], lines[2]);
    const bl = intersectLines(lines[2], lines[3]);
    if (!tl || !tr || !br || !bl) return quad;
    if (![tl, tr, br, bl].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) return quad;
    return { tl, tr, br, bl };
}

function cardQuadArea(quad) {
    return Math.abs(
        quad.tl.x * quad.tr.y - quad.tr.x * quad.tl.y +
        quad.tr.x * quad.br.y - quad.br.x * quad.tr.y +
        quad.br.x * quad.bl.y - quad.bl.x * quad.br.y +
        quad.bl.x * quad.tl.y - quad.tl.x * quad.bl.y
    ) / 2;
}

function cardQuadSize(quad) {
    const width = (Math.hypot(quad.tr.x - quad.tl.x, quad.tr.y - quad.tl.y) + Math.hypot(quad.br.x - quad.bl.x, quad.br.y - quad.bl.y)) / 2;
    const height = (Math.hypot(quad.bl.x - quad.tl.x, quad.bl.y - quad.tl.y) + Math.hypot(quad.br.x - quad.tr.x, quad.br.y - quad.tr.y)) / 2;
    return { width, height };
}

function isConvexQuad(quad) {
    const pts = [quad.tl, quad.tr, quad.br, quad.bl];
    let sign = 0;
    for (let i = 0; i < 4; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % 4];
        const c = pts[(i + 2) % 4];
        const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (Math.abs(z) < 1e-6) continue;
        const s = Math.sign(z);
        if (!sign) sign = s;
        else if (s !== sign) return false;
    }
    return true;
}

function isValidCardQuad(quad, w, h) {
    const pts = [quad.tl, quad.tr, quad.br, quad.bl];
    for (const p of pts) {
        if (p.x < -12 || p.y < -12 || p.x > w + 12 || p.y > h + 12) return false;
    }
    if (!isConvexQuad(quad)) return false;
    const { width, height } = cardQuadSize(quad);
    if (width < w * 0.14 || height < h * 0.12) return false;
    const area = cardQuadArea(quad);
    if (area < w * h * 0.055 || area > w * h * 0.97) return false;
    const ratio = Math.max(width, height) / Math.max(1, Math.min(width, height));
    return ratio > 1.12 && ratio < 2.7;
}

function meanSideMagnitude(quad, mag, w, h) {
    const sides = [[quad.tl, quad.tr], [quad.tr, quad.br], [quad.br, quad.bl], [quad.bl, quad.tl]];
    let sum = 0;
    let n = 0;
    for (const [a, b] of sides) {
        const steps = 28;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = Math.round(a.x + (b.x - a.x) * t);
            const y = Math.round(a.y + (b.y - a.y) * t);
            if (x < 0 || y < 0 || x >= w || y >= h) continue;
            sum += mag[y * w + x];
            n++;
        }
    }
    return n ? sum / n : 0;
}

function scoreCardQuad(quad, mag, w, h) {
    const { width, height } = cardQuadSize(quad);
    const fill = cardQuadArea(quad) / (w * h);
    const cr80 = 85.6 / 53.98;
    const ratio = Math.max(width, height) / Math.max(1, Math.min(width, height));
    const ratioScore = 1 - Math.min(1, Math.abs(ratio - cr80) / 0.75);
    const fillScore = (fill > 0.16 && fill < 0.88) ? 1 : (fill > 0.08 && fill < 0.95 ? 0.45 : 0.12);
    const edgeScore = Math.min(1, meanSideMagnitude(quad, mag, w, h) / 42);
    const oppW = Math.hypot(quad.tr.x - quad.tl.x, quad.tr.y - quad.tl.y) / Math.max(1, Math.hypot(quad.br.x - quad.bl.x, quad.br.y - quad.bl.y));
    const oppH = Math.hypot(quad.bl.x - quad.tl.x, quad.bl.y - quad.tl.y) / Math.max(1, Math.hypot(quad.br.x - quad.tr.x, quad.br.y - quad.tr.y));
    const parallelScore = 1 - Math.min(1, (Math.abs(1 - oppW) + Math.abs(1 - oppH)) / 1.8);
    return ratioScore * 0.32 + fillScore * 0.22 + edgeScore * 0.34 + parallelScore * 0.12;
}

function thetaDiffDeg(a, b) {
    let d = Math.abs(a - b) % 180;
    if (d > 90) d = 180 - d;
    return d;
}

function intersectRhoTheta(l1, l2) {
    const c1 = Math.cos(l1.rad);
    const s1 = Math.sin(l1.rad);
    const c2 = Math.cos(l2.rad);
    const s2 = Math.sin(l2.rad);
    const det = c1 * s2 - c2 * s1;
    if (Math.abs(det) < 1e-6) return null;
    return {
        x: (l1.rho * s2 - l2.rho * s1) / det,
        y: (c1 * l2.rho - c2 * l1.rho) / det
    };
}

function computeCardEdges(data, w, h) {
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    const blur = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            blur[i] = (
                gray[i - w - 1] + 2 * gray[i - w] + gray[i - w + 1] +
                2 * gray[i - 1] + 4 * gray[i] + 2 * gray[i + 1] +
                gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]
            ) / 16;
        }
    }

    const mag = new Float32Array(w * h);
    const gxA = new Float32Array(w * h);
    const gyA = new Float32Array(w * h);
    let magSum = 0;
    let magSq = 0;
    let magCount = 0;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const gx = -blur[i - w - 1] + blur[i - w + 1] - 2 * blur[i - 1] + 2 * blur[i + 1] - blur[i + w - 1] + blur[i + w + 1];
            const gy = -blur[i - w - 1] - 2 * blur[i - w] - blur[i - w + 1] + blur[i + w - 1] + 2 * blur[i + w] + blur[i + w + 1];
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
            const m = Math.hypot(gx, gy) + chroma * 0.22;
            gxA[i] = gx;
            gyA[i] = gy;
            mag[i] = m;
            magSum += m;
            magSq += m * m;
            magCount++;
        }
    }

    const mean = magSum / Math.max(1, magCount);
    const std = Math.sqrt(Math.max(0, magSq / Math.max(1, magCount) - mean * mean));
    const high = Math.max(22, mean + 1.15 * std);
    const low = Math.max(10, high * 0.38);

    const keep = new Uint8Array(w * h);
    const strong = [];
    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            const i = y * w + x;
            const m = mag[i];
            if (m < low) continue;
            const gx = gxA[i];
            const gy = gyA[i];
            const ax = Math.abs(gx);
            const ay = Math.abs(gy);
            let n1;
            let n2;
            if (ax >= ay) {
                n1 = mag[i - 1];
                n2 = mag[i + 1];
            } else {
                n1 = mag[i - w];
                n2 = mag[i + w];
            }
            if (m < n1 || m < n2) continue;
            if (m >= high) {
                keep[i] = 2;
                strong.push(i);
            } else {
                keep[i] = 1;
            }
        }
    }

    for (let s = 0; s < strong.length; s++) {
        const i = strong[s];
        const x = i % w;
        const y = (i / w) | 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 1 || ny < 1 || nx >= w - 1 || ny >= h - 1) continue;
                const ni = ny * w + nx;
                if (keep[ni] === 1) {
                    keep[ni] = 2;
                    strong.push(ni);
                }
            }
        }
    }

    const edges = [];
    for (let s = 0; s < strong.length; s++) {
        const i = strong[s];
        edges.push({ x: i % w, y: (i / w) | 0 });
    }
    return { mag, gx: gxA, gy: gyA, edges };
}

function houghDetectLines(edges, mag, w, h, maxLines) {
    const numTheta = 180;
    const maxRho = Math.hypot(w, h);
    const numRho = Math.ceil(maxRho * 2) + 3;
    const acc = new Float32Array(numTheta * numRho);
    const cosT = new Float32Array(numTheta);
    const sinT = new Float32Array(numTheta);
    for (let t = 0; t < numTheta; t++) {
        const a = t * Math.PI / numTheta;
        cosT[t] = Math.cos(a);
        sinT[t] = Math.sin(a);
    }

    const margin = 3;
    for (const p of edges) {
        const border = (p.x < margin || p.y < margin || p.x >= w - margin || p.y >= h - margin) ? 0.28 : 1;
        const weight = (mag[p.y * w + p.x] + 6) * border;
        for (let t = 0; t < numTheta; t++) {
            const rho = p.x * cosT[t] + p.y * sinT[t];
            const r = Math.round(rho + maxRho);
            if (r < 0 || r >= numRho) continue;
            acc[t * numRho + r] += weight;
        }
    }

    const peaks = [];
    for (let t = 0; t < numTheta; t++) {
        for (let r = 2; r < numRho - 2; r++) {
            const v = acc[t * numRho + r];
            if (v < 80) continue;
            let isMax = true;
            for (let dt = -4; dt <= 4 && isMax; dt++) {
                for (let dr = -5; dr <= 5; dr++) {
                    if (!dt && !dr) continue;
                    let tt = t + dt;
                    let rr = r + dr;
                    if (tt < 0) tt += numTheta;
                    if (tt >= numTheta) tt -= numTheta;
                    if (rr < 0 || rr >= numRho) continue;
                    if (acc[tt * numRho + rr] > v) { isMax = false; break; }
                }
            }
            if (isMax) peaks.push({ theta: t, rad: t * Math.PI / numTheta, rho: r - maxRho, votes: v });
        }
    }

    peaks.sort((a, b) => b.votes - a.votes);
    const lines = [];
    for (const p of peaks) {
        if (lines.some((l) => thetaDiffDeg(l.theta, p.theta) < 8 && Math.abs(l.rho - p.rho) < 8)) continue;
        lines.push(p);
        if (lines.length >= maxLines) break;
    }
    return lines;
}

function quadFromLinePair(a, b, c, d) {
    const pts = [
        intersectRhoTheta(a, c),
        intersectRhoTheta(a, d),
        intersectRhoTheta(b, c),
        intersectRhoTheta(b, d)
    ];
    if (pts.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
    return orderQuadCorners(pts);
}

function quadFromHoughLines(edges, mag, w, h) {
    if (edges.length < 60) return null;
    const lines = houghDetectLines(edges, mag, w, h, 18);
    if (lines.length < 4) return null;
    let best = null;
    let bestScore = -1;
    const n = lines.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (thetaDiffDeg(lines[i].theta, lines[j].theta) > 14) continue;
            if (Math.abs(lines[i].rho - lines[j].rho) < Math.min(w, h) * 0.12) continue;
            for (let k = 0; k < n; k++) {
                if (k === i || k === j) continue;
                if (Math.abs(thetaDiffDeg(lines[i].theta, lines[k].theta) - 90) > 24) continue;
                for (let m = k + 1; m < n; m++) {
                    if (m === i || m === j) continue;
                    if (thetaDiffDeg(lines[k].theta, lines[m].theta) > 14) continue;
                    if (Math.abs(lines[k].rho - lines[m].rho) < Math.min(w, h) * 0.10) continue;
                    const quad = quadFromLinePair(lines[i], lines[j], lines[k], lines[m]);
                    if (!quad || !isValidCardQuad(quad, w, h)) continue;
                    const s = scoreCardQuad(quad, mag, w, h);
                    if (s > bestScore) {
                        bestScore = s;
                        best = quad;
                    }
                }
            }
        }
    }
    return best;
}

function quadFromForegroundMask(data, w, h) {
    let rs = 0, gs = 0, bs = 0, n = 0;
    const add = (x, y) => {
        const i = (y * w + x) * 4;
        rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
    };
    for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
    for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y); }
    const br = rs / n, bg = gs / n, bb = bs / n;
    let varSum = 0;
    const varAdd = (x, y) => {
        const i = (y * w + x) * 4;
        varSum += Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
    };
    for (let x = 0; x < w; x++) { varAdd(x, 0); varAdd(x, h - 1); }
    for (let y = 0; y < h; y++) { varAdd(0, y); varAdd(w - 1, y); }
    const thresh = Math.max(34, Math.min(88, (varSum / n) * 2.8 + 22));

    const bgMask = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (bgMask[p]) return;
        const i = p * 4;
        const dist = Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
        if (dist > thresh) return;
        bgMask[p] = 1;
        stack.push(x, y);
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
        const y = stack.pop();
        const x = stack.pop();
        push(x - 1, y);
        push(x + 1, y);
        push(x, y - 1);
        push(x, y + 1);
    }

    let fg = 0;
    const contour = [];
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const p = y * w + x;
            if (bgMask[p]) continue;
            fg++;
            if (bgMask[p - 1] || bgMask[p + 1] || bgMask[p - w] || bgMask[p + w]) {
                contour.push({ x, y });
            }
        }
    }
    const fill = fg / (w * h);
    if (fill < 0.08 || fill > 0.92 || contour.length < 24) return null;
    const hull = convexHullPoints(contour);
    return minAreaRectCorners(hull);
}

function quadFromEdgeHull(edges, mag, w, h) {
    if (edges.length < 40) return null;
    const inner = edges.filter((p) => p.x > 4 && p.y > 4 && p.x < w - 5 && p.y < h - 5);
    const pts = inner.length > 40 ? inner : edges;
    const hull = convexHullPoints(pts);
    return minAreaRectCorners(hull);
}

function snapQuadCorners(quad, mag, gx, gy, w, h) {
    const keys = ['tl', 'tr', 'br', 'bl'];
    const snapped = [];
    const win = 11;
    for (const key of keys) {
        const p = quad[key];
        let best = { x: p.x, y: p.y, s: -1 };
        const x0 = Math.round(p.x);
        const y0 = Math.round(p.y);
        for (let dy = -win; dy <= win; dy++) {
            for (let dx = -win; dx <= win; dx++) {
                const x = x0 + dx;
                const y = y0 + dy;
                if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) continue;
                const i = y * w + x;
                const corner = Math.abs(gx[i]) * Math.abs(gy[i]);
                const s = mag[i] * 0.65 + corner * 0.08;
                if (s > best.s) best = { x, y, s };
            }
        }
        snapped.push({ x: best.x, y: best.y });
    }
    return orderQuadCorners(snapped);
}

function applyDetectedQuad(quad, cw, ch, sw, sh) {
    const sx = cw / sw;
    const sy = ch / sh;
    const map = (p) => ({
        x: Math.max(-2, Math.min(cw + 2, p.x * sx)),
        y: Math.max(-2, Math.min(ch + 2, p.y * sy))
    });
    cropState.quadPoints = {
        tl: map(quad.tl),
        tr: map(quad.tr),
        br: map(quad.br),
        bl: map(quad.bl)
    };
    const xs = [quad.tl.x, quad.tr.x, quad.br.x, quad.bl.x].map((v) => v * sx);
    const ys = [quad.tl.y, quad.tr.y, quad.br.y, quad.bl.y].map((v) => v * sy);
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(cw, Math.max(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxY = Math.min(ch, Math.max(...ys));
    cropState.cropBox = { x: minX, y: minY, w: Math.max(8, maxX - minX), h: Math.max(8, maxY - minY) };
}

function detectDocumentQuad(showNotification = true) {
    if (!cropState.cachedRotatedImg) return;
    const cw = DOM.cropCanvas.width;
    const ch = DOM.cropCanvas.height;
    const src = cropState.cachedRotatedImg;
    const maxSide = 800;
    const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
    const sw = Math.max(140, Math.round(src.width * scale));
    const sh = Math.max(140, Math.round(src.height * scale));

    const sample = document.createElement('canvas');
    sample.width = sw;
    sample.height = sh;
    const sCtx = sample.getContext('2d', { willReadFrequently: true });
    sCtx.drawImage(src, 0, 0, sw, sh);
    const imgData = sCtx.getImageData(0, 0, sw, sh);
    const d = imgData.data;
    const { mag, gx, gy, edges } = computeCardEdges(d, sw, sh);

    const raw = [
        quadFromHoughLines(edges, mag, sw, sh),
        quadFromForegroundMask(d, sw, sh),
        quadFromEdgeHull(edges, mag, sw, sh)
    ].filter(Boolean);

    let best = null;
    let bestScore = -1;
    for (let quad of raw) {
        quad = refineQuadOnEdges(quad, mag, sw, sh);
        quad = snapQuadCorners(quad, mag, gx, gy, sw, sh);
        if (!isValidCardQuad(quad, sw, sh)) continue;
        const s = scoreCardQuad(quad, mag, sw, sh);
        if (s > bestScore) {
            bestScore = s;
            best = quad;
        }
    }

    if (best && bestScore >= 0.18) {
        applyDetectedQuad(best, cw, ch, sw, sh);
        if (showNotification) showToast(t('cornersSnapped'), 'success', 'target');
        drawCropCanvas();
        return;
    }

    resetQuadPoints();
    if (showNotification) showToast(t('noEdge'), 'info', 'ruler');
    drawCropCanvas();
}

function resetQuadPoints() {
    resetBoxAndQuadBounds();
    drawCropCanvas();
}

// Transformación de perspectiva exacta (Homografía bilineal en malla triangular acelerada)
function warpQuadToRectangle(sourceImg, qp, outW, outH) {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const ctx = outCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const steps = 24; // Malla de 24x24 (1152 triángulos) para nitidez fotográfica
    const p0 = qp.tl, p1 = qp.tr, p2 = qp.br, p3 = qp.bl;

    function getQuadPoint(u, v) {
        return {
            x: (1 - u) * (1 - v) * p0.x + u * (1 - v) * p1.x + u * v * p2.x + (1 - u) * v * p3.x,
            y: (1 - u) * (1 - v) * p0.y + u * (1 - v) * p1.y + u * v * p2.y + (1 - u) * v * p3.y
        };
    }

    for (let y = 0; y < steps; y++) {
        const v0 = y / steps;
        const v1 = (y + 1) / steps;
        const dy0 = v0 * outH;
        const dy1 = v1 * outH;

        for (let x = 0; x < steps; x++) {
            const u0 = x / steps;
            const u1 = (x + 1) / steps;
            const dx0 = u0 * outW;
            const dx1 = u1 * outW;

            const pt00 = getQuadPoint(u0, v0);
            const pt10 = getQuadPoint(u1, v0);
            const pt01 = getQuadPoint(u0, v1);
            const pt11 = getQuadPoint(u1, v1);

            renderMappedTriangle(ctx, sourceImg,
                pt00, pt10, pt01,
                { x: dx0, y: dy0 }, { x: dx1, y: dy0 }, { x: dx0, y: dy1 }
            );

            renderMappedTriangle(ctx, sourceImg,
                pt10, pt11, pt01,
                { x: dx1, y: dy0 }, { x: dx1, y: dy1 }, { x: dx0, y: dy1 }
            );
        }
    }

    return outCanvas;
}

function renderMappedTriangle(ctx, img, s0, s1, s2, d0, d1, d2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y);
    ctx.lineTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.closePath();
    ctx.clip();

    const denom = (s0.x * (s1.y - s2.y) - s1.x * (s0.y - s2.y) + s2.x * (s0.y - s1.y));
    if (Math.abs(denom) < 0.0001) {
        ctx.restore();
        return;
    }

    const a = (d0.x * (s1.y - s2.y) - d1.x * (s0.y - s2.y) + d2.x * (s0.y - s1.y)) / denom;
    const b = (d0.y * (s1.y - s2.y) - d1.y * (s0.y - s2.y) + d2.y * (s0.y - s1.y)) / denom;
    const c = (s0.x * (d1.x - d2.x) - s1.x * (d0.x - d2.x) + s2.x * (d0.x - d1.x)) / denom;
    const d = (s0.x * (d1.y - d2.y) - s1.x * (d0.y - d2.y) + s2.x * (d0.y - d1.y)) / denom;
    const e = (s0.x * (s1.y * d2.x - s2.y * d1.x) - s1.x * (s0.y * d2.x - s2.y * d0.x) + s2.x * (s0.y * d1.x - s1.y * d0.x)) / denom;
    const f = (s0.x * (s1.y * d2.y - s2.y * d1.y) - s1.x * (s0.y * d2.y - s2.y * d0.y) + s2.x * (s0.y * d1.y - s1.y * d0.y)) / denom;

    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
}

function applyCroppedResult() {
    if (!cropState.cachedRotatedImg) return;

    let croppedCanvas = null;

    if (cropState.mode === 'quad') {
        const qp = cropState.quadPoints;
        const wTop = Math.hypot(qp.tr.x - qp.tl.x, qp.tr.y - qp.tl.y);
        const wBot = Math.hypot(qp.br.x - qp.bl.x, qp.br.y - qp.bl.y);
        const hLeft = Math.hypot(qp.bl.x - qp.tl.x, qp.bl.y - qp.tl.y);
        const hRight = Math.hypot(qp.br.x - qp.tr.x, qp.br.y - qp.tr.y);

        const avgW = Math.max(120, Math.round((wTop + wBot) / 2));
        const avgH = Math.max(80, Math.round((hLeft + hRight) / 2));

        const cr80Ratio = 85.6 / 53.98;
        const isHorizontal = avgW >= avgH;

        let outW, outH;
        if (isHorizontal) {
            outW = Math.max(500, avgW);
            outH = Math.round(outW / cr80Ratio);
        } else {
            outH = Math.max(500, avgH);
            outW = Math.round(outH / cr80Ratio);
        }

        croppedCanvas = warpQuadToRectangle(cropState.cachedRotatedImg, qp, outW, outH);
    } else {
        const box = cropState.cropBox;
        if (box.w <= 5 || box.h <= 5) return;
        croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = Math.round(box.w);
        croppedCanvas.height = Math.round(box.h);
        const ctx = croppedCanvas.getContext('2d');
        ctx.drawImage(
            cropState.cachedRotatedImg,
            box.x, box.y, box.w, box.h,
            0, 0, croppedCanvas.width, croppedCanvas.height
        );
    }

    const card = STATE.cards[cropState.cardId];
    card.croppedCanvas = croppedCanvas;
    card.rawImage = cropState.sourceImg;
    card.cropRect = { ...cropState.cropBox };
    card.cropQuad = {
        tl: { ...cropState.quadPoints.tl },
        tr: { ...cropState.quadPoints.tr },
        br: { ...cropState.quadPoints.br },
        bl: { ...cropState.quadPoints.bl }
    };
    card.cropRotation90 = cropState.rotation90;
    card.cropFineAngle = cropState.fineAngle;
    card.rotation = 0; // Se reinicia rotación en la hoja para garantizar perpendicularidad sin doble giro
    card.cachedCanvas = null;
    card.dirty = true;

    // Proporción estándar de carnet perpendicular
    card.widthMm = 85.6;
    card.heightMm = 85.6 * (croppedCanvas.height / croppedCanvas.width);

    // Configuración preferida estándar solicitada por el usuario:
    card.scale = 150;
    card.borderRadiusMm = 5;
    card.xMm = 0;
    if (STATE.layout.mode === 'single') {
        card.yMm = 0;
    } else {
        card.yMm = (cropState.cardId === 'frente') ? 21 : -8;
    }

    if (STATE.syncCards) {
        const otherId = cropState.cardId === 'frente' ? 'dorso' : 'frente';
        STATE.cards[otherId].scale = 150;
        STATE.cards[otherId].borderRadiusMm = 5;
    }

    setActiveTab(cropState.cardId);
    if (window.innerWidth < 1024) {
        STATE.selectedCardId = null;
    } else {
        STATE.selectedCardId = cropState.cardId;
    }
    syncControlsFromActiveCard();

    DOM.cropModal.classList.add('hidden');
    hideCropLoupe();
    updateDropzoneUI(cropState.cardId, croppedCanvas.toDataURL('image/jpeg', 0.94));
    saveHistoryState(`Recortar & Enderezar ${card.name}`);
    scheduleRender();
    showToast(t('cropped', { name: card.name }), 'success');

    if (cropState.cardId === 'dorso' || hasDorsoImage()) dismissDorsoPrompt();
    if (cropState.cardId === 'frente' && !hasDorsoImage()) {
        setTimeout(() => {
            showDorsoPrompt();
        }, 800);
    }
}

// Eventos del modal de recorte interactivo
DOM.btnCloseCrop.addEventListener('click', () => { DOM.cropModal.classList.add('hidden'); hideCropLoupe(); });
DOM.btnCancelCrop.addEventListener('click', () => { DOM.cropModal.classList.add('hidden'); hideCropLoupe(); });

if (DOM.btnCropTabQuad) DOM.btnCropTabQuad.addEventListener('click', () => setCropMode('quad'));
if (DOM.btnCropTabRotate) DOM.btnCropTabRotate.addEventListener('click', () => setCropMode('straighten'));
if (DOM.btnCropTabBox) DOM.btnCropTabBox.addEventListener('click', () => setCropMode('box'));

if (DOM.btnCropAspectCr80) {
    DOM.btnCropAspectCr80.addEventListener('click', () => {
        cropState.aspect = 'cr80';
        DOM.btnCropAspectCr80.className = 'min-h-[42px] px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-sm flex items-center gap-1';
        DOM.btnCropAspectFree.className = 'min-h-[42px] px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700';
        const box = cropState.cropBox;
        const ratio = 85.6 / 53.98;
        box.h = box.w / ratio;
        if (box.y + box.h > DOM.cropCanvas.height) {
            box.y = Math.max(0, DOM.cropCanvas.height - box.h);
        }
        drawCropCanvas();
    });
}

if (DOM.btnCropAspectFree) {
    DOM.btnCropAspectFree.addEventListener('click', () => {
        cropState.aspect = 'free';
        DOM.btnCropAspectFree.className = 'min-h-[42px] px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-sm flex items-center gap-1';
        DOM.btnCropAspectCr80.className = 'min-h-[42px] px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700';
        drawCropCanvas();
    });
}

if (DOM.btnCropAutoDetect) DOM.btnCropAutoDetect.addEventListener('click', detectDocumentBounds);
if (DOM.btnCropQuadAuto) DOM.btnCropQuadAuto.addEventListener('click', () => detectDocumentQuad(true));
if (DOM.btnCropQuadReset) DOM.btnCropQuadReset.addEventListener('click', resetQuadPoints);
if (DOM.btnCropQuadRotLeft) DOM.btnCropQuadRotLeft.addEventListener('click', () => rotateCrop90(-90));
if (DOM.btnCropQuadRotRight) DOM.btnCropQuadRotRight.addEventListener('click', () => rotateCrop90(90));

if (DOM.btnCropRotateLeft) DOM.btnCropRotateLeft.addEventListener('click', () => rotateCrop90(-90));
if (DOM.btnCropRotateRight) DOM.btnCropRotateRight.addEventListener('click', () => rotateCrop90(90));

if (DOM.cropAngleSlider) {
    DOM.cropAngleSlider.addEventListener('input', (e) => setFineCropAngle(parseFloat(e.target.value)));
}

if (DOM.btnCropAngleReset) {
    DOM.btnCropAngleReset.addEventListener('click', () => setFineCropAngle(0));
}

if (DOM.btnCropToggleGrid) {
    DOM.btnCropToggleGrid.addEventListener('click', () => {
        cropState.showGrid = !cropState.showGrid;
        DOM.btnCropToggleGrid.className = cropState.showGrid
            ? 'min-h-[38px] px-2.5 py-1 bg-blue-600 text-white rounded-xl font-bold text-xs'
            : 'min-h-[38px] px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs';
        drawCropCanvas();
    });
}

// Selector de Zoom de Lupa (1X, 1.5X, 2X, 3X)
if (DOM.btnLoupeZoom1) DOM.btnLoupeZoom1.addEventListener('click', () => setLoupeZoom(1.0));
if (DOM.btnLoupeZoom15) DOM.btnLoupeZoom15.addEventListener('click', () => setLoupeZoom(1.5));
if (DOM.btnLoupeZoom2) DOM.btnLoupeZoom2.addEventListener('click', () => setLoupeZoom(2.0));
if (DOM.btnLoupeZoom3) DOM.btnLoupeZoom3.addEventListener('click', () => setLoupeZoom(3.0));
if (DOM.cropLoupeBadge) DOM.cropLoupeBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    cycleLoupeZoom();
});

DOM.cropCanvas.addEventListener('pointerdown', onCropPointerDown);
DOM.cropCanvas.addEventListener('pointermove', onCropPointerMove);
DOM.cropCanvas.addEventListener('pointerup', onCropPointerUp);
DOM.cropCanvas.addEventListener('pointercancel', onCropPointerUp);

DOM.btnApplyCrop.addEventListener('click', applyCroppedResult);

// =============================================================================
// 16. MODAL DE CÁMARA (Escaneo Inteligente con Guía Exacta CR80 y Recorte Automático)
// =============================================================================

function openCameraModal(cardId) {
    targetCameraCard = cardId;
    DOM.cameraModal.classList.remove('hidden');
    startCameraStream();
}

function startCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const constraints = {
        video: {
            facingMode: cameraFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        cameraStream = stream;
        DOM.cameraVideo.srcObject = stream;
    }).catch(err => {
        console.error('Error abriendo cámara:', err);
        closeCameraModal();
        showToast(t('noCamera'), 'warning');
    });
}

function switchCameraFacingMode() {
    cameraFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    showToast(cameraFacingMode === 'environment' ? t('camRear') : t('camFront'), 'info');
    startCameraStream();
}

function closeCameraModal() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    DOM.cameraModal.classList.add('hidden');
}

function autoProcessCardFromImage(cardId, sourceImg) {
    if (!sourceImg) return;

    // 1. Configurar estado temporal de recorte para análisis
    cropState.cardId = cardId;
    cropState.sourceImg = sourceImg;
    cropState.cachedRotatedImg = sourceImg;
    cropState.fineAngle = 0;
    cropState.rotation90 = 0;

    const cw = sourceImg.width;
    const ch = sourceImg.height;

    // Asegurar tamaño base en canvas de recorte
    DOM.cropCanvas.width = cw;
    DOM.cropCanvas.height = ch;

    // 2. Detección automática inteligente de las 4 esquinas de perspectiva
    detectDocumentQuad(false);
    const qp = cropState.quadPoints;

    // 3. Rectificar perspectiva a rectángulo plano perpendicular CR80 (85.6 x 53.98)
    const wTop = Math.hypot(qp.tr.x - qp.tl.x, qp.tr.y - qp.tl.y);
    const wBot = Math.hypot(qp.br.x - qp.bl.x, qp.br.y - qp.bl.y);
    const hLeft = Math.hypot(qp.bl.x - qp.tl.x, qp.bl.y - qp.tl.y);
    const hRight = Math.hypot(qp.br.x - qp.tr.x, qp.br.y - qp.tr.y);

    const avgW = Math.max(120, Math.round((wTop + wBot) / 2));
    const avgH = Math.max(80, Math.round((hLeft + hRight) / 2));

    const cr80Ratio = 85.6 / 53.98;
    const isHorizontal = avgW >= avgH;

    let outW, outH;
    if (isHorizontal) {
        outW = Math.max(600, avgW);
        outH = Math.round(outW / cr80Ratio);
    } else {
        outH = Math.max(600, avgH);
        outW = Math.round(outH / cr80Ratio);
    }

    const unwarpedCanvas = warpQuadToRectangle(sourceImg, qp, outW, outH);

    // 4. Asignar los valores predeterminados exactos solicitados por el usuario
    const card = STATE.cards[cardId];
    card.rawImage = sourceImg;
    card.croppedCanvas = unwarpedCanvas;
    card.cropRect = { ...cropState.cropBox };
    card.cropQuad = {
        tl: { ...qp.tl },
        tr: { ...qp.tr },
        br: { ...qp.br },
        bl: { ...qp.bl }
    };
    card.cropRotation90 = 0;
    card.cropFineAngle = 0;
    card.rotation = 0;

    // Dimensiones proporcionales CR80
    card.widthMm = 85.6;
    card.heightMm = 85.6 * (unwarpedCanvas.height / unwarpedCanvas.width);

    // Ajustes automáticos preferidos:
    card.scale = 150; // 150% de tamaño
    card.borderRadiusMm = 6; // 6 mm de esquinas redondeadas
    card.xMm = 0; // Centrado exacto en eje X

    // Centrado en eje Y:
    if (STATE.layout.mode === 'single') {
        card.yMm = 0;
    } else {
        card.yMm = (cardId === 'frente') ? 21 : -8; // Frente arriba (+21), Dorso abajo (-8)
    }

    card.filter = 'normal';
    card.brightness = 0;
    card.contrast = 0;
    card.cachedCanvas = null;
    card.dirty = true;

    // Sincronizar escala y radio a la otra cara si está vinculado
    if (STATE.syncCards) {
        const otherId = cardId === 'frente' ? 'dorso' : 'frente';
        STATE.cards[otherId].scale = 150;
        STATE.cards[otherId].borderRadiusMm = 5;
    }

    // 5. Actualizar interfaz y renderizar
    updateDropzoneUI(cardId, unwarpedCanvas.toDataURL('image/jpeg', 0.94));
    setActiveTab(cardId);
    if (window.innerWidth < 1024) {
        STATE.selectedCardId = null;
        setMobileView('canvas');
    } else {
        STATE.selectedCardId = cardId;
    }
    if (typeof syncControlsFromActiveCard === 'function') syncControlsFromActiveCard();
    if (cardId === 'dorso' || hasDorsoImage()) dismissDorsoPrompt();

    saveHistoryState(`Auto-escaneo ${card.name} (150% CR80 centrado)`);
    scheduleRender();

    showToast(t('autoStraight', { name: card.name }), 'success', 'sparkle');

    // 6. Si fue el frente y el dorso aún está vacío, sugerir de inmediato escanear el dorso
    if (cardId === 'frente' && !hasDorsoImage()) {
        setTimeout(() => {
            showDorsoPrompt();
        }, 900);
    }
}

function hasDorsoImage() {
    const dorso = STATE.cards && STATE.cards.dorso;
    return !!(dorso && (dorso.rawImage || dorso.croppedCanvas));
}

function hasFrenteImage() {
    const frente = STATE.cards && STATE.cards.frente;
    return !!(frente && (frente.rawImage || frente.croppedCanvas));
}

function showDorsoPrompt() {
    if (hasDorsoImage() || STATE.selectedCardId) {
        dismissDorsoPrompt();
        return;
    }
    if (DOM.bannerScanDorso) DOM.bannerScanDorso.classList.remove('hidden');
}

function dismissDorsoPrompt() {
    if (DOM.bannerScanDorso) {
        DOM.bannerScanDorso.classList.add('hidden');
    }
}

function captureCameraPhoto() {
    const video = DOM.cameraVideo;
    if (!video || !video.srcObject) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    if (!vw || !vh) return;

    // 1. Captura en resolución nativa completa
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = vw;
    fullCanvas.height = vh;
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx.imageSmoothingEnabled = true;
    fullCtx.imageSmoothingQuality = 'high';
    fullCtx.drawImage(video, 0, 0, vw, vh);

    closeCameraModal();

    const fullImg = new Image();
    fullImg.onload = () => {
        const card = STATE.cards[targetCameraCard];
        card.rawImage = fullImg;
        card.croppedCanvas = null;
        card.cachedCanvas = null;
        card.dirty = true;

        updateDropzoneUI(targetCameraCard, fullImg.src);
        setActiveTab(targetCameraCard);
        openCropModal(targetCameraCard, { autoDetect: true, defaultMode: 'quad' });

        if (window.innerWidth < 1024) {
            setMobileView('canvas');
        }
    };
    fullImg.src = fullCanvas.toDataURL('image/jpeg', 0.96);
}

// =============================================================================
// 17. MOTOR DE EXPORTACIÓN (Sin bordes ni rayas entrecortadas)
// =============================================================================

async function generateAndDownload() {
    const hasAnyImage = !!(STATE.cards.frente.rawImage || STATE.cards.dorso.rawImage);
    if (!hasAnyImage) {
        showToast(t('needImageExport'), 'warning');
        return;
    }

    const format = STATE.exportFormat;
    const light = !!STATE.exportLight;
    const dpi = light ? 300 : (format === 'pdf' ? STATE.exportDpi : 300);
    const loaderHint = light
        ? 'Alta calidad, comprimiendo a menos de 1 MB'
        : `Renderizando a ${dpi} DPI en formato ${format.toUpperCase()}`;

    showLoader('Generando Documento...', loaderHint);

    setTimeout(async () => {
        try {
            let result;
            if (format === 'pdf') {
                result = await exportPDFDocument({ light, dpi });
            } else {
                result = await exportImageDocument(format, dpi, { light });
            }

            hideLoader();
            triggerSuccessCelebration();
            const sizeNote = result && result.bytes ? ` (${formatFileSize(result.bytes)})` : '';
            showToast(t('downloaded', { format: format.toUpperCase(), size: sizeNote || '' }), 'success');
        } catch (err) {
            console.error('Error al exportar:', err);
            hideLoader();
            showToast(t('exportError'), 'error');
        }
    }, 120);
}

const EXPORT_MAX_BYTES = 1024 * 1024;

function updateExportOptionsUI() {
    const showDpi = STATE.exportFormat === 'pdf' && !STATE.exportLight;
    if (DOM.exportDpiSelect) DOM.exportDpiSelect.disabled = !showDpi;
    if (DOM.exportDpiWrap) DOM.exportDpiWrap.classList.toggle('hidden', !showDpi);
    if (DOM.exportFields) {
        DOM.exportFields.classList.toggle('grid-cols-2', showDpi);
        DOM.exportFields.classList.toggle('grid-cols-1', !showDpi);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExportFilename(ext) {
    const typed = (DOM.exportFilename && DOM.exportFilename.value) || STATE.exportName || '';
    let name = typed.trim().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
    name = name.replace(/\.(pdf|png|jpe?g|webp)$/i, '');
    if (!name) name = `Carnet_CardPDF_${STATE.paper.size.toUpperCase()}_${getFormattedTimestamp()}`;
    return `${name}.${ext}`;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) reject(new Error('blob'));
            else resolve(blob);
        }, mimeType, quality);
    });
}

function scaleCanvas(src, factor) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(src.width * factor));
    canvas.height = Math.max(1, Math.round(src.height * factor));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function renderSheetCanvas(dpi) {
    const mmToPx = dpi / 25.4;
    const widthPx = Math.round(STATE.paper.widthMm * mmToPx);
    const heightPx = Math.round(STATE.paper.heightMm * mmToPx);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = widthPx;
    exportCanvas.height = heightPx;
    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);
    const instances = getCardInstances(mmToPx, widthPx, heightPx);
    for (const inst of instances) {
        drawCardInstance(ctx, inst, mmToPx);
    }
    return exportCanvas;
}

async function encodeImageUnderLimit(canvas, format, maxBytes) {
    const mimeType = format === 'png' ? 'image/png' : (format === 'webp' ? 'image/webp' : 'image/jpeg');
    let current = canvas;
    let best = null;

    if (format === 'png') {
        for (let i = 0; i < 7; i++) {
            const blob = await canvasToBlob(current, 'image/png');
            best = blob;
            if (blob.size <= maxBytes) return blob;
            current = scaleCanvas(current, 0.82);
        }
        return best;
    }

    for (let pass = 0; pass < 4; pass++) {
        let lo = 0.52;
        let hi = 0.92;
        for (let i = 0; i < 7; i++) {
            const quality = (lo + hi) / 2;
            const blob = await canvasToBlob(current, mimeType, quality);
            if (blob.size <= maxBytes) {
                best = blob;
                lo = quality;
            } else {
                hi = quality;
                if (!best || blob.size < best.size) best = blob;
            }
        }
        if (best && best.size <= maxBytes) return best;
        current = scaleCanvas(current, 0.85);
    }
    return best;
}

async function exportPDFDocument(options = {}) {
    const { jsPDF } = window.jspdf;
    const light = !!options.light;
    const dpiSteps = light ? [300, 260, 220, 190] : [options.dpi || STATE.exportDpi];
    const qualities = light ? [0.88, 0.78, 0.68, 0.58] : [0.94];
    let chosen = null;

    for (const dpi of dpiSteps) {
        for (const quality of qualities) {
            const blob = await buildPdfBlob(jsPDF, dpi, quality);
            chosen = blob;
            if (!light || blob.size <= EXPORT_MAX_BYTES) break;
        }
        if (!light || (chosen && chosen.size <= EXPORT_MAX_BYTES)) break;
    }

    const filename = getExportFilename('pdf');
    downloadBlob(chosen, filename);
    return { bytes: chosen.size };
}

async function buildPdfBlob(jsPDF, dpi, jpegQuality) {
    const orientation = STATE.paper.orientation === 'portrait' ? 'p' : 'l';
    const format = STATE.paper.size === 'letter' ? 'letter' : 'a4';
    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
        compress: true
    });

    const mmToPx = dpi / 25.4;
    const highResCanvasWidth = STATE.paper.widthMm * mmToPx;
    const highResCanvasHeight = STATE.paper.heightMm * mmToPx;
    const instances = getCardInstances(mmToPx, highResCanvasWidth, highResCanvasHeight);

    for (const inst of instances) {
        const card = inst.card;
        if (card.dirty || !card.cachedCanvas) {
            processCardImage(card);
        }
        const roundedCanvas = createRoundedExportCanvas(card, inst.wMm, inst.hMm, mmToPx);
        const imgData = roundedCanvas.toDataURL('image/jpeg', jpegQuality);
        pdf.addImage(imgData, 'JPEG', inst.xMm, inst.yMm, inst.wMm, inst.hMm);

        if (STATE.layout.showCutLines) {
            pdf.setDrawColor(190, 190, 190);
            pdf.setLineWidth(0.2);
            pdf.setLineDashPattern([1.5, 1.5], 0);
            pdf.rect(inst.xMm - 0.5, inst.yMm - 0.5, inst.wMm + 1.0, inst.hMm + 1.0);
            pdf.setLineDashPattern([], 0);
        }
    }

    return pdf.output('blob');
}

async function exportImageDocument(format, dpi, options = {}) {
    const light = !!(options && options.light);
    const dpiSteps = light ? [300, 250, 210] : [dpi];
    let blob = null;
    let usedDpi = dpi;

    for (const stepDpi of dpiSteps) {
        usedDpi = stepDpi;
        const canvas = renderSheetCanvas(stepDpi);
        blob = light
            ? await encodeImageUnderLimit(canvas, format, EXPORT_MAX_BYTES)
            : await canvasToBlob(
                canvas,
                format === 'png' ? 'image/png' : (format === 'webp' ? 'image/webp' : 'image/jpeg'),
                format === 'png' ? 1.0 : 0.94
            );
        if (!light || (blob && blob.size <= EXPORT_MAX_BYTES)) break;
    }

    const filename = getExportFilename(format);
    downloadBlob(blob, filename);
    return { bytes: blob.size };
}

function createRoundedExportCanvas(card, wMm, hMm, mmToPx) {
    const canvas = document.createElement('canvas');
    const width = Math.round(wMm * mmToPx);
    const height = Math.round(hMm * mmToPx);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const r = Math.round(card.borderRadiusMm * mmToPx);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, 0, 0, width, height, r);
    ctx.clip();
    ctx.drawImage(card.cachedCanvas, 0, 0, width, height);
    ctx.restore();

    // Solo si el usuario explícitamente marcó 'borde sutil'
    if (STATE.layout.showBorder) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundedRectPath(ctx, 0, 0, width, height, r);
        ctx.stroke();
    }

    return canvas;
}

async function directPrintDocument() {
    showLoader('Preparando impresión...', 'Generando hoja a tamaño real');

    setTimeout(() => {
        const mmToPx = 300 / 25.4;
        const widthPx = Math.round(STATE.paper.widthMm * mmToPx);
        const heightPx = Math.round(STATE.paper.heightMm * mmToPx);

        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, widthPx, heightPx);

        const instances = getCardInstances(mmToPx, widthPx, heightPx);
        for (const inst of instances) {
            drawCardInstance(ctx, inst, mmToPx);
        }

        DOM.printImg.src = canvas.toDataURL('image/png', 1.0);
        DOM.printArea.classList.remove('hidden');

        hideLoader();
        window.print();
        DOM.printArea.classList.add('hidden');
    }, 100);
}

async function copyToClipboard() {
    try {
        const mmToPx = 200 / 25.4;
        const widthPx = Math.round(STATE.paper.widthMm * mmToPx);
        const heightPx = Math.round(STATE.paper.heightMm * mmToPx);

        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, widthPx, heightPx);

        const instances = getCardInstances(mmToPx, widthPx, heightPx);
        for (const inst of instances) {
            drawCardInstance(ctx, inst, mmToPx);
        }

        canvas.toBlob(async (blob) => {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showToast(t('copiedSheet'), 'success');
        });
    } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
        showToast(t('copyFail'), 'warning');
    }
}

// =============================================================================
// 18. NOTIFICACIONES, LOADERS Y CELEBRACIÓN
// =============================================================================

function showToast(message, type = 'info', iconName = null) {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-emerald-600 text-white shadow-emerald-500/25',
        error: 'bg-red-600 text-white shadow-red-500/25',
        warning: 'bg-amber-500 text-white shadow-amber-500/25',
        info: 'bg-slate-900 dark:bg-slate-800 text-white shadow-slate-900/25'
    };
    const fallbackIcon = { success: 'check', error: 'close', warning: 'target', info: null };
    const icon = SVG_ICONS[iconName] || SVG_ICONS[fallbackIcon[type]] || '';

    toast.className = `${colors[type] || colors.info} px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `${icon ? `<span class="shrink-0 inline-flex">${icon}</span>` : ''}<span>${message}</span>`;

    if (type === 'error' || type === 'warning') {
        reportClientError({ level: type, message, source: 'toast' });
    }

    DOM.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function showLoader(title, subtitle) {
    DOM.loaderTitle.textContent = title || t('processing');
    DOM.loaderSubtitle.textContent = subtitle || t('pleaseWait');
    DOM.loaderOverlay.classList.remove('hidden');
}

function hideLoader() {
    DOM.loaderOverlay.classList.add('hidden');
}

function triggerSuccessCelebration() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.75 }
        });
    }
}

function getFormattedTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// -----------------------------------------------------------------------------
// Puente de la migracion a modulos ES. Ver la nota en i18n.js.
// Estas cuatro las invoca i18n.js tras cambiar de idioma, con `typeof === function`:
// sin exponerlas, cambiar idioma dejaria de refrescar la UI en silencio.
// -----------------------------------------------------------------------------
window.updateUIFromState = updateUIFromState;
window.updatePaperThemeUI = updatePaperThemeUI;
window.updateDefaultConfigBadge = updateDefaultConfigBadge;
window.scheduleRender = scheduleRender;
