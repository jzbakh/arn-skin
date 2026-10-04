// The validator is the security boundary for untrusted backup files: it must
// accept every state our own export produces and reject anything that could
// write a non-hex value or an arbitrary key into the user's settings.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { __testing } = require('../../extension');

const {
    validateImportBundle,
    assembleBundle,
    normalizeSemantic,
    parseJsonc,
    BACKUP_FORMAT,
    BACKUP_SCHEMA_VERSION,
    BACKUP_LIMITS,
} = __testing;

const REPO_ROOT = path.join(__dirname, '..', '..');

const MARS = 'Arn · Mars — Amber Storm';
const NEBULA = 'Arn · Nebula — Amethyst Void';
const IO = 'Arn · Io — Acid Haze';

// A theme entry as the export writes it: the stored state plus its label.
function validTheme(label = MARS) {
    return {
        label,
        quick: { 'ui.accentPrimary': '#3DD7C7', 'ui.pureBlack': 'yes' },
        ui: { 'editor.background': '#0A0E14', 'tab.activeBorderTop': '#3DD7C7' },
        semantic: { variable: { foreground: '#C8D3E0' }, 'variable.readonly': '#AABBCC' },
        textMate: [{ scope: 'comment', settings: { foreground: '#54637A', fontStyle: 'italic' } }],
    };
}

function validBundle(themes = [validTheme()]) {
    return {
        format: BACKUP_FORMAT,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        extensionVersion: '1.1.0',
        exportedAt: '2026-08-10T00:00:00.000Z',
        activeTheme: MARS,
        themes,
    };
}

const withTheme = (patch) => validBundle([{ ...validTheme(), ...patch }]);
const onlyLayer = (layer, value) => validBundle([{ label: MARS, [layer]: value }]);

// A computed key is an own property, as JSON.parse makes it; a literal
// __proto__ would set the prototype instead and never reach the validator.
const own = (key, value) => ({ [key]: value });

const manyKeys = (n, value) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, value]));

function accepted(obj) {
    const r = validateImportBundle(obj);
    assert.equal(r.ok, true, r.error);
    return r.bundle;
}

function bad(obj, hint) {
    const r = validateImportBundle(obj);
    assert.equal(r.ok, false, 'must be rejected');
    assert.ok(typeof r.error === 'string' && r.error.length > 0, 'must carry an error message');
    if (hint) assert.match(r.error, hint);
}

