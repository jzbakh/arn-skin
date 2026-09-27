// What happens to a colour that is not one, in each editing file: the value
// kept, the words the user reads, and where the underline and its fix land.

const assert = require('node:assert/strict');
const { __testing: t } = require('../../extension');

describe('rejected colours — value kept', () => {
    it('keeps the previous Advanced UI colour, and drops a new key it cannot resolve', () => {
        const { accepted, rejected } = t.keepPreviousUiColors(
            { a: '#00AAF', b: '#123456', c: 'red' }, { a: '#aabbcc' });
        assert.deepEqual(accepted, { a: '#aabbcc', b: '#123456' });
        assert.deepEqual(rejected.map(r => [r.name, r.value, r.kept]),
            [['a', '#00AAF', '#AABBCC'], ['c', 'red', undefined]]);
    });

    it('keeps the previous syntax colour of the token or rule it belongs to, and nothing else', () => {
        const previousRules = [{ name: 'Comment', scope: 'comment', settings: { foreground: '#111111', fontStyle: 'italic' } }];
        const { semantic, rules, rejected } = t.keepPreviousSyntaxColors({
            semanticTokenColors: { variable: '#GG0000', keyword: { foreground: '#222222' } },
            tokenColors: [
                { name: 'Comment', scope: 'comment', settings: { foreground: '#12', fontStyle: 'bold' } },
                { scope: 'new.scope', settings: { foreground: 'oops' } },
            ],
        }, { variable: { foreground: '#333333' } }, previousRules);

        assert.deepEqual(semantic, { variable: { foreground: '#333333' }, keyword: { foreground: '#222222' } });
        assert.deepEqual(rules[0].settings, { foreground: '#111111', fontStyle: 'bold' }, 'only the colour is restored');
        assert.deepEqual(rules[1].settings, {}, 'a new rule has no previous colour');
        assert.deepEqual(rejected.map(r => r.name), ['variable foreground', 'Comment foreground', 'new.scope foreground']);
    });
});

describe('rejected colours — message', () => {
    it('says what was written and what is kept', () => {
        assert.equal(t.describeRejected({ name: '--Accentuation', value: '#00AAF', kept: '#9E5344' }),
            '--Accentuation is not a valid color (#00AAF); the previous color (#9E5344) is kept.');
        assert.equal(t.describeRejected({ name: '--Borders', value: null, kept: '#000000' }),
            '--Borders is missing; the previous color (#000000) is kept.');
        assert.equal(t.describeRejected({ name: 'brand.new', value: 'red', kept: undefined }),
            'brand.new is not a valid color (red) and is ignored.');
    });
});

describe('rejected colours — underline and fix', () => {
    const underlined = (text, r) => {
        const spot = t.locateRejected(text, r);
        return spot && text.slice(spot.start, spot.end);
    };
    const fixed = (text, r) => {
        const { fix } = t.locateRejected(text, r);
        return text.slice(0, fix.start) + fix.newText + text.slice(fix.end);
    };
    const quick = (cssVar, value, kept) => ({ name: `--${cssVar}`, value, kept, at: { kind: 'quick', cssVar } });

    it('underlines a Quick value and restores the kept colour in its place', () => {
        const css = ':root {\n    --Accentuation:   #00AAF ;\n}';
        const r = quick('Accentuation', '#00AAF', '#9E5344');
        assert.equal(underlined(css, r), '#00AAF');
        assert.equal(fixed(css, r), ':root {\n    --Accentuation:   #9E5344 ;\n}');
    });

    it('fills an empty Quick value, and puts back a line that is gone', () => {
        const r = quick('Borders', null, '#000000');
        assert.equal(underlined(':root {\n    --Borders: ;\n}', r), '--Borders');
        assert.equal(fixed(':root {\n    --Borders: ;\n}', r), ':root {\n    --Borders: #000000;\n}');
        assert.equal(underlined(':root {\n}', r), ':root');
        assert.equal(fixed(':root {\n}', r), ':root {\n    --Borders: #000000;\n}');
    });

    it('underlines a Quick value whatever the case of its variable name', () => {
        const css = ':root {\n    --accentuation: #00AAF;\n}';
        const r = quick('Accentuation', '#00AAF', '#9E5344');
        assert.equal(underlined(css, r), '#00AAF');
        assert.equal(fixed(css, r), ':root {\n    --accentuation: #9E5344;\n}');
    });

    it('underlines an Advanced UI value', () => {
        const json = '{ "colors": { "editor.background": "#00AAF", "editor.foreground": "#FFFFFF" } }';
        const r = { value: '#00AAF', kept: '#0A0604', at: { kind: 'ui', key: 'editor.background' } };
        assert.equal(underlined(json, r), '#00AAF');
        assert.equal(fixed(json, r), '{ "colors": { "editor.background": "#0A0604", "editor.foreground": "#FFFFFF" } }');
    });

    it('underlines a semantic colour written as an object or as a shorthand', () => {
        const json = '{ "semanticTokenColors": { "a": { "foreground": "#12" }, "b": "#34" }, "tokenColors": [] }';
        assert.equal(underlined(json, { kept: '#111111', at: { kind: 'semantic', selector: 'a', prop: 'foreground' } }), '#12');
        assert.equal(underlined(json, { kept: '#222222', at: { kind: 'semantic', selector: 'b', prop: 'foreground' } }), '#34');
    });

    it('underlines the colour in the right TextMate rule', () => {
        const json = '{ "semanticTokenColors": { "x": { "foreground": "#000000" } }, "tokenColors": ['
            + '{ "scope": "a", "settings": { "foreground": "#111111" } },'
            + '{ "scope": "b", "settings": { "background": "#bad", "foreground": "oops" } } ] }';
        assert.equal(underlined(json, { kept: '#222222', at: { kind: 'textmate', index: 1, prop: 'foreground' } }), 'oops');
    });

    it('offers no fix when there is no previous colour, and gives up on text it cannot find', () => {
        const json = '{ "colors": { "brand.new": "red" } }';
        assert.equal(t.locateRejected(json, { value: 'red', kept: undefined, at: { kind: 'ui', key: 'brand.new' } }).fix, null);
        assert.equal(t.locateRejected(json, { value: 'x', kept: '#000000', at: { kind: 'ui', key: 'absent' } }), null);
        assert.equal(t.locateRejected('{}', { kept: '#000000', at: { kind: 'textmate', index: 0, prop: 'foreground' } }), null);
        assert.equal(t.locateRejected('body {}', quick('Borders', null, '#000000')), null);
    });
});
