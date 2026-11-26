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

describe('Quick derivations — input placeholders', () => {
    for (const th of themes) {
        it(`keeps them at 4:1 or more on ${th.file}`, () => {
            // The theme's own text, one step off so that it counts as edited.
            const text = th.bases.text.slice(0, 6) + (th.bases.text[6].toLowerCase() === 'f' ? 'e' : 'f');
            const colors = derive(th, { 'ui.baseForeground': text });
            for (const [key, field, under] of [['input.placeholderForeground', 'input.background', th.bases.bg],
                ['inlineChatInput.placeholderForeground', 'inlineChatInput.background', th.bases.bgSec]]) {
                const surface = seen(colors[field], under);
                const ratio = contrast(seen(colors[key], surface), surface);
                assert.ok(ratio >= 4, `${key}: ${ratio.toFixed(2)}:1`);
            }
        });
    }
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

describe('Quick derivations — the status colours', () => {
    const MARKS = {
        'status.error': ['editorError.foreground', 'editorOverviewRuler.errorForeground', 'minimap.errorHighlight',
            'problemsErrorIcon.foreground', 'editorMarkerNavigationError.background', 'minimapGutter.deletedBackground'],
        'status.warning': ['editorWarning.foreground', 'editorOverviewRuler.warningForeground', 'minimap.warningHighlight',
            'problemsWarningIcon.foreground', 'editorMarkerNavigationWarning.background'],
        'status.info': ['editorInfo.foreground', 'editorOverviewRuler.infoForeground', 'problemsInfoIcon.foreground',
            'editorMarkerNavigationInfo.background'],
    };

    it('paint their own squiggles and problem marks whatever the display options, the accent none', () => {
        for (const th of themes) {
            for (const toggle of ['inherit', 'yes', 'no']) {
                const toggles = { 'ui.vividSelection': toggle, 'ui.cursorLineGlow': toggle, 'ui.activeTabHighlight': toggle,
                    'ui.pureBlack': toggle, 'ui.borderless': toggle };
                for (const base of [...Object.keys(MARKS), 'ui.accentPrimary']) {
                    const colors = derive(th, { [base]: '#D34CE8', ...toggles });
                    for (const [own, keys] of Object.entries(MARKS)) {
                        for (const key of keys) {
                            assert.equal(colors[key], own === base ? '#D34CE8' : undefined, `${th.file} ${toggle} ${base}: ${key}`);
                        }
                    }
                }
            }
        }
    });

    it('paint them as the themes do, in the status colour itself', () => {
        for (const th of themes) {
            const defaults = t.quickDefaults(th.json);
            for (const [base, keys] of Object.entries(MARKS)) {
                for (const key of keys.filter(k => !/^editor(OverviewRuler|MarkerNavigation)/.test(k))) {
                    assert.ok(t.sameColor(th.json.colors[key], defaults[base]), `${th.file} ${key}: ${th.json.colors[key]}`);
                }
            }
            // VS Code draws these in editorInfo.foreground and editorError.foreground.
            assert.equal(th.json.colors['minimap.infoHighlight'], undefined, th.file);
            assert.equal(th.json.colors['editorGutter.deletedBackground'], undefined, th.file);
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

    it('recolours with a custom Borders colour the borders the theme draws, all of them with NO', () => {
        const borders = { 'ui.borders': '#FF0B0B' };
        const inherit = derive(th, borders);
        assert.equal(inherit['menu.border'], '#FF0B0B', 'a border Spaceport draws');
        assert.equal(inherit['sideBar.border'], undefined, 'Spaceport has no side bar border');
        assert.equal(inherit['inputValidation.errorBorder'], undefined, 'the error border keeps its red');
        assert.equal(derive(theme('neptune'), borders)['sideBar.border'], '#FF0B0B', 'Neptune draws one');
        assert.equal(derive(th, { ...borders, 'ui.borderless': 'no' })['sideBar.border'], '#FF0B0B');
        assert.equal(derive(th, { ...borders, 'ui.borderless': 'yes' })['menu.border'], '#00000000');
        assert.equal(derive(th, {})['menu.border'], undefined, 'nothing set');
    });

    it('treats the panel filter box and the chat request border like the other borders', () => {
        const borders = { 'ui.borders': '#FF0B0B' };
        for (const key of ['panelInput.border', 'chat.requestBorder']) {
            const theirs = th.json.colors[key];
            const shown = theirs && !t.sameColor(theirs.slice(0, 7) + '00', theirs);
            assert.equal(derive(th, borders)[key], shown ? '#FF0B0B' : undefined, `${key} INHERIT`);
            assert.equal(derive(th, { ...borders, 'ui.borderless': 'yes' })[key], '#00000000', `${key} YES`);
            assert.equal(derive(th, { ...borders, 'ui.borderless': 'no' })[key], '#FF0B0B', `${key} NO`);
        }
    });

    it('counts a fully transparent Borders colour as unset', () => {
        // What the picker gives from the theme's #00000000: it keeps that alpha.
        for (const th of themes) {
            for (const borderless of ['inherit', 'no', 'yes']) {
                assert.deepEqual(derive(th, { 'ui.borders': '#FF0B0B00', 'ui.borderless': borderless }),
                    derive(th, { 'ui.borderless': borderless }), `${th.file} ${borderless}`);
            }
            // Only a zero alpha: an opaque colour ending in 00 or an almost
            // transparent one still draws the borders.
            for (const borders of ['#FF0000', '#F00', '#FF0B0B01']) {
                assert.ok(t.sameColor(derive(th, { 'ui.borders': borders, 'ui.borderless': 'no' })['menu.border'], borders),
                    `${th.file} ${borders}`);
            }
        }
    });

    it('borders the highlighted tab with a custom Active-Border, else with the accent', () => {
        assert.equal(derive(th, { 'ui.activeBorder': '#40FF00', 'ui.activeTabHighlight': 'yes' })['tab.activeBorderTop'], '#40FF00');
        assert.ok(t.sameColor(derive(th, { 'ui.activeTabHighlight': 'yes' })['tab.activeBorderTop'], th.bases.accent));
    });
});

describe('Pure-Black with Active-Tab', () => {
    it('starts the active tab from the darkened editor, not the lighter theme background', () => {
        for (const th of themes) {
            for (const tab of ['yes', 'no']) {
                const colors = derive(th, { 'ui.pureBlack': 'yes', 'ui.activeTabHighlight': tab });
                const editor = colors['editor.background'];
                const expected = tab === 'yes' ? M(editor, th.bases.accent, 0.10) : editor;
                assert.ok(t.sameColor(colors['tab.activeBackground'], expected), `${th.file} ${tab}: ${colors['tab.activeBackground']}`);
            }
        }
    });

    it('darkens every other surface the theme paints from its own colour', () => {
        for (const th of themes) {
            const colors = derive(th, { 'ui.pureBlack': 'yes' });
            const extreme = th.light ? '#FFFFFF' : '#000000';
            for (const [key, ratio] of [['sideBarSectionHeader.background', 0.5], ['minimap.background', 0.5],
                ['editorStickyScroll.background', 0.5], ['peekViewEditorGutter.background', 0.5],
                ['peekViewTitle.background', 0.3]]) {
                const theirs = th.json.colors[key];
                if (!theirs || normalizeHex(theirs).length === 9) continue;
                assert.ok(t.sameColor(colors[key], M(theirs, extreme, ratio)), `${th.file} ${key}: ${colors[key]}`);
            }
        }
        // Nebula's violet section header, lighter than its darkened editor before.
        const nebula = derive(theme('nebula'), { 'ui.pureBlack': 'yes' });
        assert.ok(contrast(nebula['sideBarSectionHeader.background'], '#000000') < contrast(theme('nebula').json.colors['sideBarSectionHeader.background'], '#000000'));
    });

    it('darkens a surface the bases derive from that colour, not the theme\'s', () => {
        const th = theme('spaceport');
        const colors = derive(th, { 'ui.pureBlack': 'yes', 'ui.baseBackground': '#151B26' });
        assert.ok(t.sameColor(colors['welcomePage.background'], M('#151B26', '#000000', 0.5)), colors['welcomePage.background']);
        const legacy = t.legacyPureBlackSurfaces({ 'ui.pureBlack': 'yes', 'ui.baseBackground': '#151B26' }, th.json);
        assert.ok(t.sameColor(legacy['welcomePage.background'], '#151B26'), 'what 1.0.5 wrote');
        for (const key of ['minimap.background', 'editorStickyScroll.background']) {
            assert.equal(colors[key], colors['editor.background'], `${key}: no band beside the code`);
            assert.equal(legacy[key], undefined, `${key}: 1.0.5 left it to the theme`);
        }
        const sec = t.legacyPureBlackSurfaces({ 'ui.pureBlack': 'yes', 'ui.secondaryBackground': '#202733' }, th.json);
        assert.equal(sec['sideBarSectionHeader.background'], undefined, 'legacyBaseColors gives back what 1.0.5 derived for it');
    });

    it('takes a theme copy 1.0.5 left on those surfaces for the theme\'s, not the user\'s', () => {
        const th = theme('nebula');
        const quick = { 'ui.pureBlack': 'yes' };
        assert.ok(t.newlyDerivedKeys(quick, th.json, derive(th, quick)).includes('sideBarSectionHeader.background'));
    });

    it('gives back the lighter tab 1.0.5 wrote, so it follows the toggle', () => {
        const th = theme('nebula');
        const legacy = t.legacyToggleColors({ 'ui.pureBlack': 'yes', 'ui.activeTabHighlight': 'yes' }, th.json);
        assert.ok(t.sameColor(legacy['tab.activeBackground'], M(th.bases.bg, th.bases.accent, 0.10)));
    });
});

describe('Cursor-Line-Glow YES', () => {
    it('keeps the active line number readable, and the accent where it already is', () => {
        for (const th of themes) {
            const colors = derive(th, { 'ui.cursorLineGlow': 'yes' });
            const number = colors['editorLineNumber.activeForeground'];
            const under = colors['editor.background'] || th.bases.bg;
            assert.ok(contrast(number, under) >= 4.5 || t.sameColor(number, th.bases.text), `${th.file}: ${number}`);
            if (contrast(th.bases.accent, under) >= 4.5) assert.ok(t.sameColor(number, th.bases.accent), th.file);
        }
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

    it('gives back the selected-row icon color, which Quick no longer derives', () => {
        const quick = { 'ui.accentPrimary': '#D34CE8' };
        assert.equal(t.legacyBaseColors(quick, th.json)['list.activeSelectionIconForeground'], '#D34CE8');
        assert.equal(derive(th, quick)['list.activeSelectionIconForeground'], undefined);
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

    it('names the theme borders a Borders colour now recolours without Borderless-Mode', () => {
        const quick = { 'ui.borders': '#FF0B0B' };
        assert.ok(t.newlyDerivedKeys(quick, th.json, derive(th, quick)).includes('menu.border'));
        const no = { 'ui.borders': '#FF0B0B', 'ui.borderless': 'no' };
        assert.ok(!t.newlyDerivedKeys(no, th.json, derive(th, no)).includes('menu.border'), '1.0.5 drew them with NO');
    });

    it('gives back the borders Borderless-Mode NO drew in a fully transparent Borders colour', () => {
        const legacy = t.legacyToggleColors({ 'ui.borders': '#FF0B0B00', 'ui.borderless': 'no' }, th.json);
        assert.equal(legacy['sideBar.border'], '#FF0B0B00');
        assert.equal(legacy['menu.border'], '#FF0B0B00');
        assert.deepEqual(t.legacyToggleColors({ 'ui.borders': '#FF0B0B', 'ui.borderless': 'no' }, th.json), {}, 'drawn as now');
        assert.deepEqual(t.legacyToggleColors({ 'ui.borders': '#00000000', 'ui.borderless': 'no' }, th.json), {},
            'the Borders colour of the theme');
        const neptune = theme('neptune').json;
        assert.equal(t.legacyToggleColors({ 'ui.borders': '#00000000', 'ui.borderless': 'no' }, neptune)['menu.border'], '#00000000',
            'a Borders colour set in Quick');
    });

    it('gives back the info marks 1.0.5 drew in the accent on the overview ruler', () => {
        assert.equal(t.legacyBaseColors({ 'ui.accentPrimary': '#D34CE8' }, th.json)['editorOverviewRuler.infoForeground'], '#D34CE880');
    });

    it('names the diagnostics marks the status colours now paint', () => {
        const quick = { 'status.error': '#FF3355', 'status.warning': '#FFB000', 'status.info': '#33AAFF' };
        const keys = t.newlyDerivedKeys(quick, th.json, derive(th, quick));
        for (const key of ['editorError.foreground', 'editorWarning.foreground', 'editorInfo.foreground',
            'problemsErrorIcon.foreground', 'problemsWarningIcon.foreground', 'problemsInfoIcon.foreground',
            'editorMarkerNavigationError.background', 'editorMarkerNavigationWarning.background',
            'editorMarkerNavigationInfo.background', 'minimap.errorHighlight', 'minimap.warningHighlight',
            'minimapGutter.deletedBackground', 'editorOverviewRuler.infoForeground']) {
            assert.ok(keys.includes(key), key);
        }
        const accent = { ...quick, 'ui.accentPrimary': '#D34CE8' };
        assert.ok(!t.newlyDerivedKeys(accent, th.json, derive(th, accent)).includes('editorOverviewRuler.infoForeground'),
            '1.0.5 drew it from the accent');
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
