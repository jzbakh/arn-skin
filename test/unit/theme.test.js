const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { __testing } = require('../../extension');
const { extractBaseColorsFromTheme, generateQuickTheme, parseJsonc } = __testing;

const REPO_ROOT = path.join(__dirname, '..', '..');

function loadTheme(name) {
    const p = path.join(REPO_ROOT, 'themes', name);
    return parseJsonc(fs.readFileSync(p, 'utf8'));
}

// Dirty helpers — the 12 UI/status bases Quick mode tracks.
// Quick mode does not expose syntax bases (kw/fn/st/vr/nb) because the
// theme's per-language TextMate scopes (e.g. `entity.name.function.python`)
// outrank generic syntax keys, making Quick syntax customisation unreliable.
// Syntax editing belongs to Advanced Syntax exclusively.
const ALL_BASES = [
    'bg', 'text', 'accent', 'bgSec', 'surfaceElevated',
    'border', 'activeBorder', 'selection',
    'warning', 'error', 'success', 'info',
];
const allDirty = Object.fromEntries(ALL_BASES.map(k => [k, true]));
const noneDirty = Object.fromEntries(ALL_BASES.map(k => [k, false]));

// Baseline parsed UI (used as input to generateQuickTheme). Must contain
// non-null values — generateQuickTheme does not validate them.
const baselineParsed = {
    'ui.baseBackground':      '#1E1E1E',
    'ui.baseForeground':      '#D4D4D4',
    'ui.accentPrimary':       '#007ACC',
    'ui.secondaryBackground': '#252526',
    'ui.surfaceElevated':     '#2D2D30',
    'ui.borders':             '#333333',
    'ui.activeBorder':        '#007ACC',
    'ui.selection':           '#007ACC40',
    'status.warning':         '#D0B860',
    'status.error':           '#E85850',
    'status.success':         '#70D888',
    'status.info':            '#4FB4FF',
    'ui.borderless':          'inherit',
    'ui.pureBlack':           'inherit',
    'ui.activeTabHighlight':  'inherit',
    'ui.vividSelection':      'inherit',
    'ui.cursorLineGlow':      'inherit',
};

describe('extractBaseColorsFromTheme', () => {
    it('returns fallback defaults for empty theme', () => {
        const bases = extractBaseColorsFromTheme({});
        assert.equal(bases.bg, '#1e1e1e');
        assert.equal(bases.text, '#d4d4d4');
        assert.equal(bases.accent, '#007acc');
    });

    it('extracts all 12 UI/status bases', () => {
        const bases = extractBaseColorsFromTheme({});
        for (const k of ALL_BASES) {
            assert.ok(bases[k], `missing base: ${k}`);
        }
    });

    it('does not expose syntax bases (kw/fn/st/vr/nb) — Quick mode is UI-only', () => {
        const bases = extractBaseColorsFromTheme({});
        assert.equal(bases.kw, undefined);
        assert.equal(bases.fn, undefined);
        assert.equal(bases.st, undefined);
        assert.equal(bases.vr, undefined);
        assert.equal(bases.nb, undefined);
    });

    it('reads real values from a real ARN theme', () => {
        const theme = loadTheme('arn-mars.json');
        const bases = extractBaseColorsFromTheme(theme);
        assert.equal(typeof bases.bg, 'string');
        assert.ok(bases.bg.startsWith('#'));
        assert.ok(bases.surfaceElevated.startsWith('#'));
        assert.ok(bases.activeBorder.startsWith('#'));
        assert.ok(bases.selection.startsWith('#'));
        assert.ok(bases.info.startsWith('#'));
    });

    it('falls back to derived surfaceElevated when theme lacks editorWidget.background', () => {
        const theme = { colors: { 'sideBar.background': '#202020' } };
        const bases = extractBaseColorsFromTheme(theme);
        // Should be derived from bgSec via adjustLightness — non-null and 7+ chars
        assert.ok(typeof bases.surfaceElevated === 'string');
        assert.ok(bases.surfaceElevated.length >= 7);
    });
});

describe('generateQuickTheme — INHERIT baseline', () => {
    it('emits an empty colors object when nothing is dirty and all toggles inherit', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.deepEqual(out.colors, {});
    });

    it('returns a `colors` object that has been cleaned of undefined entries', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        for (const v of Object.values(out.colors)) {
            assert.notEqual(v, undefined);
        }
    });
});