describe('validateImportBundle — accepts our own export', () => {
    it('returns each theme as its label and its state', () => {
        assert.deepEqual(accepted(validBundle()), {
            activeTheme: MARS,
            themes: [{
                label: MARS,
                state: {
                    quick: { 'ui.accentPrimary': '#3DD7C7', 'ui.pureBlack': 'yes' },
                    ui: { 'editor.background': '#0A0E14', 'tab.activeBorderTop': '#3DD7C7' },
                    semantic: { variable: { foreground: '#C8D3E0' }, 'variable.readonly': { foreground: '#AABBCC' } },
                    textMate: [{ scope: 'comment', settings: { foreground: '#54637A', fontStyle: 'italic' } }],
                },
            }],
        });
    });

    it('keeps several themes in their order', () => {
        const b = accepted(validBundle([validTheme(NEBULA), validTheme(MARS), validTheme(IO)]));
        assert.deepEqual(b.themes.map(t => t.label), [NEBULA, MARS, IO]);
    });

    it('accepts every legal hex length (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) in every layer', () => {
        for (const hex of ['#abc', '#abcd', '#aabbcc', '#AABBCCDD']) {
            accepted(withTheme({
                quick: { 'ui.baseBackground': hex },
                ui: { 'editor.background': hex },
                semantic: { variable: hex, keyword: { foreground: hex, background: hex } },
                textMate: [{ scope: 'comment', settings: { foreground: hex, background: hex } }],
            }));
        }
    });

    it('accepts every Quick base and toggle value the layers store', () => {
        const quick = {
            'ui.baseBackground': '#000000', 'ui.baseForeground': '#000000', 'ui.accentPrimary': '#000000',
            'ui.secondaryBackground': '#000000', 'ui.surfaceElevated': '#000000', 'ui.borders': '#000000',
            'ui.activeBorder': '#000000', 'ui.selection': '#000000', 'status.warning': '#000000',
            'status.error': '#000000', 'status.success': '#000000', 'status.info': '#000000',
            'ui.borderless': 'yes', 'ui.pureBlack': 'no', 'ui.activeTabHighlight': 'inherit',
            'ui.vividSelection': 'yes', 'ui.cursorLineGlow': 'no',
        };
        assert.deepEqual(accepted(withTheme({ quick })).themes[0].state.quick, quick);
    });

    it('accepts a semantic token given as a bare hex string', () => {
        accepted(withTheme({ semantic: { property: '#11AA33' } }));
    });

    it('accepts semantic style objects with boolean flags and a fontStyle', () => {
        const keyword = { foreground: '#112233', bold: true, italic: false, underline: true, strikethrough: false };
        const b = accepted(withTheme({ semantic: { keyword, 'variable.readonly:javascript': { fontStyle: 'italic' }, '*.deprecated': { strikethrough: true } } }));
        assert.deepEqual(b.themes[0].state.semantic.keyword, keyword);
    });

    it('accepts a TextMate rule with a name and an array scope', () => {
        const rule = { name: 'Comments', scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#556677' } };
        assert.deepEqual(accepted(withTheme({ textMate: [rule] })).themes[0].state.textMate, [rule]);
    });

    for (const [layer, value] of Object.entries(validTheme())) {
        if (layer === 'label') continue;
        it(`accepts a theme that only carries ${layer}`, () => {
            const b = accepted(onlyLayer(layer, value));
            assert.deepEqual(Object.keys(b.themes[0].state), [layer]);
        });
    }

    it('keeps activeTheme only when it is a string', () => {
        assert.equal(accepted({ ...validBundle(), activeTheme: 42 }).activeTheme, null);
        const { activeTheme, ...noActive } = validBundle();
        assert.equal(activeTheme, MARS);
        assert.equal(accepted(noActive).activeTheme, null);
    });

    it('accepts the limits themselves', () => {
        const labels = Array.from({ length: BACKUP_LIMITS.maxThemes }, (_, i) => `Arn ${i}`);
        assert.equal(accepted(validBundle(labels.map(validTheme))).themes.length, BACKUP_LIMITS.maxThemes);
        accepted(validBundle([validTheme('Arn' + 'x'.repeat(BACKUP_LIMITS.maxLabelLen - 3))]));
        accepted(onlyLayer('ui', manyKeys(BACKUP_LIMITS.maxColorKeys, '#000000')));
        accepted(onlyLayer('ui', own('k'.repeat(BACKUP_LIMITS.maxKeyLen), '#000000')));
        accepted(onlyLayer('semantic', manyKeys(BACKUP_LIMITS.maxSemanticTokens, '#000000')));
        accepted(onlyLayer('textMate', Array.from({ length: BACKUP_LIMITS.maxTextMateRules },
            () => ({ scope: 's'.repeat(BACKUP_LIMITS.maxScopeLen), settings: { fontStyle: 'i'.repeat(BACKUP_LIMITS.maxStyleLen) } }))));
    });
});

describe('validateImportBundle — normalises', () => {
    it('turns semantic strings into { foreground }', () => {
        const b = accepted(withTheme({ semantic: { variable: '#C8D3E0', keyword: { foreground: '#112233', bold: true } } }));
        assert.deepEqual(b.themes[0].state.semantic, {
            variable: { foreground: '#C8D3E0' },
            keyword: { foreground: '#112233', bold: true },
        });
    });

    it('drops empty and null layers', () => {
        const b = accepted(validBundle([
            { label: MARS, quick: {}, ui: { 'editor.background': '#000000' }, semantic: {}, textMate: [] },
            { label: NEBULA, quick: null, ui: null, semantic: null, textMate: [{ scope: 'comment', settings: {} }] },
        ]));
        assert.deepEqual(b.themes, [
            { label: MARS, state: { ui: { 'editor.background': '#000000' } } },
            { label: NEBULA, state: { textMate: [{ scope: 'comment', settings: {} }] } },
        ]);
    });

    it('writes short Quick colours out in full, as the derivations read them', () => {
        const b = accepted(withTheme({ quick: { 'ui.accentPrimary': '#f80a', 'ui.baseBackground': '#123', 'ui.pureBlack': 'yes' } }));
        assert.deepEqual(b.themes[0].state.quick, { 'ui.accentPrimary': '#FF8800AA', 'ui.baseBackground': '#112233', 'ui.pureBlack': 'yes' });
    });

    it('drops empty themes but keeps the rest', () => {
        const b = accepted(validBundle([
            { label: NEBULA },
            validTheme(MARS),
            { label: IO, quick: {}, ui: {}, semantic: {}, textMate: [] },
        ]));
        assert.deepEqual(b.themes.map(t => t.label), [MARS]);
    });
});

describe('validateImportBundle — rejects malformed / malicious input', () => {
    it('rejects non-objects and null', () => {
        for (const v of [null, undefined, 42, 'x', true, []]) bad(v, /not an object/);
    });

    it('rejects a missing or wrong format marker', () => {
        const { format, ...noFormat } = validBundle();
        assert.equal(format, BACKUP_FORMAT);
        bad(noFormat, /marker/);
        bad({ ...validBundle(), format: 'something-else' }, /marker/);
    });

    it('rejects an invalid schemaVersion', () => {
        const { schemaVersion, ...noVersion } = validBundle();
        assert.equal(schemaVersion, BACKUP_SCHEMA_VERSION);
        bad(noVersion, /invalid schemaVersion/);
        for (const v of [1.5, 0, -1, '1', null, Infinity]) bad({ ...validBundle(), schemaVersion: v }, /invalid schemaVersion/);
    });

    it('rejects a bundle from a newer schema version', () => {
        bad({ ...validBundle(), schemaVersion: BACKUP_SCHEMA_VERSION + 1 }, /newer/);
    });

    it('rejects themes that is not an array', () => {
        const { themes, ...noThemes } = validBundle();
        assert.equal(themes.length, 1);
        bad(noThemes, /themes is not an array/);
        bad({ ...validBundle(), themes: {} }, /themes is not an array/);
        bad({ ...validBundle(), themes: 'x' }, /themes is not an array/);
    });

    it('rejects too many themes', () => {
        bad(validBundle(Array.from({ length: BACKUP_LIMITS.maxThemes + 1 }, (_, i) => validTheme(`Arn ${i}`))), /too many themes/);
    });

    it('rejects a non-ARN, non-string, missing or over-long label', () => {
        bad(validBundle([validTheme('Solarized Dark')]), /ARN-Skin theme label/);
        bad(validBundle([validTheme('')]), /ARN-Skin theme label/);
        bad(validBundle([{ ...validTheme(), label: 123 }]), /ARN-Skin theme label/);
        const { label, ...noLabel } = validTheme();
        assert.equal(label, MARS);
        bad(validBundle([noLabel]), /ARN-Skin theme label/);
        bad(validBundle([validTheme('Arn' + 'x'.repeat(BACKUP_LIMITS.maxLabelLen - 2))]), /label too long/);
    });

    it('rejects a label that would not read as one line in the confirmation', () => {
        // Line breaks and bidi controls could forge text in the import dialog.
        for (const ch of ['\n', '\r', '\t', '\u0000', '\u0085', ' ', ' ', '‮', '⁦']) {
            bad(validBundle([validTheme(`Arn${ch}Nothing is overwritten`)]), /ARN-Skin theme label/);
        }
    });

    it('rejects a TextMate rule with a null name or scope, or too many scopes', () => {
        bad(onlyLayer('textMate', [{ name: null, scope: 'x', settings: {} }]), /textMate\[0\]\.name is invalid/);
        bad(onlyLayer('textMate', [{ scope: null, settings: {} }]), /textMate\[0\]\.scope has an invalid entry/);
        const max = BACKUP_LIMITS.maxScopesPerRule;
        accepted(onlyLayer('textMate', [{ scope: Array(max).fill('x'), settings: {} }]));
        bad(onlyLayer('textMate', [{ scope: Array(max + 1).fill('x'), settings: {} }]), /scope has too many entries/);
    });

    it('rejects a label that appears twice, empty first entry or not', () => {
        bad(validBundle([validTheme(MARS), validTheme(NEBULA), validTheme(MARS)]), /^theme #3: same theme as theme #1$/);
        bad(validBundle([{ label: MARS }, validTheme(MARS)]), /^theme #2: same theme as theme #1$/);
    });

    it('rejects an unexpected key in a theme entry, the first format\'s keys included, null or not', () => {
        for (const key of ['colorCustomizations', 'tokenColorCustomizations', 'files', 'state', 'evil', '__proto__']) {
            bad(validBundle([{ ...validTheme(), ...own(key, {}) }]), /unexpected key/);
            bad(validBundle([{ ...validTheme(), ...own(key, null) }]), /unexpected key/);
        }
    });

    it('rejects the whole bundle for one bad theme, never just that theme', () => {
        bad(validBundle([validTheme(MARS), { ...validTheme(NEBULA), ui: { 'editor.background': 'red' } }]), /^theme #2: /);
    });

    it('never lets a label or a key form a link in the error', () => {
        // Notifications turn [text](command:…) into a clickable command.
        const link = '[Show details](command:workbench.action.quit)';
        for (const theme of [
            { label: `Arn ${link}`, quick: 1 },
            { ...validTheme(), ...own(link, {}) },
            { label: MARS, ui: own(link, '#000000') },
            { label: MARS, textMate: [{ scope: 'x', settings: { foreground: '#000000' }, ...own(link, 1) }] },
        ]) {
            const r = validateImportBundle(validBundle([theme]));
            assert.equal(r.ok, false);
            assert.doesNotMatch(r.error, /\[[^\]]*\]\(/, r.error);
        }
    });

    it('keeps the error short whatever the hostile key', () => {
        const r = validateImportBundle(validBundle([{ ...validTheme(), ...own('x'.repeat(10000), {}) }]));
        assert.equal(r.ok, false);
        assert.ok(r.error.length < 300, `error is ${r.error.length} characters`);
    });

    it('rejects an unknown Quick key', () => {
        for (const key of ['ui.bogus', 'Global-Background', 'bg', '__proto__', 'constructor', 'toString']) {
            bad(onlyLayer('quick', own(key, '#000000')), /unexpected Quick key/);
        }
    });

    it('rejects an invalid Quick colour or toggle value', () => {
        for (const v of ['red', '#12', '#1234567', 42, null, 'yes']) {
            bad(onlyLayer('quick', { 'ui.accentPrimary': v }), /quick\.ui\.accentPrimary is invalid/);
        }
        // Settings keep toggles lowercase.
        for (const v of ['maybe', 'YES', true, 1, null, '#000000']) {
            bad(onlyLayer('quick', { 'ui.pureBlack': v }), /quick\.ui\.pureBlack is invalid/);
        }
    });

    it('rejects a non-hex ui value (the core hardening)', () => {
        for (const v of ['red', 'url(javascript:alert(1))', 12345, '#12', '#1234567', '#GGGGGG',
            ' #000000', '#000000;', '', null, true, {}, ['#000000']]) {
            bad(onlyLayer('ui', { 'editor.background': v }), /is not a hex value/);
        }
    });

    it('rejects an invalid or hostile color key', () => {
        for (const key of ['editor background', 'a/../../evil', '', 'editor.background"', `[${NEBULA}]`,
            'k'.repeat(BACKUP_LIMITS.maxKeyLen + 1), '__proto__', 'constructor', 'prototype']) {
            bad(onlyLayer('ui', own(key, '#000000')), /invalid color key/);
        }
    });

    it('rejects an invalid or hostile semantic token', () => {
        for (const key of ['bad token!', 'variable readonly', '', `[${NEBULA}]`,
            't'.repeat(BACKUP_LIMITS.maxKeyLen + 1), '__proto__', 'constructor', 'prototype']) {
            bad(onlyLayer('semantic', own(key, '#000000')), /invalid semantic token/);
        }
    });

    it('rejects too many color keys, semantic tokens or TextMate rules', () => {
        bad(onlyLayer('ui', manyKeys(BACKUP_LIMITS.maxColorKeys + 1, '#000000')), /too many color keys/);
        bad(onlyLayer('semantic', manyKeys(BACKUP_LIMITS.maxSemanticTokens + 1, '#000000')), /too many semantic tokens/);
        bad(onlyLayer('textMate', Array.from({ length: BACKUP_LIMITS.maxTextMateRules + 1 },
            () => ({ scope: 'comment', settings: { foreground: '#000000' } }))), /too many TextMate rules/);
    });

    for (const [what, value, hint] of [
        ['a non-hex semantic string', 'notacolor', /semantic\.variable is not a hex value/],
        ['a semantic token that is neither hex nor object', 42, /hex string or settings object/],
        ['a semantic token given as an array', ['#000000'], /hex string or settings object/],
        ['a null semantic token', null, /hex string or settings object/],
        ['an unexpected key in a semantic style object', { foreground: '#112233', evil: 'x' }, /unexpected key/],
        ['a non-hex semantic foreground', { foreground: 'red' }, /foreground is not a hex value/],
        ['a non-hex semantic background', { background: 'red' }, /background is not a hex value/],
        ['a non-string semantic fontStyle', { fontStyle: 1 }, /fontStyle is invalid/],
        ['an over-long semantic fontStyle', { fontStyle: 'x'.repeat(BACKUP_LIMITS.maxStyleLen + 1) }, /fontStyle is invalid/],
        ['a string bold flag', { bold: 'yes' }, /bold must be a boolean/],
        ['a numeric italic flag', { italic: 1 }, /italic must be a boolean/],
        ['a null underline flag', { underline: null }, /underline must be a boolean/],
        ['a string strikethrough flag', { strikethrough: 'true' }, /strikethrough must be a boolean/],
    ]) {
        it(`rejects ${what}`, () => {
            bad(onlyLayer('semantic', { variable: value }), hint);
        });
    }

    for (const [what, rule, hint] of [
        ['a TextMate rule that is not an object', 'comment', /must be an object/],
        ['a null TextMate rule', null, /must be an object/],
        ['a TextMate rule given as an array', [], /must be an object/],
        ['an unexpected key in a TextMate rule', { scope: 'x', settings: {}, evil: 1 }, /unexpected key/],
        ['a non-string TextMate name', { name: 7, scope: 'x', settings: {} }, /name is invalid/],
        ['an over-long TextMate name', { name: 'n'.repeat(BACKUP_LIMITS.maxScopeLen + 1), settings: {} }, /name is invalid/],
        ['a non-string TextMate scope', { scope: 5, settings: {} }, /scope has an invalid entry/],
        ['a non-string TextMate scope entry', { scope: ['comment', 3], settings: {} }, /scope has an invalid entry/],
        ['an over-long TextMate scope', { scope: 's'.repeat(BACKUP_LIMITS.maxScopeLen + 1), settings: {} }, /scope has an invalid entry/],
        ['a TextMate rule without settings', { scope: 'x' }, /settings must be an object/],
        ['TextMate settings that are not an object', { scope: 'x', settings: 'bold' }, /settings must be an object/],
        ['TextMate settings given as an array', { scope: 'x', settings: [] }, /settings must be an object/],
        ['a non-hex TextMate foreground', { scope: 'x', settings: { foreground: 'purple' } }, /settings\.foreground is not a hex value/],
        ['a non-hex TextMate background', { scope: 'x', settings: { background: '#12' } }, /settings\.background is not a hex value/],
        ['an unexpected key in TextMate settings', { scope: 'x', settings: { evil: '#000000' } }, /unexpected key/],
        ['a non-string TextMate fontStyle', { scope: 'x', settings: { fontStyle: false } }, /settings\.fontStyle is invalid/],
        ['an over-long TextMate fontStyle', { scope: 'x', settings: { fontStyle: 'x'.repeat(BACKUP_LIMITS.maxStyleLen + 1) } }, /settings\.fontStyle is invalid/],
    ]) {
        it(`rejects ${what}`, () => {
            bad(onlyLayer('textMate', [{ scope: 'comment', settings: { foreground: '#000000' } }, rule]), hint);
        });
    }

    it('rejects a theme or a layer of the wrong type', () => {
        bad(validBundle([42]), /not an object/);
        bad(validBundle([[validTheme()]]), /not an object/);
        bad(onlyLayer('quick', ['#000000']), /quick must be an object/);
        bad(onlyLayer('quick', 'yes'), /quick must be an object/);
        bad(onlyLayer('ui', ['#000000']), /ui must be an object/);
        bad(onlyLayer('ui', '#000000'), /ui must be an object/);
        bad(onlyLayer('semantic', []), /semantic must be an object/);
        bad(onlyLayer('semantic', '#000000'), /semantic must be an object/);
        bad(onlyLayer('textMate', {}), /textMate must be an array/);
        bad(onlyLayer('textMate', 'comment'), /textMate must be an array/);
    });

    it('rejects a bundle with no customizations', () => {
        bad(validBundle([]), /no customizations/);
        bad(validBundle([{ label: MARS }]), /no customizations/);
        bad(validBundle([{ label: MARS, quick: {}, ui: {}, semantic: {}, textMate: [] }, { label: NEBULA, ui: null }]), /no customizations/);
    });
});

describe('assembleBundle', () => {
    const state = () => {
        const { label, ...rest } = validTheme();
        assert.equal(label, MARS);
        return rest;
    };

    it('stamps the format and schema version and flattens each state into its theme entry', () => {
        const b = assembleBundle({
            extensionVersion: '1.1.0', activeTheme: MARS, exportedAt: 'T',
            themes: [{ label: MARS, state: state() }, { label: NEBULA, state: { ui: { 'editor.background': '#000000' } } }],
        });
        assert.deepEqual(b, {
            format: BACKUP_FORMAT,
            schemaVersion: BACKUP_SCHEMA_VERSION,
            extensionVersion: '1.1.0',
            exportedAt: 'T',
            activeTheme: MARS,
            themes: [validTheme(MARS), { label: NEBULA, ui: { 'editor.background': '#000000' } }],
        });
    });

    it('writes missing metadata as null, never undefined in the JSON', () => {
        const b = assembleBundle({ themes: [] });
        assert.equal(b.extensionVersion, null);
        assert.equal(b.exportedAt, null);
        assert.equal(b.activeTheme, null);
        assert.deepEqual(b.themes, []);
    });

    it('round-trips through the file and validateImportBundle', () => {
        const themes = [
            { label: MARS, state: state() },
            { label: IO, state: { quick: { 'ui.cursorLineGlow': 'yes' } } },
        ];
        const text = JSON.stringify(assembleBundle({ extensionVersion: '1.1.0', activeTheme: IO, exportedAt: 'T', themes }), null, 2);
        const b = accepted(JSON.parse(text));
        assert.equal(b.activeTheme, IO);
        assert.deepEqual(b.themes, [
            { label: MARS, state: { ...state(), semantic: normalizeSemantic(state().semantic) } },
            themes[1],
        ]);
    });
});

describe('pruneForBackup', () => {
    const { pruneForBackup } = __testing;

    it('keeps a valid state whole', () => {
        const { label, ...state } = validTheme();
        assert.deepEqual(pruneForBackup(label, state), { state, leftOut: [] });
    });

    it('leaves out only what import would reject, and says where', () => {
        // What the editors keep although VS Code ignores it.
        const { state, leftOut } = pruneForBackup(MARS, {
            quick: { 'ui.accentPrimary': '#3DD7C7', 'ui.bogus': '#000000' },
            ui: { 'editor.background': '#0A0E14', 'editor background': '#000000', 'minimap.background': '#12345' },
            semantic: { variable: { foreground: '#C8D3E0' }, keyword: { foreground: '#112233', bold: 'true' } },
            textMate: [
                { scope: 'comment', settings: { foreground: '#54637A' }, comment: 'mine' },
                { scope: 'string', settings: { foreground: '#AABBCC' } },
            ],
        });
        // A colour VS Code applies stays, whatever stray property sits next to it.
        assert.deepEqual(state, {
            quick: { 'ui.accentPrimary': '#3DD7C7' },
            ui: { 'editor.background': '#0A0E14' },
            semantic: { variable: { foreground: '#C8D3E0' }, keyword: { foreground: '#112233' } },
            textMate: [
                { scope: 'comment', settings: { foreground: '#54637A' } },
                { scope: 'string', settings: { foreground: '#AABBCC' } },
            ],
        });
        assert.equal(leftOut.length, 5);
        assert.ok(leftOut.every(e => e.startsWith(`${MARS}: `)), leftOut.join('\n'));
        assert.equal(validateImportBundle(assembleBundle({ themes: [{ label: MARS, state }] })).ok, true);
    });

    it('drops a rule or token only when nothing it sets is left', () => {
        const { state, leftOut } = pruneForBackup(MARS, {
            semantic: { keyword: { bold: 'true' }, variable: 'red', type: { foreground: '#112233', italic: 1 } },
            textMate: [
                { scope: 'a', settings: { foreground: 'red' } },
                { scope: 'b', settings: { foreground: '#111111', fontStyle: 5 } },
                { scope: 'c', settings: {} },
            ],
        });
        assert.deepEqual(state, {
            semantic: { type: { foreground: '#112233' } },
            textMate: [{ scope: 'b', settings: { foreground: '#111111' } }, { scope: 'c', settings: {} }],
        });
        assert.equal(leftOut.length, 5);
    });

    it('drops a rule that no longer targets anything', () => {
        const { state, leftOut } = pruneForBackup(MARS, {
            textMate: [
                { scope: null, settings: { foreground: '#111111' } },
                { name: 7, scope: 'x', settings: { foreground: '#111111' } },
                { scope: Array(BACKUP_LIMITS.maxScopesPerRule + 1).fill('x'), settings: { foreground: '#111111' } },
            ],
        });
        assert.deepEqual(state, {});
        assert.equal(leftOut.length, 3);
    });

    it('leaves out a layer of the wrong type and drops what ends up empty', () => {
        assert.deepEqual(pruneForBackup(MARS, { ui: 'red', textMate: [{ scope: 'x' }] }),
            { state: {}, leftOut: [`${MARS}: ui`, `${MARS}: textMate[0].settings must be an object`] });
    });
});

// A strict schema that rejects a genuine theme value would break the round
// trip, so each shipped theme's full surface, as layers, must validate.
describe('validateImportBundle — real theme data (all shipped themes)', () => {
    const pkg = parseJsonc(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    const labelOf = new Map(pkg.contributes.themes.map(t => [path.basename(t.path), t.label]));
    const files = fs.readdirSync(path.join(REPO_ROOT, 'themes')).filter(f => f.endsWith('.json'));
    const full = (file) => {
        const themeJson = parseJsonc(fs.readFileSync(path.join(REPO_ROOT, 'themes', file), 'utf8'));
        return {
            label: labelOf.get(file),
            state: { ui: themeJson.colors, semantic: themeJson.semanticTokenColors, textMate: themeJson.tokenColors },
        };
    };

    it('discovers the shipped theme files', () => {
        assert.ok(files.length >= 7, `expected the 7 ARN themes, found ${files.length}`);
    });

    for (const file of files) {
        it(`accepts the full UI and syntax surface of ${file}`, () => {
            const theme = full(file);
            assert.ok(theme.label, `${file} is not in package.json`);
            assert.ok(Object.keys(theme.state.ui).length > 100, `${file} should ship many UI colour keys`);
            assert.ok(Object.keys(theme.state.semantic).length > 10, `${file} should ship semantic tokens`);
            assert.ok(theme.state.textMate.length > 100, `${file} should ship many TextMate rules`);

            const b = accepted(JSON.parse(JSON.stringify(assembleBundle({ themes: [theme] }))));
            assert.deepEqual(b.themes, [{
                label: theme.label,
                state: { ...theme.state, semantic: normalizeSemantic(theme.state.semantic) },
            }]);
        });
    }

    it('accepts every shipped theme in one backup', () => {
        const b = accepted(assembleBundle({ themes: files.map(full) }));
        assert.equal(b.themes.length, files.length);
    });
});
