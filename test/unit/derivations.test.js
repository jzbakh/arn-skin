// What a Quick base becomes once derived: every key keeps its role on dark and
// light themes, a tinted base never turns into a saturated colour, the
// palettes each theme picks for itself are left alone, and a colour the user
// set wins over a display option.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { __testing: t } = require('../../extension');
const { mix: M, addAlpha: A, hexToRgb, contrast, normalizeHex } = t.colorUtils;

const THEMES_DIR = path.join(__dirname, '..', '..', 'themes');
const themes = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.json')).map(file => {
    const json = t.parseJsonc(fs.readFileSync(path.join(THEMES_DIR, file), 'utf8'));
    return { file, json, light: json.type === 'vs' || json.type === 'light', bases: t.extractBaseColorsFromTheme(json) };
});
const theme = (name) => themes.find(x => x.file === `arn-${name}.json`);
const derive = (th, quick) => t.deriveQuickColors({ ...t.quickDefaults(th.json), ...quick }, th.json);

// A colour as it shows over `under`.
function seen(hex, under) {
    const h = normalizeHex(hex);
    const a = h.length === 9 ? parseInt(h.slice(7), 16) / 255 : 1;
    return M(normalizeHex(under).slice(0, 7), h.slice(0, 7), a);
}
const chroma = (hex) => { const { r, g, b } = hexToRgb(hex); return (Math.max(r, g, b) - Math.min(r, g, b)) / 255; };

const DIMMED = [
    'editorLineNumber.foreground', 'tab.inactiveForeground', 'activityBar.inactiveForeground', 'statusBar.foreground',
    'breadcrumb.foreground', 'editorGhostText.foreground', 'input.placeholderForeground', 'titleBar.inactiveForeground',
    'panelTitle.inactiveForeground', 'gitDecoration.ignoredResourceForeground', 'debugIcon.breakpointDisabledForeground',
];

describe('Quick derivations — a tinted text colour', () => {
    for (const th of themes) {
        // A pale pink on dark themes, a dark red-brown on light ones: the
        // dimmed keys used to turn the first into red and the second into black.
        const text = th.light ? '#3A1F1F' : '#EAC6C6';

        it(`dims the text of ${th.file} toward its background without saturating it`, () => {
            const colors = derive(th, { 'ui.baseForeground': text });
            for (const key of DIMMED) {
                const shown = seen(colors[key], th.bases.bg);
                assert.ok(chroma(shown) <= chroma(text) + 0.02, `${key}: ${shown} is more colourful than ${text}`);
                assert.ok(contrast(shown, th.bases.bg) < contrast(text, th.bases.bg), `${key}: ${shown} reads as strong as the text`);
                assert.ok(contrast(shown, th.bases.bg) > 1.3, `${key}: ${shown} vanishes`);
            }
        });
    }

    it('mutes the cursor of Glow NO and the unfocused tab of Active-Tab NO the same way', () => {
        const colors = derive(theme('spaceport'), { 'ui.baseForeground': '#EAC6C6', 'ui.cursorLineGlow': 'no', 'ui.activeTabHighlight': 'no' });
        assert.equal(colors['editorCursor.foreground'], '#EAC6C6C0');
        assert.equal(colors['tab.unfocusedActiveForeground'], '#EAC6C6B0');
    });
});

describe('Quick derivations — a light background', () => {
    it('dims the labels of Jupiter about as much as Jupiter does', () => {
        // A text one step off the theme's own, so that every text key is derived.
        const th = theme('jupiter');
        const colors = derive(th, { 'ui.baseForeground': '#1A1206' });
        for (const [key, surface] of [['breadcrumb.foreground', 'editor.background'], ['titleBar.inactiveForeground', 'titleBar.inactiveBackground'],
            ['activityBar.inactiveForeground', 'activityBar.background'], ['statusBar.foreground', 'statusBar.background'],
            ['tab.inactiveForeground', 'tab.inactiveBackground']]) {
            const under = th.json.colors[surface];
            const ours = contrast(seen(colors[key], under), under);
            const theirs = contrast(seen(th.json.colors[key], under), under);
            assert.ok(ours > theirs * 0.8, `${key}: ${ours.toFixed(2)}:1, Jupiter ships ${theirs.toFixed(2)}:1`);
        }
    });

    it('keeps the line highlight and the indent guides visible on Jupiter', () => {
        const th = theme('jupiter');
        const bg = '#FFF6E5';
        const colors = derive(th, { 'ui.baseBackground': bg });
        const line = seen(colors['editor.lineHighlightBackground'], bg);
        const guide = seen(colors['editorIndentGuide.background1'], bg);
        assert.ok(contrast(line, bg) > 1.02 && contrast(line, '#000000') < contrast(bg, '#000000'), `line highlight ${line} is not a shade darker`);
        assert.ok(contrast(guide, bg) > 1.15, `indent guide ${guide} vanishes`);
    });
});

