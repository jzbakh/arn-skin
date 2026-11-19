const vscode = require('vscode');

// =========================================================================
// COLOR UTILITIES
// =========================================================================

const colorUtils = {
    hexToRgb: (hex) => {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        const num = parseInt(hex.substring(0, 6), 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    },
    rgbToHex: (r, g, b) => {
        const clamp = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
        const v = ((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16);
        return "#" + v.slice(1).toUpperCase();
    },
    rgbToHsl: (r, g, b) => {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, l };
    },
    hslToRgb: (h, s, l) => {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    },
    adjustLightness: (hex, percentDelta) => {
        if (!hex || typeof hex !== 'string') return hex;
        const rgb = colorUtils.hexToRgb(hex);
        const hsl = colorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.l = Math.max(0, Math.min(1, hsl.l + percentDelta));
        const newRgb = colorUtils.hslToRgb(hsl.h, hsl.s, hsl.l);
        const alpha = hex.length === 9 ? hex.substring(7) : '';
        return colorUtils.rgbToHex(newRgb.r, newRgb.g, newRgb.b) + alpha;
    },
    normalizeHex: (hex) => {
        if (!hex || typeof hex !== 'string') return hex;
        let h = hex.replace(/^#/, '');
        if (h.length === 3) h = h.split('').map(x => x + x).join('');
        if (h.length === 4) h = h.split('').map(x => x + x).join('');
        return '#' + h.toUpperCase();
    },
    addAlpha: (hex, alphaHex) => {
        if (!hex || typeof hex !== 'string') return hex;
        const normalized = colorUtils.normalizeHex(hex);
        return normalized.substring(0, 7) + alphaHex;
    },
    // True channel-wise blend of two RGB colours. ratio=0 returns hexA unchanged,
    // ratio=1 returns hexB. Alpha channels are stripped on input. Used by toggles
    // that need a "tint" (e.g. status bar tinted toward accent) — addAlpha would
    // give a fake/translucent result that depends on what's behind it.
    mix: (hexA, hexB, ratio) => {
        if (!hexA || !hexB || typeof hexA !== 'string' || typeof hexB !== 'string') return hexA;
        const a = colorUtils.hexToRgb(hexA);
        const b = colorUtils.hexToRgb(hexB);
        const r = Math.max(0, Math.min(1, ratio));
        return colorUtils.rgbToHex(
            a.r * (1 - r) + b.r * r,
            a.g * (1 - r) + b.g * r,
            a.b * (1 - r) + b.b * r
        );
    },
    // WCAG relative luminance and contrast ratio. Alpha channels are ignored.
    luminance: (hex) => {
        const { r, g, b } = colorUtils.hexToRgb(hex);
        const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    },
    contrast: (hexA, hexB) => {
        const [hi, lo] = [colorUtils.luminance(hexA), colorUtils.luminance(hexB)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
    },
    // `fg` when it reads at 4.5:1 on `bg`, else the first 5 % step of `fg`
    // toward `ink` that does: a gold accent on a cream background becomes
    // a darker gold rather than an unreadable label. A translucent `fg` is
    // judged, and returned, as it shows on `bg`. When no step reads, the
    // most legible one wins.
    readable: (fg, bg, ink) => {
        if (!fg || !bg || !ink) return fg;
        const hex = colorUtils.normalizeHex(fg);
        const base = hex.length === 9 ? colorUtils.mix(bg, hex, parseInt(hex.slice(7), 16) / 255) : fg;
        let best = base;
        for (let step = 0; step <= 20; step++) {
            const c = step ? colorUtils.mix(base, ink, step / 20) : base;
            const ratio = colorUtils.contrast(c, bg);
            if (ratio >= 4.5) return c;
            if (ratio > colorUtils.contrast(best, bg)) best = c;
        }
        return best;
    },
    cleanUndefined: (obj) => {
        const cleaned = {};
        for (const key in obj) {
            const v = obj[key];
            if (v !== undefined && v !== null) cleaned[key] = v;
        }
        return cleaned;
    }
};

// =========================================================================
// JSONC PARSING (shared between theme loading and advanced file)
// =========================================================================

function parseJsonc(text) {
    const clean = text.replace(
        /("([^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*$/gm,
        (m, s) => s ? s : ''
    );
    try {
        return JSON.parse(clean);
    } catch (firstErr) {
        try {
            return JSON.parse(clean.replace(/,(?=\s*[}\]])/g, ''));
        } catch (secondErr) {
            // Both attempts failed — surface a clear, actionable error.
            throw new Error(
                `JSONC parse failed: ${secondErr.message} (initial error: ${firstErr.message})`,
                { cause: secondErr });
        }
    }
}

// =========================================================================
// THEME BASE COLORS — extract the 12 canonical UI bases from a theme JSON
// Used both to pre-fill the Quick CSS file and to compute dirty-tracking
// during apply (so untouched bases inherit theme defaults).
// Syntax colors are NOT exposed in Quick mode — they're handled exclusively
// in "Advanced: Syntax Colors" because per-language scopes (e.g.
// `entity.name.function.python`) override generic Quick keys via TextMate
// specificity, making Quick syntax customisation unreliable.
// =========================================================================

function extractBaseColorsFromTheme(themeJson) {
    const themeColors = themeJson.colors || {};
    const pick = (k, fallback) => themeColors[k] || fallback;
    const bg = pick('editor.background', '#1e1e1e');
    const bgSec = pick('sideBar.background', '#252526');
    const accent = pick('button.background', '#007acc');
    return {
        bg,
        text: pick('editor.foreground', '#d4d4d4'),
        accent,
        bgSec,
        surfaceElevated: pick('editorWidget.background', colorUtils.adjustLightness(bgSec, 0.03)),
        border: pick('sideBar.border', '#333333'),
        activeBorder: pick('focusBorder', accent),
        selection: pick('editor.selectionBackground', colorUtils.addAlpha(accent, '40')),
        warning: pick('list.warningForeground', '#d0b860'),
        error: pick('list.errorForeground', '#e85850'),
        success: pick('gitDecoration.addedResourceForeground', '#70d888'),
        info: pick('notificationsInfoIcon.foreground', accent),
    };
}

// =========================================================================
// QUICK THEME GENERATION — workbench colour keys derived from 12 base colours
// Each derived key declares its source base(s) and is only emitted when at
// least one of its sources has been modified from the theme default (see
// `dirty` parameter). Untouched bases let the theme's own values pass
// through, so a Quick customisation never silently overrides palette
// decisions the user did not intend to change.
// =========================================================================

// The theme's other surfaces Pure-Black darkens, each from its own colour:
// the code-area ones as much as the editor, the floating ones as the widgets.
const PURE_BLACK_AREAS = [
    'tab.unfocusedActiveBackground', 'tab.unfocusedInactiveBackground', 'editorGroupHeader.noTabsBackground',
    'editorStickyScroll.background', 'minimap.background', 'editorGutter.background', 'sideBarSectionHeader.background',
    'panelSectionHeader.background', 'peekViewEditor.background', 'peekViewEditorGutter.background',
    'peekViewResult.background', 'welcomePage.background', 'statusBar.noFolderBackground',
    'notificationCenterHeader.background', 'quickInputTitle.background', 'textBlockQuote.background',
    'editorHoverWidget.statusBarBackground',
];
const PURE_BLACK_WIDGETS = [
    'editorStickyScrollHover.background', 'peekViewTitle.background', 'breadcrumbPicker.background',
    'dropdown.listBackground', 'editorMarkerNavigation.background', 'debugToolBar.background',
    'debugExceptionWidget.background', 'inlineChat.background',
];

// The keys the Borderless toggle and a Borders colour draw.
const BORDER_KEYS = [
    'sideBar.border', 'panel.border', 'editorGroup.border',
    'activityBar.border', 'tab.activeBorder', 'tab.border',
    'titleBar.border', 'menu.border', 'dropdown.border',
    'input.border', 'notifications.border', 'statusBar.border',
    'editorGroupHeader.border',
    'panelSection.border', 'panelSectionHeader.border',
    'notificationCenter.border', 'notificationToast.border',
    'editorWidget.border', 'editorHoverWidget.border',
    'editorSuggestWidget.border', 'diffEditor.border',
    'checkbox.border', 'button.border', 'pickerGroup.border',
    'inputValidation.errorBorder', 'inputValidation.warningBorder',
    'inputValidation.infoBorder', 'menubar.selectionBorder',
    'panelInput.border', 'chat.requestBorder'
];

// The diagnostics marks a status colour paints besides the overview ruler, as
// the themes do; 1.0.5 left them to the theme. VS Code draws the editor
// gutter's deleted lines in editorError.foreground, so the minimap's follow.
const STATUS_MARKERS = [
    ['editorError.foreground', 'error'], ['editorWarning.foreground', 'warning'], ['editorInfo.foreground', 'info'],
    ['problemsErrorIcon.foreground', 'error'], ['problemsWarningIcon.foreground', 'warning'],
    ['problemsInfoIcon.foreground', 'info'], ['editorMarkerNavigationError.background', 'error'],
    ['editorMarkerNavigationWarning.background', 'warning'], ['editorMarkerNavigationInfo.background', 'info'],
    ['minimap.errorHighlight', 'error'], ['minimap.warningHighlight', 'warning'],
    ['minimapGutter.deletedBackground', 'error'],
];

function generateQuickTheme(parsedUi, dirty, themeType, themeColors = {}) {
    const bg = parsedUi["ui.baseBackground"];
    const text = parsedUi["ui.baseForeground"];
    const accent = parsedUi["ui.accentPrimary"];
    const bgSec = parsedUi["ui.secondaryBackground"];
    const surfaceElevated = parsedUi["ui.surfaceElevated"];
    // A fully transparent Borders colour counts as unset: the colour picker
    // keeps the alpha of the theme's #00000000.
    const border = toRgba8(parsedUi["ui.borders"])?.endsWith('00') ? undefined : parsedUi["ui.borders"];
    const activeBorder = parsedUi["ui.activeBorder"];
    const selection = parsedUi["ui.selection"];
    const warning = parsedUi["status.warning"];
    const error = parsedUi["status.error"];
    const success = parsedUi["status.success"];
    const info = parsedUi["status.info"];

    const borderless = parsedUi["ui.borderless"];
    const pureBlack = parsedUi["ui.pureBlack"];
    const activeTabHighlight = parsedUi["ui.activeTabHighlight"];
    const vividSelection = parsedUi["ui.vividSelection"];
    const cursorLineGlow = parsedUi["ui.cursorLineGlow"];

    const A = colorUtils.addAlpha;
    const M = colorUtils.mix;
    const isLight = themeType === 'vs' || themeType === 'light';
    // The light theme dims its labels far less than the dark ones do: those
    // alphas are fitted on each.
    const dim = (dark, light) => (isLight ? light : dark);

    // Borderless toggle:
    //   YES     → force all border keys transparent (truly borderless)
    //   NO      → force visible borders. If user customized --Borders, use
    //             that; otherwise derive a subtle visible border from `text`
    //             at ~12% opacity. This is critical for the ARN themes that
    //             ship with sideBar.border = "#00000000": without the
    //             derivation, NO would be visually identical to YES because
    //             `border` would still be the theme's transparent default.
    //   INHERIT → leave border keys untouched (theme defaults pass through).
    //             A Borders colour the user set recolours the borders the
    //             theme draws, and only those: a borderless theme stays
    //             borderless. The input validation borders keep the theme's
    //             error, warning and info colours.
    let borderFinal;
    if (borderless === 'yes') {
        borderFinal = '#00000000';
    } else if (borderless === 'no') {
        if (dirty.border && border) {
            borderFinal = border;
        } else {
            borderFinal = text ? A(text, '20') : '#80808033';
        }
    } else {
        borderFinal = undefined;
    }

    const colors = {};
    // Gated emitter — a key is only written when one of its source bases is
    // dirty. This lets untouched bases fall through to the theme's own values.
    // Each formula keeps its role on dark and light themes alike: a dimmed
    // text is the text with alpha, a raised surface is mixed toward the text.
    // A lightness shift would saturate a tinted colour and invert on light
    // themes.
    const add = (key, value, ...deps) => { if (deps.some(d => dirty[d])) colors[key] = value; };

    // ---- Editor core
    add('editor.background', bg, 'bg');
    add('editor.foreground', text, 'text');
    add('editor.lineHighlightBackground', A(text, '10'), 'text', 'bg');
    add('editor.selectionBackground', selection, 'selection');
    add('editor.selectionHighlightBackground', A(selection, '28'), 'selection');
    add('editor.inactiveSelectionBackground', A(selection, '20'), 'selection');
    add('editor.wordHighlightBackground', A(accent, '22'), 'accent');
    add('editor.wordHighlightStrongBackground', A(accent, '33'), 'accent');
    add('editor.findMatchBackground', A(accent, '55'), 'accent');
    add('editor.findMatchHighlightBackground', A(accent, '28'), 'accent');
    add('editor.findRangeHighlightBackground', A(accent, '0D'), 'accent');
    add('editor.hoverHighlightBackground', A(accent, '20'), 'accent');
    add('editor.rangeHighlightBackground', A(accent, '15'), 'accent');
    add('editorCursor.background', bg, 'bg');
    add('editorLink.activeForeground', accent, 'accent');
    // The themes paint them as the code they lie on, or a shade off it.
    add('minimap.background', bg, 'bg');
    add('editorStickyScroll.background', bg, 'bg');

    // ---- Line numbers, rulers, whitespace, indent guides
    add('editorLineNumber.foreground', A(text, dim('48', '58')), 'text', 'bg');
    add('editorLineNumber.activeForeground', accent, 'accent');
    add('editorIndentGuide.background1', A(text, '20'), 'text', 'bg');
    add('editorIndentGuide.activeBackground1', A(accent, '45'), 'accent');
    add('editorRuler.foreground', A(text, '28'), 'text', 'bg');
    add('editorWhitespace.foreground', A(text, dim('18', '28')), 'text');

    // ---- Bracket match; the bracket pair colours stay the theme's
    add('editorBracketMatch.background', A(accent, '20'), 'accent');
    add('editorBracketMatch.border', accent, 'accent');
    add('editorBracketHighlight.unexpectedBracket.foreground', error, 'error');

    // ---- Overview ruler
    add('editorOverviewRuler.border', bg, 'bg');
    add('editorOverviewRuler.findMatchForeground', A(accent, '80'), 'accent');
    add('editorOverviewRuler.errorForeground', error, 'error');
    add('editorOverviewRuler.warningForeground', warning, 'warning');
    add('editorOverviewRuler.infoForeground', info, 'info');
    add('editorOverviewRuler.addedForeground', success, 'success');
    add('editorOverviewRuler.deletedForeground', error, 'error');
    add('editorOverviewRuler.modifiedForeground', A(accent, '80'), 'accent');
    add('editorOverviewRuler.selectionHighlightForeground', A(accent, '60'), 'accent');
    add('editorOverviewRuler.wordHighlightForeground', A(accent, '60'), 'accent');
    add('editorOverviewRuler.wordHighlightStrongForeground', A(accent, '80'), 'accent');

    // ---- Diagnostics
    const status = { error, warning, info };
    for (const [key, base] of STATUS_MARKERS) add(key, status[base], base);

    // ---- Editor widgets — surface-elevated palette
    add('editorWidget.background', surfaceElevated, 'surfaceElevated');
    add('editorWidget.foreground', text, 'text');
    add('editorWidget.resizeBorder', activeBorder, 'activeBorder');
    add('editorHoverWidget.background', surfaceElevated, 'surfaceElevated');
    add('editorHoverWidget.foreground', text, 'text');
    add('editorSuggestWidget.background', surfaceElevated, 'surfaceElevated');
    add('editorSuggestWidget.foreground', text, 'text');
    add('editorSuggestWidget.highlightForeground', accent, 'accent');
    add('editorSuggestWidget.selectedBackground', A(accent, '33'), 'accent');
    add('editorSuggestWidget.focusHighlightForeground', accent, 'accent');

    // ---- Side bar
    add('sideBar.background', bgSec, 'bgSec');
    add('sideBar.foreground', text, 'text');
    add('sideBarTitle.foreground', A(text, dim('A0', 'C0')), 'text', 'bgSec');
    add('sideBarSectionHeader.background', bgSec, 'bgSec');
    add('sideBarSectionHeader.foreground', text, 'text');

    // ---- Activity bar
    add('activityBar.background', bgSec, 'bgSec');
    add('activityBar.foreground', accent, 'accent');
    add('activityBar.inactiveForeground', A(text, dim('48', '88')), 'text', 'bgSec');
    add('activityBar.activeBorder', activeBorder, 'activeBorder');
    add('activityBar.activeBackground', A(accent, '10'), 'accent');
    add('activityBarBadge.background', accent, 'accent');
    add('activityBarBadge.foreground', bg, 'bg');
    add('activityBarTop.foreground', accent, 'accent');
    add('activityBarTop.inactiveForeground', A(text, dim('48', '88')), 'text', 'bgSec');

    // ---- Status bar
    add('statusBar.background', bgSec, 'bgSec');
    add('statusBar.foreground', A(text, dim('B0', 'F8')), 'text', 'bgSec');
    add('statusBar.debuggingBackground', accent, 'accent');
    add('statusBar.debuggingForeground', bg, 'bg');
    add('statusBar.noFolderBackground', bgSec, 'bgSec');
    add('statusBar.noFolderForeground', A(text, dim('A8', 'F8')), 'text', 'bgSec');
    add('statusBarItem.remoteBackground', accent, 'accent');
    add('statusBarItem.remoteForeground', bg, 'bg');
    add('statusBarItem.hoverBackground', A(accent, '15'), 'accent');
    add('statusBarItem.activeBackground', A(accent, '20'), 'accent');
    add('statusBarItem.prominentBackground', A(accent, '20'), 'accent');
    add('statusBarItem.prominentForeground', accent, 'accent');
    add('statusBarItem.prominentHoverBackground', A(accent, '30'), 'accent');
    add('statusBarItem.errorBackground', error, 'error');
    add('statusBarItem.errorForeground', bg, 'bg');
    add('statusBarItem.warningBackground', warning, 'warning');
    add('statusBarItem.warningForeground', bg, 'bg');

    // ---- Title bar
    add('titleBar.activeBackground', bgSec, 'bgSec');
    add('titleBar.activeForeground', text, 'text');
    add('titleBar.inactiveBackground', bgSec, 'bgSec');
    add('titleBar.inactiveForeground', A(text, dim('70', 'C0')), 'text', 'bgSec');

    // ---- Tabs
    add('tab.activeBackground', bg, 'bg');
    add('tab.activeForeground', text, 'text');
    add('tab.activeBorderTop', activeBorder, 'activeBorder');
    add('tab.inactiveBackground', bgSec, 'bgSec');
    add('tab.inactiveForeground', A(text, dim('98', 'C0')), 'text', 'bgSec');
    add('tab.hoverBackground', A(text, '10'), 'text', 'bgSec');
    add('tab.hoverForeground', text, 'text');
    add('tab.unfocusedActiveBackground', bg, 'bg');
    add('tab.unfocusedActiveForeground', A(text, dim('B0', 'C0')), 'text', 'bgSec');
    add('tab.unfocusedInactiveBackground', bgSec, 'bgSec');
    add('tab.unfocusedInactiveForeground', A(text, '58'), 'text', 'bgSec');
    add('editorGroupHeader.tabsBackground', bgSec, 'bgSec');

    // ---- Panel
    add('panel.background', bg, 'bg');
    add('panelTitle.activeForeground', text, 'text');
    add('panelTitle.activeBorder', activeBorder, 'activeBorder');
    add('panelTitle.inactiveForeground', A(text, dim('98', 'C0')), 'text', 'bgSec');
    add('panelSectionHeader.background', bgSec, 'bgSec');
    add('panelSectionHeader.foreground', A(text, dim('A0', 'C0')), 'text', 'bgSec');

    // ---- Terminal
    add('terminal.background', bg, 'bg');
    add('terminal.foreground', text, 'text');
    add('terminal.selectionBackground', selection, 'selection');
    add('terminalCursor.background', bg, 'bg');

    // ---- Debug
    add('debugIcon.breakpointForeground', error, 'error');
    add('debugIcon.breakpointDisabledForeground', A(text, '50'), 'text', 'bgSec');
    add('debugIcon.breakpointUnverifiedForeground', warning, 'warning');
    add('debugIcon.startForeground', success, 'success');
    add('debugIcon.pauseForeground', accent, 'accent');
    add('debugIcon.stopForeground', error, 'error');
    add('debugIcon.disconnectForeground', warning, 'warning');
    add('debugIcon.restartForeground', success, 'success');
    add('debugIcon.stepOverForeground', accent, 'accent');
    add('debugIcon.stepIntoForeground', accent, 'accent');
    add('debugIcon.stepOutForeground', accent, 'accent');
    add('debugIcon.continueForeground', success, 'success');
    add('debugToolBar.background', bgSec, 'bgSec');
    add('editor.stackFrameHighlightBackground', A(warning, '18'), 'warning');
    add('editor.focusedStackFrameHighlightBackground', A(success, '18'), 'success');

    // ---- Git decoration
    add('gitDecoration.addedResourceForeground', success, 'success');
    add('gitDecoration.modifiedResourceForeground', warning, 'warning');
    add('gitDecoration.deletedResourceForeground', error, 'error');
    add('gitDecoration.ignoredResourceForeground', A(text, '48'), 'text', 'bgSec');
    add('gitDecoration.conflictingResourceForeground', error, 'error');
    add('gitDecoration.stageModifiedResourceForeground', warning, 'warning');
    add('gitDecoration.stageDeletedResourceForeground', error, 'error');

    // ---- Diff editor
    add('diffEditor.insertedTextBackground', A(success, '20'), 'success');
    add('diffEditor.removedTextBackground', A(error, '20'), 'error');
    add('diffEditor.insertedLineBackground', A(success, '10'), 'success');
    add('diffEditor.removedLineBackground', A(error, '10'), 'error');
    add('diffEditorOverview.insertedForeground', success, 'success');
    add('diffEditorOverview.removedForeground', error, 'error');

    // ---- Merge conflicts
    add('merge.currentHeaderBackground', A(accent, '50'), 'accent');
    add('merge.currentContentBackground', A(accent, '20'), 'accent');
    add('merge.incomingHeaderBackground', A(success, '50'), 'success');
    add('merge.incomingContentBackground', A(success, '20'), 'success');
    add('merge.commonHeaderBackground', A(warning, '50'), 'warning');
    add('merge.commonContentBackground', A(warning, '20'), 'warning');
    add('mergeEditor.change.background', A(accent, '15'), 'accent');
    add('mergeEditor.change.word.background', A(accent, '30'), 'accent');

    // ---- Peek view
    add('peekView.border', A(accent, '48'), 'accent');
    add('peekViewEditor.background', M(bg, text, 0.05), 'bg', 'text');
    add('peekViewEditor.matchHighlightBackground', A(accent, '50'), 'accent');
    add('peekViewEditorGutter.background', M(bg, text, 0.05), 'bg', 'text');
    add('peekViewResult.background', bgSec, 'bgSec');
    add('peekViewResult.fileForeground', text, 'text');
    add('peekViewResult.lineForeground', A(text, dim('B0', 'C0')), 'text', 'bg');
    add('peekViewResult.matchHighlightBackground', A(accent, '50'), 'accent');
    add('peekViewResult.selectionBackground', A(accent, '30'), 'accent');
    add('peekViewResult.selectionForeground', text, 'text');
    add('peekViewTitle.background', surfaceElevated, 'surfaceElevated');
    add('peekViewTitleDescription.foreground', A(text, dim('A0', 'C0')), 'text', 'bg');
    add('peekViewTitleLabel.foreground', text, 'text');

    // ---- Button & checkbox
    add('button.background', accent, 'accent');
    add('button.foreground', bg, 'bg');
    add('button.hoverBackground', M(accent, text, 0.15), 'accent', 'text');
    add('button.secondaryBackground', M(bgSec, text, 0.1), 'bgSec', 'text');
    add('button.secondaryForeground', text, 'text');
    add('button.secondaryHoverBackground', M(bgSec, text, 0.2), 'bgSec', 'text');
    add('checkbox.background', A(text, '18'), 'text', 'bg');
    add('checkbox.foreground', text, 'text');

    // ---- Input
    add('input.background', A(text, '10'), 'text', 'bg');
    add('input.foreground', text, 'text');
    add('input.placeholderForeground', A(text, '60'), 'text', 'bg');
    // One raised surface for the three messages, as the themes do.
    add('inputValidation.errorBackground', M(bg, text, 0.05), 'bg', 'text');
    add('inputValidation.errorForeground', text, 'text');
    add('inputValidation.warningBackground', M(bg, text, 0.05), 'bg', 'text');
    add('inputValidation.warningForeground', text, 'text');
    add('inputValidation.infoBackground', M(bg, text, 0.05), 'bg', 'text');
    add('inputValidation.infoForeground', text, 'text');
    add('inputOption.activeBackground', A(accent, '20'), 'accent');
    add('inputOption.activeBorder', accent, 'accent');
    add('inputOption.activeForeground', accent, 'accent');

    // ---- Dropdown
    add('dropdown.background', bgSec, 'bgSec');
    add('dropdown.foreground', text, 'text');
    add('dropdown.listBackground', bgSec, 'bgSec');

    // ---- List & tree
    add('list.activeSelectionBackground', A(accent, '33'), 'accent');
    add('list.activeSelectionForeground', text, 'text');
    add('list.activeSelectionIconForeground', accent, 'accent');
    add('list.inactiveSelectionBackground', A(accent, '20'), 'accent');
    add('list.inactiveSelectionForeground', text, 'text');
    add('list.hoverBackground', A(text, '1A'), 'text');
    add('list.hoverForeground', text, 'text');
    add('list.focusBackground', A(accent, '22'), 'accent');
    add('list.focusForeground', text, 'text');
    add('list.focusHighlightForeground', accent, 'accent');
    add('list.focusOutline', A(accent, '48'), 'accent');
    add('list.highlightForeground', accent, 'accent');
    add('list.warningForeground', warning, 'warning');
    add('list.errorForeground', error, 'error');
    add('list.filterMatchBackground', A(accent, '20'), 'accent');
    add('list.filterMatchBorder', accent, 'accent');
    add('list.dropBackground', A(accent, '18'), 'accent');

    // ---- Menu
    add('menu.background', bgSec, 'bgSec');
    add('menu.foreground', text, 'text');
    add('menu.selectionBackground', A(accent, '33'), 'accent');
    add('menu.selectionForeground', text, 'text');
    add('menu.separatorBackground', A(text, '20'), 'text', 'bgSec');
    add('menubar.selectionBackground', A(accent, '20'), 'accent');
    add('menubar.selectionForeground', text, 'text');

    // ---- Notifications
    add('notifications.background', bgSec, 'bgSec');
    add('notifications.foreground', text, 'text');
    add('notificationCenterHeader.background', bgSec, 'bgSec');
    add('notificationCenterHeader.foreground', text, 'text');
    add('notificationLink.foreground', accent, 'accent');
    add('notificationsErrorIcon.foreground', error, 'error');
    add('notificationsWarningIcon.foreground', warning, 'warning');
    add('notificationsInfoIcon.foreground', info, 'info');

    // ---- Badges
    add('badge.background', accent, 'accent');
    add('badge.foreground', bg, 'bg');

    // ---- Breadcrumb
    add('breadcrumb.background', bg, 'bg');
    add('breadcrumb.foreground', A(text, dim('80', 'C0')), 'text', 'bg');
    add('breadcrumb.focusForeground', text, 'text');
    add('breadcrumb.activeSelectionForeground', text, 'text');
    add('breadcrumbPicker.background', bgSec, 'bgSec');

    // ---- Quick input / picker
    add('quickInput.background', bgSec, 'bgSec');
    add('quickInput.foreground', text, 'text');
    add('quickInputList.focusBackground', A(accent, '33'), 'accent');
    add('quickInputList.focusForeground', text, 'text');
    add('quickInputList.focusIconForeground', accent, 'accent');
    add('quickInputTitle.background', bgSec, 'bgSec');
    add('pickerGroup.foreground', accent, 'accent');

    // ---- Progress bar & scrollbar
    add('progressBar.background', accent, 'accent');
    add('scrollbarSlider.background', A(text, '1A'), 'text');
    add('scrollbarSlider.hoverBackground', A(text, '33'), 'text');
    add('scrollbarSlider.activeBackground', A(text, '4D'), 'text');

    // ---- Text links
    add('textLink.foreground', accent, 'accent');
    add('textLink.activeForeground', M(accent, text, 0.45), 'accent', 'text');

    // ---- Welcome page
    add('welcomePage.background', bg, 'bg');

    // ---- Focus
    add('focusBorder', activeBorder, 'activeBorder');

    // ---- Chat / inline chat — full coverage of the chat.* surface keys.
    // Bubble backgrounds and the diff line markers are registered by VSCode
    // with `needsTransparency: true`, so we always emit them with an alpha
    // channel — feeding an opaque colour back through the user's customisation
    // would only earn a "must be transparent" warning in the Advanced editor.
    add('chat.requestBackground', A(text, '10'), 'text', 'bg');
    add('chat.requestBubbleBackground', A(M(bgSec, text, 0.05), '66'), 'bgSec', 'text');
    add('chat.requestBubbleHoverBackground', A(M(bgSec, text, 0.08), '99'), 'bgSec', 'text');
    add('chat.requestCodeBorder', A(accent, '40'), 'accent');
    add('chat.editedFileForeground', accent, 'accent');
    add('chat.linesAddedForeground', A(success, 'CC'), 'success');
    add('chat.linesRemovedForeground', A(error, 'CC'), 'error');
    add('chat.slashCommandBackground', A(accent, '15'), 'accent');
    add('chat.slashCommandForeground', accent, 'accent');
    add('chat.avatarBackground', M(bgSec, text, 0.1), 'bgSec', 'text');
    add('chat.avatarForeground', text, 'text');
    add('inlineChat.background', bgSec, 'bgSec');
    add('inlineChat.border', A(accent, '40'), 'accent');
    add('inlineChatInput.border', A(accent, '40'), 'accent');
    add('inlineChatInput.focusBorder', accent, 'accent');
    add('inlineChatInput.placeholderForeground', A(text, '60'), 'text', 'bgSec');
    add('inlineChatInput.background', M(bgSec, text, 0.1), 'bgSec', 'text');
    add('inlineChatDiff.inserted', A(success, '18'), 'success');
    add('inlineChatDiff.removed', A(error, '18'), 'error');

    // ---- Ghost text / inlay hints
    add('editorGhostText.foreground', A(text, '78'), 'text', 'bg');
    add('editorGhostText.background', A(accent, '08'), 'accent');
    add('editorInlayHint.foreground', A(text, '90'), 'text', 'bg');

    // Borders group — an undefined value is dropped by cleanUndefined(): the
    // theme's own borders pass through unchanged.
    const drawn = (key) => {
        const theirs = toRgba8(themeColors[key]);
        return !key.startsWith('inputValidation.') && theirs !== null && !theirs.endsWith('00');
    };
    BORDER_KEYS.forEach(k => {
        colors[k] = borderless !== 'inherit' ? borderFinal
            : dirty.border && border && drawn(k) ? border : undefined;
    });

    // ---- Pure Black Mode (near-black backgrounds)
    //   YES     → darken the code area and side panels halfway to black
    //             (to white on light themes), and the widgets less so they
    //             stand out from the editor. The theme keeps its hue —
    //             Nebula stays violet-black, Mars warm. Every other surface
    //             the theme paints (section headers, sticky scroll, minimap,
    //             peek view...) is darkened the same way from its own
    //             colour, so none stands out lighter than the editor.
    //   NO      → keep the theme's own backgrounds: nothing is written,
    //             as with INHERIT.
    //   INHERIT → leave the keys alone.
    if (pureBlack === 'yes' && bg && bgSec) {
        const extreme = isLight ? '#FFFFFF' : '#000000';
        const primary = M(bg, extreme, 0.5);
        const secondary = M(bgSec, extreme, 0.5);
        const lift = M(surfaceElevated || bgSec, extreme, 0.3);
        // Code-area surfaces.
        colors['editor.background'] = primary;
        colors['terminal.background'] = primary;
        colors['breadcrumb.background'] = primary;
        colors['panel.background'] = primary;
        colors['tab.activeBackground'] = primary;
        // Side panels.
        colors['sideBar.background'] = secondary;
        colors['activityBar.background'] = secondary;
        colors['statusBar.background'] = secondary;
        colors['titleBar.activeBackground'] = secondary;
        colors['titleBar.inactiveBackground'] = secondary;
        colors['editorGroupHeader.tabsBackground'] = secondary;
        colors['tab.inactiveBackground'] = secondary;
        // Floating widgets / menus — darkened less, to stand out from the editor.
        colors['editorWidget.background'] = lift;
        colors['editorHoverWidget.background'] = lift;
        colors['editorSuggestWidget.background'] = lift;
        colors['dropdown.background'] = lift;
        colors['quickInput.background'] = lift;
        colors['quickInputList.focusBackground'] = M(lift, accent || '#888888', 0.15);
        colors['menu.background'] = lift;
        colors['notifications.background'] = lift;
        colors['input.background'] = lift;
        // From the colour the bases derive for it when they do, else the theme's.
        const darken = (keys, ratio) => {
            for (const key of keys) {
                const shown = toRgba8(colors[key] || themeColors[key]);
                if (shown && shown.endsWith('FF')) colors[key] = M(shown.slice(0, 7), extreme, ratio);
            }
        };
        darken(PURE_BLACK_AREAS, 0.5);
        darken(PURE_BLACK_WIDGETS, 0.3);
    }

    // ---- Active Tab Highlight (Material Theme inspired)
    //   YES     → strong accent presence on the active tab: tinted bg,
    //             accent foreground, accent borders top + bottom, or the
    //             Active-Border colour when the user set one. The label is
    //             pulled toward the text colour when the accent would read
    //             below 4.5:1 (gold on Jupiter's cream).
    //   NO      → plain active tab: the editor's background and the text
    //             colour, no accent tint or border.
    //   INHERIT → leave the keys alone.
    // The tab starts from the editor's background, the one Pure-Black
    // darkened: it would otherwise stand out lighter than the editor below.
    const tabBase = colors['editor.background'] || bg;
    if (activeTabHighlight === 'yes' && accent && bg) {
        const activeBg = M(tabBase, accent, 0.10);
        const unfocusedBg = M(tabBase, accent, 0.05);
        colors['tab.activeBackground'] = activeBg;
        colors['tab.activeForeground'] = colorUtils.readable(accent, activeBg, text);
        const border = dirty.activeBorder ? activeBorder : accent;
        colors['tab.activeBorderTop'] = border;
        colors['tab.activeBorder'] = border;
        colors['tab.unfocusedActiveBackground'] = unfocusedBg;
        colors['tab.unfocusedActiveForeground'] = colorUtils.readable(M(text, accent, 0.30), unfocusedBg, text);
    } else if (activeTabHighlight === 'no' && bg) {
        colors['tab.activeBackground'] = tabBase;
        colors['tab.activeForeground'] = text;
        colors['tab.activeBorderTop'] = '#00000000';
        colors['tab.activeBorder'] = '#00000000';
        colors['tab.unfocusedActiveBackground'] = tabBase;
        colors['tab.unfocusedActiveForeground'] = A(text, dim('B0', 'C0'));
    }

    // ---- Vivid Selection (Tokyo Night inspired)
    //   YES     → saturated accent-coloured selection (~31% opacity) so
    //             selected text pops out. Highlight backgrounds for word
    //             matches and inactive selections scale with it.
    //   NO      → soft neutral selection: the text colour at ~22% opacity
    //             (~15% on light themes), light enough for the syntax
    //             colours underneath to stay readable.
    //   INHERIT → leave the keys alone.
    // A Selection colour set in Quick keeps the selection either way: the
    // toggle then only colours the word highlights.
    const ownSelection = dirty.selection;
    if (vividSelection === 'yes' && accent) {
        if (!ownSelection) {
            colors['editor.selectionBackground'] = A(accent, '50');
            colors['editor.selectionHighlightBackground'] = A(accent, '30');
            colors['editor.inactiveSelectionBackground'] = A(accent, '28');
        }
        colors['editor.wordHighlightBackground'] = A(accent, '38');
        colors['editor.wordHighlightStrongBackground'] = A(accent, '48');
    } else if (vividSelection === 'no' && text) {
        // A stronger grey (~33%) washed out the syntax colours, and hid
        // Jupiter's gold identifiers. Word matches stay a step below the
        // selection so they never compete with it.
        const [sel, match, inactive, word, strongWord] = isLight
            ? ['26', '18', '1C', '1C', '22']
            : ['38', '22', '28', '26', '34'];
        if (!ownSelection) {
            colors['editor.selectionBackground'] = A(text, sel);
            colors['editor.selectionHighlightBackground'] = A(text, match);
            colors['editor.inactiveSelectionBackground'] = A(text, inactive);
        }
        colors['editor.wordHighlightBackground'] = A(text, word);
        colors['editor.wordHighlightStrongBackground'] = A(text, strongWord);
    }

    // ---- Cursor & Active Line Glow
    //   YES     → bright accent cursor with an accent-tinted line
    //             highlight and matching outline around the active line —
    //             the cursor never gets lost in any code file. The active
    //             line number is pulled toward the text colour when the
    //             accent would read below 4.5:1 (gold on Jupiter's cream).
    //   NO      → muted cursor (the text colour, a little translucent) and
    //             zero line highlight (flat editing).
    //   INHERIT → leave the keys alone.
    if (cursorLineGlow === 'yes' && accent) {
        colors['editorCursor.foreground'] = accent;
        colors['editor.lineHighlightBackground'] = A(accent, '20');
        colors['editor.lineHighlightBorder'] = A(accent, '60');
        colors['editorLineNumber.activeForeground'] = colorUtils.readable(accent, colors['editor.background'] || bg, text);
    } else if (cursorLineGlow === 'no' && text) {
        colors['editorCursor.foreground'] = A(text, 'C0');
        colors['editor.lineHighlightBackground'] = '#00000000';
        colors['editor.lineHighlightBorder'] = '#00000000';
        colors['editorLineNumber.activeForeground'] = text;
    }

    return {
        colors: colorUtils.cleanUndefined(colors),
    };
}

// =========================================================================
// FILE NAMING & STATE
// =========================================================================

function sanitizeLabel(label) {
    return String(label).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Known planets for icon lookup. Expected icon path: media/<planet>.png
const PLANETS = ['Spaceport', 'Nebula', 'Neptune', 'Uranus', 'Io', 'Jupiter', 'Mars'];

function planetOf(label) {
    return PLANETS.find(p => label.includes(p)) || null;
}

function quickUriFor(context, themeLabel) {
    return vscode.Uri.joinPath(context.globalStorageUri, `quick-${sanitizeLabel(themeLabel)}.css`);
}

function advancedUIUriFor(context, themeLabel) {
    return vscode.Uri.joinPath(context.globalStorageUri, `advanced-ui-${sanitizeLabel(themeLabel)}.jsonc`);
}

function advancedSyntaxUriFor(context, themeLabel) {
    return vscode.Uri.joinPath(context.globalStorageUri, `advanced-syntax-${sanitizeLabel(themeLabel)}.jsonc`);
}

// Infer customization mode from a file URI.
// Returns 'quick' | 'advanced-ui' | 'advanced-syntax' | null.
// Robust across VSCode restarts — no in-memory state needed.
// Path normalization handles Windows backslashes vs Unix forward slashes.
function inferCustomizationMode(uri, context) {
    const norm = (p) => p.replace(/\\/g, '/').toLowerCase();
    const fsPath = norm(uri.fsPath);
    const storagePath = norm(context.globalStorageUri.fsPath);
    if (!fsPath.startsWith(storagePath)) return null;
    const name = uri.path.split('/').pop() || '';
    if (name.startsWith('quick-') && name.endsWith('.css')) return 'quick';
    if (name.startsWith('advanced-ui-') && name.endsWith('.jsonc')) return 'advanced-ui';
    if (name.startsWith('advanced-syntax-') && name.endsWith('.jsonc')) return 'advanced-syntax';
    return null;
}

// Close any open editor tabs for the three customisation files of `themeLabel`.
// Called before switching themes so the user is never left editing a file
// whose name corresponds to a theme that is no longer active. Also called
// from resetTheme to clean up tabs after deleting the underlying file.
//
// `skipReapplySet` is an optional Set<string>. Every URI about to close is
// added to it, so the tab-close handler restores nothing: these buffers are
// saved first and the operation closing them owns the settings.
async function closeCustomisationFilesForTheme(themeLabel, skipReapplySet) {
    const sanitized = sanitizeLabel(themeLabel);
    const targets = new Set([
        `quick-${sanitized}.css`,
        `advanced-ui-${sanitized}.jsonc`,
        `advanced-syntax-${sanitized}.jsonc`,
    ]);

    const tabsToClose = [];
    for (const group of vscode.window.tabGroups.all) {
        for (const tab of group.tabs) {
            const input = tab.input;
            if (!input || !(input instanceof vscode.TabInputText)) continue;
            const basename = input.uri.path.split('/').pop() || '';
            if (targets.has(basename)) tabsToClose.push(tab);
        }
    }
    if (tabsToClose.length === 0) return;

    // Stamp every URI we're about to close so the close handler bails out.
    if (skipReapplySet) {
        for (const tab of tabsToClose) {
            skipReapplySet.add(tab.input.uri.toString());
        }
    }

    // Save dirty docs first so we never lose user edits to the close.
    for (const tab of tabsToClose) {
        const doc = vscode.workspace.textDocuments.find(
            d => d.uri.toString() === tab.input.uri.toString()
        );
        if (doc && doc.isDirty) {
            try { await doc.save(); } catch { /* fall through to close */ }
        }
    }

    await vscode.window.tabGroups.close(tabsToClose);
}

// Close the two customisation tabs OTHER than `keepMode` for `themeLabel`.
// Used when the user picks a customisation mode from the Skin menu so that
// only one customisation tab is ever open at a time — regardless of whether
// the previously open tab had pending edits. Dirty documents are saved
// before close, so no user input is lost.
async function closeOtherCustomisationFilesForTheme(themeLabel, keepMode) {
    const sanitized = sanitizeLabel(themeLabel);
    const byMode = {
        'quick':           `quick-${sanitized}.css`,
        'advanced-ui':     `advanced-ui-${sanitized}.jsonc`,
        'advanced-syntax': `advanced-syntax-${sanitized}.jsonc`,
    };
    const targets = new Set();
    for (const [mode, basename] of Object.entries(byMode)) {
        if (mode !== keepMode) targets.add(basename);
    }

    const tabsToClose = [];
    for (const group of vscode.window.tabGroups.all) {
        for (const tab of group.tabs) {
            const input = tab.input;
            if (!input || !(input instanceof vscode.TabInputText)) continue;
            const basename = input.uri.path.split('/').pop() || '';
            if (targets.has(basename)) tabsToClose.push(tab);
        }
    }
    if (tabsToClose.length === 0) return;

    // Save dirty docs first: the pending edits are kept, and a saved buffer
    // leaves no snapshot for the tab-close to restore.
    for (const tab of tabsToClose) {
        const doc = vscode.workspace.textDocuments.find(
            d => d.uri.toString() === tab.input.uri.toString()
        );
        if (doc && doc.isDirty) {
            try { await doc.save(); } catch { /* fall through to close */ }
        }
    }

    await vscode.window.tabGroups.close(tabsToClose);
}

// =========================================================================
// CUSTOMIZATION STATE
// One record per theme in the `arnSkin.customizations` user setting holds
// what the user chose: the Quick inputs that differ from the theme, and the
// Advanced overrides. The three editing files are views rendered from it and
// the three VS Code settings are outputs computed from it. Settings outlive
// the extension's storage folder, which a publisher or name change orphans.
//
// Precedence is per key, last action wins: an Advanced override beats the
// Quick-derived value until the user changes the Quick input that drives that
// key, at which point Quick takes the key back.
// =========================================================================

const QUICK_BASES = [
    ['ui.baseBackground', 'bg', 'baseBackground', 'Global-Background'],
    ['ui.baseForeground', 'text', 'baseForeground', 'Main-Text'],
    ['ui.accentPrimary', 'accent', 'accentPrimary', 'Accentuation'],
    ['ui.secondaryBackground', 'bgSec', 'secondaryBackground', 'Secondary-Background'],
    ['ui.surfaceElevated', 'surfaceElevated', 'surfaceElevated', 'Surface-Elevated'],
    ['ui.borders', 'border', 'borders', 'Borders'],
    ['ui.activeBorder', 'activeBorder', 'activeBorder', 'Active-Border'],
    ['ui.selection', 'selection', 'selection', 'Selection'],
    ['status.warning', 'warning', 'statusWarning', 'Status-Warning'],
    ['status.error', 'error', 'statusError', 'Status-Error'],
    ['status.success', 'success', 'statusSuccess', 'Status-Success'],
    ['status.info', 'info', 'statusInfo', 'Status-Info'],
];
const QUICK_TOGGLES = [
    ['ui.borderless', 'Opt-Borderless-Mode', 'borderless'],
    ['ui.pureBlack', 'Opt-Pure-Black-Mode', 'pureBlack'],
    ['ui.activeTabHighlight', 'Opt-Active-Tab-Highlight', 'activeTabHighlight'],
    ['ui.vividSelection', 'Opt-Vivid-Selection', 'vividSelection'],
    ['ui.cursorLineGlow', 'Opt-Cursor-Line-Glow', 'cursorLineGlow'],
];
const TOGGLE_VALUES = new Set(['yes', 'no', 'inherit']);
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function toRgba8(hex) {
    if (typeof hex !== 'string' || !HEX_COLOR_RE.test(hex)) return null;
    const n = colorUtils.normalizeHex(hex);
    return n.length === 7 ? n + 'FF' : n;
}

// #abc, #AABBCC and #AABBCCFF are the same colour.
function sameColor(a, b) {
    if (a === b) return true;
    const A = toRgba8(a);
    return A !== null && A === toRgba8(b);
}

function quickDefaults(themeJson) {
    const bases = extractBaseColorsFromTheme(themeJson);
    const quick = {};
    for (const [key, base] of QUICK_BASES) quick[key] = bases[base];
    for (const [key] of QUICK_TOGGLES) quick[key] = 'inherit';
    return quick;
}

function expandQuick(stored, themeJson) {
    return { ...quickDefaults(themeJson), ...(stored || {}) };
}

// Only what differs from the theme is stored, so a theme update still reaches
// every base the user never touched.
function compactQuick(quick, themeJson) {
    const defaults = quickDefaults(themeJson);
    const out = {};
    for (const [key] of QUICK_BASES) {
        if (quick[key] && !sameColor(quick[key], defaults[key])) out[key] = quick[key];
    }
    for (const [key] of QUICK_TOGGLES) {
        if (quick[key] && quick[key] !== 'inherit') out[key] = quick[key];
    }
    return out;
}

// A half-typed hex or toggle keeps its previous value instead of briefly
// dropping every key it drives, and with them the Advanced overrides on those
// keys. Rejected colours are returned with the text written and the colour
// kept, for the user to fix. `value` is null when the line is gone.
function resolveQuickInput(cssText, previous) {
    const parsed = parseQuickCss(cssText);
    const quick = { ...previous };
    const rejected = [];
    for (const [key, , , cssVar] of QUICK_BASES) {
        if (parsed[key]) {
            quick[key] = parsed[key];
            continue;
        }
        const written = new RegExp(`--${cssVar}:[ \\t]*([^;\\n]*)`, 'i').exec(cssText);
        const value = written && written[1].trim();
        rejected.push({
            name: `--${cssVar}`,
            value: value || null,
            kept: colorUtils.normalizeHex(previous[key]),
            at: { kind: 'quick', cssVar },
        });
    }
    for (const [key, cssVar] of QUICK_TOGGLES) {
        if (new RegExp(`--${cssVar}:\\s*(yes|no|inherit)\\b`, 'i').test(cssText)) quick[key] = parsed[key];
    }
    return { quick, rejected };
}

function deriveQuickColors(quick, themeJson) {
    const bases = extractBaseColorsFromTheme(themeJson);
    const dirty = {};
    for (const [key, base] of QUICK_BASES) dirty[base] = !sameColor(quick[key], bases[base]);
    return colorUtils.cleanUndefined(generateQuickTheme(quick, dirty, themeJson.type, themeJson.colors || {}).colors);
}

function quickViewInputs(quick) {
    const baseValues = {};
    for (const [key, , name] of QUICK_BASES) baseValues[name] = quick[key];
    const toggles = {};
    for (const [key, , name] of QUICK_TOGGLES) toggles[name] = String(quick[key]).toUpperCase();
    return { baseValues, toggles };
}

function dropSupersededOverrides(overrides, derivedBefore, derivedAfter) {
    const out = {};
    for (const [key, value] of Object.entries(overrides || {})) {
        if (sameColor(derivedBefore[key], derivedAfter[key])) out[key] = value;
    }
    return out;
}

function diffColors(colors, baseline) {
    const out = {};
    for (const [key, value] of Object.entries(colors || {})) {
        if (typeof value === 'string' && !sameColor(value, baseline[key])) out[key] = value;
    }
    return out;
}

function normalizeSemantic(tokens) {
    const out = {};
    for (const [key, value] of Object.entries(tokens || {})) {
        if (typeof value === 'string') out[key] = { foreground: value };
        else if (value && typeof value === 'object') out[key] = value;
    }
    return out;
}

// Key order and hex case never make two token styles different.
function canonicalStyle(value) {
    if (typeof value === 'string') return toRgba8(value) || value;
    if (Array.isArray(value)) return value.map(canonicalStyle);
    if (value && typeof value === 'object') {
        const out = {};
        for (const key of Object.keys(value).sort()) out[key] = canonicalStyle(value[key]);
        return out;
    }
    return value;
}
const styleKey = (value) => JSON.stringify(canonicalStyle(value));

function diffSemantic(tokens, themeTokens) {
    const theirs = normalizeSemantic(themeTokens);
    const out = {};
    for (const [key, value] of Object.entries(normalizeSemantic(tokens))) {
        if (theirs[key] === undefined || styleKey(value) !== styleKey(theirs[key])) out[key] = value;
    }
    return out;
}

// VS Code layers customised TextMate rules over the theme's own, so only the
// rules the user changed or added are kept.
function diffTextMate(rules, themeRules) {
    const theirs = new Set((themeRules || []).map(styleKey));
    const seen = new Set();
    const out = [];
    // VS Code reads textMateRules only when it is an array.
    for (const rule of Array.isArray(rules) ? rules : []) {
        if (!rule || typeof rule !== 'object' || !rule.settings) continue;
        const key = styleKey(rule);
        if (theirs.has(key) || seen.has(key)) continue;
        seen.add(key);
        out.push(rule);
    }
    return out;
}

const ruleIdentity = (rule) => JSON.stringify([rule.name ?? null, canonicalStyle(rule.scope ?? null)]);

// An override takes the place of the theme rule it was edited from, so the
// view reads like the theme and diffs back to the same overrides.
function renderTextMateView(themeRules, overrides) {
    const base = themeRules || [];
    const rules = [...base];
    // Positions of the theme rules not yet replaced, per identity, in order:
    // one pass over each list, however many rules a theme or the user has.
    const free = new Map();
    base.forEach((rule, i) => {
        const id = ruleIdentity(rule);
        if (!free.has(id)) free.set(id, []);
        free.get(id).push(i);
    });
    for (const rule of overrides || []) {
        const slots = free.get(ruleIdentity(rule));
        if (slots && slots.length) rules[slots.shift()] = rule;
        else rules.push(rule);
    }
    return rules;
}

// A colour that is not one keeps the value the view showed before, in every
// mode, instead of reaching settings. Each rejection says what was written,
// what is kept and where to find it.
const COLOR_PROPS = ['foreground', 'background'];
const isHexColor = (value) => typeof value === 'string' && HEX_COLOR_RE.test(value);
const keptColor = (value) => (value === undefined ? undefined : colorUtils.normalizeHex(value));

function keepPreviousUiColors(colors, previous) {
    const accepted = {};
    const rejected = [];
    for (const [key, value] of Object.entries(colors || {})) {
        if (isHexColor(value)) {
            accepted[key] = value;
            continue;
        }
        if (previous[key] !== undefined) accepted[key] = previous[key];
        rejected.push({
            name: key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            kept: keptColor(previous[key]),
            at: { kind: 'ui', key },
        });
    }
    return { accepted, rejected };
}

function keepPreviousSyntaxColors(payload, previousSemantic, previousRules) {
    const rejected = [];
    const semantic = {};
    for (const [selector, style] of Object.entries(normalizeSemantic(payload.semanticTokenColors))) {
        const next = { ...style };
        for (const prop of COLOR_PROPS) {
            if (next[prop] === undefined || isHexColor(next[prop])) continue;
            const kept = (previousSemantic[selector] || {})[prop];
            rejected.push({ name: `${selector} ${prop}`, value: String(next[prop]), kept: keptColor(kept), at: { kind: 'semantic', selector, prop } });
            if (kept === undefined) delete next[prop];
            else next[prop] = kept;
        }
        semantic[selector] = next;
    }
    const rules = (Array.isArray(payload.tokenColors) ? payload.tokenColors : []).map((rule, index) => {
        if (!rule || typeof rule !== 'object' || !rule.settings) return rule;
        const settings = { ...rule.settings };
        for (const prop of COLOR_PROPS) {
            if (settings[prop] === undefined || isHexColor(settings[prop])) continue;
            const before = (previousRules || []).find(r => r && r.settings && ruleIdentity(r) === ruleIdentity(rule));
            const kept = before && before.settings[prop];
            const label = rule.name || [].concat(rule.scope || []).join(', ') || `rule ${index + 1}`;
            rejected.push({ name: `${label} ${prop}`, value: String(settings[prop]), kept: keptColor(kept), at: { kind: 'textmate', index, prop } });
            if (kept === undefined) delete settings[prop];
            else settings[prop] = kept;
        }
        return { ...rule, settings };
    });
    return { semantic, rules, rejected };
}

// Three lengths of the same news: the full sentence on hover, a line short
// enough for a notification toast, and the hint written after the line.
function describeRejected(r) {
    if (r.value === null) return `${r.name} is missing; the previous color (${r.kept}) is kept.`;
    if (r.kept === undefined) return `${r.name} is not a valid color (${r.value}) and is ignored.`;
    return `${r.name} is not a valid color (${r.value}); the previous color (${r.kept}) is kept.`;
}

function summarizeRejected(r) {
    if (r.value === null) return `${r.name} is missing, stays ${r.kept}`;
    if (r.kept === undefined) return `${r.name} ignored (${r.value} is invalid)`;
    return `${r.name} stays ${r.kept} (${r.value} is invalid)`;
}

function hintForRejected(r) {
    if (r.value === null) return `← ${r.name} missing, previous color: ${r.kept}`;
    if (r.kept === undefined) return '← ignored: not a color';
    return `← previous color: ${r.kept}`;
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Offsets of a rejected value in the editing file, and the edit that puts the
// kept colour back. Null when the text no longer holds it where expected.
function locateRejected(text, r) {
    const at = r.at || {};
    const inner = (from, pattern) => {
        const m = pattern.exec(text.slice(from));
        if (!m) return null;
        const start = from + m.index + m[0].length;
        const end = text.indexOf('"', start);
        return end === -1 ? null : { start, end, fix: r.kept === undefined ? null : { start, end, newText: r.kept } };
    };
    if (at.kind === 'quick') {
        const m = new RegExp(`--${at.cssVar}:[ \\t]*`, 'i').exec(text);
        if (!m) {
            const root = text.indexOf(':root');
            const brace = text.indexOf('{', root);
            if (root === -1 || brace === -1) return null;
            return { start: root, end: root + 5, fix: { start: brace + 1, end: brace + 1, newText: `\n    --${at.cssVar}: ${r.kept};` } };
        }
        const start = m.index + m[0].length;
        const raw = /^[^;\n]*/.exec(text.slice(start))[0].replace(/\s+$/, '');
        if (!raw) return { start: m.index, end: m.index + at.cssVar.length + 2, fix: { start, end: start, newText: r.kept } };
        return { start, end: start + raw.length, fix: { start, end: start + raw.length, newText: r.kept } };
    }
    if (at.kind === 'ui') return inner(0, new RegExp(`"${escapeRegExp(at.key)}"\\s*:\\s*"`));
    if (at.kind === 'semantic') {
        const from = Math.max(0, text.indexOf('"semanticTokenColors"'));
        const sel = escapeRegExp(at.selector);
        return inner(from, new RegExp(`"${sel}"\\s*:\\s*\\{[^{}]*?"${at.prop}"\\s*:\\s*"`))
            || (at.prop === 'foreground' ? inner(from, new RegExp(`"${sel}"\\s*:\\s*"`)) : null);
    }
    if (at.kind === 'textmate') {
        const from = text.indexOf('"tokenColors"');
        if (from === -1) return null;
        const settings = /"settings"\s*:\s*\{[^{}]*\}/g;
        settings.lastIndex = from;
        let m;
        for (let i = 0; (m = settings.exec(text)) && i < at.index; i++) { /* skip to the rule */ }
        return m ? inner(m.index, new RegExp(`"${at.prop}"\\s*:\\s*"`)) : null;
    }
    return null;
}

// The Quick lines that differ from the theme, each with the edit that puts
// the theme's value back: its colour for a base, INHERIT for a display option.
function themeRestores(text, defaults) {
    const parsed = parseQuickCss(text);
    const out = [];
    for (const [key, , , cssVar] of QUICK_BASES) {
        const m = new RegExp(`--${cssVar}:[ \\t]*([^;\\n]*)`, 'i').exec(text);
        const value = m && m[1].replace(/\s+$/, '');
        if (!value || !parsed[key] || sameColor(parsed[key], defaults[key])) continue;
        const start = m.index + m[0].length - m[1].length;
        const theirs = colorUtils.normalizeHex(defaults[key]);
        out.push({ start, end: start + value.length, newText: theirs, title: `Restore the theme's color (${theirs})` });
    }
    for (const [, cssVar] of QUICK_TOGGLES) {
        const m = new RegExp(`--${cssVar}:[ \\t]*(yes|no)\\b`, 'i').exec(text);
        if (!m) continue;
        const start = m.index + m[0].length - m[1].length;
        out.push({ start, end: start + m[1].length, newText: 'INHERIT', title: "Restore the theme's default (INHERIT)" });
    }
    return out;
}

function compactState(state) {
    const out = {};
    if (state.quick && Object.keys(state.quick).length) out.quick = state.quick;
    if (state.ui && Object.keys(state.ui).length) out.ui = state.ui;
    if (state.semantic && Object.keys(state.semantic).length) out.semantic = state.semantic;
    if (state.textMate && state.textMate.length) out.textMate = state.textMate;
    return out;
}

// settings.json is hand-editable: keep only what the layers can use.
function sanitizeState(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const state = {};
    if (raw.quick && typeof raw.quick === 'object') {
        state.quick = {};
        // The derivations read #RRGGBB(AA) only, as the Quick file is parsed.
        for (const [key] of QUICK_BASES) {
            if (HEX_COLOR_RE.test(raw.quick[key])) state.quick[key] = colorUtils.normalizeHex(raw.quick[key]);
        }
        for (const [key] of QUICK_TOGGLES) {
            if (TOGGLE_VALUES.has(raw.quick[key])) state.quick[key] = raw.quick[key];
        }
    }
    if (raw.ui && typeof raw.ui === 'object') {
        state.ui = {};
        for (const [key, value] of Object.entries(raw.ui)) {
            if (typeof value === 'string') state.ui[key] = value;
        }
    }
    if (raw.semantic && typeof raw.semantic === 'object') state.semantic = normalizeSemantic(raw.semantic);
    if (Array.isArray(raw.textMate)) state.textMate = raw.textMate.filter(r => r && typeof r === 'object' && r.settings);
    return compactState(state);
}

function composeOutputs(state, themeJson) {
    return {
        colors: { ...deriveQuickColors(expandQuick(state.quick, themeJson), themeJson), ...(state.ui || {}) },
        textMateRules: state.textMate || [],
        semanticRules: state.semantic || {},
    };
}

// We own one key inside these entries. Anything else the user put there stays;
// `legacy` keys are ones earlier versions wrote where VS Code never reads them.
function withOwnedPart(entry, key, value, legacy = []) {
    const next = { ...(entry || {}) };
    for (const k of legacy) delete next[k];
    if (value === undefined) delete next[key];
    else next[key] = value;
    return Object.keys(next).length ? next : undefined;
}

const themeSelector = (themeLabel) => `[${themeLabel}]`;

function globalEntries(section, key) {
    const inspected = vscode.workspace.getConfiguration(section).inspect(key);
    return (inspected && inspected.globalValue) || {};
}

async function updateThemeEntry(section, key, themeLabel, value) {
    const current = globalEntries(section, key);
    const sel = themeSelector(themeLabel);
    if (deepEqual(current[sel] ?? null, value ?? null)) return;
    const next = { ...current };
    if (value === undefined) delete next[sel];
    else next[sel] = value;
    await vscode.workspace.getConfiguration(section)
        .update(key, Object.keys(next).length ? next : undefined, vscode.ConfigurationTarget.Global);
}

function readStoredState(themeLabel) {
    const raw = globalEntries('arnSkin', 'customizations')[themeSelector(themeLabel)];
    return raw === undefined ? null : sanitizeState(raw);
}

async function saveThemeState(themeLabel, themeJson, state) {
    const clean = compactState(state);
    const out = composeOutputs(clean, themeJson);
    const sel = themeSelector(themeLabel);
    await updateThemeEntry('arnSkin', 'customizations', themeLabel,
        Object.keys(clean).length ? clean : undefined);
    await updateThemeEntry('workbench', 'colorCustomizations', themeLabel,
        Object.keys(out.colors).length ? out.colors : undefined);
    await updateThemeEntry('editor', 'tokenColorCustomizations', themeLabel,
        withOwnedPart(globalEntries('editor', 'tokenColorCustomizations')[sel], 'textMateRules',
            out.textMateRules.length ? out.textMateRules : undefined, ['semanticTokenColors']));
    await updateThemeEntry('editor', 'semanticTokenColorCustomizations', themeLabel,
        withOwnedPart(globalEntries('editor', 'semanticTokenColorCustomizations')[sel], 'rules',
            Object.keys(out.semanticRules).length ? out.semanticRules : undefined));
}

// Recomposes the outputs of every theme with a saved state: a newer version
// may derive the same state differently, and its colours then show without
// an edit. The themes earlier versions customised through Quick are rebuilt
// into layers here too, rather than at the first open of the Skin menu: their
// Quick file tells which colours were derived. Unchanged entries are not
// rewritten. A customisation view left open is rewritten from the state, so
// saving it brings nothing older back.
async function refreshOutputs(context) {
    const labels = new Set(Object.keys(globalEntries('arnSkin', 'customizations')).map(sel => sel.slice(1, -1)));
    for (const { label } of (await readPackageJson(context)).contributes.themes) {
        if (await readTextIfExists(quickUriFor(context, label)) !== null) labels.add(label);
    }
    for (const label of labels) {
        const theme = await getThemeData(context, label);
        if (theme) await saveThemeState(label, theme.themeJson, await loadThemeState(context, label, theme.themeJson));
    }
    const views = { quick: ensureQuickFile, 'advanced-ui': ensureAdvancedUIFile, 'advanced-syntax': ensureAdvancedSyntaxFile };
    for (const doc of vscode.workspace.textDocuments) {
        const mode = inferCustomizationMode(doc.uri, context);
        const themeLabel = mode && await themeLabelForUri(context, doc.uri);
        const theme = themeLabel && await getThemeData(context, themeLabel);
        if (theme) await views[mode](context, themeLabel, theme.themeJson);
    }
}

async function readTextIfExists(uri) {
    try {
        return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
    } catch {
        return null;
    }
}

// What 1.0.5 wrote for the toggles whose colours have changed since. Such a
// value is the toggle's, not an edit of the user's, so rebuilding the layers
// does not keep it as an override and the toggle's current colours take over.
// Frozen on purpose: it must not follow later changes to the toggles.
function legacyToggleColors(quick, themeJson) {
    const q = expandQuick(quick, themeJson);
    const light = themeJson.type === 'vs' || themeJson.type === 'light';
    const L = colorUtils.adjustLightness;
    const out = {};
    const paint = (keys, value) => { for (const key of keys) out[key] = value; };
    const surfaces = (primary, secondary, widgets) => {
        paint(['editor.background', 'terminal.background', 'breadcrumb.background', 'panel.background',
            'tab.activeBackground'], primary);
        paint(['sideBar.background', 'activityBar.background', 'statusBar.background', 'titleBar.activeBackground',
            'titleBar.inactiveBackground', 'editorGroupHeader.tabsBackground', 'tab.inactiveBackground'], secondary);
        paint(['editorWidget.background', 'editorHoverWidget.background', 'editorSuggestWidget.background',
            'dropdown.background', 'quickInput.background', 'menu.background', 'notifications.background',
            'input.background'], widgets);
    };
    // Borderless-Mode NO drew the borders in a fully transparent Borders
    // colour set in Quick, which now counts as unset.
    if (q['ui.borderless'] === 'no' && toRgba8(q['ui.borders'])?.endsWith('00')
        && !sameColor(q['ui.borders'], extractBaseColorsFromTheme(themeJson).border)) {
        paint(BORDER_KEYS, q['ui.borders']);
    }
    if (q['ui.pureBlack'] === 'yes') {
        surfaces(light ? '#FFFFFF' : '#000000', light ? '#F5F5F5' : '#050505', light ? '#EDEDED' : '#0A0A0A');
        out['quickInputList.focusBackground'] = colorUtils.mix(light ? '#EDEDED' : '#0A0A0A',
            q['ui.accentPrimary'] || '#888888', 0.15);
    } else if (q['ui.pureBlack'] === 'no') {
        const lift = light ? -0.04 : 0.03;
        surfaces(L(q['ui.baseBackground'], lift), L(q['ui.secondaryBackground'], lift),
            L(q['ui.secondaryBackground'], light ? -0.07 : 0.5));
    }
    if (q['ui.vividSelection'] === 'no') {
        const A = (alpha) => colorUtils.addAlpha(q['ui.baseForeground'], alpha);
        out['editor.selectionBackground'] = A('55');
        out['editor.selectionHighlightBackground'] = A('30');
        out['editor.inactiveSelectionBackground'] = A('38');
        out['editor.wordHighlightBackground'] = A('35');
        out['editor.wordHighlightStrongBackground'] = A('48');
    }
    if (q['ui.activeTabHighlight'] === 'yes') {
        out['tab.activeBackground'] = colorUtils.mix(q['ui.baseBackground'], q['ui.accentPrimary'], 0.10);
        out['tab.unfocusedActiveBackground'] = colorUtils.mix(q['ui.baseBackground'], q['ui.accentPrimary'], 0.05);
        out['tab.activeForeground'] = q['ui.accentPrimary'];
        out['tab.unfocusedActiveForeground'] = colorUtils.mix(q['ui.baseForeground'], q['ui.accentPrimary'], 0.30);
        out['tab.activeBorderTop'] = q['ui.accentPrimary'];
        out['tab.activeBorder'] = q['ui.accentPrimary'];
    } else if (q['ui.activeTabHighlight'] === 'no') {
        out['tab.activeBackground'] = q['ui.baseBackground'];
        out['tab.unfocusedActiveBackground'] = q['ui.baseBackground'];
        out['tab.unfocusedActiveForeground'] = L(q['ui.baseForeground'], -0.2);
    }
    if (q['ui.vividSelection'] === 'yes') {
        const A = (alpha) => colorUtils.addAlpha(q['ui.accentPrimary'], alpha);
        out['editor.selectionBackground'] = A('50');
        out['editor.selectionHighlightBackground'] = A('30');
        out['editor.inactiveSelectionBackground'] = A('28');
    }
    if (q['ui.cursorLineGlow'] === 'yes') {
        out['editorLineNumber.activeForeground'] = q['ui.accentPrimary'];
    } else if (q['ui.cursorLineGlow'] === 'no') {
        out['editorCursor.foreground'] = L(q['ui.baseForeground'], light ? 0.2 : -0.2);
    }
    return out;
}

// What 1.0.5 derived from the Quick bases for the keys whose derivation has
// changed since (formula or sources), or that Quick no longer derives. Like
// legacyToggleColors, it keeps those values from being taken for the user's
// own when the layers are rebuilt. Frozen on purpose: it must not follow later
// changes.
const LEGACY_BASE_KEYS = (() => {
    const L = colorUtils.adjustLightness;
    const A = colorUtils.addAlpha;
    return [
        ['editor.lineHighlightBackground', 'bg', (b) => L(b.bg, 0.04)],
        ['editor.selectionHighlightBackground', 'selection', (b) => A(b.selection, '60')],
        ['editor.inactiveSelectionBackground', 'selection', (b) => A(b.selection, '50')],
        ['editor.findMatchHighlightBackground', 'accent', (b) => A(b.accent, '33')],
        ['editor.findRangeHighlightBackground', 'accent', (b) => A(b.accent, '15')],
        ['editorCursor.foreground', 'accent', (b) => b.accent],
        ['editorLineNumber.foreground', 'text', (b) => L(b.text, -0.4)],
        ['editorIndentGuide.background1', 'bg', (b) => L(b.bg, 0.1)],
        ['editorRuler.foreground', 'text', (b) => L(b.text, -0.5)],
        ['editorWhitespace.foreground', 'text', (b) => A(b.text, '30')],
        ['editorBracketHighlight.foreground1', 'accent', (b) => b.accent],
        ['editorBracketHighlight.foreground2', 'info', (b) => b.info],
        ['editorBracketHighlight.foreground3', 'success', (b) => b.success],
        ['editorBracketHighlight.foreground4', 'warning', (b) => b.warning],
        ['editorBracketHighlight.foreground5', 'activeBorder', (b) => b.activeBorder],
        ['editorBracketHighlight.foreground6', 'text', (b) => A(b.text, '99')],
        ['editorOverviewRuler.errorForeground', 'error', (b) => A(b.error, '80')],
        ['editorOverviewRuler.warningForeground', 'warning', (b) => A(b.warning, '80')],
        ['editorOverviewRuler.infoForeground', 'accent', (b) => A(b.accent, '80')],
        ['editorOverviewRuler.addedForeground', 'success', (b) => A(b.success, '80')],
        ['editorOverviewRuler.deletedForeground', 'error', (b) => A(b.error, '80')],
        ['sideBarTitle.foreground', 'text', (b) => b.text],
        ['sideBarSectionHeader.background', 'bgSec', (b) => L(b.bgSec, 0.04)],
        ['activityBar.inactiveForeground', 'text', (b) => L(b.text, -0.4)],
        ['activityBarTop.inactiveForeground', 'text', (b) => L(b.text, -0.4)],
        ['statusBar.background', 'bgSec', (b) => L(b.bgSec, -0.03)],
        ['statusBar.foreground', 'text', (b) => L(b.text, -0.2)],
        ['statusBar.noFolderBackground', 'bgSec', (b) => L(b.bgSec, 0.02)],
        ['statusBar.noFolderForeground', 'text', (b) => L(b.text, -0.2)],
        ['titleBar.inactiveBackground', 'bgSec', (b) => L(b.bgSec, -0.05)],
        ['titleBar.inactiveForeground', 'text', (b) => L(b.text, -0.3)],
        ['tab.inactiveForeground', 'text', (b) => L(b.text, -0.3)],
        ['tab.hoverBackground', 'bgSec', (b) => L(b.bgSec, 0.03)],
        ['tab.unfocusedActiveBackground', 'bg', (b) => L(b.bg, 0.02)],
        ['tab.unfocusedActiveForeground', 'text', (b) => L(b.text, -0.2)],
        ['tab.unfocusedInactiveForeground', 'text', (b) => L(b.text, -0.4)],
        ['panelTitle.inactiveForeground', 'text', (b) => L(b.text, -0.3)],
        ['panelSectionHeader.background', 'bgSec', (b) => L(b.bgSec, 0.02)],
        ['panelSectionHeader.foreground', 'text', (b) => b.text],
        ['terminalCursor.foreground', 'accent', (b) => b.accent],
        ['terminal.ansiBlack', 'bg', (b) => b.bg],
        ['terminal.ansiRed', 'error', (b) => b.error],
        ['terminal.ansiGreen', 'success', (b) => b.success],
        ['terminal.ansiYellow', 'warning', (b) => b.warning],
        ['terminal.ansiBlue', 'accent', (b) => b.accent],
        ['terminal.ansiMagenta', 'activeBorder', (b) => b.activeBorder],
        ['terminal.ansiCyan', 'info', (b) => b.info],
        ['terminal.ansiWhite', 'text', (b) => b.text],
        ['terminal.ansiBrightBlack', 'bg', (b) => L(b.bg, 0.2)],
        ['terminal.ansiBrightRed', 'error', (b) => L(b.error, 0.1)],
        ['terminal.ansiBrightGreen', 'success', (b) => L(b.success, 0.1)],
        ['terminal.ansiBrightYellow', 'warning', (b) => L(b.warning, 0.1)],
        ['terminal.ansiBrightBlue', 'accent', (b) => L(b.accent, 0.1)],
        ['terminal.ansiBrightMagenta', 'activeBorder', (b) => L(b.activeBorder, 0.1)],
        ['terminal.ansiBrightCyan', 'info', (b) => L(b.info, 0.1)],
        ['terminal.ansiBrightWhite', 'text', (b) => L(b.text, 0.1)],
        ['debugIcon.breakpointDisabledForeground', 'error', (b) => L(b.error, -0.3)],
        ['debugToolBar.background', 'bgSec', (b) => L(b.bgSec, 0.02)],
        ['editor.stackFrameHighlightBackground', 'warning', (b) => A(b.warning, '33')],
        ['editor.focusedStackFrameHighlightBackground', 'success', (b) => A(b.success, '33')],
        ['gitDecoration.renamedResourceForeground', 'accent', (b) => b.accent],
        ['gitDecoration.untrackedResourceForeground', 'success', (b) => b.success],
        ['gitDecoration.ignoredResourceForeground', 'text', (b) => L(b.text, -0.5)],
        ['gitDecoration.submoduleResourceForeground', 'accent', (b) => b.accent],
        ['diffEditorOverview.insertedForeground', 'success', (b) => A(b.success, '80')],
        ['diffEditorOverview.removedForeground', 'error', (b) => A(b.error, '80')],
        ['peekView.border', 'accent', (b) => b.accent],
        ['peekViewEditor.background', 'bg', (b) => L(b.bg, 0.01)],
        ['peekViewEditorGutter.background', 'bg', (b) => L(b.bg, 0.01)],
        ['peekViewResult.lineForeground', 'text', (b) => L(b.text, -0.2)],
        ['peekViewTitleDescription.foreground', 'text', (b) => L(b.text, -0.2)],
        ['button.hoverBackground', 'accent', (b) => L(b.accent, 0.08)],
        ['button.secondaryBackground', 'bgSec', (b) => L(b.bgSec, 0.05)],
        ['button.secondaryHoverBackground', 'bgSec', (b) => L(b.bgSec, 0.1)],
        ['checkbox.background', 'bg', (b) => L(b.bg, -0.02)],
        ['input.background', 'bg', (b) => L(b.bg, -0.02)],
        ['input.placeholderForeground', 'text', (b) => L(b.text, -0.4)],
        ['inputValidation.errorBackground', 'error', (b) => A(b.error, '20')],
        ['inputValidation.warningBackground', 'warning', (b) => A(b.warning, '20')],
        ['inputValidation.infoBackground', 'accent', (b) => A(b.accent, '20')],
        ['inputOption.activeBackground', 'accent', (b) => A(b.accent, '33')],
        ['list.focusOutline', 'accent', (b) => b.accent],
        ['list.filterMatchBackground', 'accent', (b) => A(b.accent, '40')],
        ['list.dropBackground', 'accent', (b) => A(b.accent, '30')],
        ['notificationCenterHeader.background', 'bgSec', (b) => L(b.bgSec, 0.05)],
        ['breadcrumb.foreground', 'text', (b) => L(b.text, -0.2)],
        ['breadcrumb.focusForeground', 'accent', (b) => b.accent],
        ['breadcrumb.activeSelectionForeground', 'accent', (b) => b.accent],
        ['quickInputTitle.background', 'bgSec', (b) => L(b.bgSec, 0.03)],
        ['textLink.activeForeground', 'accent', (b) => L(b.accent, 0.1)],
        ['chat.requestBackground', 'bg', (b) => L(b.bg, 0.02)],
        ['chat.requestBubbleBackground', 'bgSec', (b) => A(L(b.bgSec, 0.02), '66')],
        ['chat.requestBubbleHoverBackground', 'bgSec', (b) => A(L(b.bgSec, 0.05), '99')],
        ['chat.avatarBackground', 'bgSec', (b) => L(b.bgSec, 0.03)],
        ['inlineChat.background', 'bgSec', (b) => L(b.bgSec, 0.02)],
        ['inlineChatInput.placeholderForeground', 'text', (b) => L(b.text, -0.4)],
        ['inlineChatInput.background', 'bgSec', (b) => L(b.bgSec, 0.05)],
        ['editorGhostText.foreground', 'text', (b) => L(b.text, -0.5)],
        ['editorInlayHint.foreground', 'text', (b) => L(b.text, -0.5)],
        ['editorInlayHint.typeForeground', 'activeBorder', (b) => A(b.activeBorder, 'a0')],
        ['editorInlayHint.parameterForeground', 'info', (b) => A(b.info, 'a0')],
        ['menu.separatorBackground', 'text', (b) => A(b.text, '20')],
        ['panelInput.border', 'border', (b) => b.border],
        ['chat.requestBorder', 'border', (b) => b.border],
    ];
})();

// Keys the bases derive that 1.0.5 left to the theme.
const NEW_BASE_KEYS = ['minimap.background', 'editorStickyScroll.background', 'editorWidget.resizeBorder'];
// Besides those, 1.0.5 left the borders to the theme while Borderless-Mode was
// INHERIT, whatever the Borders colour, Pure-Black left the theme's other
// surfaces alone, and the status colours left the diagnostics marks alone.
const NEWLY_DERIVED_CANDIDATES = new Set([...LEGACY_BASE_KEYS.map(([key]) => key), ...NEW_BASE_KEYS, ...BORDER_KEYS,
    ...PURE_BLACK_AREAS, ...PURE_BLACK_WIDGETS, ...STATUS_MARKERS.map(([key]) => key)]);
// Keys the toggles write now that 1.0.5's toggles never wrote.
const UNTOGGLED_IN_1_0_5 = new Set(['panelInput.border', 'chat.requestBorder', ...PURE_BLACK_AREAS, ...PURE_BLACK_WIDGETS]);

// Keys now derived for `quick` that 1.0.5 left to the theme: their derivation
// changed, and 1.0.5 wrote them neither from a base nor through a toggle.
// The theme's value for them in the old outputs is the theme's, not the user's.
function newlyDerivedKeys(quick, themeJson, derived) {
    const old = legacyBaseColors(quick, themeJson);
    const toggled = generateQuickTheme(expandQuick(quick, themeJson), {}, themeJson.type).colors;
    return Object.keys(derived).filter(key => NEWLY_DERIVED_CANDIDATES.has(key) && !(key in old)
        && (toggled[key] === undefined || UNTOGGLED_IN_1_0_5.has(key)));
}

function legacyBaseColors(quick, themeJson) {
    const q = expandQuick(quick, themeJson);
    const bases = extractBaseColorsFromTheme(themeJson);
    const b = {};
    const dirty = {};
    for (const [key, base] of QUICK_BASES) {
        b[base] = q[key];
        dirty[base] = !sameColor(q[key], bases[base]);
    }
    const out = {};
    for (const [key, dep, value] of LEGACY_BASE_KEYS) {
        if (dirty[dep]) out[key] = value(b);
    }
    return out;
}

function dropThemeValues(ui, keys, themeJson) {
    const out = { ...ui };
    for (const key of keys) {
        if (sameColor(out[key], (themeJson.colors || {})[key])) delete out[key];
    }
    return out;
}

// What 1.0.5 wrote for the surfaces Pure-Black now darkens too: the colour the
// bases alone derive for them, as 1.0.5 darkened none of them. It derived the
// LEGACY_BASE_KEYS otherwise (legacyBaseColors) and left NEW_BASE_KEYS alone.
function legacyPureBlackSurfaces(quick, themeJson) {
    if (expandQuick(quick, themeJson)['ui.pureBlack'] !== 'yes') return {};
    const plain = deriveQuickColors(expandQuick({ ...quick, 'ui.pureBlack': 'inherit' }, themeJson), themeJson);
    const elsewhere = new Set([...LEGACY_BASE_KEYS.map(([key]) => key), ...NEW_BASE_KEYS]);
    const out = {};
    for (const key of [...PURE_BLACK_AREAS, ...PURE_BLACK_WIDGETS]) {
        if (key in plain && !elsewhere.has(key)) out[key] = plain[key];
    }
    return out;
}

// Earlier versions kept no state: the outputs were the only record, Advanced
// wrote the whole theme into them, and the Quick file alone held the toggles.
// The layers are rebuilt from both so the colours on screen do not change,
// except those an older version derived: they follow the derivation as it is
// now.
async function loadThemeState(context, themeLabel, themeJson) {
    const stored = readStoredState(themeLabel);
    if (stored) return stored;

    const sel = themeSelector(themeLabel);
    const cc = globalEntries('workbench', 'colorCustomizations')[sel];
    const tc = globalEntries('editor', 'tokenColorCustomizations')[sel];
    const sc = globalEntries('editor', 'semanticTokenColorCustomizations')[sel];
    if (!cc && !tc && !sc) return {};

    let quick = {};
    const quickText = await readTextIfExists(quickUriFor(context, themeLabel));
    if (quickText !== null) {
        quick = compactQuick(resolveQuickInput(quickText, quickDefaults(themeJson)).quick, themeJson);
    }
    const derived = deriveQuickColors(expandQuick(quick, themeJson), themeJson);
    const state = compactState({
        quick,
        ui: dropThemeValues([legacyToggleColors(quick, themeJson), legacyBaseColors(quick, themeJson), legacyPureBlackSurfaces(quick, themeJson)]
            .reduce(diffColors, diffColors(cc, { ...(themeJson.colors || {}), ...derived })),
        newlyDerivedKeys(quick, themeJson, derived), themeJson),
        semantic: diffSemantic({ ...(tc && tc.semanticTokenColors), ...(sc && sc.rules) }, themeJson.semanticTokenColors),
        textMate: diffTextMate(tc && tc.textMateRules, themeJson.tokenColors),
    });
    await saveThemeState(themeLabel, themeJson, state);
    return state;
}

// Views are rewritten from the state on every open, never under a buffer with
// unsaved edits. Applying a freshly rendered view changes nothing, so the change
// event the rewrite raises in a buffer VS Code still holds is harmless.
async function writeView(context, uri, content) {
    const open = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
    if (open && open.isDirty) return;
    if (await readTextIfExists(uri) === content) return;
    await vscode.workspace.fs.createDirectory(context.globalStorageUri);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
}

function hasThemeCustomization(themeLabel) {
    const sel = themeSelector(themeLabel);
    return !!(vscode.workspace.getConfiguration('workbench').get('colorCustomizations') || {})[sel]
        || !!(vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations') || {})[sel]
        || !!(vscode.workspace.getConfiguration('editor').get('semanticTokenColorCustomizations') || {})[sel];
}

// =========================================================================
// QUICK CSS FILE
// =========================================================================

function buildQuickCssContent(baseValues, toggles) {
    const safe = (v) => (v && typeof v === 'string') ? v : '#000000';

    return `/*
==========================================================
  QUICK CUSTOMIZATION — ARN-SKIN
==========================================================
  Change any color via the gutter color picker.
  Changes apply in real-time (debounced 400ms).
  On a changed line, the light bulb restores the
  theme's value.

  For syntax colors, use "Advanced: Syntax Colors" — it
  exposes all per-language scopes that the theme defines.
==========================================================
*/

:root {
    /* ---- UI base palette ---- */
    --Global-Background:     ${safe(baseValues.baseBackground)};
    --Main-Text:             ${safe(baseValues.baseForeground)};
    --Accentuation:          ${safe(baseValues.accentPrimary)};
    --Secondary-Background:  ${safe(baseValues.secondaryBackground)};
    --Surface-Elevated:      ${safe(baseValues.surfaceElevated)};
    --Borders:               ${safe(baseValues.borders)};
    --Active-Border:         ${safe(baseValues.activeBorder)};
    --Selection:             ${safe(baseValues.selection)};

    /* ---- Status palette (debug / git / diagnostics) ---- */
    --Status-Warning:        ${safe(baseValues.statusWarning)};
    --Status-Error:          ${safe(baseValues.statusError)};
    --Status-Success:        ${safe(baseValues.statusSuccess)};
    --Status-Info:           ${safe(baseValues.statusInfo)};

    /* ========================================================= */
    /* DISPLAY OPTIONS (Accepted values: YES / NO / INHERIT)     */
    /* ========================================================= */

  /* INHERIT = keep the theme's default behavior */

  /* YES: Highlights current line and cursor with an accent glow.
     NO:  Removes the line highlight entirely. */
    --Opt-Cursor-Line-Glow:     ${toggles.cursorLineGlow};

  /* YES: Turns every background near-black (near-white on
          light themes).
     NO:  Keeps the theme's own background shades. */
    --Opt-Pure-Black-Mode:      ${toggles.pureBlack};

  /* YES: Colors the selection and word highlights with the accent.
     NO:  Uses a soft neutral gray for the selection and word
          highlights.
     A Selection color set above still colors the selection. */
    --Opt-Vivid-Selection:      ${toggles.vividSelection};

  /* YES: Hides all UI borders (panels, tabs, side bar, widgets).
     NO:  Shows them all, in the Borders color set above or a
          subtle, text-tinted one.
     INHERIT: Keeps the theme's own borders, in the Borders
              color if set above. */
    --Opt-Borderless-Mode:      ${toggles.borderless};

  /* YES: Highlights the active tab with an accent background,
          text color, and top/bottom borders (in the Active-Border
          color if set above).
     NO:  Plain active tab, without accent color or border. */
    --Opt-Active-Tab-Highlight: ${toggles.activeTabHighlight};
}
`;
}

async function ensureQuickFile(context, themeLabel, themeJson) {
    const uri = quickUriFor(context, themeLabel);
    const state = await loadThemeState(context, themeLabel, themeJson);
    const { baseValues, toggles } = quickViewInputs(expandQuick(state.quick, themeJson));
    await writeView(context, uri, buildQuickCssContent(baseValues, toggles));
    return uri;
}

// =========================================================================
// ADVANCED JSONC FILE
// =========================================================================

// Find the `"colors": { ... }` block in a raw theme JSONC file and return
// it verbatim (including category comments and blank lines). Walks the
// text counting braces while honouring strings and comments so nested
// objects inside `colors` (none in our themes today, but cheap to handle)
// don't trip the matcher. Returns null if the block can't be located.
function extractColorsBlockFromTheme(themeRaw) {
    const colorsKeyRe = /"colors"\s*:\s*\{/;
    const m = themeRaw.match(colorsKeyRe);
    if (!m) return null;
    const openBraceIdx = m.index + m[0].length - 1;

    let depth = 1;
    let p = openBraceIdx + 1;
    let inStr = false, esc = false, inLineCmt = false, inBlockCmt = false;
    while (p < themeRaw.length && depth > 0) {
        const c = themeRaw[p], n = themeRaw[p + 1];
        if (inLineCmt) {
            if (c === '\n') inLineCmt = false;
            p++; continue;
        }
        if (inBlockCmt) {
            if (c === '*' && n === '/') { inBlockCmt = false; p += 2; continue; }
            p++; continue;
        }
        if (inStr) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inStr = false;
            p++; continue;
        }
        if (c === '"') { inStr = true; p++; continue; }
        if (c === '/' && n === '/') { inLineCmt = true; p += 2; continue; }
        if (c === '/' && n === '*') { inBlockCmt = true; p += 2; continue; }
        if (c === '{') depth++;
        else if (c === '}') {
            depth--;
            if (depth === 0) break;
        }
        p++;
    }
    if (depth !== 0) return null;
    return themeRaw.slice(openBraceIdx, p + 1); // includes opening { and closing }
}

// Splice user-side colour overrides into the theme's verbatim block.
// Existing keys get a value-only substitution (preserving every comment
// and indent in the surrounding text). User-only keys (added through
// Quick mode, or VSCode tokens not present in the theme) are appended
// in a clearly-labelled block right before the closing `}`.
function mergeUserColorsIntoBlock(block, userColors) {
    if (!block) return null;
    let parsed;
    try { parsed = parseJsonc(block); } catch { return null; }
    const themeBlockKeys = new Set(Object.keys(parsed));

    const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let result = block;

    for (const [key, value] of Object.entries(userColors)) {
        if (typeof value !== 'string') continue;
        if (!themeBlockKeys.has(key)) continue;
        const re = new RegExp(`("${escRe(key)}"\\s*:\\s*)("[^"]*")`);
        result = result.replace(re, (full, prefix) => prefix + JSON.stringify(value));
    }

    const userOnlyKeys = Object.keys(userColors).filter(k =>
        !themeBlockKeys.has(k) && typeof userColors[k] === 'string');
    if (userOnlyKeys.length > 0) {
        const indent = '    ';
        // Strip the trailing `}` (and any whitespace before it) to splice in
        // the appended user keys, then close the block again.
        const closeIdx = result.lastIndexOf('}');
        let beforeClose = result.slice(0, closeIdx).replace(/\s*$/, '');
        if (!beforeClose.endsWith(',')) beforeClose += ',';
        let appended = beforeClose + '\n\n';
        appended += indent + '// ─────────────────────────────────────────────\n';
        appended += indent + '//   USER-ADDED KEYS (not present in the theme)\n';
        appended += indent + '// ─────────────────────────────────────────────\n';
        for (let i = 0; i < userOnlyKeys.length; i++) {
            const k = userOnlyKeys[i];
            const sep = i < userOnlyKeys.length - 1 ? ',' : '';
            appended += indent + JSON.stringify(k) + ': ' + JSON.stringify(userColors[k]) + sep + '\n';
        }
        appended += '  }';
        result = appended;
    }

    return result;
}

async function ensureAdvancedUIFile(context, themeLabel, themeJson) {
    const uri = advancedUIUriFor(context, themeLabel);
    const state = await loadThemeState(context, themeLabel, themeJson);
    const userColors = composeOutputs(state, themeJson).colors;

    const header =
        `/*
==========================================================
  ADVANCED · UI COLORS — ARN-SKIN
  Theme: ${themeLabel}
==========================================================
  Every workbench color is listed below, grouped by the
  same categories as the source theme. Click the gutter
  color swatch to pick a new color. Changes apply in
  real-time (400ms debounce).

  For syntax highlighting, use "Advanced: Syntax Colors".
  To restore defaults, pick "Reset" from the Skin menu.
  Rebuilt from your saved customizations on every open.
==========================================================
*/
`;

    // Read the source theme file so we can copy its `colors` block verbatim,
    // category comments and all. Falls back to a stringified payload if the
    // file can't be located or parsed (defensive — should never happen with
    // a valid published theme).
    let body;
    try {
        const packageUri = vscode.Uri.joinPath(context.extensionUri, 'package.json');
        const packageJson = parseJsonc(new TextDecoder().decode(
            await vscode.workspace.fs.readFile(packageUri)));
        const themeEntry = packageJson.contributes.themes.find(t => t.label === themeLabel);
        if (themeEntry) {
            const themeFileUri = vscode.Uri.joinPath(context.extensionUri, themeEntry.path);
            // The themes ship with CRLF; spliced under the LF header they would
            // give the view mixed line endings, which VS Code rewrites on save.
            const themeRaw = new TextDecoder().decode(
                await vscode.workspace.fs.readFile(themeFileUri)).replace(/\r\n/g, '\n');
            const block = extractColorsBlockFromTheme(themeRaw);
            const merged = mergeUserColorsIntoBlock(block, userColors);
            if (merged) {
                body = `{\n  "$schema": "vscode://schemas/color-theme",\n  "colors": ${merged}\n}\n`;
            }
        }
    } catch { /* fall through to flat-JSON fallback */ }

    if (!body) {
        const KEY_RE = /^[a-zA-Z][a-zA-Z0-9.]*$/;
        const filterKeys = (obj) => {
            const out = {};
            for (const [k, v] of Object.entries(obj || {})) {
                if (KEY_RE.test(k)) out[k] = v;
            }
            return out;
        };
        const payload = {
            "$schema": "vscode://schemas/color-theme",
            colors: { ...filterKeys(themeJson.colors), ...filterKeys(userColors) },
        };
        body = JSON.stringify(payload, null, 2);
    }

    await writeView(context, uri, header + body);
    return uri;
}

async function ensureAdvancedSyntaxFile(context, themeLabel, themeJson) {
    const uri = advancedSyntaxUriFor(context, themeLabel);
    const state = await loadThemeState(context, themeLabel, themeJson);

    // Force every semantic token to the `{ foreground: "…" }` object form.
    // The JSON color picker fires reliably on object-shaped values whose
    // `foreground` property has a `format: "color-hex"` declaration, but
    // does NOT fire on string-shorthand values when the property's schema
    // is wrapped in `anyOf` (every recent VSCode + Antigravity build).
    // Pair this with the schema fix that drops `anyOf` from each semantic
    // entry: together they put a working color swatch in the gutter for
    // every entry — exactly what the user expects when editing this file.
    const semanticTokenColors = { ...normalizeSemantic(themeJson.semanticTokenColors), ...(state.semantic || {}) };

    // No `$schema` line is written here. Declaring `vscode://schemas/color-theme`
    // would pin the file to VSCode's built-in color-theme schema, whose
    // semanticTokenColors entry uses a dynamic `$ref` to
    // `vscode://schemas/token-styling`. That ref provides validation but
    // DOES NOT carry a `format: "color-hex"` hint reachable by the gutter
    // color decorator, so the picker silently fails to render the swatch on
    // every semantic entry. Leaving `$schema` unset lets our extension's
    // `jsonValidation` binding (declared in `package.json` against
    // `fileMatch: "advanced-*.jsonc"`) be the sole authority — it puts an
    // explicit `format: "color-hex"` on every
    // `semanticTokenColors[token].foreground` in the resolver's path.
    const payload = {
        semanticTokenColors,
        tokenColors: renderTextMateView(themeJson.tokenColors, state.textMate),
    };

    const header =
        `/*
==========================================================
  ADVANCED · SYNTAX COLORS — ARN-SKIN
  Theme: ${themeLabel}
==========================================================
  Semantic tokens and TextMate rules for code highlighting
  are listed below. Click the gutter color swatch to pick a
  new color. Changes apply in real-time (400ms).

  For UI chrome, use "Advanced: UI Colors".
  To restore defaults, pick "Reset" from the Skin menu.
  Rebuilt from your saved customizations on every open.

==========================================================
Color picker tip for Advanced Syntax editing

The Advanced: Syntax Colors file lists ~900+ TextMate rules
(per-language scopes + cross-platform bracket cumul rules).
By default VSCode renders the gutter color swatch on the first
500 entries only. To get the picker on every entry, add this
to your user settings:

    "editor.colorDecoratorsLimit": 1000

⚠️ WARNING: Render hundreds of extra color decorators consumes 
heavy resources. It may cause the editor to freeze or become 
slow while editing this file.
==========================================================
*/
`;
    const body = JSON.stringify(payload, null, 2);
    await writeView(context, uri, header + body);
    return uri;
}

// =========================================================================
// CSS COLOUR NOTATIONS — every format the CSS colour picker can write
// Clicking the picker's header cycles through rgb, hex, hsl, hwb, lab, lch,
// oklab and oklch. Each reads into #RRGGBB, or #RRGGBBAA below full opacity.
// lab() and lch() use the D65 white point, as VS Code's picker writes them;
// CSS Color 4 specifies D50, which would shift a picked colour on read-back.
// =========================================================================

const D65_WHITE = [0.3127 / 0.3290, 1, (1 - 0.3127 - 0.3290) / 0.3290];
const XYZ_TO_LINEAR_SRGB = [
    [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
    [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
    [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const multiply = (m, v) => m.map(row => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

function labToLinearSrgb(L, a, b) {
    const k = 24389 / 27;
    const e = 216 / 24389;
    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;
    const xyz = [
        fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k,
        L > k * e ? fy ** 3 : L / k,
        fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k,
    ].map((c, i) => c * D65_WHITE[i]);
    return multiply(XYZ_TO_LINEAR_SRGB, xyz);
}

function oklabToLinearSrgb(L, a, b) {
    const [l, m, s] = [
        L + 0.3963377774 * a + 0.2158037573 * b,
        L - 0.1055613458 * a - 0.0638541728 * b,
        L - 0.0894841775 * a - 1.2914855480 * b,
    ].map(c => c ** 3);
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
}

const encodeSrgb = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const polar = (chroma, hueDeg) => [chroma * Math.cos(hueDeg * Math.PI / 180), chroma * Math.sin(hueDeg * Math.PI / 180)];

function cssColorToHex(text) {
    const value = String(text).trim().toLowerCase();
    if (HEX_COLOR_RE.test(value)) return colorUtils.normalizeHex(value);
    const m = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(([^()]*)\)$/.exec(value);
    if (!m) return null;
    const parts = m[2].replace(/[,/]/g, ' ').trim().split(/\s+/);
    if (parts.length !== 3 && parts.length !== 4) return null;
    // A percentage is scaled so that 100% equals `full`, as each notation defines.
    const num = (token, full = 100) => {
        if (!/^[+-]?(\d+\.?\d*|\.\d+)(%|deg)?$/.test(token)) return NaN;
        const n = parseFloat(token);
        return token.endsWith('%') ? n * full / 100 : n;
    };
    const [x, y, z] = parts;
    const alpha = parts[3] === undefined ? 1 : num(parts[3], 1);
    const hue = ((num(x) % 360) + 360) % 360 / 360;
    let rgb;
    switch (m[1]) {
        case 'rgb': case 'rgba':
            rgb = [num(x, 255), num(y, 255), num(z, 255)];
            break;
        case 'hsl': case 'hsla': {
            const c = colorUtils.hslToRgb(hue, num(y, 1), num(z, 1));
            rgb = [c.r, c.g, c.b];
            break;
        }
        case 'hwb': {
            const w = num(y, 1);
            const bl = num(z, 1);
            if (w + bl >= 1) {
                rgb = Array(3).fill(255 * w / (w + bl));
            } else {
                const c = colorUtils.hslToRgb(hue, 1, 0.5);
                rgb = [c.r, c.g, c.b].map(v => 255 * (v / 255 * (1 - w - bl) + w));
            }
            break;
        }
        case 'lab':
            rgb = labToLinearSrgb(num(x, 100), num(y, 125), num(z, 125)).map(encodeSrgb);
            break;
        case 'lch':
            rgb = labToLinearSrgb(num(x, 100), ...polar(num(y, 150), num(z))).map(encodeSrgb);
            break;
        case 'oklab':
            rgb = oklabToLinearSrgb(num(x, 1), num(y, 0.4), num(z, 0.4)).map(encodeSrgb);
            break;
        case 'oklch':
            rgb = oklabToLinearSrgb(num(x, 1), ...polar(num(y, 0.4), num(z))).map(encodeSrgb);
            break;
    }
    if (![...rgb, alpha].every(Number.isFinite)) return null;
    const hex = colorUtils.rgbToHex(...rgb);
    if (alpha >= 1) return hex;
    return hex + Math.round(Math.max(0, alpha) * 255).toString(16).padStart(2, '0').toUpperCase();
}

// =========================================================================
// CSS PARSING for QUICK mode
// =========================================================================

function parseQuickCss(text) {
    const parseHex = (varName) => {
        const m = new RegExp(`--${varName}:\\s*([^;\\n]+)`, 'i').exec(text);
        return m ? cssColorToHex(m[1]) : null;
    };
    const parseToggle = (varName) => {
        const re = new RegExp(`--${varName}:\\s*(yes|no|inherit)\\b`, 'i');
        const m = text.match(re);
        return m ? m[1].toLowerCase() : 'inherit';
    };

    return {
        "ui.baseBackground": parseHex("Global-Background"),
        "ui.baseForeground": parseHex("Main-Text"),
        "ui.accentPrimary": parseHex("Accentuation"),
        "ui.secondaryBackground": parseHex("Secondary-Background"),
        "ui.surfaceElevated": parseHex("Surface-Elevated"),
        "ui.borders": parseHex("Borders"),
        "ui.activeBorder": parseHex("Active-Border"),
        "ui.selection": parseHex("Selection"),
        "status.warning": parseHex("Status-Warning"),
        "status.error": parseHex("Status-Error"),
        "status.success": parseHex("Status-Success"),
        "status.info": parseHex("Status-Info"),
        "ui.borderless": parseToggle("Opt-Borderless-Mode"),
        "ui.pureBlack": parseToggle("Opt-Pure-Black-Mode"),
        "ui.activeTabHighlight": parseToggle("Opt-Active-Tab-Highlight"),
        "ui.vividSelection": parseToggle("Opt-Vivid-Selection"),
        "ui.cursorLineGlow": parseToggle("Opt-Cursor-Line-Glow"),
    };
}

// =========================================================================
// APPLY — writes customizations to workbench/editor configuration
// =========================================================================

// `themeLabel` defaults to the active theme.
async function resolveTheme(context, themeLabel) {
    return themeLabel ? getThemeData(context, themeLabel) : getActiveThemeData(context);
}

// The apply* functions return the colours they rejected, each keeping its
// previous value, or null when they could not read the file at all.
async function applyQuick(context, cssText, themeLabel) {
    const theme = await resolveTheme(context, themeLabel);
    if (!theme) return null;
    const { themeJson } = theme;
    const state = await loadThemeState(context, theme.themeLabel, themeJson);

    const before = expandQuick(state.quick, themeJson);
    const { quick: after, rejected } = resolveQuickInput(cssText, before);

    await saveThemeState(theme.themeLabel, themeJson, {
        ...state,
        quick: compactQuick(after, themeJson),
        ui: dropSupersededOverrides(state.ui,
            deriveQuickColors(before, themeJson), deriveQuickColors(after, themeJson)),
    });
    return rejected;
}

// Deep-equality between two plain JSON values (null/string/number/bool/
// array/object). We can't use `===` because the customisation JSONC is
// freshly parsed each apply and never identity-equal to the theme JSON.
function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    const aArr = Array.isArray(a), bArr = Array.isArray(b);
    if (aArr !== bArr) return false;
    if (aArr) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
        return true;
    }
    const ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
    return true;
}

async function applyAdvancedUI(context, jsonText, themeLabel) {
    const theme = await resolveTheme(context, themeLabel);
    if (!theme) return null;
    const { themeJson } = theme;

    let payload;
    try {
        payload = parseJsonc(jsonText);
    } catch (err) {
        console.warn('[ARN] Advanced UI JSONC parse error:', err.message);
        return null;
    }
    if (!payload || typeof payload !== 'object') return null;
    const colors = payload.colors && typeof payload.colors === 'object' && !Array.isArray(payload.colors)
        ? payload.colors : {};

    const state = await loadThemeState(context, theme.themeLabel, themeJson);
    const baseline = { ...(themeJson.colors || {}), ...deriveQuickColors(expandQuick(state.quick, themeJson), themeJson) };
    const { accepted, rejected } = keepPreviousUiColors(colors, { ...baseline, ...(state.ui || {}) });
    await saveThemeState(theme.themeLabel, themeJson, { ...state, ui: diffColors(accepted, baseline) });
    return rejected;
}

async function applyAdvancedSyntax(context, jsonText, themeLabel) {
    const theme = await resolveTheme(context, themeLabel);
    if (!theme) return null;
    const { themeJson } = theme;

    let payload;
    try {
        payload = parseJsonc(jsonText);
    } catch (err) {
        console.warn('[ARN] Advanced Syntax JSONC parse error:', err.message);
        return null;
    }
    if (!payload || typeof payload !== 'object') return null;

    const themeRules = themeJson.tokenColors || [];
    const state = await loadThemeState(context, theme.themeLabel, themeJson);
    const { semantic, rules, rejected } = keepPreviousSyntaxColors(payload,
        { ...normalizeSemantic(themeJson.semanticTokenColors), ...(state.semantic || {}) },
        renderTextMateView(themeRules, state.textMate));
    const edited = diffTextMate(rules, themeRules);
    await saveThemeState(theme.themeLabel, themeJson, {
        ...state,
        semantic: diffSemantic(semantic, themeJson.semanticTokenColors),
        // Canonical order, so re-applying an unedited view is a no-op.
        textMate: diffTextMate(renderTextMateView(themeRules, edited), themeRules),
    });
    return rejected;
}

// =========================================================================
// RESET — remove customizations and delete open files for the given theme
// =========================================================================

async function resetTheme(context, themeLabel, skipReapplySet) {
    // Close any open customisation tabs first. Stock VSCode does NOT
    // auto-close tabs whose underlying file gets deleted (some forks like
    // Antigravity IDE do, but we cannot rely on that). The skipReapplySet
    // (when supplied by activate) prevents the close handler from re-
    // applying the about-to-be-deleted file's content back into settings
    // during the close → delete race.
    await closeCustomisationFilesForTheme(themeLabel, skipReapplySet);

    await updateThemeEntry('arnSkin', 'customizations', themeLabel, undefined);
    await updateThemeEntry('workbench', 'colorCustomizations', themeLabel, undefined);
    await updateThemeEntry('editor', 'tokenColorCustomizations', themeLabel, undefined);
    await updateThemeEntry('editor', 'semanticTokenColorCustomizations', themeLabel, undefined);

    // Delete associated files (best-effort, ignore if missing)
    const filesToDelete = [
        quickUriFor(context, themeLabel),
        advancedUIUriFor(context, themeLabel),
        advancedSyntaxUriFor(context, themeLabel),
    ];
    for (const uri of filesToDelete) {
        try {
            await vscode.workspace.fs.delete(uri);
        } catch { /* already gone */ }
    }
}

// =========================================================================
// THEME DATA LOADER
// =========================================================================

async function readPackageJson(context) {
    const data = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'package.json'));
    return parseJsonc(new TextDecoder().decode(data));
}

async function getActiveThemeData(context) {
    const themeLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    if (!themeLabel || !themeLabel.startsWith('Arn')) return null;
    return getThemeData(context, themeLabel);
}

// Each file belongs to the theme in its name, whichever theme is active.
async function themeLabelForUri(context, uri) {
    const m = /^(?:quick|advanced-ui|advanced-syntax)-(.+)\.(?:css|jsonc)$/.exec(uri.path.split('/').pop() || '');
    if (!m) return null;
    const theme = (await readPackageJson(context)).contributes.themes.find(t => sanitizeLabel(t.label) === m[1]);
    return theme ? theme.label : null;
}

async function getThemeData(context, themeLabel) {
    const packageJson = await readPackageJson(context);
    const themeEntry = packageJson.contributes.themes.find(t => t.label === themeLabel);
    if (!themeEntry) return null;

    const liveFileUri = vscode.Uri.joinPath(context.extensionUri, themeEntry.path);
    const themeData = await vscode.workspace.fs.readFile(liveFileUri);
    const themeString = new TextDecoder().decode(themeData);

    let themeJson;
    try {
        themeJson = parseJsonc(themeString);
    } catch (finalError) {
        vscode.window.showErrorMessage(`Theme Syntax Error: [${themeLabel}] contains invalid structure.`);
        console.error(`[ARN] JSON Parse Error on ${themeLabel}:`, finalError);
        return null;
    }

    return { themeLabel, themeJson, packageJson };
}

const NOTICE_COOLDOWN_MS = 15000;

// Which rejections a notice announces: each value once, and at most one notice
// per file every 15 s, so a colour typed letter by letter with long pauses does
// not raise one per letter. The file itself always shows the current state.
function planNotice(previous, rejected, now) {
    const id = (r) => `${r.name}=${r.value}`;
    const seen = previous ? previous.seen : new Set();
    const lastAt = previous ? previous.at : -Infinity;
    const fresh = rejected.filter(r => !seen.has(id(r)));
    const due = fresh.length > 0 && now - lastAt >= NOTICE_COOLDOWN_MS;
    return { announce: due ? fresh : [], next: { seen: new Set(rejected.map(id)), at: due ? now : lastAt } };
}

// =========================================================================
// ACTIVATE
// =========================================================================

function activate(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(paintcan) Skin';
    statusBarItem.command = 'arn.manageSkin';
    context.subscriptions.push(statusBarItem);

    // Every read-modify-write of the state runs through this queue, one at a
    // time and in the order the events arrived: an apply, a save and a tab close
    // racing each other can otherwise restore a snapshot over a saved edit.
    let queue = Promise.resolve();
    const enqueue = (task) => {
        const run = queue.then(task);
        queue = run.catch(() => { /* reported by the caller */ });
        return run;
    };

    // URIs we close ourselves (theme switch, Reset): the operation owns the
    // settings, so their tab-close restores nothing.
    const skipReapplyUris = new Set();

    // Per theme, the state from before the first unsaved edit. Closing the tab
    // without saving restores it, undoing the live preview — including any
    // Advanced override a Quick edit took over.
    const editSnapshots = new Map();

    // Buffers left dirty by a previous session have no snapshot; discarding
    // them falls back to re-applying the file on disk.
    const revertFromDisk = new Set(vscode.workspace.textDocuments
        .filter(d => d.isDirty && inferCustomizationMode(d.uri, context))
        .map(d => d.uri.toString()));

    // Rate-limited error reporter — surface apply failures in the UI but don't
    // spam the user with toasts when they're typing through a broken state.
    const RATE_LIMIT_MS = 5000;
    let lastNotifiedAt = 0;
    const reportApplyError = (err) => {
        console.warn('[ARN]', err);
        const now = Date.now();
        if (now - lastNotifiedAt < RATE_LIMIT_MS) return;
        lastNotifiedAt = now;
        const msg = (err && err.message) ? err.message : String(err);
        vscode.window.showErrorMessage(`ARN-Skin: failed to apply customization — ${msg}`);
    };

    // A colour typed by hand can be half-written or broken. The notice waits
    // for the debounce; planNotice decides what it announces.
    const notices = new Map();
    const reportRejected = (fileKey, rejected) => {
        const { announce, next } = planNotice(notices.get(fileKey), rejected, Date.now());
        notices.set(fileKey, next);
        if (announce.length === 0) return;
        const more = announce.length > 1 ? ` (+${announce.length - 1} more)` : '';
        vscode.window.showWarningMessage(`ARN-Skin: ${summarizeRejected(announce[0])}${more}`);
    };

    // The same rejections, underlined where they are written, with the kept
    // colour after the line and a quick fix that puts it back.
    const diagnostics = vscode.languages.createDiagnosticCollection('arn-skin');
    const hintDecoration = vscode.window.createTextEditorDecorationType({
        after: { margin: '0 0 0 2em', fontStyle: 'italic', color: new vscode.ThemeColor('descriptionForeground') },
    });
    context.subscriptions.push(diagnostics, hintDecoration);
    const rejectionMarks = new Map();
    const showHints = (editor) => {
        const marks = rejectionMarks.get(editor.document.uri.toString()) || [];
        editor.setDecorations(hintDecoration, marks.map(m => {
            const end = editor.document.lineAt(m.diagnostic.range.start.line).range.end;
            return { range: new vscode.Range(end, end), renderOptions: { after: { contentText: m.hint } } };
        }));
    };
    const refreshHints = (uri) => {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() === uri.toString()) showHints(editor);
        }
    };
    const markRejected = (doc, rejected) => {
        const text = doc.getText();
        const marks = [];
        for (const r of rejected) {
            const spot = locateRejected(text, r);
            if (!spot) continue;
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(doc.positionAt(spot.start), doc.positionAt(spot.end)),
                describeRejected(r), vscode.DiagnosticSeverity.Warning);
            diagnostic.source = 'ARN-Skin';
            const fix = spot.fix && {
                title: r.value === null ? `Restore ${r.name}: ${r.kept}` : `Restore the previous color (${r.kept})`,
                range: new vscode.Range(doc.positionAt(spot.fix.start), doc.positionAt(spot.fix.end)),
                newText: spot.fix.newText,
            };
            marks.push({ diagnostic, fix, hint: hintForRejected(r) });
        }
        diagnostics.set(doc.uri, marks.map(m => m.diagnostic));
        rejectionMarks.set(doc.uri.toString(), marks);
        refreshHints(doc.uri);
    };
    const clearMarks = (uri) => {
        diagnostics.delete(uri);
        rejectionMarks.delete(uri.toString());
        refreshHints(uri);
    };
    // The theme's Quick values, read once per theme: the light bulb asks for
    // them at every cursor move in a Quick file.
    const themeDefaults = new Map();
    const quickDefaultsFor = async (uri) => {
        const themeLabel = await themeLabelForUri(context, uri);
        if (!themeLabel) return null;
        if (!themeDefaults.has(themeLabel)) {
            const theme = await getThemeData(context, themeLabel);
            if (!theme) return null;
            themeDefaults.set(themeLabel, quickDefaults(theme.themeJson));
        }
        return themeDefaults.get(themeLabel);
    };
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { pattern: new vscode.RelativePattern(context.globalStorageUri, '*') },
            {
                async provideCodeActions(doc, range, ctx) {
                    const marks = rejectionMarks.get(doc.uri.toString()) || [];
                    const actions = marks
                        .filter(m => m.fix && ctx.diagnostics.some(d =>
                            d.source === 'ARN-Skin' && d.range.isEqual(m.diagnostic.range) && d.message === m.diagnostic.message))
                        .map(m => {
                            const action = new vscode.CodeAction(m.fix.title, vscode.CodeActionKind.QuickFix);
                            action.edit = new vscode.WorkspaceEdit();
                            action.edit.replace(doc.uri, m.fix.range, m.fix.newText);
                            action.diagnostics = [m.diagnostic];
                            action.isPreferred = true;
                            return action;
                        });
                    if (inferCustomizationMode(doc.uri, context) !== 'quick') return actions;
                    const defaults = await quickDefaultsFor(doc.uri);
                    for (const r of defaults ? themeRestores(doc.getText(), defaults) : []) {
                        const at = new vscode.Range(doc.positionAt(r.start), doc.positionAt(r.end));
                        if (range.start.line !== range.end.line || at.start.line !== range.start.line) continue;
                        const action = new vscode.CodeAction(r.title, vscode.CodeActionKind.QuickFix);
                        action.edit = new vscode.WorkspaceEdit();
                        action.edit.replace(doc.uri, at, r.newText);
                        actions.push(action);
                    }
                    return actions;
                },
            },
            { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }),
        vscode.workspace.onDidCloseTextDocument(doc => clearMarks(doc.uri)),
        vscode.window.onDidChangeVisibleTextEditors(editors => editors.forEach(showHints)),
    );

    const updateStatusBar = () => {
        const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
        if (theme && theme.startsWith('Arn')) {
            if (hasThemeCustomization(theme)) {
                statusBarItem.text = '$(paintcan) Skin (Customized)';
                statusBarItem.tooltip = 'Customized theme. Click to manage.';
            } else {
                statusBarItem.text = '$(paintcan) Skin';
                statusBarItem.tooltip = 'Customize theme colors.';
            }
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    };
    updateStatusBar();

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('workbench.colorTheme') ||
                e.affectsConfiguration('workbench.colorCustomizations') ||
                e.affectsConfiguration('editor.tokenColorCustomizations') ||
                e.affectsConfiguration('editor.semanticTokenColorCustomizations')) {
                updateStatusBar();
            }
        })
    );

    const applyByMode = async (mode, text, themeLabel) => {
        if (mode === 'quick') return applyQuick(context, text, themeLabel);
        if (mode === 'advanced-ui') return applyAdvancedUI(context, text, themeLabel);
        if (mode === 'advanced-syntax') return applyAdvancedSyntax(context, text, themeLabel);
        return null;
    };

    const applyDocument = async (doc, mode) => {
        // A file gone from disk was reset or deleted: its buffer no longer holds
        // a customisation. Antigravity edits a buffer while saving it, and the
        // reset saves before deleting, so that edit would otherwise re-apply.
        try {
            await vscode.workspace.fs.stat(doc.uri);
        } catch {
            return;
        }
        const themeLabel = await themeLabelForUri(context, doc.uri);
        if (!themeLabel) return;
        // A save queued before this apply leaves a clean buffer: nothing for a
        // close to discard. A buffer left dirty by a previous session has no
        // snapshot: the state already holds its unsaved edits, and discarding
        // it re-applies the file on disk instead.
        if (doc.isDirty && !editSnapshots.has(themeLabel) && !revertFromDisk.has(doc.uri.toString())) {
            const theme = await getThemeData(context, themeLabel);
            if (theme) editSnapshots.set(themeLabel, await loadThemeState(context, themeLabel, theme.themeJson));
        }
        const rejected = await applyByMode(mode, doc.getText(), themeLabel);
        if (!rejected) return;
        reportRejected(doc.uri.toString(), rejected);
        markRejected(doc, rejected);
    };

    const pendingApplies = new Map();
    const scheduleApply = (doc, mode) => {
        const key = doc.uri.toString();
        const previous = pendingApplies.get(key);
        if (previous) clearTimeout(previous.timer);
        const run = () => {
            pendingApplies.delete(key);
            return enqueue(() => applyDocument(doc, mode)).catch(reportApplyError);
        };
        pendingApplies.set(key, { timer: setTimeout(run, 400), run });
    };
    const flushPendingApply = (key) => {
        const pending = pendingApplies.get(key);
        if (!pending) return;
        clearTimeout(pending.timer);
        pending.run();
    };

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            const mode = inferCustomizationMode(e.document.uri, context);
            if (mode && e.contentChanges.length > 0) scheduleApply(e.document, mode);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (!inferCustomizationMode(doc.uri, context)) return;
            const key = doc.uri.toString();
            // What was saved must be what the state holds, debounce or not.
            flushPendingApply(key);
            enqueue(async () => {
                revertFromDisk.delete(key);
                const themeLabel = await themeLabelForUri(context, doc.uri);
                if (themeLabel) editSnapshots.delete(themeLabel);
            }).catch(reportApplyError);
        })
    );

    // Tab events, not onDidCloseTextDocument: VS Code disposes a closed
    // document whenever it likes, and a late restore would clobber whatever
    // the user did in between.
    context.subscriptions.push(
        vscode.window.tabGroups.onDidChangeTabs(({ closed }) => {
            for (const tab of closed) {
                const uri = tab.input instanceof vscode.TabInputText ? tab.input.uri : null;
                const mode = uri && inferCustomizationMode(uri, context);
                if (!mode) continue;
                const key = uri.toString();
                const stillOpen = vscode.window.tabGroups.all.some(g => g.tabs.some(t =>
                    t.input instanceof vscode.TabInputText && t.input.uri.toString() === key));
                if (stillOpen) continue;
                // Read once the last tab is gone: a file open in two groups
                // closes twice, and the second close is ours too.
                const ours = skipReapplyUris.delete(key);
                clearMarks(uri);
                // A keystroke still waiting belongs to the edits being discarded.
                const pending = pendingApplies.get(key);
                if (pending && !ours) {
                    clearTimeout(pending.timer);
                    pendingApplies.delete(key);
                }
                enqueue(async () => {
                    const themeLabel = await themeLabelForUri(context, uri);
                    if (!themeLabel) return;
                    const snapshot = editSnapshots.get(themeLabel);
                    editSnapshots.delete(themeLabel);
                    if (ours) return;
                    if (snapshot) {
                        const theme = await getThemeData(context, themeLabel);
                        if (theme) await saveThemeState(themeLabel, theme.themeJson, snapshot);
                    } else if (revertFromDisk.delete(key)) {
                        const text = await readTextIfExists(uri);
                        const rejected = text === null ? null : await applyByMode(mode, text, themeLabel);
                        if (rejected) reportRejected(key, rejected);
                    }
                }).catch(reportApplyError);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('arn.manageSkin', async () => {
            const data = await getActiveThemeData(context);
            if (!data) return;
            const { themeLabel, themeJson, packageJson } = data;

            const hasCustomization = hasThemeCustomization(themeLabel);

            const options = [
                {
                    label: `⚡ Quick Customization`,
                    action: 'quick',
                    description: 'Edit 12 key colors and 5 toggles — every other UI key is derived from them'
                },
                {
                    label: `🌈 Advanced: UI Colors`,
                    action: 'advanced-ui',
                    description: 'Edit every workbench color (tabs, side bar, editor chrome…)'
                },
                {
                    label: `⌨️ Advanced: Syntax Colors`,
                    action: 'advanced-syntax',
                    description: 'Edit semantic tokens and TextMate rules for code highlighting'
                }
            ];

            if (hasCustomization) {
                options.push({
                    label: `♻️ Reset [${themeLabel}]`,
                    action: 'reset',
                    description: 'Remove all customizations and delete associated files'
                });
            }

            options.push({
                label: `✨ Change Theme`,
                action: 'changeTheme',
                description: 'Quickly switch between ARN-Skin themes'
            });

            const choice = await vscode.window.showQuickPick(options, {
                placeHolder: "Theme Management: " + themeLabel
            });
            if (!choice) return;

            // Every keystroke typed so far reaches the state before this action
            // reads or replaces it.
            for (const key of [...pendingApplies.keys()]) flushPendingApply(key);

            if (choice.action === 'quick') {
                try {
                    const uri = await enqueue(() => ensureQuickFile(context, themeLabel, themeJson));
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                    await closeOtherCustomisationFilesForTheme(themeLabel, 'quick');
                } catch (err) {
                    vscode.window.showErrorMessage("Unable to open Quick file: " + err.message);
                    console.error('[ARN]', err);
                }
                return;
            }

            if (choice.action === 'advanced-ui') {
                try {
                    const uri = await enqueue(() => ensureAdvancedUIFile(context, themeLabel, themeJson));
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                    await closeOtherCustomisationFilesForTheme(themeLabel, 'advanced-ui');
                } catch (err) {
                    vscode.window.showErrorMessage("Unable to open Advanced UI file: " + err.message);
                    console.error('[ARN]', err);
                }
                return;
            }

            if (choice.action === 'advanced-syntax') {
                try {
                    const uri = await enqueue(() => ensureAdvancedSyntaxFile(context, themeLabel, themeJson));
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                    await closeOtherCustomisationFilesForTheme(themeLabel, 'advanced-syntax');
                } catch (err) {
                    vscode.window.showErrorMessage("Unable to open Advanced Syntax file: " + err.message);
                    console.error('[ARN]', err);
                }
                return;
            }

            if (choice.action === 'reset') {
                const confirm = await vscode.window.showWarningMessage(
                    `Reset all customizations for ${themeLabel}?`,
                    {
                        modal: true,
                        detail: 'This will delete the Quick / Advanced files and remove every override for this theme. This cannot be undone.'
                    },
                    'Reset'
                );
                if (confirm !== 'Reset') return;

                try {
                    await enqueue(() => resetTheme(context, themeLabel, skipReapplyUris));
                    vscode.window.showInformationMessage(`Default colors restored for ${themeLabel}.`);
                } catch (err) {
                    vscode.window.showErrorMessage("Reset failed: " + err.message);
                    console.error('[ARN]', err);
                }
                return;
            }

            if (choice.action === 'changeTheme') {
                try {
                    // Menu order follows package.json declaration order.
                    const themeItems = packageJson.contributes.themes.map(t => {
                        const planet = planetOf(t.label);
                        return {
                            label: t.label,
                            description: t.label === themeLabel ? '(Active)' : '',
                            iconPath: planet
                                ? vscode.Uri.joinPath(context.extensionUri, 'media', `${planet.toLowerCase()}.png`)
                                : undefined,
                        };
                    });

                    const selected = await vscode.window.showQuickPick(themeItems, {
                        placeHolder: "Choose an ARN-Skin theme to apply"
                    });
                    if (selected && selected.label !== themeLabel) {
                        await enqueue(async () => {
                            await closeCustomisationFilesForTheme(themeLabel, skipReapplyUris);
                            const wb = vscode.workspace.getConfiguration('workbench');
                            await wb.update('colorTheme', selected.label, vscode.ConfigurationTarget.Global);
                        });
                    }
                } catch (err) {
                    vscode.window.showErrorMessage("Unable to list themes: " + err.message);
                    console.error('[ARN]', err);
                }
                return;
            }
        })
    );

    enqueue(() => refreshOutputs(context)).catch(reportApplyError);

    // Resolves once no edit waits for its debounce and the queue is empty. The
    // integration tests read it from the extension's exports.
    return {
        whenIdle: async () => {
            for (;;) {
                const current = queue;
                await current;
                if (pendingApplies.size === 0 && queue === current) return;
                await new Promise(r => setTimeout(r, 50));
            }
        },
    };
}

function deactivate() { }

module.exports = { activate, deactivate };

// =========================================================================
// TEST-ONLY EXPORT
// `__testing` is consumed by the Mocha suite under /test. It is never read
// by VSCode at runtime — the test harness lives in a separate package.json
// (test/package.json) and is excluded from the published .vsix via
// .vscodeignore. Keeping the bag here means tests can exercise pure
// helpers without copy-pasting them.
// =========================================================================
module.exports.__testing = {
    colorUtils,
    parseJsonc,
    deepEqual,
    extractBaseColorsFromTheme,
    generateQuickTheme,
    parseQuickCss,
    planNotice,
    cssColorToHex,
    keepPreviousUiColors,
    keepPreviousSyntaxColors,
    describeRejected,
    summarizeRejected,
    hintForRejected,
    locateRejected,
    themeRestores,
    buildQuickCssContent,
    sanitizeLabel,
    planetOf,
    inferCustomizationMode,
    closeCustomisationFilesForTheme,
    closeOtherCustomisationFilesForTheme,
    extractColorsBlockFromTheme,
    mergeUserColorsIntoBlock,
    ensureQuickFile,
    ensureAdvancedUIFile,
    ensureAdvancedSyntaxFile,
    applyQuick,
    applyAdvancedUI,
    applyAdvancedSyntax,
    resetTheme,
    getActiveThemeData,
    getThemeData,
    themeLabelForUri,
    sameColor,
    quickDefaults,
    expandQuick,
    compactQuick,
    resolveQuickInput,
    deriveQuickColors,
    dropSupersededOverrides,
    diffColors,
    normalizeSemantic,
    diffSemantic,
    diffTextMate,
    renderTextMateView,
    sanitizeState,
    composeOutputs,
    withOwnedPart,
    readStoredState,
    legacyToggleColors,
    legacyBaseColors,
    legacyPureBlackSurfaces,
    newlyDerivedKeys,
    loadThemeState,
    saveThemeState,
    refreshOutputs,
};