describe('generateQuickTheme — dirty bases', () => {
    it('emits a large set of derived keys when every base is dirty', () => {
        const out = generateQuickTheme(baselineParsed, allDirty);
        assert.ok(Object.keys(out.colors).length > 100,
            `expected > 100 keys, got ${Object.keys(out.colors).length}`);
    });

    it('drives editor.background from the bg base', () => {
        const parsed = { ...baselineParsed, 'ui.baseBackground': '#ABCDEF' };
        const dirty = { ...noneDirty, bg: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['editor.background'], '#ABCDEF');
    });

    it('derives chat.linesAddedForeground from success (with the required alpha)', () => {
        // VSCode flags chat.linesAddedForeground with `needsTransparency`,
        // so the apply pipeline must emit an alpha-channel form. Asserting
        // a startsWith / suffix split lets us verify both the colour
        // propagation and the transparency contract in one go.
        const parsed = { ...baselineParsed, 'status.success': '#11CC22' };
        const dirty = { ...noneDirty, success: true };
        const out = generateQuickTheme(parsed, dirty);
        const v = out.colors['chat.linesAddedForeground'];
        assert.ok(v && v.toUpperCase().startsWith('#11CC22'),
            `must start with the source colour, got ${v}`);
        const alpha = parseInt(v.slice(-2), 16);
        assert.ok(alpha > 0 && alpha < 0xFF,
            `must carry a non-FF alpha, got ${v.slice(-2)}`);
    });

    it('derives chat.linesRemovedForeground from error (with the required alpha)', () => {
        const parsed = { ...baselineParsed, 'status.error': '#FF0000' };
        const dirty = { ...noneDirty, error: true };
        const out = generateQuickTheme(parsed, dirty);
        const v = out.colors['chat.linesRemovedForeground'];
        assert.ok(v && v.toUpperCase().startsWith('#FF0000'),
            `must start with the source colour, got ${v}`);
        const alpha = parseInt(v.slice(-2), 16);
        assert.ok(alpha > 0 && alpha < 0xFF,
            `must carry a non-FF alpha, got ${v.slice(-2)}`);
    });

    it('drives editor.selectionBackground from the selection base', () => {
        const parsed = { ...baselineParsed, 'ui.selection': '#11223380' };
        const dirty = { ...noneDirty, selection: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['editor.selectionBackground'], '#11223380');
    });

    it('drives focusBorder from the activeBorder base', () => {
        const parsed = { ...baselineParsed, 'ui.activeBorder': '#FF8800' };
        const dirty = { ...noneDirty, activeBorder: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['focusBorder'], '#FF8800');
    });

    it('drives editorWidget.background from the surfaceElevated base', () => {
        const parsed = { ...baselineParsed, 'ui.surfaceElevated': '#2A2A2A' };
        const dirty = { ...noneDirty, surfaceElevated: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['editorWidget.background'], '#2A2A2A');
    });

    it('drives notificationsInfoIcon.foreground from the info base', () => {
        const parsed = { ...baselineParsed, 'status.info': '#3FE5FF' };
        const dirty = { ...noneDirty, info: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['notificationsInfoIcon.foreground'], '#3FE5FF');
    });
});

