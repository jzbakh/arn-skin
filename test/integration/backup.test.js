// Export and import against real settings. A backup holds each theme's state;
// importing it must give back the same state and the same three outputs, and
// nothing typed before the import may come back after it.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vscode = require('vscode');
const { __testing } = require('../../extension');
const { snapshotCustomizations, restoreCustomizations, clearCustomizations, settle } = require('./customizations');

const {
    collectExportState,
    exportCustomizationsToUri,
    readBackupFromUri,
    validateImportBundle,
    saveThemeState,
    readStoredState,
    ensureQuickFile,
    expandQuick,
    deriveQuickColors,
    parseJsonc,
} = __testing;

const REPO_ROOT = path.join(__dirname, '..', '..');
const MARS = 'Arn · Mars — Amber Storm';
const NEBULA = 'Arn · Nebula — Amethyst Void';
// An ARN label this version does not ship.
const PLUTO = 'Arn · Pluto — Frozen Rim';
const SANITIZED = 'arn-mars-amber-storm';
const VERSION = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).version;
const G = vscode.ConfigurationTarget.Global;

const readTheme = (file) => parseJsonc(fs.readFileSync(path.join(REPO_ROOT, 'themes', file), 'utf8'));
const wb = () => vscode.workspace.getConfiguration('workbench');
const entryOf = (section, key, label = MARS) =>
    (vscode.workspace.getConfiguration(section).get(key) || {})[`[${label}]`];
const colorsOf = (label = MARS) => entryOf('workbench', 'colorCustomizations', label) || {};
// Everything settings hold for a theme: its state and the outputs composed from it.
const recordOf = (label = MARS) => ({
    state: entryOf('arnSkin', 'customizations', label),
    colors: entryOf('workbench', 'colorCustomizations', label),
    tokens: entryOf('editor', 'tokenColorCustomizations', label),
    semantic: entryOf('editor', 'semanticTokenColorCustomizations', label),
});
const NOTHING = { state: undefined, colors: undefined, tokens: undefined, semantic: undefined };

const backupOf = (themes) => ({ format: 'arn-skin-backup', schemaVersion: 1, themes });

function writeBackup(dir, name, content) {
    const file = path.join(dir, name);
    fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
    return vscode.Uri.file(file);
}

// Swaps vscode.window functions for the time of `run`.
async function withWindow(stubs, run) {
    const saved = Object.fromEntries(Object.keys(stubs).map(k => [k, vscode.window[k]]));
    Object.assign(vscode.window, stubs);
    try {
        return await run();
    } finally {
        Object.assign(vscode.window, saved);
    }
}

// A message stub that records what it was shown. The modal confirmation gets
// `answer`, every other message is dismissed.
function messages(answer) {
    const calls = [];
    const stub = async (msg, opts) => {
        calls.push({ msg, opts });
        return opts && opts.modal ? answer : undefined;
    };
    return { calls, stub };
}

const runImport = () => vscode.commands.executeCommand('arn.importCustomizations');
const runExport = () => vscode.commands.executeCommand('arn.exportCustomizations');

describe('Export / Import — command registration', () => {
    it('registers arn.exportCustomizations and arn.importCustomizations after activation', async () => {
        const ext = vscode.extensions.getExtension('jzbakh.antigravity-arn-skin');
        assert.ok(ext, 'extension must be discoverable');
        await ext.activate();
        const cmds = await vscode.commands.getCommands(true);
        assert.ok(cmds.includes('arn.exportCustomizations'), 'arn.exportCustomizations must be registered');
        assert.ok(cmds.includes('arn.importCustomizations'), 'arn.importCustomizations must be registered');
    });
});

