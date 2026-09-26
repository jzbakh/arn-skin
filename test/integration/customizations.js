// The four user settings the extension writes. Suites snapshot them before
// running and clear them between tests: a record left in arnSkin.customizations
// would carry one test's layers into the next.

const vscode = require('vscode');

const SETTINGS = [
    ['workbench', 'colorCustomizations'],
    ['editor', 'tokenColorCustomizations'],
    ['editor', 'semanticTokenColorCustomizations'],
    ['arnSkin', 'customizations'],
];

function snapshotCustomizations() {
    return SETTINGS.map(([section, key]) => {
        const inspected = vscode.workspace.getConfiguration(section).inspect(key);
        return inspected && inspected.globalValue;
    });
}

async function restoreCustomizations(snapshot) {
    for (let i = 0; i < SETTINGS.length; i++) {
        const [section, key] = SETTINGS[i];
        await vscode.workspace.getConfiguration(section).update(key, snapshot[i], vscode.ConfigurationTarget.Global);
    }
}

async function clearCustomizations() {
    await restoreCustomizations(SETTINGS.map(() => undefined));
}

// Waits until the extension has handled every edit, save and tab close so far.
// The pause covers what VS Code delivers late (tab events, a buffer reloading
// after its file was rewritten); the extension then says when its queue is
// empty. A fixed sleep alone flakes on a slow runner.
async function settle() {
    await new Promise(r => setTimeout(r, 500));
    await vscode.extensions.getExtension('jzbakh.antigravity-arn-skin').exports.whenIdle();
}

module.exports = { snapshotCustomizations, restoreCustomizations, clearCustomizations, settle };