describe('generateQuickTheme — borderless toggle', () => {
    it('sets every border key to transparent when borderless is "yes"', () => {
        const parsed = { ...baselineParsed, 'ui.borderless': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty);
        assert.equal(out.colors['sideBar.border'], '#00000000');
        assert.equal(out.colors['panel.border'], '#00000000');
        assert.equal(out.colors['editorGroup.border'], '#00000000');
    });

    it('uses the user borders value when borderless="no" AND user customised --Borders', () => {
        // dirty.border = true means user changed --Borders away from theme default.
        const parsed = { ...baselineParsed, 'ui.borderless': 'no', 'ui.borders': '#ABCDEF' };
        const dirty = { ...noneDirty, border: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['sideBar.border'], '#ABCDEF');
        assert.equal(out.colors['panel.border'], '#ABCDEF');
    });

    it('derives a visible text-tinted border when borderless="no" AND --Borders untouched', () => {
        // Critical contract: borderless-by-default themes (Spaceport, Mars,
        // etc.) ship with sideBar.border = "#00000000". When the user
        // toggles "NO" without touching --Borders, simply propagating that
        // transparent value would make NO look identical to YES. The
        // generator therefore derives `text` at ~12% opacity so NO is
        // visibly distinct on every theme.
        const parsed = {
            ...baselineParsed,
            'ui.borderless': 'no',
            'ui.borders': '#00000000',  // simulating spaceport's transparent default
            'ui.baseForeground': '#D4D4D4',
        };
        // dirty.border = false → user has NOT customised --Borders
        const out = generateQuickTheme(parsed, noneDirty);
        const derived = out.colors['sideBar.border'];
        assert.ok(derived, 'sideBar.border must be set');
        assert.notEqual(derived, '#00000000',
            'derived border must NOT be transparent — that would make NO indistinguishable from YES');
        // Format check: addAlpha returns the original hex prefixed with the alpha byte.
        assert.ok(/^#[0-9A-Fa-f]{8}$/.test(derived) || /^#[0-9A-Fa-f]{6}/.test(derived),
            `derived border has unexpected format: ${derived}`);
    });

    it('falls back to a sensible neutral border when text is missing on NO', () => {
        // Defensive: if text is null (parse failure), the dervation must not throw.
        const parsed = {
            ...baselineParsed,
            'ui.borderless': 'no',
            'ui.borders': '#00000000',
            'ui.baseForeground': null,
        };
        const out = generateQuickTheme(parsed, noneDirty);
        assert.ok(out.colors['sideBar.border'], 'sideBar.border must be set even when text is null');
        assert.notEqual(out.colors['sideBar.border'], '#00000000');
    });

    it('purges border keys when toggle is "inherit"', () => {
        // After cleanUndefined, purged keys are stripped from output entirely.
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.colors['sideBar.border'], undefined);
        assert.equal(out.colors['panel.border'], undefined);
    });

    it('does NOT touch any border key on inherit even if --Borders was customised', () => {
        // The "smart NO" derivation must not leak into INHERIT.
        const parsed = { ...baselineParsed, 'ui.borderless': 'inherit', 'ui.borders': '#FF0000' };
        const dirty = { ...noneDirty, border: true };
        const out = generateQuickTheme(parsed, dirty);
        assert.equal(out.colors['sideBar.border'], undefined);
        assert.equal(out.colors['panel.border'], undefined);
    });
});

describe('generateQuickTheme — pureBlack toggle', () => {
    it('darkens the code area halfway to black on dark themes when "yes"', () => {
        const parsed = { ...baselineParsed, 'ui.pureBlack': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty, 'dark');
        assert.equal(out.colors['editor.background'], '#0F0F0F');
        assert.equal(out.colors['terminal.background'], '#0F0F0F');
        assert.equal(out.colors['panel.background'], '#0F0F0F');
    });

    it('brightens the code area halfway to white on light themes when "yes"', () => {
        const parsed = {
            ...baselineParsed,
            'ui.baseBackground': '#FDFBF5',
            'ui.secondaryBackground': '#F7F4EB',
            'ui.surfaceElevated': '#F4EAD1',
            'ui.pureBlack': 'yes',
        };
        const out = generateQuickTheme(parsed, noneDirty, 'light');
        assert.equal(out.colors['editor.background'], '#FEFDFA');
        assert.equal(out.colors['sideBar.background'], '#FBFAF5');
        assert.equal(out.colors['menu.background'], '#F7F0DF');
    });

    it('darkens the side panels from the secondary background on dark "yes"', () => {
        const parsed = { ...baselineParsed, 'ui.pureBlack': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty, 'dark');
        assert.equal(out.colors['sideBar.background'], '#131313');
        assert.equal(out.colors['activityBar.background'], '#131313');
        assert.equal(out.colors['statusBar.background'], '#131313');
        assert.equal(out.colors['titleBar.activeBackground'], '#131313');
    });

    it('darkens the widgets less, so they stand out from the editor', () => {
        const parsed = { ...baselineParsed, 'ui.pureBlack': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty, 'dark');
        assert.equal(out.colors['editorWidget.background'], '#1F1F22');
        assert.equal(out.colors['menu.background'], '#1F1F22');
        assert.equal(out.colors['notifications.background'], '#1F1F22');
        assert.equal(out.colors['input.background'], '#1F1F22');
    });

    it('keeps the theme backgrounds when "no"', () => {
        const parsed = { ...baselineParsed, 'ui.pureBlack': 'no' };
        for (const type of ['dark', 'light']) {
            const out = generateQuickTheme(parsed, noneDirty, type);
            assert.equal(out.colors['editor.background'], undefined);
            assert.equal(out.colors['sideBar.background'], undefined);
            assert.equal(out.colors['menu.background'], undefined);
        }
    });

    it('purges background overrides on "inherit"', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.colors['editor.background'], undefined);
        assert.equal(out.colors['sideBar.background'], undefined);
        assert.equal(out.colors['menu.background'], undefined);
    });
});