describe('Export / Import — helpers', function () {
    // The 1.0.5 case writes a theme's worth of colours to settings.
    this.timeout(60000);

    let tmpDir;
    let fakeCtx;
    let themeJson;
    let originalTheme;
    let savedCustomizations;

    before(async () => {
        themeJson = readTheme('arn-mars.json');
        savedCustomizations = snapshotCustomizations();
        originalTheme = wb().get('colorTheme');
        await wb().update('colorTheme', MARS, G);
    });

    after(async () => {
        await wb().update('colorTheme', originalTheme, G);
        await restoreCustomizations(savedCustomizations);
    });

    beforeEach(async () => {
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arn-backup-'));
        fakeCtx = { extensionUri: vscode.Uri.file(REPO_ROOT), globalStorageUri: vscode.Uri.file(tmpDir) };
        await clearCustomizations();
    });

    afterEach(async () => {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });

    it('collectExportState reports nothing without customisations', async () => {
        const { themes } = await collectExportState(fakeCtx);
        assert.deepEqual(themes, []);
    });

    it('collectExportState captures a theme\'s stored state', async () => {
        const state = { quick: { 'ui.cursorLineGlow': 'yes' }, ui: { 'minimap.background': '#FF00FF' } };
        await saveThemeState(MARS, themeJson, state);

        const { themes } = await collectExportState(fakeCtx);

        assert.deepEqual(themes, [{ label: MARS, state }]);
    });

    it('collectExportState captures a theme upgraded from 1.0.5 without migrating it', async () => {
        // 1.0.5 kept no state: its outputs and the Quick file were the only record.
        // Rendered before the outputs exist, so the view is the theme's own.
        const view = fs.readFileSync((await ensureQuickFile(fakeCtx, MARS, themeJson)).fsPath, 'utf8');
        fs.writeFileSync(path.join(tmpDir, `quick-${SANITIZED}.css`),
            view.replace(/(--Opt-Cursor-Line-Glow:\s*)\w+/, '$1YES'));
        const quick = { 'ui.cursorLineGlow': 'yes' };
        await wb().update('colorCustomizations', {
            [`[${MARS}]`]: { ...deriveQuickColors(expandQuick(quick, themeJson), themeJson), 'minimap.background': '#FF00FF' },
        }, G);
        await vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', {
            [`[${MARS}]`]: { semanticTokenColors: { variable: { foreground: '#123456' } } },
        }, G);
        const before = snapshotCustomizations();

        const { themes } = await collectExportState(fakeCtx);

        assert.deepEqual(themes, [{
            label: MARS,
            state: { quick, ui: { 'minimap.background': '#FF00FF' }, semantic: { variable: { foreground: '#123456' } } },
        }]);
        assert.deepEqual(snapshotCustomizations(), before, 'exporting writes nothing to settings');
    });

    it('exportCustomizationsToUri writes nothing without state', async () => {
        const target = vscode.Uri.file(path.join(tmpDir, 'empty.json'));
        const res = await exportCustomizationsToUri(fakeCtx, target, 'T');
        assert.deepEqual(res, { written: false, count: 0, leftOut: [] });
        assert.equal(fs.existsSync(target.fsPath), false, 'no file should be created');
    });

    it('exportCustomizationsToUri writes a bundle that re-validates', async () => {
        const state = { quick: { 'ui.cursorLineGlow': 'yes' }, ui: { 'minimap.background': '#FF00FF' } };
        await saveThemeState(MARS, themeJson, state);
        const target = vscode.Uri.file(path.join(tmpDir, 'backup.json'));

        const res = await exportCustomizationsToUri(fakeCtx, target, '2026-10-04T00:00:00.000Z');

        assert.deepEqual(res, { written: true, count: 1, leftOut: [] });
        const written = JSON.parse(fs.readFileSync(target.fsPath, 'utf8'));
        assert.deepEqual(written, {
            format: 'arn-skin-backup',
            schemaVersion: 1,
            extensionVersion: VERSION,
            exportedAt: '2026-10-04T00:00:00.000Z',
            activeTheme: MARS,
            themes: [{ label: MARS, ...state }],
        });
        const parsed = validateImportBundle(written);
        assert.equal(parsed.ok, true, parsed.error);
        assert.deepEqual(parsed.bundle, { activeTheme: MARS, themes: [{ label: MARS, state }] });
    });

    it('exportCustomizationsToUri leaves out what import would reject and writes the rest', async () => {
        // Reading the state keeps any string as a UI colour; import takes only hex.
        await vscode.workspace.getConfiguration('arnSkin').update('customizations', {
            [`[${MARS}]`]: { ui: { 'editor.background': 'red', 'minimap.background': '#FF00FF' } },
            [`[${NEBULA}]`]: { ui: { 'terminal.border': 'nope' } },
        }, G);
        const target = vscode.Uri.file(path.join(tmpDir, 'pruned.json'));

        const result = await exportCustomizationsToUri(fakeCtx, target, 'T');
        assert.equal(result.count, 1, 'nothing is left of Nebula');
        assert.deepEqual(result.leftOut.map(l => l.label).sort(), [MARS, NEBULA].sort());
        const parsed = validateImportBundle(JSON.parse(fs.readFileSync(target.fsPath, 'utf8')));
        assert.deepEqual(parsed.bundle.themes, [{ label: MARS, state: { ui: { 'minimap.background': '#FF00FF' } } }]);
    });

    it('readBackupFromUri rejects non-JSON and unmarked files', async () => {
        const r1 = await readBackupFromUri(writeBackup(tmpDir, 'x.json', 'not json at all {'));
        assert.equal(r1.ok, false);
        assert.match(r1.error, /valid JSON/);

        const r2 = await readBackupFromUri(writeBackup(tmpDir, 'y.json', { hello: 1 }));
        assert.equal(r2.ok, false);
        assert.match(r2.error, /marker/);
    });

    it('readBackupFromUri rejects unreadable and oversized files', async () => {
        const missing = await readBackupFromUri(vscode.Uri.file(path.join(tmpDir, 'missing.json')));
        assert.equal(missing.ok, false);
        assert.match(missing.error, /cannot read/);

        const huge = vscode.Uri.file(path.join(tmpDir, 'huge.json'));
        await vscode.workspace.fs.writeFile(huge, new Uint8Array(__testing.BACKUP_LIMITS.maxRawBytes + 1));
        const tooBig = await readBackupFromUri(huge);
        assert.equal(tooBig.ok, false);
        assert.match(tooBig.error, /too large/);
    });
});

