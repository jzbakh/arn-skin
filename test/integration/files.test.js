const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vscode = require('vscode');
const { __testing } = require('../../extension');
const { snapshotCustomizations, restoreCustomizations, clearCustomizations } = require('./customizations');

const {
    ensureQuickFile,
    ensureAdvancedUIFile,
    ensureAdvancedSyntaxFile,
    parseJsonc,
} = __testing;

const REPO_ROOT = path.join(__dirname, '..', '..');
const MARS_LABEL = 'Arn · Mars — Amber Storm';
const SANITIZED  = 'arn-mars-amber-storm';

describe('File creation in globalStorageUri', () => {
    let tmpDir;
    let themeJson;
    let fakeCtx;
    let savedCustomizations;

    before(() => {
        themeJson = parseJsonc(
            fs.readFileSync(path.join(REPO_ROOT, 'themes', 'arn-mars.json'), 'utf8')
        );
        savedCustomizations = snapshotCustomizations();
    });

    after(async () => {
        await restoreCustomizations(savedCustomizations);
    });

    beforeEach(async () => {
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arn-test-'));
        fakeCtx = { globalStorageUri: vscode.Uri.file(tmpDir) };
        await clearCustomizations();
    });

    afterEach(async () => {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });

    it('ensureQuickFile creates quick-<label>.css with expected basename', async () => {
        const uri = await ensureQuickFile(fakeCtx, MARS_LABEL, themeJson);
        assert.equal(path.basename(uri.fsPath), `quick-${SANITIZED}.css`);
        assert.ok(fs.existsSync(uri.fsPath), 'file must exist on disk');
    });

    it('quick CSS file has the expected header and the 12 base + 5 toggle variables', async () => {
        const uri = await ensureQuickFile(fakeCtx, MARS_LABEL, themeJson);
        const content = fs.readFileSync(uri.fsPath, 'utf8');

        // Header
        assert.ok(content.startsWith('/*'), 'must start with comment header');

        // 12 base + status variables
        assert.ok(content.includes('--Global-Background:'));
        assert.ok(content.includes('--Main-Text:'));
        assert.ok(content.includes('--Accentuation:'));
        assert.ok(content.includes('--Secondary-Background:'));
        assert.ok(content.includes('--Surface-Elevated:'));
        assert.ok(content.includes('--Borders:'));
        assert.ok(content.includes('--Active-Border:'));
        assert.ok(content.includes('--Selection:'));
        assert.ok(content.includes('--Status-Warning:'));
        assert.ok(content.includes('--Status-Error:'));
        assert.ok(content.includes('--Status-Success:'));
        assert.ok(content.includes('--Status-Info:'));

        // 5 toggles
        assert.ok(content.includes('--Opt-Borderless-Mode:'));
        assert.ok(content.includes('--Opt-Pure-Black-Mode:'));
        assert.ok(content.includes('--Opt-Active-Tab-Highlight:'));
        assert.ok(content.includes('--Opt-Vivid-Selection:'));
        assert.ok(content.includes('--Opt-Cursor-Line-Glow:'));

        // Out-of-scope toggle variables must NOT appear in the file.
        assert.equal(content.includes('--Opt-Deep-Shadows:'), false);
        assert.equal(content.includes('--Opt-Semantic-Italics:'), false);
        assert.equal(content.includes('--Opt-High-Contrast:'), false);
        assert.equal(content.includes('--Opt-Dimmed-Inactive:'), false);
        assert.equal(content.includes('--Opt-Vivid-Status-Bar:'), false);
    });

    it('quick CSS file does NOT include any --Syntax-* variables', async () => {
        // Quick mode owns UI colours only — syntax customisation lives
        // exclusively in Advanced Syntax, where per-language scopes can
        // be expressed reliably.
        const uri = await ensureQuickFile(fakeCtx, MARS_LABEL, themeJson);
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        assert.equal(content.includes('--Syntax-Keywords:'),  false);
        assert.equal(content.includes('--Syntax-Functions:'), false);
        assert.equal(content.includes('--Syntax-Strings:'),   false);
        assert.equal(content.includes('--Syntax-Variables:'), false);
        assert.equal(content.includes('--Syntax-Numbers:'),   false);
    });

    it('ensureQuickFile rebuilds a stale file from the stored layers', async () => {
        const uri1 = await ensureQuickFile(fakeCtx, MARS_LABEL, themeJson);
        const fresh = fs.readFileSync(uri1.fsPath, 'utf8');
        fs.writeFileSync(uri1.fsPath, '/* stale copy from another machine */');

        const uri2 = await ensureQuickFile(fakeCtx, MARS_LABEL, themeJson);

        assert.equal(uri1.fsPath, uri2.fsPath);
        assert.equal(fs.readFileSync(uri2.fsPath, 'utf8'), fresh);
    });

    it('ensureQuickFile never writes under a buffer with unsaved edits', async () => {
        // Its own folder: on Windows the open buffer locks it until VS Code
        // drops the document, which the shared afterEach cannot wait for.
        const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arn-dirty-'));
        const ctx = { globalStorageUri: vscode.Uri.file(dir) };
        const uri = await ensureQuickFile(ctx, MARS_LABEL, themeJson);
        const onDisk = fs.readFileSync(uri.fsPath, 'utf8');
        const doc = await vscode.workspace.openTextDocument(uri);
        const pending = new vscode.WorkspaceEdit();
        pending.insert(uri, new vscode.Position(0, 0), '/* pending */\n');
        await vscode.workspace.applyEdit(pending);
        assert.ok(doc.isDirty, 'precondition: the buffer carries unsaved edits');

        try {
            await __testing.saveThemeState(MARS_LABEL, themeJson, { quick: { 'ui.cursorLineGlow': 'yes' } });
            await ensureQuickFile(ctx, MARS_LABEL, themeJson);
            assert.equal(fs.readFileSync(uri.fsPath, 'utf8'), onDisk, 'the file under the dirty buffer stays as it was');
        } finally {
            await vscode.window.showTextDocument(doc);
            await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
            await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => { /* left to the OS temp cleanup */ });
        }
    });

    it('ensureAdvancedUIFile creates advanced-ui-<label>.jsonc', async () => {
        const uri = await ensureAdvancedUIFile(fakeCtx, MARS_LABEL, themeJson);
        assert.equal(path.basename(uri.fsPath), `advanced-ui-${SANITIZED}.jsonc`);
        assert.ok(fs.existsSync(uri.fsPath));
    });

    it('advanced-ui file has schema + colors payload covering chat.* keys', async () => {
        const uri = await ensureAdvancedUIFile(fakeCtx, MARS_LABEL, themeJson);
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        assert.ok(content.startsWith('/*'));
        const payload = parseJsonc(content);
        assert.equal(payload.$schema, 'vscode://schemas/color-theme');
        assert.ok(payload.colors && typeof payload.colors === 'object');
        assert.ok(Object.keys(payload.colors).length > 0);
        // chat.* surface keys must be present.
        assert.ok('chat.linesAddedForeground' in payload.colors);
        assert.ok('chat.linesRemovedForeground' in payload.colors);
        assert.ok('chat.editedFileForeground' in payload.colors);
    });

    it('advanced-ui file uses one line ending throughout', async () => {
        const ctx = { ...fakeCtx, extensionUri: vscode.Uri.file(REPO_ROOT) };
        const uri = await ensureAdvancedUIFile(ctx, MARS_LABEL, themeJson);
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        assert.ok(content.includes('"editor.background"'), 'precondition: the theme block was spliced in');
        assert.equal(content.includes('\r'), false);
    });

    it('ensureAdvancedSyntaxFile creates advanced-syntax-<label>.jsonc', async () => {
        const uri = await ensureAdvancedSyntaxFile(fakeCtx, MARS_LABEL, themeJson);
        assert.equal(path.basename(uri.fsPath), `advanced-syntax-${SANITIZED}.jsonc`);
        assert.ok(fs.existsSync(uri.fsPath));
    });

    it('advanced-syntax file normalises every semantic token to object form', async () => {
        // Object form is REQUIRED for the gutter color picker to fire:
        // the schema's per-token entry declares `format: "color-hex"`
        // on `foreground`, which the picker resolver traverses directly
        // — string shorthand under our (or any) `anyOf` wrapping
        // silently disables the picker.
        const uri = await ensureAdvancedSyntaxFile(fakeCtx, MARS_LABEL, themeJson);
        const payload = parseJsonc(fs.readFileSync(uri.fsPath, 'utf8'));
        assert.ok(payload.semanticTokenColors && typeof payload.semanticTokenColors === 'object');
        assert.ok(Array.isArray(payload.tokenColors));

        for (const [k, v] of Object.entries(payload.semanticTokenColors)) {
            assert.equal(typeof v, 'object',
                `semanticTokenColors.${k} must be object form (got ${typeof v}) — string shorthand disables the picker`);
            assert.ok(v && typeof v.foreground === 'string',
                `semanticTokenColors.${k} must carry a string foreground for the picker to fire`);
        }
    });

    // ensureAdvancedSyntaxFile must merge — never replace — the theme's
    // tokenColors with any user-side textMateRules already present in the
    // configuration. Replacing would silently drop the per-language rules
    // shipped by the theme as soon as the user adds a single rule of their
    // own (a TextMate italic-comment rule, for instance).
    it('advanced-syntax shows the theme rules with the user rule in place, never twice', async () => {
        // Plant a representative user customisation: a single comment rule.
        const ed = vscode.workspace.getConfiguration('editor');
        const previous = ed.get('tokenColorCustomizations');
        try {
            const userOverride = { ...(previous || {}) };
            userOverride[`[${MARS_LABEL}]`] = {
                semanticTokenColors: {},
                textMateRules: [
                    { scope: ['comment', 'punctuation.definition.comment'],
                      settings: { fontStyle: 'italic' } }
                ],
            };
            await ed.update('tokenColorCustomizations', userOverride, 1 /* Global */);

            const uri = await ensureAdvancedSyntaxFile(fakeCtx, MARS_LABEL, themeJson);
            const payload = parseJsonc(fs.readFileSync(uri.fsPath, 'utf8'));

            const themeRuleCount = themeJson.tokenColors.length;
            assert.ok(payload.tokenColors.length >= themeRuleCount && payload.tokenColors.length <= themeRuleCount + 1,
                `expected the ${themeRuleCount} theme rules plus at most the user one, got ${payload.tokenColors.length}`);

            const ours = payload.tokenColors.filter(r => Array.isArray(r.scope)
                && r.scope.includes('comment')
                && r.settings && r.settings.fontStyle === 'italic');
            assert.equal(ours.length, 1, 'the user italic rule appears exactly once');

            // Re-rendering must not grow the file: the old code appended the
            // stored rules to the theme's on every regeneration.
            fs.rmSync(uri.fsPath);
            const again = parseJsonc(fs.readFileSync((await ensureAdvancedSyntaxFile(fakeCtx, MARS_LABEL, themeJson)).fsPath, 'utf8'));
            assert.equal(again.tokenColors.length, payload.tokenColors.length);
        } finally {
            await ed.update('tokenColorCustomizations', previous, 1);
        }
    });

    it('creates globalStorageUri directory if it does not exist yet', async () => {
        // Remove the temp dir so ensureQuickFile has to create it
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
        assert.ok(!fs.existsSync(tmpDir), 'precondition: dir must not exist');

        const uri = await ensureQuickFile(fakeCtx, MARS_LABEL, themeJson);
        assert.ok(fs.existsSync(uri.fsPath), 'file must be created');
        assert.ok(fs.existsSync(tmpDir), 'parent dir must be created');
    });
});