describe('generateQuickTheme — activeTabHighlight toggle', () => {
    it('paints the active tab with accent on "yes"', () => {
        const parsed = { ...baselineParsed, 'ui.accentPrimary': '#4FB4FF', 'ui.activeTabHighlight': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty);
        assert.equal(out.colors['tab.activeForeground'], '#4FB4FF');
        assert.equal(out.colors['tab.activeBorderTop'], '#4FB4FF');
        assert.equal(out.colors['tab.activeBorder'], '#4FB4FF');
        assert.ok(out.colors['tab.activeBackground'], 'tab.activeBackground must be tinted');
        assert.notEqual(out.colors['tab.activeBackground'], baselineParsed['ui.baseBackground'],
            'tab.activeBackground must NOT be raw bg — must be tinted');
    });

    it('pulls an accent label that reads below 4.5:1 toward the text on "yes"', () => {
        const { contrast } = __testing.colorUtils;
        const parsed = {
            ...baselineParsed,
            'ui.baseBackground': '#FDFBF5',  // Jupiter: gold accent on cream
            'ui.baseForeground': '#1A1205',
            'ui.accentPrimary': '#D99815',
            'ui.activeTabHighlight': 'yes',
        };
        const out = generateQuickTheme(parsed, noneDirty, 'light');
        assert.equal(out.colors['tab.activeBorderTop'], '#D99815', 'the borders keep the accent');
        for (const [fg, bg] of [['tab.activeForeground', 'tab.activeBackground'],
            ['tab.unfocusedActiveForeground', 'tab.unfocusedActiveBackground']]) {
            assert.ok(contrast(out.colors[fg], out.colors[bg]) >= 4.5, `${fg} reads on ${bg}: ${out.colors[fg]}`);
        }
        assert.equal(out.colors['tab.activeForeground'], '#8D620F', 'a darker gold, not the text colour');
    });

    it('pulls the unfocused label too when the 30 % blend reads below 4.5:1', () => {
        const parsed = {
            ...baselineParsed,
            'ui.baseBackground': '#FFFFFF',
            'ui.baseForeground': '#595959',
            'ui.accentPrimary': '#FFD54F',
            'ui.activeTabHighlight': 'yes',
        };
        const out = generateQuickTheme(parsed, noneDirty, 'light');
        assert.equal(out.colors['tab.unfocusedActiveForeground'], '#7F7557', 'the raw blend #8B7E56 reads at 3.96:1');
    });

    it('keeps a plain active tab on "no"', () => {
        const parsed = { ...baselineParsed, 'ui.activeTabHighlight': 'no' };
        const out = generateQuickTheme(parsed, noneDirty);
        assert.equal(out.colors['tab.activeForeground'], '#D4D4D4');
        assert.equal(out.colors['tab.activeBorderTop'], '#00000000');
        assert.equal(out.colors['tab.activeBorder'], '#00000000');
        assert.equal(out.colors['tab.activeBackground'], '#1E1E1E');
    });

    it('purges tab overrides on "inherit"', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.colors['tab.activeForeground'], undefined);
        assert.equal(out.colors['tab.activeBorderTop'], undefined);
    });
});

describe('generateQuickTheme — vividSelection toggle', () => {
    it('saturates editor selection with accent on "yes"', () => {
        const parsed = { ...baselineParsed, 'ui.vividSelection': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty);
        const sel = out.colors['editor.selectionBackground'];
        assert.ok(sel, 'editor.selectionBackground must be set');
        assert.ok(sel.toUpperCase().startsWith('#007ACC'),
            `selection must use accent prefix, got ${sel}`);
    });

    // A stronger grey (~33%) washed out the syntax colours under the
    // selection; word matches stay a step below it.
    const MATCHES = ['editor.selectionHighlightBackground', 'editor.inactiveSelectionBackground',
        'editor.wordHighlightBackground', 'editor.wordHighlightStrongBackground'];
    const alpha = (hex) => parseInt(hex.slice(7), 16);

    it('NO selection is a soft text-coloured grey on dark themes', () => {
        const parsed = { ...baselineParsed, 'ui.vividSelection': 'no' };
        const out = generateQuickTheme(parsed, noneDirty, 'dark');
        assert.equal(out.colors['editor.selectionBackground'], '#D4D4D438');
        for (const key of MATCHES) {
            assert.ok(alpha(out.colors[key]) < 0x38, `${key} stays below the selection: ${out.colors[key]}`);
        }
    });

    it('NO selection is lighter still on Jupiter (light theme)', () => {
        // Dark text weighs more on a near-white background.
        const parsed = {
            ...baselineParsed,
            'ui.baseForeground': '#1F2328',  // Jupiter-like dark text
            'ui.vividSelection': 'no',
        };
        const out = generateQuickTheme(parsed, noneDirty, 'light');
        assert.equal(out.colors['editor.selectionBackground'], '#1F232826');
        for (const key of MATCHES) {
            assert.ok(alpha(out.colors[key]) < 0x26, `${key} stays below the selection: ${out.colors[key]}`);
        }
    });

    it('purges selection overrides on "inherit"', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.colors['editor.selectionBackground'], undefined);
        assert.equal(out.colors['editor.wordHighlightBackground'], undefined);
    });
});