// The editing files, the Skin menu and the commands of the running extension:
// an import has to win over whatever those files and their tabs still hold.
describe('Export / Import — through the extension', function () {
    this.timeout(120000);

    let storageDir;
    let tmpDir;
    let themeJson;
    let savedCustomizations;
    let originalTheme;

    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const GLOW_ON = (text) => text.replace(/(--Opt-Cursor-Line-Glow:\s*)\w+/, '$1YES');
    const MINIMAP = (text) => text.replace(/("minimap\.background"\s*:\s*)"[^"]*"/, '$1"#FF00FF"');
    // First foreground after `anchor`: a semantic token before "tokenColors", a TextMate rule after it.
    const FOREGROUND_AFTER = (anchor, hex) => (text) => {
        const at = text.indexOf(anchor);
        return text.slice(0, at) + text.slice(at).replace(/("foreground":\s*)"#[0-9A-Fa-f]+"/, `$1"${hex}"`);
    };

    async function openMode(action) {
        await withWindow({ showQuickPick: async (items) => (await items).find(i => i.action === action) },
            () => vscode.commands.executeCommand('arn.manageSkin'));
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

    async function edit(editor, transform) {
        const doc = editor.document;
        const text = doc.getText();
        const next = transform(text);
        assert.notEqual(next, text, 'the edit must change the buffer');
        await editor.edit(b => b.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(text.length)), next));
    }

    async function type(editor, transform) {
        await edit(editor, transform);
        await settle();
    }

    async function closeAll() {
        await vscode.commands.executeCommand('workbench.action.files.saveAll');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await settle();
    }

    // Runs the import command on `uri` and confirms the overwrite.
    async function importBackup(uri) {
        const info = messages();
        await withWindow({
            showOpenDialog: async () => [uri],
            showWarningMessage: messages('Import').stub,
            showInformationMessage: info.stub,
        }, runImport);
        await settle();
        assert.match(info.calls[0].msg, /imported 1 theme\./);
    }

    before(async () => {
        await vscode.extensions.getExtension('jzbakh.antigravity-arn-skin').activate();
        themeJson = readTheme('arn-mars.json');
        savedCustomizations = snapshotCustomizations();
        originalTheme = wb().get('colorTheme');
        await clearCustomizations();
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
        await clearCustomizations();
        await settle();
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arn-import-'));
    });

    afterEach(async () => {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });

    it('gives back the same state and outputs after export, reset and import', async () => {
        await type(await openMode('quick'), GLOW_ON);
        await type(await openMode('advanced-ui'), MINIMAP);
        const syntax = await openMode('advanced-syntax');
        await type(syntax, FOREGROUND_AFTER('"semanticTokenColors"', '#123456'));
        await type(syntax, FOREGROUND_AFTER('"scope"', '#654321'));
        await closeAll();
        const before = recordOf();
        assert.deepEqual(Object.keys(before.state).sort(), ['quick', 'semantic', 'textMate', 'ui'],
            'precondition: every layer is customised');

        const backup = vscode.Uri.file(path.join(tmpDir, 'round-trip.json'));
        await withWindow({ showSaveDialog: async () => backup, showInformationMessage: messages().stub }, runExport);
        assert.ok(fs.existsSync(backup.fsPath), 'precondition: the backup is written');

        await withWindow({
            showQuickPick: async (items) => (await items).find(i => i.action === 'reset'),
            showWarningMessage: async (msg, opts, ...buttons) => (opts && opts.modal ? buttons[0] : undefined),
            showInformationMessage: messages().stub,
        }, () => vscode.commands.executeCommand('arn.manageSkin'));
        await settle();
        assert.deepEqual(recordOf(), NOTHING, 'precondition: the reset cleared the theme');

        await importBackup(backup);

        assert.deepEqual(recordOf(), before);
    });

    it('replaces the theme as a whole, leaves the others alone and drops its editing files', async () => {
        await saveThemeState(MARS, themeJson, { quick: { 'ui.cursorLineGlow': 'yes' }, ui: { 'minimap.background': '#FF00FF' } });
        await saveThemeState(NEBULA, readTheme('arn-nebula.json'), { ui: { 'terminal.border': '#00FF00' } });
        await openMode('quick');
        await openMode('advanced-ui');
        await closeAll();
        const views = [`quick-${SANITIZED}.css`, `advanced-ui-${SANITIZED}.jsonc`].map(name => path.join(storageDir, name));
        assert.ok(views.every(f => fs.existsSync(f)), 'precondition: the views are on disk');
        const nebula = recordOf(NEBULA);

        const semantic = { variable: { foreground: '#123456' } };
        await importBackup(writeBackup(tmpDir, 'in.json', backupOf([{ label: MARS, semantic }])));

        assert.deepEqual(readStoredState(MARS), { semantic });
        assert.deepEqual(colorsOf(), {}, 'the Quick toggle and the UI override left with their layers');
        assert.deepEqual(entryOf('editor', 'semanticTokenColorCustomizations').rules, semantic);
        assert.deepEqual(recordOf(NEBULA), nebula, 'a theme outside the backup is untouched');
        assert.deepEqual(views.filter(f => fs.existsSync(f)), [], 'the views of the replaced state are deleted');

        const quick = await openMode('quick');
        assert.match(quick.document.getText(), /--Opt-Cursor-Line-Glow:\s*INHERIT;/, 'the next open renders the imported state');
    });

    it('exports a Quick edit still waiting for its debounce', async () => {
        await edit(await openMode('quick'), GLOW_ON);
        const target = vscode.Uri.file(path.join(tmpDir, 'pending.json'));

        await withWindow({ showSaveDialog: async () => target, showInformationMessage: messages().stub }, runExport);

        const parsed = validateImportBundle(JSON.parse(fs.readFileSync(target.fsPath, 'utf8')));
        assert.equal(parsed.ok, true, parsed.error);
        assert.equal(parsed.bundle.themes.find(t => t.label === MARS).state.quick['ui.cursorLineGlow'], 'yes');
    });

    it('lets the imported state win over an unsaved Quick edit still waiting for its debounce', async () => {
        // Antigravity rewrites a buffer as it saves it; trimming trailing
        // whitespace on save does the same in VS Code. The import saves the
        // open buffer before deleting its file: neither the pending keystroke
        // nor the edit made by the save may re-apply the old buffer afterwards.
        const files = vscode.workspace.getConfiguration('files');
        const trim = files.inspect('trimTrailingWhitespace').globalValue;
        const ui = { 'minimap.background': '#00FF00' };
        const backup = writeBackup(tmpDir, 'in.json', backupOf([{ label: MARS, ui }]));
        await files.update('trimTrailingWhitespace', true, G);
        try {
            const quick = await openMode('quick');
            await edit(quick, (text) => text.replace(/(--Opt-Cursor-Line-Glow:\s*)\w+;/, '$1YES;   '));
            assert.ok(quick.document.isDirty, 'precondition: the edit is unsaved');

            await withWindow({
                showOpenDialog: async () => [backup],
                showWarningMessage: messages('Import').stub,
                showInformationMessage: messages().stub,
            }, runImport);
            await settle();
        } finally {
            await files.update('trimTrailingWhitespace', trim, G);
        }

        assert.deepEqual(readStoredState(MARS), { ui });
        assert.deepEqual(colorsOf(), ui, 'the glow typed before the import is gone');
        const reopened = await openMode('quick');
        assert.match(reopened.document.getText(), /--Opt-Cursor-Line-Glow:\s*INHERIT;/);
        assert.deepEqual(readStoredState(MARS), { ui }, 'reopening Quick brings nothing back');
    });
});