// Registered by VS Code with needsTransparency: an opaque value hides what lies
// under it and earns a "must be transparent" warning.
const NEEDS_TRANSPARENCY = [
    'chat.linesAddedForeground', 'chat.linesRemovedForeground', 'chat.requestBubbleBackground',
    'chat.requestBubbleHoverBackground', 'chat.requestCodeBorder', 'diffEditor.insertedLineBackground',
    'diffEditor.insertedTextBackground', 'diffEditor.removedLineBackground', 'diffEditor.removedTextBackground',
    'editor.findMatchHighlightBackground', 'editor.findRangeHighlightBackground', 'editor.hoverHighlightBackground',
    'editor.inactiveSelectionBackground', 'editor.rangeHighlightBackground', 'editor.selectionHighlightBackground',
    'editor.wordHighlightBackground', 'editor.wordHighlightStrongBackground', 'editorOverviewRuler.findMatchForeground',
    'merge.commonHeaderBackground', 'merge.currentHeaderBackground', 'merge.incomingHeaderBackground',
];

describe('Quick derivations — colours VS Code needs translucent', () => {
    it('never writes them opaque, whatever the bases and display options', () => {
        const palette = {
            'ui.baseBackground': '#1A1A1A', 'ui.baseForeground': '#EAC6C6', 'ui.accentPrimary': '#D34CE8',
            'ui.secondaryBackground': '#202020', 'ui.surfaceElevated': '#2A1F3D', 'ui.borders': '#FF0B0B',
            'ui.activeBorder': '#40FF00', 'status.warning': '#FFB000', 'status.error': '#FF3355',
            'status.success': '#33DD77', 'status.info': '#33AAFF',
        };
        for (const th of themes) {
            for (const toggle of ['inherit', 'yes', 'no']) {
                const toggles = { 'ui.vividSelection': toggle, 'ui.cursorLineGlow': toggle, 'ui.activeTabHighlight': toggle, 'ui.pureBlack': toggle };
                for (const quick of [palette, ...Object.entries(palette).map(([k, v]) => ({ [k]: v }))]) {
                    const colors = derive(th, { ...quick, ...toggles });
                    for (const key of NEEDS_TRANSPARENCY) {
                        const v = colors[key] && normalizeHex(colors[key]);
                        assert.ok(!v || (v.length === 9 && !v.endsWith('FF')), `${th.file} ${toggle} ${JSON.stringify(quick)}: ${key} = ${v}`);
                    }
                }
            }
        }
    });
});

describe('Quick derivations — the editor and its widgets', () => {
    it('paints the minimap and the sticky scroll as the code they lie on', () => {
        for (const th of themes) {
            for (const key of ['minimap.background', 'editorStickyScroll.background']) {
                assert.ok(contrast(th.json.colors[key], th.bases.bg) < 1.2, `${th.file} ${key}: no shade off the editor`);
                assert.equal(derive(th, { 'ui.baseBackground': '#151B26' })[key], '#151B26', `${th.file} ${key}`);
                assert.equal(derive(th, { 'ui.baseForeground': '#EAC6C6' })[key], undefined, `${th.file} ${key}`);
            }
        }
    });

    it('draws the resize bar of the find widget in the Active-Border colour, as the themes do', () => {
        for (const th of themes) {
            assert.ok(t.sameColor(th.json.colors['editorWidget.resizeBorder'], th.json.colors['panelTitle.activeBorder']), th.file);
            assert.equal(derive(th, { 'ui.activeBorder': '#40FF00' })['editorWidget.resizeBorder'], '#40FF00', th.file);
        }
    });

    it('gives the three validation messages one opaque surface over the code, as the themes do', () => {
        for (const th of themes) {
            const c = th.json.colors;
            assert.equal(c['inputValidation.warningBackground'], c['inputValidation.errorBackground'], th.file);
            assert.equal(c['inputValidation.infoBackground'], c['inputValidation.errorBackground'], th.file);
            const colors = derive(th, { 'ui.baseBackground': '#151B26', 'ui.baseForeground': '#EAC6C6' });
            const bg = derive(th, { 'ui.baseBackground': '#151B26' });
            const status = derive(th, { 'status.error': '#FF3355', 'status.warning': '#FFB000', 'ui.accentPrimary': '#D34CE8' });
            for (const kind of ['error', 'warning', 'info']) {
                const key = `inputValidation.${kind}Background`;
                assert.equal(colors[key], M('#151B26', '#EAC6C6', 0.05), `${th.file} ${kind}`);
                assert.equal(bg[key], M('#151B26', th.bases.text, 0.05), `${th.file} ${kind}: Global-Background alone`);
                assert.equal(status[key], undefined, `${th.file} ${kind}: the status colour stays on the border`);
            }
        }
    });
});

