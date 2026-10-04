// The layer rules behind every transition between Quick and Advanced: what is
// stored, what one mode takes back from the other, and what a view diffs to.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { __testing: t } = require('../../extension');

const mars = t.parseJsonc(fs.readFileSync(path.join(__dirname, '..', '..', 'themes', 'arn-mars.json'), 'utf8'));
const GLOW = 'editor.lineHighlightBorder';

function css(quick) {
    return `:root {
        --Global-Background: ${quick['ui.baseBackground']};
        --Main-Text: ${quick['ui.baseForeground']};
        --Accentuation: ${quick['ui.accentPrimary']};
        --Secondary-Background: ${quick['ui.secondaryBackground']};
        --Surface-Elevated: ${quick['ui.surfaceElevated']};
        --Borders: ${quick['ui.borders']};
        --Active-Border: ${quick['ui.activeBorder']};
        --Selection: ${quick['ui.selection']};
        --Status-Warning: ${quick['status.warning']};
        --Status-Error: ${quick['status.error']};
        --Status-Success: ${quick['status.success']};
        --Status-Info: ${quick['status.info']};
        --Opt-Borderless-Mode: ${quick['ui.borderless']};
        --Opt-Pure-Black-Mode: ${quick['ui.pureBlack']};
        --Opt-Active-Tab-Highlight: ${quick['ui.activeTabHighlight']};
        --Opt-Vivid-Selection: ${quick['ui.vividSelection']};
        --Opt-Cursor-Line-Glow: ${quick['ui.cursorLineGlow']};
    }`;
}

describe('sameColor', () => {
    it('compares colours by value', () => {
        assert.ok(t.sameColor('#abc', '#AABBCC'));
        assert.ok(t.sameColor('#AABBCC', '#aabbccff'));
        assert.ok(!t.sameColor('#AABBCC', '#AABBCD'));
        assert.ok(!t.sameColor('#AABBCC', '#AABBCC80'));
    });

    it('falls back to strict equality for anything that is not a hex colour', () => {
        assert.ok(t.sameColor(undefined, undefined));
        assert.ok(!t.sameColor('#AABBCC', undefined));
        assert.ok(!t.sameColor('red', '#FF0000'));
    });
});