describe('generateQuickTheme — cursorLineGlow toggle', () => {
    it('paints cursor and active line with accent on "yes"', () => {
        const parsed = { ...baselineParsed, 'ui.cursorLineGlow': 'yes' };
        const out = generateQuickTheme(parsed, noneDirty);
        assert.equal(out.colors['editorCursor.foreground'], '#007ACC',
            'cursor must take the accent colour');
        assert.equal(out.colors['editorLineNumber.activeForeground'], '#007ACC',
            'active line number must take the accent colour');
        const lineBg = out.colors['editor.lineHighlightBackground'];
        const lineBorder = out.colors['editor.lineHighlightBorder'];
        assert.ok(lineBg && lineBg.toUpperCase().startsWith('#007ACC'),
            'lineHighlightBackground must be accent-tinted');
        assert.ok(lineBorder && lineBorder.toUpperCase().startsWith('#007ACC'),
            'lineHighlightBorder must be accent-tinted');
    });

    it('removes the line highlight entirely on "no"', () => {
        const parsed = { ...baselineParsed, 'ui.cursorLineGlow': 'no' };
        const out = generateQuickTheme(parsed, noneDirty);
        assert.equal(out.colors['editor.lineHighlightBackground'], '#00000000',
            'NO must clear the line highlight');
        assert.equal(out.colors['editor.lineHighlightBorder'], '#00000000',
            'NO must clear the line highlight border');
    });

    it('purges cursor/line overrides on "inherit"', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.colors['editorCursor.foreground'], undefined);
        assert.equal(out.colors['editor.lineHighlightBackground'], undefined);
        assert.equal(out.colors['editor.lineHighlightBorder'], undefined);
    });
});

describe('generateQuickTheme — out-of-scope output is never emitted', () => {
    it('does not return a textMateRules property (Quick mode is UI-only)', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.textMateRules, undefined);
    });

    it('never emits widget.shadow / inlineChat.shadow / scrollbar.shadow', () => {
        const out = generateQuickTheme(baselineParsed, noneDirty);
        assert.equal(out.colors['widget.shadow'], undefined);
        assert.equal(out.colors['inlineChat.shadow'], undefined);
        assert.equal(out.colors['scrollbar.shadow'], undefined);
    });

    it('does not throw when out-of-scope ui.* keys are absent from input', () => {
        const parsed = { ...baselineParsed };
        delete parsed['ui.deepShadows'];
        delete parsed['ui.highContrast'];
        delete parsed['ui.dimmedInactive'];
        delete parsed['ui.vividStatusBar'];
        delete parsed['ui.italics'];
        assert.doesNotThrow(() => generateQuickTheme(parsed, noneDirty));
    });
});

describe('generateQuickTheme — robustness on real ARN themes', () => {
    const realThemes = [
        'arn-spaceport.json', 'arn-uranus.json', 'arn-neptune.json',
        'arn-nebula.json', 'arn-mars.json', 'arn-io.json', 'arn-jupiter.json',
    ];
    for (const fname of realThemes) {
        it(`never throws on ${fname} with all bases dirty`, () => {
            const theme = loadTheme(fname);
            const bases = extractBaseColorsFromTheme(theme);
            const parsed = {
                ...baselineParsed,
                'ui.baseBackground':      bases.bg,
                'ui.baseForeground':      bases.text,
                'ui.accentPrimary':       bases.accent,
                'ui.secondaryBackground': bases.bgSec,
                'ui.surfaceElevated':     bases.surfaceElevated,
                'ui.borders':             bases.border,
                'ui.activeBorder':        bases.activeBorder,
                'ui.selection':           bases.selection,
                'status.warning':         bases.warning,
                'status.error':           bases.error,
                'status.success':         bases.success,
                'status.info':            bases.info,
            };
            assert.doesNotThrow(() => generateQuickTheme(parsed, allDirty, theme.type));
        });
    }
});