describe('Quick derivations — palettes each theme picks for itself', () => {
    it('never touches the terminal ANSI colours, the bracket pairs or the cursors', () => {
        for (const th of themes) {
            const colors = derive(th, {
                'ui.baseBackground': '#151B26', 'ui.baseForeground': '#EAC6C6', 'ui.accentPrimary': '#D34CE8',
                'ui.secondaryBackground': '#062F40', 'ui.surfaceElevated': '#2A1F3D', 'ui.borders': '#FF0B0B',
                'ui.activeBorder': '#40FF00', 'ui.selection': '#4CC4E866', 'status.warning': '#FFB000',
                'status.error': '#FF3355', 'status.success': '#33DD77', 'status.info': '#33AAFF',
            });
            const theirs = Object.keys(colors).filter(k => /^terminal\.ansi|^editorBracketHighlight\.foreground|Cursor\.foreground$/.test(k));
            assert.deepEqual(theirs, [], th.file);
        }
    });
});

describe('Quick derivations — a colour the user set wins over a display option', () => {
    const th = theme('spaceport');

    it('keeps a custom Selection whatever Vivid-Selection says, the word highlights still follow the toggle', () => {
        for (const vivid of ['yes', 'no']) {
            const colors = derive(th, { 'ui.selection': '#4CC4E866', 'ui.vividSelection': vivid });
            assert.equal(colors['editor.selectionBackground'], '#4CC4E866', vivid);
            assert.ok(colors['editor.wordHighlightBackground'], vivid);
        }
    });

    it('lets Vivid-Selection colour the selection while it is the theme\'s', () => {
        const colors = derive(th, { 'ui.vividSelection': 'yes' });
        assert.equal(colors['editor.selectionBackground'], A(th.bases.accent, '50'));
    });

    it('borders the highlighted tab with a custom Active-Border, else with the accent', () => {
        assert.equal(derive(th, { 'ui.activeBorder': '#40FF00', 'ui.activeTabHighlight': 'yes' })['tab.activeBorderTop'], '#40FF00');
        assert.ok(t.sameColor(derive(th, { 'ui.activeTabHighlight': 'yes' })['tab.activeBorderTop'], th.bases.accent));
    });
});

describe('Colours 1.0.5 derived from the Quick bases', () => {
    const th = theme('spaceport');

    it('gives back the old values of the keys whose derivation changed', () => {
        // The red line numbers a pale pink text gave.
        const legacy = t.legacyBaseColors({ 'ui.baseForeground': '#EAC6C6' }, th.json);
        assert.equal(legacy['editorLineNumber.foreground'], '#A73D3D');
        assert.equal(legacy['editorBracketHighlight.foreground6'], '#EAC6C699', 'a key Quick no longer derives');
        assert.equal(legacy['editor.foreground'], undefined, 'a key whose derivation did not change');
    });

    it('gives nothing back for untouched bases', () => {
        assert.deepEqual(t.legacyBaseColors({}, th.json), {});
    });

    it('names the keys now derived that 1.0.5 left to the theme', () => {
        // The line numbers now follow the background too: 1.0.5 left them to
        // the theme when only the background was set.
        const quick = { 'ui.baseBackground': '#151B26' };
        const keys = t.newlyDerivedKeys(quick, th.json, derive(th, quick));
        assert.ok(keys.includes('editorLineNumber.foreground'));
        assert.ok(!keys.includes('editor.background'), 'a key 1.0.5 already derived');
        for (const key of ['minimap.background', 'editorStickyScroll.background', 'inputValidation.errorBackground']) {
            assert.ok(keys.includes(key), key);
        }
        const border = { 'ui.activeBorder': '#40FF00' };
        assert.ok(t.newlyDerivedKeys(border, th.json, derive(th, border)).includes('editorWidget.resizeBorder'));
    });

    it('gives back the translucent validation messages 1.0.5 drew', () => {
        assert.equal(t.legacyBaseColors({ 'status.error': '#FF3355' }, th.json)['inputValidation.errorBackground'], '#FF335520');
    });

    it('gives back what the toggles wrote before their muted colours changed', () => {
        const off = t.legacyToggleColors({ 'ui.baseForeground': '#EAC6C6', 'ui.cursorLineGlow': 'no', 'ui.activeTabHighlight': 'no' }, th.json);
        assert.equal(off['editorCursor.foreground'], '#CF7B7B');
        assert.equal(off['tab.unfocusedActiveForeground'], '#CF7B7B');
    });

    it('gives back what the toggles wrote before a custom colour won over them', () => {
        const legacy = t.legacyToggleColors({ 'ui.vividSelection': 'yes', 'ui.activeTabHighlight': 'yes' }, th.json);
        assert.ok(t.sameColor(legacy['editor.selectionBackground'], A(th.bases.accent, '50')));
        assert.ok(t.sameColor(legacy['tab.activeBorderTop'], th.bases.accent));
    });
});
