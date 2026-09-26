// The user settings the extension writes. Suites snapshot them before running
// and clear them between tests, so one test's customisation never leaks into
// the next.

const vscode = require('vscode');

const SETTINGS = [
    ['workbench', 'colorCustomizations'],
    ['editor', 'tokenColorCustomizations'],
    ['editor', 'semanticTokenColorCustomizations'],
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

module.exports = { snapshotCustomizations, restoreCustomizations, clearCustomizations };
