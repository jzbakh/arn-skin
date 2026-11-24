// The support prompt: when it asks again, and which pages its buttons open.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { __testing } = require('../../extension');
const { SUPPORT_PROMPT, minorVersion, shouldPromptSupport, supportLinks, parseJsonc } = __testing;

const stateWith = (entries) => ({ get: (key) => entries[key] });
const targetsOf = (links) => links.map(({ label, url }) => [label, new URL(url).host]);

describe('minorVersion', () => {
    it('keeps major and minor only', () => {
        assert.equal(minorVersion('1.1.0'), '1.1');
        assert.equal(minorVersion('2.10.7'), '2.10');
    });
});

describe('shouldPromptSupport', () => {
    it('prompts when nothing is stored yet', () => {
        assert.equal(shouldPromptSupport(stateWith({}), '1.1.0'), true);
    });

    it('skips patch releases of an already prompted minor version', () => {
        assert.equal(shouldPromptSupport(stateWith({ [SUPPORT_PROMPT.STATE_KEY]: '1.1' }), '1.1.2'), false);
    });

    it('prompts again on the next minor version', () => {
        assert.equal(shouldPromptSupport(stateWith({ [SUPPORT_PROMPT.STATE_KEY]: '1.1' }), '1.2.0'), true);
    });

    it('stays silent on a minor version older than the stored one', () => {
        assert.equal(shouldPromptSupport(stateWith({ [SUPPORT_PROMPT.STATE_KEY]: '1.2' }), '1.1.4'), false);
    });

    it('compares minor versions as numbers', () => {
        assert.equal(shouldPromptSupport(stateWith({ [SUPPORT_PROMPT.STATE_KEY]: '1.9' }), '1.10.0'), true);
        assert.equal(shouldPromptSupport(stateWith({ [SUPPORT_PROMPT.STATE_KEY]: '1.10' }), '1.9.0'), false);
    });
});

describe('supportLinks', () => {
    it('offers a GitHub star and a Marketplace review in VS Code', () => {
        for (const appName of ['Visual Studio Code', 'Visual Studio Code - Insiders']) {
            assert.deepEqual(targetsOf(supportLinks(appName)), [
                ['⭐ Drop GitHub Star', 'github.com'],
                ['🚀 Rate on Marketplace', 'marketplace.visualstudio.com'],
            ], appName);
        }
    });

    it('offers an Open VSX review in other editors', () => {
        for (const appName of ['Antigravity', 'VSCodium']) {
            assert.deepEqual(targetsOf(supportLinks(appName)), [
                ['⭐ Drop GitHub Star', 'github.com'],
                ['🚀 Rate on Open VSX', 'open-vsx.org'],
            ], appName);
        }
    });

    it('names this extension and opens its own pages', () => {
        const pkg = parseJsonc(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
        const { MARKETPLACE, OPEN_VSX } = SUPPORT_PROMPT.REVIEWS;
        assert.ok(SUPPORT_PROMPT.MESSAGE.startsWith(`Enjoying ${pkg.displayName}?`), SUPPORT_PROMPT.MESSAGE);
        assert.equal(new URL(SUPPORT_PROMPT.STAR.url).pathname, '/jzbakh/arn-skin');
        assert.equal(new URL(MARKETPLACE.url).searchParams.get('itemName'), `${pkg.publisher}.${pkg.name}`);
        assert.equal(new URL(OPEN_VSX.url).pathname, `/extension/${pkg.publisher}/${pkg.name}/reviews`);
    });
});