// Drives the real commands with the dialogs stubbed: the confirmation before an
// overwrite, and every early exit around it, live in the handlers.
describe('Export / Import — commands', function () {
    this.timeout(60000);

    let tmpDir;
    let themeJson;
    let originalTheme;
    let savedCustomizations;

    const STATE = { ui: { 'editor.background': '#123456' } };
    const MARS_BACKUP = backupOf([{ label: MARS, ui: { 'editor.background': '#654321' } }]);

    before(async () => {
        await vscode.extensions.getExtension('jzbakh.antigravity-arn-skin').activate();
        themeJson = readTheme('arn-mars.json');
        savedCustomizations = snapshotCustomizations();
        originalTheme = wb().get('colorTheme');
        await wb().update('colorTheme', MARS, G);
    });

    after(async () => {
        await wb().update('colorTheme', originalTheme, G);
        await restoreCustomizations(savedCustomizations);
    });

    beforeEach(async () => {
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arn-cmd-'));
        await clearCustomizations();
        await saveThemeState(MARS, themeJson, STATE);
    });

    afterEach(async () => {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });

    it('export writes a backup that re-validates', async () => {
        const target = vscode.Uri.file(path.join(tmpDir, 'arn-skin-backup.json'));
        const info = messages();

        await withWindow({ showSaveDialog: async () => target, showInformationMessage: info.stub }, runExport);

        const parsed = validateImportBundle(JSON.parse(fs.readFileSync(target.fsPath, 'utf8')));
        assert.equal(parsed.ok, true, parsed.error);
        assert.deepEqual(parsed.bundle.themes, [{ label: MARS, state: STATE }]);
        assert.match(info.calls[0].msg, /exported 1 theme to arn-skin-backup\.json\./);
    });

    it('export writes nothing when the save dialog is dismissed', async () => {
        let asked = false;
        const info = messages();

        await withWindow({
            showSaveDialog: async () => { asked = true; return undefined; },
            showInformationMessage: info.stub,
        }, runExport);

        assert.ok(asked);
        assert.deepEqual(info.calls, []);
    });

    it('export says so when there is nothing to export', async () => {
        await clearCustomizations();
        let asked = false;
        const info = messages();

        await withWindow({
            showSaveDialog: async () => { asked = true; return undefined; },
            showInformationMessage: info.stub,
        }, runExport);

        assert.equal(asked, false, 'no dialog for an empty export');
        assert.match(info.calls[0].msg, /no customizations to export/);
    });

    it('export says which themes lost invalid values', async () => {
        await saveThemeState(MARS, themeJson, { ui: { 'editor.background': '#123456', 'editor background': '#000000' } });
        const target = vscode.Uri.file(path.join(tmpDir, 'arn-skin-backup.json'));
        const warnings = messages();

        await withWindow({ showSaveDialog: async () => target, showWarningMessage: warnings.stub }, runExport);

        assert.match(warnings.calls[0].msg,
            /^ARN-Skin: exported 1 theme to arn-skin-backup\.json, without 1 invalid value in Arn · Mars — Amber Storm\.$/);
        const parsed = validateImportBundle(JSON.parse(fs.readFileSync(target.fsPath, 'utf8')));
        assert.deepEqual(parsed.bundle.themes, [{ label: MARS, state: STATE }]);
    });

    it('export says so, before any dialog, when everything left is invalid', async () => {
        await saveThemeState(MARS, themeJson, { ui: { 'editor background': '#000000' } });
        let asked = false;
        const warnings = messages();

        await withWindow({
            showSaveDialog: async () => { asked = true; return undefined; },
            showWarningMessage: warnings.stub,
        }, runExport);

        assert.equal(asked, false, 'no dialog for a backup that would be empty');
        assert.match(warnings.calls[0].msg,
            /^ARN-Skin: nothing to export\. The customizations of Arn · Mars — Amber Storm are all invalid values\.$/);
    });

    it('export surfaces an error instead of throwing', async () => {
        const errors = messages();

        await withWindow({
            showSaveDialog: async () => { throw new Error('boom'); },
            showErrorMessage: errors.stub,
        }, runExport);

        assert.match(errors.calls[0].msg, /export failed — boom/);
    });

    it('import overwrites the listed themes once confirmed', async () => {
        const backup = writeBackup(tmpDir, 'in.json', MARS_BACKUP);
        const warnings = messages('Import');
        const info = messages();

        await withWindow({
            showOpenDialog: async () => [backup],
            showWarningMessage: warnings.stub,
            showInformationMessage: info.stub,
        }, runImport);

        const [prompt] = warnings.calls;
        assert.equal(prompt.opts.modal, true, 'the overwrite must be confirmed in a modal');
        assert.ok(prompt.opts.detail.includes(MARS), 'the prompt must name the themes it overwrites');
        assert.deepEqual(readStoredState(MARS), { ui: { 'editor.background': '#654321' } });
        assert.deepEqual(colorsOf(), { 'editor.background': '#654321' });
        assert.match(info.calls[0].msg, /imported 1 theme\./);
    });

    it('import changes nothing when the confirmation is declined', async () => {
        const backup = writeBackup(tmpDir, 'in.json', MARS_BACKUP);
        const warnings = messages(undefined);
        const before = recordOf();

        await withWindow({
            showOpenDialog: async () => [backup],
            showWarningMessage: warnings.stub,
        }, runImport);

        assert.equal(warnings.calls.length, 1, 'precondition: the confirmation was asked');
        assert.deepEqual(recordOf(), before);
    });

    it('import rejects an invalid backup before asking anything', async () => {
        const backup = writeBackup(tmpDir, 'bad.json', 'not json {');
        const warnings = messages('Import');
        const errors = messages();

        await withWindow({
            showOpenDialog: async () => [backup],
            showWarningMessage: warnings.stub,
            showErrorMessage: errors.stub,
        }, runImport);

        assert.deepEqual(warnings.calls, []);
        assert.match(errors.calls[0].msg, /invalid backup — not valid JSON\./);
    });

    it('import does nothing when the open dialog is dismissed', async () => {
        const warnings = messages('Import');
        const before = recordOf();

        await withWindow({
            showOpenDialog: async () => undefined,
            showWarningMessage: warnings.stub,
        }, runImport);

        assert.deepEqual(warnings.calls, []);
        assert.deepEqual(recordOf(), before);
    });

    it('import skips a theme this version does not ship and lists it in the confirmation', async () => {
        const backup = writeBackup(tmpDir, 'in.json', backupOf([
            { label: MARS, ui: { 'editor.background': '#654321' } },
            { label: PLUTO, ui: { 'editor.background': '#ABCDEF' } },
        ]));
        const warnings = messages('Import');
        const info = messages();

        await withWindow({
            showOpenDialog: async () => [backup],
            showWarningMessage: warnings.stub,
            showInformationMessage: info.stub,
        }, runImport);

        const [overwritten, skipped] = warnings.calls[0].opts.detail.split('\n\n');
        assert.ok(overwritten.includes(MARS) && !overwritten.includes(PLUTO), 'only the shipped theme is overwritten');
        assert.equal(skipped, `Not in this version, skipped:\n${PLUTO}`);
        assert.deepEqual(colorsOf(), { 'editor.background': '#654321' });
        assert.equal(entryOf('arnSkin', 'customizations', PLUTO), undefined, 'nothing is stored for the skipped theme');
        assert.match(info.calls[0].msg, /imported 1 theme\./);
    });

    it('import with only unknown themes warns and changes nothing', async () => {
        const backup = writeBackup(tmpDir, 'in.json', backupOf([{ label: PLUTO, ui: { 'editor.background': '#ABCDEF' } }]));
        const warnings = messages('Import');
        const before = recordOf();

        await withWindow({
            showOpenDialog: async () => [backup],
            showWarningMessage: warnings.stub,
        }, runImport);

        assert.equal(warnings.calls.length, 1, 'a warning, and no confirmation');
        assert.equal(warnings.calls[0].opts, undefined);
        assert.match(warnings.calls[0].msg, /none of the themes in this backup is in this version/);
        assert.deepEqual(recordOf(), before);
        assert.equal(entryOf('arnSkin', 'customizations', PLUTO), undefined);
    });

    it('import surfaces an error instead of throwing', async () => {
        const errors = messages();

        await withWindow({
            showOpenDialog: async () => { throw new Error('boom'); },
            showErrorMessage: errors.stub,
        }, runImport);

        assert.match(errors.calls[0].msg, /import failed — boom/);
    });

    it('the Skin menu routes Export and Import to their commands', async () => {
        const asked = [];
        let action;

        await withWindow({
            showQuickPick: async (items) => (await items).find(i => i.action === action),
            showSaveDialog: async () => { asked.push('save'); return undefined; },
            showOpenDialog: async () => { asked.push('open'); return undefined; },
        }, async () => {
            for (const next of ['export', 'import']) {
                action = next;
                await vscode.commands.executeCommand('arn.manageSkin');
            }
        });

        assert.deepEqual(asked, ['save', 'open']);
    });
});
