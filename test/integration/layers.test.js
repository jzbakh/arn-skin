// Every transition between Quick and Advanced, driven the way a user drives
// it: through the Skin menu, typing in the real files, closing tabs. Each case
// was a way to lose or corrupt a customisation before the layered state.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');
const { __testing } = require('../../extension');
const { snapshotCustomizations, restoreCustomizations, clearCustomizations, settle } = require('./customizations');

const REPO_ROOT = path.join(__dirname, '..', '..');
const MARS = 'Arn · Mars — Amber Storm';
const NEBULA = 'Arn · Nebula — Amethyst Void';
const GLOW = 'editor.lineHighlightBorder';
const G = vscode.ConfigurationTarget.Global;

const wb = () => vscode.workspace.getConfiguration('workbench');
const entryOf = (section, key, label = MARS) =>
    (vscode.workspace.getConfiguration(section).get(key) || {})[`[${label}]`];
const colorsOf = (label = MARS) => entryOf('workbench', 'colorCustomizations', label) || {};
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const MINIMAP = (text) => text.replace(/("minimap\.background"\s*:\s*)"[^"]*"/, '$1"#FF00FF"');
const TERMINAL = (text) => text.replace(/("terminal\.border"\s*:\s*)"[^"]*"/, '$1"#00FF00"');
const KEY = (key, hex) => (text) => {
    const id = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`("${id}"\\s*:\\s*)"[^"]*"`), `$1"${hex}"`);
};
const GLOW_ON = (text) => text.replace(/(--Opt-Cursor-Line-Glow:\s*)\w+/, '$1YES');
const ACCENT = (hex) => (text) => text.replace(/(--Accentuation:\s*)#[0-9A-Fa-f]+/, `$1${hex}`);
// First foreground after `anchor`: a semantic token before "tokenColors", a TextMate rule after it.
const FOREGROUND_AFTER = (anchor, hex) => (text) => {
    const at = text.indexOf(anchor);
    return text.slice(0, at) + text.slice(at).replace(/("foreground":\s*)"#[0-9A-Fa-f]+"/, `$1"${hex}"`);
};

describe('Quick and Advanced layers — user transitions', function () {
    this.timeout(120000);

    let storageDir;
    let themeJson;
    let savedCustomizations;
    let originalTheme;

    async function openMode(action) {
        const pick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => (await items).find(i => i.action === action);
        try {
            await vscode.commands.executeCommand('arn.manageSkin');
        } finally {
            vscode.window.showQuickPick = pick;
        }
        const editor = vscode.window.activeTextEditor;
        storageDir = path.dirname(editor.document.uri.fsPath);
        // A buffer VS Code kept from an earlier open reloads the rebuilt file
        // late; typing before that would edit the stale text.
        const file = editor.document.uri.fsPath;
        for (let i = 0; i < 50; i++) {
            if (!editor.document.isDirty && fs.existsSync(file)
                && fs.readFileSync(file, 'utf8') === editor.document.getText()) break;
            await wait(100);
        }
        await settle();
        return editor;
    }

    async function type(editor, transform) {
        const doc = editor.document;
        const text = doc.getText();
        const next = transform(text);
        assert.notEqual(next, text, 'the edit must change the buffer');
        await editor.edit(b => b.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(text.length)), next));
        await settle();
    }

    async function closeAll() {
        await vscode.commands.executeCommand('workbench.action.files.saveAll');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await settle();
    }

    const readView = (name) => fs.readFileSync(path.join(storageDir, name), 'utf8');

    before(async () => {
        await vscode.extensions.getExtension('jzbakh.antigravity-arn-skin').activate();
        themeJson = __testing.parseJsonc(fs.readFileSync(path.join(REPO_ROOT, 'themes', 'arn-mars.json'), 'utf8'));
        savedCustomizations = snapshotCustomizations();
        originalTheme = wb().get('colorTheme');
        await wb().update('colorTheme', MARS, G);
        await openMode('quick');
    });

    after(async () => {
        await closeAll();
        await wb().update('colorTheme', originalTheme, G);
        await restoreCustomizations(savedCustomizations);
    });

    beforeEach(async () => {
        await closeAll();
        for (const name of fs.readdirSync(storageDir)) fs.rmSync(path.join(storageDir, name), { force: true, recursive: true });
        await wb().update('colorTheme', MARS, G);
        await clearCustomizations();
        await settle();
    });

    it('keeps an Advanced tweak when the Quick glow is turned on, and the glow when going back', async () => {
        await type(await openMode('advanced-ui'), MINIMAP);
        await type(await openMode('quick'), GLOW_ON);
        assert.equal(colorsOf()['minimap.background'], '#FF00FF');
        assert.ok(colorsOf()[GLOW], 'the glow is on');

        const advanced = await openMode('advanced-ui');
        assert.match(readView(path.basename(advanced.document.uri.fsPath)), new RegExp(`"${GLOW}"`),
            'the Advanced view shows the glow Quick just added');
        await type(advanced, TERMINAL);
        assert.equal(colorsOf()['minimap.background'], '#FF00FF');
        assert.equal(colorsOf()['terminal.border'], '#00FF00');
        assert.ok(colorsOf()[GLOW], 'the glow survives the Advanced edit');
    });

    it('hands a key back to Quick when the Quick input driving it changes, and back to Advanced after', async () => {
        await type(await openMode('advanced-ui'), KEY('editor.lineHighlightBackground', '#123456'));
        assert.equal(colorsOf()['editor.lineHighlightBackground'], '#123456');

        await type(await openMode('quick'), GLOW_ON);
        assert.notEqual(colorsOf()['editor.lineHighlightBackground'], '#123456', 'the glow takes the key over');

        await type(await openMode('advanced-ui'), KEY('editor.lineHighlightBackground', '#654321'));
        assert.equal(colorsOf()['editor.lineHighlightBackground'], '#654321', 'the latest Advanced edit wins again');
        assert.ok(colorsOf()[GLOW], 'the rest of the glow stays');
    });

    it('shows the current Quick colours every time the Advanced view opens', async () => {
        let quick = await openMode('quick');
        await type(quick, ACCENT('#00AAFF'));
        let advanced = await openMode('advanced-ui');
        const name = path.basename(advanced.document.uri.fsPath);
        assert.match(readView(name), /"button\.background"\s*:\s*"#00AAFF"/i);

        quick = await openMode('quick');
        await type(quick, ACCENT('#FFAA00'));
        advanced = await openMode('advanced-ui');
        assert.match(readView(name), /"button\.background"\s*:\s*"#FFAA00"/i, 'the view is rebuilt, not stale');
        await type(advanced, TERMINAL);
        assert.ok(__testing.sameColor(colorsOf()['button.background'], '#FFAA00'), 'the Advanced edit does not restore the old accent');
    });

    it('shows a Quick keystroke typed just before the Advanced view opens', async () => {
        const quick = await openMode('quick');
        const doc = quick.document;
        const text = doc.getText();
        await quick.edit(b => b.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(text.length)), ACCENT('#00AAFF')(text)));

        const advanced = await openMode('advanced-ui');

        assert.match(advanced.document.getText(), /"button\.background"\s*:\s*"#00AAFF"/i,
            'the view is rendered after the pending Quick apply, not before');
    });

    it('changes nothing when Quick is opened and closed untouched', async () => {
        await type(await openMode('advanced-ui'), MINIMAP);
        await closeAll();
        const before = colorsOf();

        await openMode('quick');
        await closeAll();

        assert.deepEqual(colorsOf(), before);
    });

    it('applies an edit to the theme the file belongs to, not the active one', async () => {
        const quick = await openMode('quick');
        await wb().update('colorTheme', NEBULA, G);
        await settle();

        await type(quick, GLOW_ON);

        assert.ok(colorsOf(MARS)[GLOW], 'the Mars file customises Mars');
        assert.equal(entryOf('workbench', 'colorCustomizations', NEBULA), undefined, 'Nebula stays untouched');
    });

    it('writes semantic edits where VS Code reads them and never duplicates TextMate rules', async () => {
        let syntax = await openMode('advanced-syntax');
        await type(syntax, FOREGROUND_AFTER('"semanticTokenColors"', '#123456'));
        await type(syntax, FOREGROUND_AFTER('"scope"', '#654321'));

        const semantic = entryOf('editor', 'semanticTokenColorCustomizations');
        assert.equal(Object.keys(semantic.rules).length, 1);
        const tokens = entryOf('editor', 'tokenColorCustomizations');
        assert.equal(tokens.semanticTokenColors, undefined);
        assert.equal(tokens.textMateRules.length, 1, 'only the edited rule is stored');

        await closeAll();
        fs.rmSync(syntax.document.uri.fsPath);
        syntax = await openMode('advanced-syntax');
        const view = __testing.parseJsonc(syntax.document.getText());
        assert.equal(view.tokenColors.length, themeJson.tokenColors.length, 'the rebuilt view is the theme, edited in place');

        await type(syntax, FOREGROUND_AFTER('"scope"', '#ABCDEF'));
        assert.equal(entryOf('editor', 'tokenColorCustomizations').textMateRules.length, 1);
    });

    it('keeps the Quick toggles when the Quick file is lost', async () => {
        let quick = await openMode('quick');
        await type(quick, GLOW_ON);
        await closeAll();
        fs.rmSync(quick.document.uri.fsPath);

        quick = await openMode('quick');
        assert.match(quick.document.getText(), /--Opt-Cursor-Line-Glow:\s*YES/);
        await type(quick, ACCENT('#00AAFF'));
        assert.ok(colorsOf()[GLOW], 'the glow is still on');
    });

    it('applies the last keystroke even when it lands during an apply', async () => {
        const quick = await openMode('quick');
        const set = async (hex) => {
            const doc = quick.document;
            const text = doc.getText();
            await quick.edit(b => b.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(text.length)), ACCENT(hex)(text)));
        };
        await set('#00AAFF');
        await wait(430);
        await set('#FFAA00');
        await settle();
        assert.ok(__testing.sameColor(colorsOf()['button.background'], '#FFAA00'),
            `the final accent must be applied, got ${colorsOf()['button.background']}`);
    });

    it('keeps the previous value of a half-typed Quick colour', async () => {
        const quick = await openMode('quick');
        await type(quick, ACCENT('#00AAFF'));
        const warn = vscode.window.showWarningMessage;
        vscode.window.showWarningMessage = async () => undefined;
        try {
            await type(quick, (text) => text.replace(/(--Accentuation:\s*)#[0-9A-Fa-f]+/, '$1#00AAF'));
        } finally {
            vscode.window.showWarningMessage = warn;
        }
        assert.ok(__testing.sameColor(colorsOf()['button.background'], '#00AAFF'), 'the half-typed value changes nothing');
    });

    it('keeps an unsaved edit when the Skin menu switches theme', async () => {
        const quick = await openMode('quick');
        await type(quick, GLOW_ON);
        let seen = 0;
        const pick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            const list = await items;
            return ++seen === 1 ? list.find(i => i.action === 'changeTheme') : list.find(i => i.label === NEBULA);
        };
        try {
            await vscode.commands.executeCommand('arn.manageSkin');
        } finally {
            vscode.window.showQuickPick = pick;
        }
        await settle();

        assert.equal(wb().get('colorTheme'), NEBULA);
        assert.ok(colorsOf(MARS)[GLOW], 'the edit is saved with the tab, not rolled back');
        assert.match(fs.readFileSync(quick.document.uri.fsPath, 'utf8'), /--Opt-Cursor-Line-Glow:\s*YES/);
    });

    it('keeps the last keystroke when the Skin menu switches theme right after it', async () => {
        const quick = await openMode('quick');
        const doc = quick.document;
        const text = doc.getText();
        await quick.edit(b => b.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(text.length)), GLOW_ON(text)));
        let seen = 0;
        const pick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            const list = await items;
            return ++seen === 1 ? list.find(i => i.action === 'changeTheme') : list.find(i => i.label === NEBULA);
        };
        try {
            await vscode.commands.executeCommand('arn.manageSkin');
        } finally {
            vscode.window.showQuickPick = pick;
        }
        await settle();

        assert.equal(wb().get('colorTheme'), NEBULA);
        assert.equal(__testing.readStoredState(MARS).quick['ui.cursorLineGlow'], 'yes',
            'the keystroke typed just before the switch reaches the state');
    });

    it('keeps every saved edit across repeated mode switches', async () => {
        // Each switch saves the tab it leaves and then closes it; the save and
        // the close must never be handled out of order.
        for (let i = 1; i <= 6; i++) {
            const hex = `#0000${String(i).padStart(2, '0')}`;
            await type(await openMode('advanced-ui'), KEY('minimap.background', hex));
            await openMode('quick');
            assert.equal(colorsOf()['minimap.background'], hex, `switch ${i}`);
        }
    });

    // The underline and its quick fix, read back from VS Code as the user gets them.
    const ourMarks = (doc) => vscode.languages.getDiagnostics(doc.uri).filter(d => d.source === 'ARN-Skin');
    async function restoreWithQuickFix(editor, title) {
        const [mark] = ourMarks(editor.document);
        const actions = await vscode.commands.executeCommand('vscode.executeCodeActionProvider', editor.document.uri, mark.range);
        const action = actions.find(a => a.title === title);
        assert.ok(action, `quick fix "${title}" among ${JSON.stringify(actions.map(a => a.title))}`);
        await vscode.workspace.applyEdit(action.edit);
        await settle();
    }

    it('underlines a rejected Quick colour and puts the previous one back in one action', async () => {
        const quick = await openMode('quick');
        await type(quick, ACCENT('#00AAFF'));
        await type(quick, (text) => text.replace(/(--Accentuation:\s*)#[0-9A-Fa-f]+/, '$1#00AAF'));

        const marks = ourMarks(quick.document);
        assert.equal(marks.length, 1);
        assert.equal(quick.document.getText(marks[0].range), '#00AAF');
        assert.match(marks[0].message, /--Accentuation is not a valid color \(#00AAF\); the previous color \(#00AAFF\) is kept\./);

        await restoreWithQuickFix(quick, 'Restore the previous color (#00AAFF)');
        assert.match(quick.document.getText(), /--Accentuation:\s*#00AAFF;/);
        assert.deepEqual(ourMarks(quick.document), []);
    });

    it('keeps the previous Advanced UI colour, underlines the rejected one and offers it back', async () => {
        const advanced = await openMode('advanced-ui');
        await type(advanced, MINIMAP);
        await type(advanced, KEY('minimap.background', '#FF00F'));

        assert.equal(colorsOf()['minimap.background'], '#FF00FF', 'the invalid value never reaches settings');
        const [mark] = ourMarks(advanced.document);
        assert.equal(advanced.document.getText(mark.range), '#FF00F');

        await restoreWithQuickFix(advanced, 'Restore the previous color (#FF00FF)');
        assert.match(advanced.document.getText(), /"minimap\.background"\s*:\s*"#FF00FF"/);
        assert.deepEqual(ourMarks(advanced.document), []);
    });

    it('keeps the previous syntax colour, underlines the rejected one and offers it back', async () => {
        const syntax = await openMode('advanced-syntax');
        await type(syntax, FOREGROUND_AFTER('"scope"', '#12'));

        assert.equal(entryOf('editor', 'tokenColorCustomizations'), undefined, 'nothing is written for an invalid colour');
        const [mark] = ourMarks(syntax.document);
        assert.equal(syntax.document.getText(mark.range), '#12');

        const kept = /previous color \((#[0-9A-F]+)\)/.exec(mark.message)[1];
        await restoreWithQuickFix(syntax, `Restore the previous color (${kept})`);
        assert.deepEqual(ourMarks(syntax.document), []);
        assert.equal(entryOf('editor', 'tokenColorCustomizations'), undefined, 'the restored colour is the theme\'s own');
    });

    it('reads a colour the picker wrote in another notation', async () => {
        const quick = await openMode('quick');
        await type(quick, (text) => text.replace(/(--Accentuation:\s*)#[0-9A-Fa-f]+/, '$1oklch(52.887% 0.10286 32.457)'));

        assert.ok(__testing.sameColor(colorsOf()['button.background'], '#9E5344'));
        assert.deepEqual(ourMarks(quick.document), []);
    });

    it('writes one key for one Advanced tweak', async () => {
        await type(await openMode('advanced-ui'), MINIMAP);
        assert.deepEqual(colorsOf(), { 'minimap.background': '#FF00FF' });
        assert.deepEqual(__testing.readStoredState(MARS), { ui: { 'minimap.background': '#FF00FF' } });
    });

    it('restores the layers from before the edit when the tab closes unsaved', async () => {
        await type(await openMode('advanced-ui'), KEY('editor.lineHighlightBackground', '#123456'));
        await closeAll();

        await type(await openMode('quick'), GLOW_ON);
        assert.notEqual(colorsOf()['editor.lineHighlightBackground'], '#123456', 'precondition: the glow took the key');

        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await settle();

        assert.equal(colorsOf()['editor.lineHighlightBackground'], '#123456', 'the Advanced override is back');
        assert.equal(colorsOf()[GLOW], undefined, 'the unsaved glow is gone');
    });

    it('drops an unsaved Advanced tweak when its tab closes unsaved', async () => {
        await type(await openMode('advanced-ui'), MINIMAP);
        assert.equal(colorsOf()['minimap.background'], '#FF00FF', 'precondition: live preview');

        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await settle();

        assert.deepEqual(colorsOf(), {});
        assert.equal(__testing.readStoredState(MARS), null);
    });

    it('offers Reset for a theme customised only through semantic tokens', async () => {
        await type(await openMode('advanced-syntax'), FOREGROUND_AFTER('"semanticTokenColors"', '#123456'));
        await closeAll();
        let actions = [];
        const pick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => { actions = (await items).map(i => i.action); return undefined; };
        try {
            await vscode.commands.executeCommand('arn.manageSkin');
        } finally {
            vscode.window.showQuickPick = pick;
        }
        assert.ok(actions.includes('reset'));
    });

    it('resets in one go even when saving the buffer edits it', async () => {
        // Antigravity rewrites a buffer as it saves it; trimming trailing
        // whitespace on save does the same in VS Code. The reset saves the open
        // buffer before deleting its file, and that edit must not re-apply.
        const files = vscode.workspace.getConfiguration('files');
        await files.update('trimTrailingWhitespace', true, G);
        try {
            await type(await openMode('quick'), (text) => text.replace(/(--Opt-Cursor-Line-Glow:\s*)\w+;/, '$1YES;   '));
            assert.ok(colorsOf()[GLOW], 'precondition: the glow is on');

            const pick = vscode.window.showQuickPick;
            const warn = vscode.window.showWarningMessage;
            const info = vscode.window.showInformationMessage;
            vscode.window.showQuickPick = async (items) => (await items).find(i => i.action === 'reset');
            vscode.window.showWarningMessage = async (msg, opts, ...buttons) => (opts && opts.modal ? buttons[0] : undefined);
            vscode.window.showInformationMessage = async () => undefined;
            try {
                await vscode.commands.executeCommand('arn.manageSkin');
            } finally {
                vscode.window.showQuickPick = pick;
                vscode.window.showWarningMessage = warn;
                vscode.window.showInformationMessage = info;
            }
            await settle();
        } finally {
            await files.update('trimTrailingWhitespace', undefined, G);
        }

        assert.deepEqual(colorsOf(), {});
        assert.equal(__testing.readStoredState(MARS), null);
    });

    it('resets for good when the Quick file is open in two groups', async () => {
        // Each group closes its tab on its own, and the second close is the
        // reset's too: it must not restore the state from before the edit.
        const editor = await openMode('quick');
        await type(editor, GLOW_ON);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.splitEditor');
        await settle();
        const split = vscode.window.activeTextEditor;
        await type(split, ACCENT('#123456'));
        await vscode.commands.executeCommand('undo');
        await settle();
        assert.equal(split.document.isDirty, false, 'precondition: back to the saved text, snapshot kept');
        assert.ok(colorsOf()[GLOW], 'precondition: the saved glow is on');

        const pick = vscode.window.showQuickPick;
        const warn = vscode.window.showWarningMessage;
        const info = vscode.window.showInformationMessage;
        vscode.window.showQuickPick = async (items) => (await items).find(i => i.action === 'reset');
        vscode.window.showWarningMessage = async (msg, opts, ...buttons) => (opts && opts.modal ? buttons[0] : undefined);
        vscode.window.showInformationMessage = async () => undefined;
        try {
            await vscode.commands.executeCommand('arn.manageSkin');
        } finally {
            vscode.window.showQuickPick = pick;
            vscode.window.showWarningMessage = warn;
            vscode.window.showInformationMessage = info;
        }
        await settle();

        assert.deepEqual(colorsOf(), {});
        assert.equal(__testing.readStoredState(MARS), null);
    });

    it('rebuilds the layers from earlier versions without changing a colour on screen', async () => {
        const defaultView = (await openMode('quick')).document.getText();
        await closeAll();
        // Outside the extension storage: rewriting a file there reloads the
        // buffer VS Code still holds, and that apply would create the state first.
        const legacyDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'arn-legacy-'));
        fs.writeFileSync(path.join(legacyDir, 'quick-arn-mars-amber-storm.css'),
            defaultView.replace(/(--Opt-Cursor-Line-Glow:\s*)\w+/, '$1YES'));
        const legacyColors = { ...themeJson.colors, 'minimap.background': '#FF00FF' };
        await wb().update('colorCustomizations', { [`[${MARS}]`]: legacyColors }, G);
        await vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', {
            [`[${MARS}]`]: {
                semanticTokenColors: { variable: { foreground: '#123456' } },
                // The full doubled array is covered in the unit tests; writing 1782
                // rules to settings.json takes most of a minute.
                textMateRules: [...themeJson.tokenColors.slice(0, 50), ...themeJson.tokenColors.slice(0, 50)],
            },
        }, G);

        const ctx = { extensionUri: vscode.Uri.file(REPO_ROOT), globalStorageUri: vscode.Uri.file(legacyDir) };
        const state = await __testing.loadThemeState(ctx, MARS, themeJson);
        fs.rmSync(legacyDir, { recursive: true, force: true });

        assert.equal(state.quick['ui.cursorLineGlow'], 'yes', 'the toggle comes back from the Quick file');
        const colors = colorsOf();
        for (const [key, value] of Object.entries(legacyColors)) {
            const effective = colors[key] ?? themeJson.colors[key];
            assert.ok(__testing.sameColor(effective, value), `${key}: ${effective} on screen, ${value} before`);
        }
        assert.ok(Object.keys(colors).length < 20, 'the stored theme copy collapses to the actual differences');
        assert.equal(entryOf('editor', 'tokenColorCustomizations'), undefined, 'duplicated theme rules are dropped');
        assert.deepEqual(entryOf('editor', 'semanticTokenColorCustomizations').rules, { variable: { foreground: '#123456' } },
            'the semantic edit moves to where VS Code reads it');
    });
});