describe('Quick layer', () => {
    const defaults = t.quickDefaults(mars);

    it('stores and derives nothing for a Quick file left at the theme defaults', () => {
        assert.deepEqual(t.compactQuick(defaults, mars), {});
        assert.deepEqual(t.deriveQuickColors(defaults, mars), {});
    });

    it('stores only the bases and toggles that differ from the theme', () => {
        const quick = {
            ...defaults,
            'ui.baseBackground': defaults['ui.baseBackground'].toUpperCase(),
            'ui.accentPrimary': '#00AAFF',
            'ui.cursorLineGlow': 'yes',
            'ui.pureBlack': 'inherit',
        };
        assert.deepEqual(t.compactQuick(quick, mars), { 'ui.accentPrimary': '#00AAFF', 'ui.cursorLineGlow': 'yes' });
        assert.deepEqual(t.expandQuick(t.compactQuick(quick, mars), mars)['ui.cursorLineGlow'], 'yes');
    });

    it('reads a complete Quick file', () => {
        const { quick, rejected } = t.resolveQuickInput(
            css({ ...defaults, 'ui.accentPrimary': '#00aaff', 'ui.cursorLineGlow': 'YES' }), defaults);
        assert.equal(quick['ui.accentPrimary'], '#00AAFF');
        assert.equal(quick['ui.cursorLineGlow'], 'yes');
        assert.deepEqual(rejected, []);
    });

    it('keeps the previous value of a half-typed colour and reports what was written', () => {
        const previous = { ...defaults, 'ui.accentPrimary': '#9e5344' };
        const { quick, rejected } = t.resolveQuickInput(css({ ...previous, 'ui.accentPrimary': '#00AAF' }), previous);
        assert.equal(quick['ui.accentPrimary'], '#9e5344');
        assert.deepEqual(rejected, [{ name: '--Accentuation', value: '#00AAF', kept: '#9E5344', at: { kind: 'quick', cssVar: 'Accentuation' } }]);
    });

    it('reports a colour whose line is gone or left empty', () => {
        const text = css(defaults)
            .replace(/\s*--Accentuation:[^;]*;/, '')
            .replace(/(--Borders:)[^;]*;/, '$1 ;');
        const { rejected } = t.resolveQuickInput(text, defaults);
        assert.deepEqual(rejected.map(r => [r.name, r.value]), [['--Accentuation', null], ['--Borders', null]]);
    });

    it('finds a broken colour whatever the case of its variable name', () => {
        const text = css(defaults).replace(/--Accentuation:\s*#[0-9A-Fa-f]+/, '--accentuation: #00AAF');
        assert.deepEqual(t.resolveQuickInput(text, defaults).rejected.map(r => r.value), ['#00AAF']);
    });

    it('keeps the previous toggle while it is half-typed, and honours an explicit INHERIT', () => {
        const previous = { ...defaults, 'ui.cursorLineGlow': 'yes' };
        assert.equal(t.resolveQuickInput(css({ ...previous, 'ui.cursorLineGlow': 'YE' }), previous).quick['ui.cursorLineGlow'], 'yes');
        assert.equal(t.resolveQuickInput(css({ ...previous, 'ui.cursorLineGlow': 'INHERIT' }), previous).quick['ui.cursorLineGlow'], 'inherit');
    });

    it('derives the glow keys from the accent', () => {
        const colors = t.deriveQuickColors({ ...defaults, 'ui.cursorLineGlow': 'yes' }, mars);
        assert.ok(t.sameColor(colors[GLOW], defaults['ui.accentPrimary'].slice(0, 7) + '60'));
    });
});

describe('Pure-Black YES', () => {
    const THEMES_DIR = path.join(__dirname, '..', '..', 'themes');
    const { hexToRgb, rgbToHsl } = t.colorUtils;
    const hue = (hex) => { const { r, g, b } = hexToRgb(hex); return rgbToHsl(r, g, b).h; };
    const luminance = (hex) => {
        const { r, g, b } = hexToRgb(hex);
        const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const contrast = (a, b) => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
    };

    for (const file of fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.json'))) {
        const theme = t.parseJsonc(fs.readFileSync(path.join(THEMES_DIR, file), 'utf8'));
        const bases = t.extractBaseColorsFromTheme(theme);
        const light = theme.type === 'vs' || theme.type === 'light';

        it(`deepens ${file} while keeping its hue and its widgets apart`, () => {
            const colors = t.deriveQuickColors({ ...t.quickDefaults(theme), 'ui.pureBlack': 'yes' }, theme);
            const editor = colors['editor.background'];
            const widget = colors['editorWidget.background'];
            assert.ok(contrast(bases.text, editor) > contrast(bases.text, bases.bg), `${editor} reads stronger than ${bases.bg}`);
            assert.ok(Math.abs(hue(editor) - hue(bases.bg)) < 0.05, `${editor} keeps the hue of ${bases.bg}`);
            assert.ok(light ? luminance(widget) < luminance(editor) : luminance(widget) > luminance(editor),
                `${widget} stands out from ${editor}`);
        });
    }
});

describe('Pure-Black NO', () => {
    const THEMES_DIR = path.join(__dirname, '..', '..', 'themes');

    for (const file of fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.json'))) {
        const theme = t.parseJsonc(fs.readFileSync(path.join(THEMES_DIR, file), 'utf8'));

        it(`leaves the backgrounds of ${file} to the theme`, () => {
            assert.deepEqual(t.deriveQuickColors({ ...t.quickDefaults(theme), 'ui.pureBlack': 'no' }, theme), {});
        });
    }
});

describe('Colours the toggles of 1.0.5 wrote', () => {
    const jupiter = t.parseJsonc(fs.readFileSync(path.join(__dirname, '..', '..', 'themes', 'arn-jupiter.json'), 'utf8'));

    it('gives back the lifted backgrounds of Pure-Black NO', () => {
        const dark = t.legacyToggleColors({ 'ui.pureBlack': 'no' }, mars);
        assert.equal(Object.keys(dark).length, 20);
        assert.equal(dark['editor.background'], '#150D08');
        assert.equal(dark['sideBar.background'], '#23160D');
        assert.equal(dark['menu.background'], '#C2865E', 'the pale widgets 1.0.5 shipped');
        const light = t.legacyToggleColors({ 'ui.pureBlack': 'no' }, jupiter);
        assert.equal(light['editor.background'], '#FAF4E4');
        assert.equal(light['menu.background'], '#EDE6D1');
    });

    it('gives back the fixed blacks of Pure-Black YES', () => {
        const dark = t.legacyToggleColors({ 'ui.pureBlack': 'yes' }, mars);
        assert.equal(dark['editor.background'], '#000000');
        assert.equal(dark['sideBar.background'], '#050505');
        assert.equal(dark['menu.background'], '#0A0A0A');
        assert.ok(dark['quickInputList.focusBackground']);
        const light = t.legacyToggleColors({ 'ui.pureBlack': 'yes' }, jupiter);
        assert.equal(light['editor.background'], '#FFFFFF');
        assert.equal(light['menu.background'], '#EDEDED');
    });

    it('gives back the strong grey of Vivid-Selection NO', () => {
        const legacy = t.legacyToggleColors({ 'ui.vividSelection': 'no' }, mars);
        const text = t.extractBaseColorsFromTheme(mars).text;
        assert.ok(t.sameColor(legacy['editor.selectionBackground'], `${text}55`));
        assert.equal(Object.keys(legacy).length, 5);
    });

    it('gives back the raw accent label of Active-Tab-Highlight YES', () => {
        const legacy = t.legacyToggleColors({ 'ui.activeTabHighlight': 'yes' }, jupiter);
        assert.ok(t.sameColor(legacy['tab.activeForeground'], '#d99815'), 'the unreadable gold');
        assert.ok(legacy['tab.unfocusedActiveForeground']);
    });

    it('gives nothing back for a toggle left on INHERIT', () => {
        assert.deepEqual(t.legacyToggleColors({}, mars), {});
    });
});

describe('Rejected colour notices', () => {
    const broken = (value) => ({ name: '--Accentuation', value });

    it('announces a rejected value once, then waits 15 s before the next notice', () => {
        let plan = t.planNotice(undefined, [broken('#0')], 0);
        assert.equal(plan.announce.length, 1);
        plan = t.planNotice(plan.next, [broken('#0')], 1000);
        assert.equal(plan.announce.length, 0, 'the same value is not announced twice');
        plan = t.planNotice(plan.next, [broken('#00AAF')], 5000);
        assert.equal(plan.announce.length, 0, 'a new value within 15 s waits');
        plan = t.planNotice(plan.next, [broken('#00AAG')], 15000);
        assert.equal(plan.announce.length, 1, 'the next value after 15 s is announced');
    });

    it('announces a value again once it was fixed and broken anew', () => {
        let plan = t.planNotice(undefined, [broken('#0')], 0);
        plan = t.planNotice(plan.next, [], 20000);
        plan = t.planNotice(plan.next, [broken('#0')], 40000);
        assert.equal(plan.announce.length, 1);
    });

    it('calls a value erased with its semicolon missing, not the next line', () => {
        const view = ':root {\n    --Accentuation:\n    --Secondary-Background:  #062F40;\n}\n';
        const [r] = t.resolveQuickInput(view, t.quickDefaults(mars)).rejected.filter(x => x.name === '--Accentuation');
        assert.equal(r.value, null);
    });

    it('keeps the toast to one line, the kept colour first', () => {
        assert.equal(t.summarizeRejected({ name: '--Main-Text', value: '#e0hHs', kept: '#E0DEF4' }),
            '--Main-Text stays #E0DEF4 (#e0hHs is invalid)');
        assert.equal(t.summarizeRejected({ name: '--Borders', value: null, kept: '#000000' }),
            '--Borders is missing, stays #000000');
        assert.equal(t.summarizeRejected({ name: 'brand.new', value: 'red', kept: undefined }),
            'brand.new ignored (red is invalid)');
    });
});

describe('Precedence between Quick and Advanced', () => {
    const defaults = t.quickDefaults(mars);
    const glowOn = { ...defaults, 'ui.cursorLineGlow': 'yes' };

    it('keeps an Advanced override on a key the Quick change does not drive', () => {
        const kept = t.dropSupersededOverrides({ 'minimap.background': '#FF00FF' },
            t.deriveQuickColors(defaults, mars), t.deriveQuickColors(glowOn, mars));
        assert.deepEqual(kept, { 'minimap.background': '#FF00FF' });
    });

    it('hands a key back to Quick when the Quick input driving it changes', () => {
        const kept = t.dropSupersededOverrides({ 'minimap.background': '#FF00FF', [GLOW]: '#123456' },
            t.deriveQuickColors(defaults, mars), t.deriveQuickColors(glowOn, mars));
        assert.deepEqual(kept, { 'minimap.background': '#FF00FF' });
    });

    it('does not count a change of hex case as a change', () => {
        const kept = t.dropSupersededOverrides({ k: '#123456' }, { k: '#aabbcc' }, { k: '#AABBCC' });
        assert.deepEqual(kept, { k: '#123456' });
    });

    it('lets an override win over the derived value on the same key', () => {
        const { colors } = t.composeOutputs({ quick: { 'ui.cursorLineGlow': 'yes' }, ui: { [GLOW]: '#123456' } }, mars);
        assert.equal(colors[GLOW], '#123456');
        assert.ok(colors['editorCursor.foreground'], 'the other glow keys still come from Quick');
    });

    it('produces no output for an empty state', () => {
        assert.deepEqual(t.composeOutputs({}, mars), { colors: {}, textMateRules: [], semanticRules: {} });
    });
});

describe('Advanced UI diff', () => {
    it('keeps only the keys that differ from the baseline, whatever the hex case', () => {
        const diff = t.diffColors(
            { a: '#AABBCC', b: '#aabbcc', c: '#FFFFFF', d: 42, e: '#123456' },
            { a: '#aabbcc', b: '#AABBCCFF', c: '#000000', d: '#000000' });
        assert.deepEqual(diff, { c: '#FFFFFF', e: '#123456' });
    });
});

describe('Advanced Syntax diff', () => {
    it('treats the string and object forms of a semantic style as one', () => {
        assert.deepEqual(t.diffSemantic({ x: '#AABBCC' }, { x: { foreground: '#aabbcc' } }), {});
        assert.deepEqual(t.diffSemantic(mars.semanticTokenColors, mars.semanticTokenColors), {});
    });

    it('keeps changed and added semantic selectors, in object form', () => {
        assert.deepEqual(t.diffSemantic({ x: '#123456', y: { bold: true } }, { x: '#AABBCC' }),
            { x: { foreground: '#123456' }, y: { bold: true } });
    });

    it('keeps only the TextMate rules the user changed or added', () => {
        const rules = mars.tokenColors;
        const edited = { ...rules[5], settings: { ...rules[5].settings, foreground: '#123456' } };
        const added = { scope: 'arn.test', settings: { foreground: '#654321' } };
        assert.deepEqual(t.diffTextMate(rules, rules), []);
        assert.deepEqual(t.diffTextMate([...rules.slice(0, 5), edited, ...rules.slice(6), added], rules), [edited, added]);
    });

    it('recovers the edits from the doubled arrays earlier versions stored', () => {
        const rules = mars.tokenColors;
        const edited = { ...rules[5], settings: { ...rules[5].settings, foreground: '#123456' } };
        assert.deepEqual(t.diffTextMate([...rules, ...rules, edited], rules), [edited]);
    });

    it('handles a theme that ships no semantic tokens or TextMate rules', () => {
        const rule = { name: 'Arn', scope: 'arn.test', settings: { foreground: '#654321' } };
        assert.deepEqual(t.normalizeSemantic(undefined), {});
        assert.deepEqual(t.diffTextMate([rule], undefined), [rule]);
        assert.deepEqual(t.renderTextMateView(undefined, [rule]), [rule]);
    });

    it('matches an edited rule to its original by name as well as scope', () => {
        const theme = [
            { name: 'A', scope: 'x', settings: { foreground: '#111111' } },
            { name: 'B', scope: 'x', settings: { foreground: '#222222' } },
        ];
        const edited = { name: 'B', scope: 'x', settings: { foreground: '#333333' } };
        assert.deepEqual(t.renderTextMateView(theme, [edited]), [theme[0], edited]);
    });

    it('ignores entries that are not rules', () => {
        assert.deepEqual(t.diffTextMate([null, 'comment', { scope: 'x' }], []), []);
    });

    it('ignores a rule list that is not an array, as VS Code does', () => {
        // A hand-edited single rule without its brackets.
        assert.deepEqual(t.diffTextMate({ scope: 'comment', settings: { foreground: '#FF0000' } }, []), []);
        assert.deepEqual(t.diffTextMate(true, []), []);
    });

    it('renders an override in place of the rule it was edited from', () => {
        const rules = mars.tokenColors;
        const edited = { ...rules[5], settings: { ...rules[5].settings, foreground: '#123456' } };
        const added = { scope: 'arn.test', settings: { foreground: '#654321' } };
        const view = t.renderTextMateView(rules, [added, edited]);
        assert.equal(view.length, rules.length + 1);
        assert.deepEqual(view[5], edited);
        assert.deepEqual(view[view.length - 1], added);
        assert.deepEqual(t.diffTextMate(view, rules), [edited, added]);
    });

    it('replaces rules sharing a name and scope in order, then adds the extra ones', () => {
        const theme = [
            { name: 'A', scope: 'x', settings: { foreground: '#111111' } },
            { name: 'B', scope: 'y', settings: { foreground: '#222222' } },
            { name: 'A', scope: 'x', settings: { foreground: '#333333' } },
        ];
        const first = { name: 'A', scope: 'x', settings: { foreground: '#AAAAAA' } };
        const second = { name: 'A', scope: 'x', settings: { foreground: '#BBBBBB' } };
        const third = { name: 'A', scope: 'x', settings: { foreground: '#CCCCCC' } };
        assert.deepEqual(t.renderTextMateView(theme, [first, second, third]), [first, theme[1], second, third]);
    });
});

describe('Stored state', () => {
    it('keeps only what the layers can use from a hand-edited record', () => {
        const state = t.sanitizeState({
            quick: { 'ui.accentPrimary': '#00AAFF', 'ui.baseBackground': 'blue', 'ui.cursorLineGlow': 'maybe', 'ui.pureBlack': 'no' },
            ui: { 'minimap.background': '#FF00FF', broken: 7 },
            semantic: { variable: '#123456' },
            textMate: [{ scope: 'x', settings: { foreground: '#000000' } }, { scope: 'y' }],
            extra: true,
        });
        assert.deepEqual(state, {
            quick: { 'ui.accentPrimary': '#00AAFF', 'ui.pureBlack': 'no' },
            ui: { 'minimap.background': '#FF00FF' },
            semantic: { variable: { foreground: '#123456' } },
            textMate: [{ scope: 'x', settings: { foreground: '#000000' } }],
        });
        assert.deepEqual(t.sanitizeState('garbage'), {});
        assert.deepEqual(t.sanitizeState([]), {});
    });

    it('writes short Quick colours out in full, as the derivations read them', () => {
        const state = t.sanitizeState({ quick: { 'ui.accentPrimary': '#f80a', 'ui.baseBackground': '#123' } });
        assert.deepEqual(state.quick, { 'ui.accentPrimary': '#FF8800AA', 'ui.baseBackground': '#112233' });
    });

    it('rewrites only its own part of a shared settings entry', () => {
        assert.deepEqual(t.withOwnedPart({ comments: '#111111', semanticTokenColors: {} }, 'textMateRules', [1], ['semanticTokenColors']),
            { comments: '#111111', textMateRules: [1] });
        assert.equal(t.withOwnedPart({ textMateRules: [1] }, 'textMateRules', undefined), undefined);
    });
});
