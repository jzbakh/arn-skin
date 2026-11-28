<div align="center">

# ARN-Skin - Explore 7 space-themed skins + customization to enhance your IDE.

[![Version](https://img.shields.io/github/v/release/jzbakh/arn-skin?label=version&color=blue&sort=semver)](https://github.com/jzbakh/arn-skin/releases)
[![VS Marketplace Downloads](https://img.shields.io/endpoint?url=https://gitlab.com/arn_inside/arn-skin/-/raw/badges-gitlab/.gitlab/badges/marketplace-downloads.json)](https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin)
[![Open VSX Downloads](https://img.shields.io/endpoint?url=https://gitlab.com/arn_inside/arn-skin/-/raw/badges-gitlab/.gitlab/badges/openvsx-downloads.json)](https://open-vsx.org/extension/jzbakh/antigravity-arn-skin)

[![GitHub stars](https://img.shields.io/github/stars/jzbakh/arn-skin?style=flat&color=gold&logo=github)](https://github.com/jzbakh/arn-skin)
[![GitLab stars](https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=flat&color=gold&logo=gitlab)](https://gitlab.com/arn_inside/arn-skin)
[![GitHub issues](https://img.shields.io/github/issues/jzbakh/arn-skin)](https://github.com/jzbakh/arn-skin/issues)
[![License](https://img.shields.io/github/license/jzbakh/arn-skin?color=blue)](https://github.com/jzbakh/arn-skin)

[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://github.com/jzbakh/arn-skin/blob/main/package.json)
[![Telemetry](https://img.shields.io/badge/telemetry-none-success.svg)](https://github.com/jzbakh/arn-skin/blob/main/extension.js)
[![Spyware](https://img.shields.io/badge/spyware-0%25-success.svg)](https://github.com/jzbakh/arn-skin/blob/main/extension.js)

<p align="center">
  <video src="https://github.com/user-attachments/assets/11b1e624-03df-46ab-abf8-b4b3c32c18f6" controls width="100%"></video>
</p>

<br>

---

<div align="center">
  <h2>
    💬 <a href="#en">🇬🇧 English</a> | 
    <a href="#fr">🇫🇷 Français</a> | 
    <a href="#cn">🇨🇳 中文</a> | 
    <a href="#es">🇪🇸 Español</a> | 
    <a href="#ar">🇸🇦 العربية</a> | 
    <a href="#th">🇹🇭 ภาษาไทย</a>
  </h2>
</div>

---

<br>

<a id="en"></a>
## 🇬🇧 English

<br>

**7 premium space themes + customization** for Antigravity IDE, VS Code, Cursor, VSCodium, Windsurf...

📦 **Zero dependencies**: vanilla JavaScript with no build step, readable and auditable.

---

<div align="center">
  <h4> <a href="https://arn_inside.gitlab.io/arn-skin/"> Preview the syntax highlighting for Markdown, Python, TypeScript, Rust, CSS, HTML, JSON, Shell, and SQL </a></h4>
</div><br>

| Theme | Style | Description |
|:---|:---|:---|
| [<img src="./media/spaceport.png" width="64" alt="Spaceport"> **Spaceport**](https://arn_inside.gitlab.io/arn-skin/) | *Tungsten Grid* | Industrial charcoal gray with golden accents |
| [<img src="./media/nebula.png" width="64" alt="Nebula"> **Nebula**](https://arn_inside.gitlab.io/arn-skin/) | *Amethyst Void* | Violet, magenta, and cyan cosmos |
| [<img src="./media/neptune.png" width="64" alt="Neptune"> **Neptune**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Navy* | Teal ocean ice |
| [<img src="./media/uranus.png" width="64" alt="Uranus"> **Uranus**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Teal* | Teal and ultramarine blue variant |
| [<img src="./media/io.png" width="64" alt="Io"> **Io**](https://arn_inside.gitlab.io/arn-skin/) | *Acid Haze* | Neon lime green on deep black |
| [<img src="./media/jupiter.png" width="64" alt="Jupiter"> **Jupiter**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Light* | Light parchment (the only light theme) |
| [<img src="./media/mars.png" width="64" alt="Mars"> **Mars**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Storm* | Burnt orange on red earth |

</div><br>

---

### ✨ Features

🚀 **Change Theme:** Instantly switch between the 7 themes from the extension menu: click `Skin` in the status bar.

*Customize in real time (400 ms delay) with the IDE's native color picker:*

⚡ **Quick Customization:** Edit just **12 key colors and 5 smart toggles**, and the extension automatically generates the ~250 derived UI colors!

<div align="center">

Each toggle accepts `YES`, `NO`, or `INHERIT` *(keeps the theme's default behavior)*.

| Toggle | YES | NO |
| :--- | :--- | :--- |
| **Cursor Line Glow** | Highlights the current line and the cursor with an accent glow | Removes the line highlight entirely |
| **Pure Black Mode** | Makes every background near-black (near-white on the light theme) | Keeps the theme's background shades |
| **Vivid Selection** | Colors the selection and highlighted words with the accent color | Uses a soft neutral gray for the selection and highlighted words |
| **Borderless Mode** | Hides all UI borders | Shows every border, in the Borders color or a subtle tint of the text |
| **Active Tab Highlight** | Makes the active tab stand out: background, text, and top and bottom borders in the accent colors | Keeps the active tab plain, with no accent color or border |

</div>

💡 Easily undo a change: the light bulb restores the theme's value.

🌈 **Advanced: UI Colors:** Granular control over every visual element (tabs, sidebar, activity bar, terminal...). Quick and Advanced combine color by color: the most recent change wins.

⌨️ **Advanced: Syntax Colors:** Adjust the syntax highlighting of your code by directly editing semantic tokens and TextMate rules.

💾 **Export / Import:** Save all your ARN-Skin customizations to a portable file, then restore them on another machine or after a reinstall.

♻️ **Reset:** Revert all modifications to restore the original theme at any time.

---

## 🚀 Installation

<details>
<summary><b>🔌 From your editor (recommended)</b></summary>

<br>

Works in Antigravity IDE, VS Code, Cursor, Windsurf, VSCodium, and other VS Code forks that use the VS Marketplace or Open VSX.

1. Open the **Extensions** view (`Ctrl+Shift+X`).
2. Search for `ARN-Skin`.
> 💡 **Tip:** Sort the search results by **Name** (and NOT by popularity, relevance, or install count) to find the extension easily.
3. Click **Install** and enable the extension.

</details>

<details>
<summary><b>💻 Installation via VSIX</b></summary>

<br>

1. Download the [`arn-skin.vsix`](https://github.com/jzbakh/arn-skin/releases/latest/download/arn-skin.vsix) file.
2. In your editor, open the **Extensions** view (`Ctrl+Shift+X`).
3. Click the "..." menu (Views and More Actions) at the top of the sidebar.
4. Select **Install from VSIX...**
5. Choose the downloaded file and enable the extension.

</details>

<details>
<summary><b>🔧 Manual Installation</b></summary>

<br>

Vanilla JavaScript with no build step: the code is readable and auditable.

1. Create a folder named `arn-skin`, then download and place the `schemas`, `themes`, and `media` folders inside it, along with the `extension.js`, `package.json`, and `README.md` files.
2. Copy this folder into your editor's extensions folder:
   - **Antigravity IDE**: `%USERPROFILE%\.antigravity-ide\extensions\` (Windows) or `~/.antigravity-ide/extensions/` (macOS/Linux)
   - **VS Code**: `%USERPROFILE%\.vscode\extensions\` (Windows) or `~/.vscode/extensions/` (macOS/Linux)
3. Restart the editor and enable the extension.

</details>

---

## 🩵 Support the project

<br>

<div align="center">

<p align="center">
  <b>💫 Enjoying this project? Leave a ⭐ on GitHub or GitLab to support it!</b>
</p>
<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://img.shields.io/github/stars/jzbakh/arn-skin?style=social" alt="Star on GitHub">
  </a>
  <a href="https://gitlab.com/arn_inside/arn-skin">
    <img src="https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=social" alt="Star on GitLab">
  </a>
</p>
<p align="center">
  A review on <a href="https://open-vsx.org/extension/jzbakh/antigravity-arn-skin/reviews">Open VSX</a> or the <a href="https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin&ssr=false#review-details">VS Marketplace</a> also helps others find it.
</p>

<br>

<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://api.star-history.com/svg?repos=jzbakh/arn-skin&type=Date"  width="600" alt="Star History Chart">
  </a>
</p>

</div>

---

<a id="donate"></a>
### ☕ Financial support

If you'd like to support development and future updates financially, you can buy me a coffee or donate in cryptocurrency. Thank you so much! 🫶

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ARN_Inside)

</div>

**Cryptocurrency donations:**

<details>
<summary><b>₿ Bitcoin (BTC)</b></summary>

<br>

`bc1q4zu08uxpfra9aecp28x6zelg23qdcdeg680hlg`

![Bitcoin (BTC)](./media/Bitcoin.png)

</details>

<details>
<summary><b>Ethereum (ETH) & ERC-20 Tokens</b></summary>

<br>

`0xdc593BfaD6Be146400B713c2787DCCb9392AC206`

![Ethereum (ETH) & ERC-20](./media/Ethereum.png)

</details>

<details>
<summary><b>Solana (SOL)</b></summary>

<br>

`FwBu1oqSCdfDvvFhy3crYBkgzjDuwDcU5gxXzVCqxTn9`

![Solana (SOL)](./media/Solana.png)

</details>

---

<div align="center">
<p align="center">
  <b>Made with 🩵 by <a href="https://github.com/jzbakh">jzbakh</a></b>
</p>

---

<br>


<a id="fr"></a>
## 🇫🇷 Français

<br>

**7 thèmes spatiaux premium + personnalisation** pour Antigravity IDE, VS Code, Cursor, VSCodium, Windsurf...

📦 **Zéro dépendance** : JavaScript vanilla sans étape de build, lisible et auditable.

---

<div align="center">
  <h4> <a href="https://arn_inside.gitlab.io/arn-skin/"> Visualisez les syntaxes Markdown, Python, TypeScript, Rust, CSS, HTML, JSON, Shell et SQL </a></h4>
</div><br>

| Thème | Style | Description |
|:---|:---|:---|
| [<img src="./media/spaceport.png" width="64" alt="Spaceport"> **Spaceport**](https://arn_inside.gitlab.io/arn-skin/) | *Tungsten Grid* | Gris anthracite industriel aux accents dorés |
| [<img src="./media/nebula.png" width="64" alt="Nebula"> **Nebula**](https://arn_inside.gitlab.io/arn-skin/) | *Amethyst Void* | Cosmos violet, magenta et cyan |
| [<img src="./media/neptune.png" width="64" alt="Neptune"> **Neptune**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Navy* | Glace océanique bleu sarcelle (teal) |
| [<img src="./media/uranus.png" width="64" alt="Uranus"> **Uranus**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Teal* | Variante sarcelle et bleu outremer |
| [<img src="./media/io.png" width="64" alt="Io"> **Io**](https://arn_inside.gitlab.io/arn-skin/) | *Acid Haze* | Vert lime néon sur fond noir profond |
| [<img src="./media/jupiter.png" width="64" alt="Jupiter"> **Jupiter**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Light* | Parchemin clair (le seul thème clair) |
| [<img src="./media/mars.png" width="64" alt="Mars"> **Mars**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Storm* | Orange brûlé sur terres rouges |

</div><br>

---

### ✨ Fonctionnalités

🚀 **Change Theme (Changer de thème) :** Basculez instantanément entre les 7 thèmes via le menu de l'extension en cliquant sur `Skin` dans la barre d'état. 

*Personnalisez en temps réel (délai de 400 ms) via le sélecteur de couleurs natif de l'IDE :*

⚡ **Quick Customization (Personnalisation rapide) :** Éditez seulement **12 couleurs clés et 5 réglages intelligents**, l'extension génère automatiquement les ~250 couleurs d'interface dérivées !

<div align="center">

Chaque réglage accepte `YES`, `NO` ou `INHERIT` *(conserve le comportement par défaut du thème)*.

| Réglage | YES | NO |
| :--- | :--- | :--- |
| **Cursor Line Glow** *(Surbrillance de ligne)* | Illumine la ligne active et le curseur avec la couleur d'accentuation | Désactive l'effet de surbrillance sur la ligne |
| **Pure Black Mode** *(Noir profond)* | Rend tous les fonds presque noirs (presque blancs sur le thème clair) | Garde les nuances de fond du thème |
| **Vivid Selection** *(Sélection vive)* | Colore la sélection et les mots surlignés avec la couleur d'accentuation | Utilise un gris neutre et doux pour la sélection et les mots surlignés |
| **Borderless Mode** *(Sans bordure)* | Masque toutes les bordures de l'interface | Affiche toutes les bordures, dans la couleur Borders ou une teinte discrète du texte |
| **Active Tab Highlight** *(Mise en évidence de l'onglet actif)* | Met en avant l'onglet actif : fond, texte et bordures haute et basse aux couleurs d'accentuation | Onglet actif sobre, sans couleur d'accentuation ni bordure |

</div>

💡 Annulez facilement une modification : l'ampoule rétablit la valeur du thème.

🌈 **Advanced: UI Colors (Couleurs de l'interface) :** Contrôle granulaire de chaque élément visuel (onglets, barre latérale, barre d'activité, terminal…). Quick et Advanced se combinent couleur par couleur : la dernière modification l'emporte.

⌨️ **Advanced: Syntax Colors (Couleurs de syntaxe) :** Ajustez la coloration syntaxique de votre code en éditant directement les tokens sémantiques et les règles TextMate.

💾 **Export / Import (Exporter / Importer) :** Sauvegardez toutes vos personnalisations ARN-Skin dans un fichier portable, puis restaurez-les sur une autre machine ou après une réinstallation.

♻️ **Reset (Réinitialisation) :** Annulez toutes les modifications pour restaurer le thème d'origine à tout moment.

---

## 🚀 Installation

<details>
<summary><b>🔌 Via l'interface de votre éditeur (recommandé)</b></summary>

<br>

Fonctionne sur Antigravity IDE, VS Code, Cursor, Windsurf, VSCodium et les autres forks qui utilisent le VS Marketplace ou Open VSX.

1. Ouvrez la vue **Extensions** (`Ctrl+Shift+X`).
2. Recherchez `ARN-Skin`.
> 💡 **Astuce :** Triez les résultats de recherche par **Nom** (et PAS par popularité, pertinence ou nombre d'installations) pour trouver l'extension facilement.
3. Cliquez sur **Installer** et activez l'extension.

</details>

<details>
<summary><b>💻 Installation via VSIX</b></summary>

<br>

1. Téléchargez le fichier [`arn-skin.vsix`](https://github.com/jzbakh/arn-skin/releases/latest/download/arn-skin.vsix).
2. Dans votre éditeur, ouvrez la vue **Extensions** (`Ctrl+Shift+X`).
3. Cliquez sur le menu « ... » (Vues et autres actions) en haut de la barre latérale.
4. Sélectionnez **Installer à partir de VSIX...**
5. Choisissez le fichier téléchargé et activez l'extension.

</details>

<details>
<summary><b>🔧 Installation manuelle</b></summary>

<br>

JavaScript vanilla sans étape de build : le code est lisible et auditable.

1. Créez un dossier nommé `arn-skin`, puis téléchargez et placez-y les dossiers `schemas`, `themes` et `media`, ainsi que les fichiers `extension.js`, `package.json` et `README.md`.
2. Copiez ce dossier dans le répertoire des extensions de votre éditeur :
   - **Antigravity IDE** : `%USERPROFILE%\.antigravity-ide\extensions\` (Windows) ou `~/.antigravity-ide/extensions/` (macOS/Linux)
   - **VS Code** : `%USERPROFILE%\.vscode\extensions\` (Windows) ou `~/.vscode/extensions/` (macOS/Linux)
3. Relancez l'éditeur et activez l'extension.

</details>

---

## 🩵 Soutenir le projet

<br>

<div align="center">

<p align="center">
  <b>💫 Ce projet vous plaît ? Laissez une ⭐ sur GitHub ou GitLab pour le soutenir !</b>
</p>
<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://img.shields.io/github/stars/jzbakh/arn-skin?style=social" alt="Star sur GitHub">
  </a>
  <a href="https://gitlab.com/arn_inside/arn-skin">
    <img src="https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=social" alt="Star sur GitLab">
  </a>
</p>
<p align="center">
  Un avis sur <a href="https://open-vsx.org/extension/jzbakh/antigravity-arn-skin/reviews">Open VSX</a> ou le <a href="https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin&ssr=false#review-details">VS Marketplace</a> aide aussi d'autres personnes à le découvrir.
</p>

<br>

<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://api.star-history.com/svg?repos=jzbakh/arn-skin&type=Date"  width="600" alt="Graphique de l'historique des étoiles">
  </a>
</p>

</div>

---

### ☕ Soutien financier

Si vous souhaitez contribuer financièrement au développement et aux futures mises à jour, vous pouvez m'offrir un café ou faire un don en cryptomonnaies. Merci infiniment ! 🫶

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ARN_Inside)

</div>

**Dons en cryptomonnaies :**

<details>
<summary><b>₿ Bitcoin (BTC)</b></summary>

<br>

`bc1q4zu08uxpfra9aecp28x6zelg23qdcdeg680hlg`

![Bitcoin (BTC)](./media/Bitcoin.png)

</details>

<details>
<summary><b>Ethereum (ETH) et tokens ERC-20</b></summary>

<br>

`0xdc593BfaD6Be146400B713c2787DCCb9392AC206`

![Ethereum (ETH) et tokens ERC-20](./media/Ethereum.png)

</details>

<details>
<summary><b>Solana (SOL)</b></summary>

<br>

`FwBu1oqSCdfDvvFhy3crYBkgzjDuwDcU5gxXzVCqxTn9`

![Solana (SOL)](./media/Solana.png)

</details>

---

<div align="center">
<p align="center">
  <b>Créé avec 🩵 par <a href="https://github.com/jzbakh">jzbakh</a></b>
</p>

---

<br>


<a id="cn"></a>
## 🇨🇳 中文

<br>

**7 款高级太空主题 + 自定义功能**，适用于 Antigravity IDE、VS Code、Cursor、VSCodium、Windsurf 等编辑器。

📦 **零依赖**：纯原生 JavaScript，无需构建步骤，代码清晰易读且易于审计。

---

<div align="center">
  <h4> <a href="https://arn_inside.gitlab.io/arn-skin/"> 预览 Markdown、Python、TypeScript、Rust、CSS、HTML、JSON、Shell 和 SQL 的语法高亮</a></h4>
</div><br>

| 主题 | 风格 | 描述 |
|:---|:---|:---|
| [<img src="./media/spaceport.png" width="64" alt="Spaceport"> **Spaceport**](https://arn_inside.gitlab.io/arn-skin/) | *Tungsten Grid* | 带有金色点缀的工业炭灰色 |
| [<img src="./media/nebula.png" width="64" alt="Nebula"> **Nebula**](https://arn_inside.gitlab.io/arn-skin/) | *Amethyst Void* | 紫色、洋红色与青色的宇宙 |
| [<img src="./media/neptune.png" width="64" alt="Neptune"> **Neptune**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Navy* | 青绿色的海洋冰 |
| [<img src="./media/uranus.png" width="64" alt="Uranus"> **Uranus**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Teal* | 青绿色与群青蓝的变体 |
| [<img src="./media/io.png" width="64" alt="Io"> **Io**](https://arn_inside.gitlab.io/arn-skin/) | *Acid Haze* | 深邃黑色上的霓虹青柠绿 |
| [<img src="./media/jupiter.png" width="64" alt="Jupiter"> **Jupiter**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Light* | 浅色羊皮纸（唯一的浅色主题） |
| [<img src="./media/mars.png" width="64" alt="Mars"> **Mars**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Storm* | 红土地上的焦橙色 |

</div><br>

---

### ✨ 功能特性

🚀 **Change Theme（更改主题）：** 点击状态栏中的 `Skin`，即可在扩展菜单中瞬间切换 7 款主题。

*通过 IDE 原生颜色选择器实时自定义（400 毫秒延迟）：*

⚡ **Quick Customization（快速自定义）：** 仅需编辑 **12 种关键颜色和 5 个智能开关**，扩展程序会自动生成约 250 种派生的 UI 颜色！

<div align="center">

每个开关接受 `YES`、`NO` 或 `INHERIT`（保留主题的默认行为）。

| 开关 | YES | NO |
| :--- | :--- | :--- |
| **Cursor Line Glow**（光标行发光） | 使用强调色高亮当前行与光标 | 完全移除当前行高亮 |
| **Pure Black Mode**（极黑模式） | 将所有背景变为近乎纯黑（浅色主题下为近乎纯白） | 保留主题原有的背景色调 |
| **Vivid Selection**（鲜明选区） | 用强调色标出选中内容和高亮的单词 | 选中内容和高亮的单词使用柔和的中性灰色 |
| **Borderless Mode**（无边框模式） | 隐藏所有 UI 边框 | 显示所有边框，使用 Borders 颜色或柔和的文本色调 |
| **Active Tab Highlight**（活动选项卡高亮） | 突出显示活动选项卡：背景、文字及上下边框均使用强调色 | 活动选项卡保持简洁，不使用强调色或边框 |

</div>

💡 轻松撤销修改：点击灯泡即可恢复主题的原始值。

🌈 **Advanced: UI Colors（高级：UI 颜色）：** 对每个视觉元素（选项卡、侧边栏、活动栏、终端等）进行细粒度控制。Quick 和 Advanced 按颜色逐一合并，以最后一次修改为准。

⌨️ **Advanced: Syntax Colors（高级：语法颜色）：** 通过直接编辑语义 token 和 TextMate 规则来调整代码的语法高亮。

💾 **Export / Import（导出 / 导入）：** 将所有 ARN-Skin 自定义设置保存到一个可移植的文件中，之后可在另一台电脑上或重新安装后恢复。

♻️ **Reset（重置）：** 随时撤销所有修改，恢复原始主题。

---

## 🚀 安装

<details>
<summary><b>🔌 通过编辑器界面安装（推荐）</b></summary>

<br>

适用于 Antigravity IDE、VS Code、Cursor、Windsurf、VSCodium，以及其他使用 VS Marketplace 或 Open VSX 的 VS Code 分支。

1. 打开**扩展**视图（`Ctrl+Shift+X`）。
2. 搜索 `ARN-Skin`。
> 💡 **提示：** 将搜索结果按**名称**排序（而**不是**按热门程度、相关性或安装计数），即可轻松找到该扩展。
3. 点击**安装**并启用扩展程序。

</details>

<details>
<summary><b>💻 通过 VSIX 安装</b></summary>

<br>

1. 下载 [`arn-skin.vsix`](https://github.com/jzbakh/arn-skin/releases/latest/download/arn-skin.vsix) 文件。
2. 在您的编辑器中，打开**扩展**视图（`Ctrl+Shift+X`）。
3. 点击侧边栏顶部的“...”菜单（视图和更多操作）。
4. 选择 **从 VSIX 安装...**
5. 选择下载的文件并启用扩展程序。

</details>

<details>
<summary><b>🔧 手动安装</b></summary>

<br>

纯原生 JavaScript，无需构建步骤：代码清晰易读且易于审计。

1. 创建一个名为 `arn-skin` 的文件夹，然后下载并将 `schemas`、`themes` 和 `media` 文件夹，以及 `extension.js`、`package.json` 和 `README.md` 文件放入其中。
2. 将此文件夹复制到您的编辑器扩展目录中：
   - **Antigravity IDE**：`%USERPROFILE%\.antigravity-ide\extensions\`（Windows）或 `~/.antigravity-ide/extensions/`（macOS/Linux）
   - **VS Code**：`%USERPROFILE%\.vscode\extensions\`（Windows）或 `~/.vscode/extensions/`（macOS/Linux）
3. 重启编辑器并启用扩展程序。

</details>

---

## 🩵 支持项目

<br>

<div align="center">

<p align="center">
  <b>💫 喜欢这个项目吗？在 GitHub 或 GitLab 上点亮 ⭐ 来支持一下吧！</b>
</p>
<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://img.shields.io/github/stars/jzbakh/arn-skin?style=social" alt="在 GitHub 上点亮星星">
  </a>
  <a href="https://gitlab.com/arn_inside/arn-skin">
    <img src="https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=social" alt="在 GitLab 上点亮星星">
  </a>
</p>
<p align="center">
  在 <a href="https://open-vsx.org/extension/jzbakh/antigravity-arn-skin/reviews">Open VSX</a> 或 <a href="https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin&ssr=false#review-details">VS Marketplace</a> 上留下评价，也能帮助更多人发现它。
</p>

<br>

<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://api.star-history.com/svg?repos=jzbakh/arn-skin&type=Date"  width="600" alt="星标历史图表">
  </a>
</p>

</div>

---

### ☕ 资金支持

如果您愿意资助本项目的开发和后续更新，可以请我喝杯咖啡，或使用加密货币捐赠。非常感谢！🫶

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ARN_Inside)

</div>

**加密货币捐赠：**

<details>
<summary><b>₿ 比特币（BTC）</b></summary>

<br>

`bc1q4zu08uxpfra9aecp28x6zelg23qdcdeg680hlg`

![比特币（BTC）](./media/Bitcoin.png)

</details>

<details>
<summary><b>以太坊（ETH）与 ERC-20 代币</b></summary>

<br>

`0xdc593BfaD6Be146400B713c2787DCCb9392AC206`

![以太坊（ETH）与 ERC-20 代币](./media/Ethereum.png)

</details>

<details>
<summary><b>索拉纳（SOL）</b></summary>

<br>

`FwBu1oqSCdfDvvFhy3crYBkgzjDuwDcU5gxXzVCqxTn9`

![索拉纳（SOL）](./media/Solana.png)

</details>

---

<div align="center">
<p align="center">
  <b>由 <a href="https://github.com/jzbakh">jzbakh</a> 用 🩵 制作</b>
</p>

---

<br>


<a id="es"></a>
## 🇪🇸 Español

<br>

**7 temas espaciales premium + personalización** para Antigravity IDE, VS Code, Cursor, VSCodium, Windsurf...

📦 **Cero dependencias**: JavaScript vanilla sin paso de compilación, legible y auditable.

---

<div align="center">
  <h4> <a href="https://arn_inside.gitlab.io/arn-skin/"> Previsualiza el resaltado de sintaxis de Markdown, Python, TypeScript, Rust, CSS, HTML, JSON, Shell y SQL </a></h4>
</div><br>

| Tema | Estilo | Descripción |
|:---|:---|:---|
| [<img src="./media/spaceport.png" width="64" alt="Spaceport"> **Spaceport**](https://arn_inside.gitlab.io/arn-skin/) | *Tungsten Grid* | Gris antracita industrial con toques dorados |
| [<img src="./media/nebula.png" width="64" alt="Nebula"> **Nebula**](https://arn_inside.gitlab.io/arn-skin/) | *Amethyst Void* | Cosmos violeta, magenta y cian |
| [<img src="./media/neptune.png" width="64" alt="Neptune"> **Neptune**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Navy* | Hielo oceánico verde azulado (teal) |
| [<img src="./media/uranus.png" width="64" alt="Uranus"> **Uranus**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Teal* | Variante verde azulado y azul ultramar |
| [<img src="./media/io.png" width="64" alt="Io"> **Io**](https://arn_inside.gitlab.io/arn-skin/) | *Acid Haze* | Verde lima neón sobre fondo negro profundo |
| [<img src="./media/jupiter.png" width="64" alt="Jupiter"> **Jupiter**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Light* | Pergamino claro (el único tema claro) |
| [<img src="./media/mars.png" width="64" alt="Mars"> **Mars**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Storm* | Naranja quemado sobre tierras rojas |

</div><br>

---

### ✨ Características

🚀 **Change Theme (Cambiar tema):** Cambia al instante entre los 7 temas desde el menú de la extensión: haz clic en `Skin` en la barra de estado.

*Personaliza en tiempo real (retraso de 400 ms) a través del selector de colores nativo del IDE:*

⚡ **Quick Customization (Personalización rápida):** ¡Edita solo **12 colores clave y 5 interruptores inteligentes** y la extensión generará automáticamente los ~250 colores derivados de la interfaz!

<div align="center">

Cada interruptor acepta `YES`, `NO` o `INHERIT` *(conserva el comportamiento por defecto del tema)*.

| Interruptor | YES | NO |
| :--- | :--- | :--- |
| **Cursor Line Glow** *(Resplandor de línea)* | Ilumina la línea actual y el cursor con el color de énfasis | Elimina por completo el resaltado de la línea |
| **Pure Black Mode** *(Modo negro puro)* | Vuelve casi negros todos los fondos (casi blancos en el tema claro) | Mantiene los matices de fondo del tema |
| **Vivid Selection** *(Selección vívida)* | Colorea la selección y las palabras resaltadas con el color de énfasis | Usa un gris neutro y suave para la selección y las palabras resaltadas |
| **Borderless Mode** *(Modo sin bordes)* | Oculta todos los bordes de la interfaz | Muestra todos los bordes, en el color Borders o en un tono discreto del texto |
| **Active Tab Highlight** *(Resaltado de pestaña activa)* | Destaca la pestaña activa: fondo, texto y bordes superior e inferior en los colores de énfasis | Pestaña activa sobria, sin color de énfasis ni bordes |

</div>

💡 Deshaz un cambio fácilmente: la bombilla restaura el valor del tema.

🌈 **Advanced: UI Colors (Colores de la interfaz):** Control granular de cada elemento visual (pestañas, barra lateral, barra de actividad, terminal…). Quick y Advanced se combinan color por color: prevalece el último cambio.

⌨️ **Advanced: Syntax Colors (Colores de sintaxis):** Ajusta el resaltado de sintaxis de tu código editando directamente los tokens semánticos y las reglas TextMate.

💾 **Export / Import (Exportar / Importar):** Guarda todas tus personalizaciones de ARN-Skin en un archivo portátil y restáuralas en otro equipo o tras una reinstalación.

♻️ **Reset (Restablecer):** Deshaz todas las modificaciones para restaurar el tema original en cualquier momento.

---

## 🚀 Instalación

<details>
<summary><b>🔌 A través de la interfaz de tu editor (recomendado)</b></summary>

<br>

Funciona en Antigravity IDE, VS Code, Cursor, Windsurf, VSCodium y otros forks que usan el VS Marketplace u Open VSX.

1. Abre la vista de **Extensiones** (`Ctrl+Shift+X`).
2. Busca `ARN-Skin`.
> 💡 **Consejo:** Ordena los resultados de búsqueda por **Nombre** (y NO por popularidad, relevancia o número de instalaciones) para encontrar la extensión fácilmente.
3. Haz clic en **Instalar** y activa la extensión.

</details>

<details>
<summary><b>💻 Instalación desde VSIX</b></summary>

<br>

1. Descarga el archivo [`arn-skin.vsix`](https://github.com/jzbakh/arn-skin/releases/latest/download/arn-skin.vsix).
2. En tu editor, abre la vista de **Extensiones** (`Ctrl+Shift+X`).
3. Haz clic en el menú "..." (Vistas y más acciones) en la parte superior de la barra lateral.
4. Selecciona **Instalar desde VSIX...**
5. Elige el archivo descargado y activa la extensión.

</details>

<details>
<summary><b>🔧 Instalación manual</b></summary>

<br>

JavaScript vanilla sin paso de compilación: el código es legible y auditable.

1. Crea una carpeta llamada `arn-skin`, luego descarga y coloca las carpetas `schemas`, `themes` y `media` dentro de ella, junto con los archivos `extension.js`, `package.json` y `README.md`.
2. Copia esta carpeta en el directorio de extensiones de tu editor:
   - **Antigravity IDE**: `%USERPROFILE%\.antigravity-ide\extensions\` (Windows) o `~/.antigravity-ide/extensions/` (macOS/Linux)
   - **VS Code**: `%USERPROFILE%\.vscode\extensions\` (Windows) o `~/.vscode/extensions/` (macOS/Linux)
3. Reinicia el editor y activa la extensión.

</details>

---

## 🩵 Apoyar el proyecto

<br>

<div align="center">

<p align="center">
  <b>💫 ¿Te gusta este proyecto? ¡Deja una ⭐ en GitHub o GitLab para apoyarlo!</b>
</p>
<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://img.shields.io/github/stars/jzbakh/arn-skin?style=social" alt="Estrella en GitHub">
  </a>
  <a href="https://gitlab.com/arn_inside/arn-skin">
    <img src="https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=social" alt="Estrella en GitLab">
  </a>
</p>
<p align="center">
  Una reseña en <a href="https://open-vsx.org/extension/jzbakh/antigravity-arn-skin/reviews">Open VSX</a> o en el <a href="https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin&ssr=false#review-details">VS Marketplace</a> también ayuda a que otros lo descubran.
</p>

<br>

<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://api.star-history.com/svg?repos=jzbakh/arn-skin&type=Date"  width="600" alt="Gráfico de historial de estrellas">
  </a>
</p>

</div>

---

### ☕ Apoyo financiero

Si deseas contribuir económicamente al desarrollo y a futuras actualizaciones, puedes invitarme a un café o hacer una donación en criptomonedas. ¡Muchas gracias! 🫶

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ARN_Inside)

</div>

**Donaciones en criptomonedas:**

<details>
<summary><b>₿ Bitcoin (BTC)</b></summary>

<br>

`bc1q4zu08uxpfra9aecp28x6zelg23qdcdeg680hlg`

![Bitcoin (BTC)](./media/Bitcoin.png)

</details>

<details>
<summary><b>Ethereum (ETH) y tokens ERC-20</b></summary>

<br>

`0xdc593BfaD6Be146400B713c2787DCCb9392AC206`

![Ethereum (ETH) y tokens ERC-20](./media/Ethereum.png)

</details>

<details>
<summary><b>Solana (SOL)</b></summary>

<br>

`FwBu1oqSCdfDvvFhy3crYBkgzjDuwDcU5gxXzVCqxTn9`

![Solana (SOL)](./media/Solana.png)

</details>

---

<div align="center">
<p align="center">
  <b>Hecho con 🩵 por <a href="https://github.com/jzbakh">jzbakh</a></b>
</p>

---

<br>


<a id="ar"></a>
## 🇸🇦 العربية

<br>

**7 سمات فضائية متميزة + إمكانية التخصيص** لبيئات التطوير Antigravity IDE، VS Code، Cursor، VSCodium، Windsurf...

📦 **صفر تبعيات:** JavaScript خالص (Vanilla) بدون خطوة بناء (build step)، قابل للقراءة والتدقيق.

---

<div align="center">
  <h4> <a href="https://arn_inside.gitlab.io/arn-skin/"> عاين تمييز بناء الجملة (Syntax highlighting) في Markdown و Python و TypeScript و Rust و CSS و HTML و JSON و Shell و SQL </a></h4>
</div><br>

| السمة | النمط | الوصف |
|:---|:---|:---|
| [<img src="./media/spaceport.png" width="64" alt="Spaceport"> **Spaceport**](https://arn_inside.gitlab.io/arn-skin/) | *Tungsten Grid* | رمادي فحمي صناعي مع لمسات ذهبية |
| [<img src="./media/nebula.png" width="64" alt="Nebula"> **Nebula**](https://arn_inside.gitlab.io/arn-skin/) | *Amethyst Void* | كون بنفسجي، أرجواني، وسماوي |
| [<img src="./media/neptune.png" width="64" alt="Neptune"> **Neptune**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Navy* | جليد محيطي أزرق مخضر (teal) |
| [<img src="./media/uranus.png" width="64" alt="Uranus"> **Uranus**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Teal* | نسخة باللون الأزرق المخضر والأزرق اللازوردي |
| [<img src="./media/io.png" width="64" alt="Io"> **Io**](https://arn_inside.gitlab.io/arn-skin/) | *Acid Haze* | أخضر ليموني نيون على خلفية سوداء عميقة |
| [<img src="./media/jupiter.png" width="64" alt="Jupiter"> **Jupiter**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Light* | ورق رقي فاتح (السمة الفاتحة الوحيدة) |
| [<img src="./media/mars.png" width="64" alt="Mars"> **Mars**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Storm* | برتقالي محروق على أراضٍ حمراء |

</div><br>

---

### ✨ الميزات

🚀 **Change Theme (تغيير السمة):** بدّل فورًا بين السمات السبع من قائمة الإضافة: انقر على `Skin` في شريط الحالة.

*التخصيص في الوقت الفعلي (بتأخير 400 مللي ثانية) عبر منتقي الألوان المدمج في بيئة التطوير (IDE):*

⚡ **Quick Customization (تخصيص سريع):** قم بتعديل **12 لونًا رئيسيًا و5 مفاتيح تحكم ذكية** فقط، وستقوم الإضافة تلقائيًا بإنشاء حوالي 250 لونًا مشتقًا لواجهة المستخدم (UI)!

<div align="center">

كل مفتاح يقبل القيم `YES` أو `NO` أو `INHERIT` *(الإبقاء على السلوك الافتراضي للسمة)*.

| المفتاح | YES | NO |
| :--- | :--- | :--- |
| **Cursor Line Glow** *(توهج سطر المؤشر)* | يُضيء السطر النشط والمؤشر بلون التمييز | يُزيل تمييز السطر بالكامل |
| **Pure Black Mode** *(وضع الأسود الخالص)* | يجعل جميع الخلفيات شبه سوداء (شبه بيضاء في السمة الفاتحة) | يحافظ على درجات ألوان خلفية السمة |
| **Vivid Selection** *(تحديد بارز)* | يلوّن التحديد والكلمات المظللة بلون التمييز | يستخدم رماديًا محايدًا وهادئًا للتحديد والكلمات المظللة |
| **Borderless Mode** *(الوضع بلا حدود)* | يخفي جميع حدود واجهة المستخدم | يُظهر جميع الحدود، بلون Borders أو بدرجة خفيفة من لون النص |
| **Active Tab Highlight** *(تمييز التبويب النشط)* | يُبرز التبويب النشط: الخلفية والنص والحدّان العلوي والسفلي بألوان التمييز | تبويب نشط بسيط، بلا لون تمييز ولا حدود |

</div>

💡 تراجع عن أي تعديل بسهولة: يستعيد المصباح قيمة السمة.

🌈 **Advanced: UI Colors (ألوان واجهة المستخدم):** تحكم دقيق في كل عنصر مرئي (علامات التبويب، الشريط الجانبي، شريط النشاط، الطرفية...). يندمج Quick و Advanced لونًا بلون، والغلبة لآخر تعديل.

⌨️ **Advanced: Syntax Colors (ألوان بناء الجملة):** قم بضبط تمييز بناء الجملة (Syntax highlighting) لكودك عن طريق التعديل المباشر على الرموز الدلالية (semantic tokens) وقواعد TextMate.

💾 **Export / Import (تصدير / استيراد):** احفظ جميع تخصيصات ARN-Skin في ملف قابل للنقل، ثم استعدها على جهاز آخر أو بعد إعادة التثبيت.

♻️ **Reset (إعادة تعيين):** تراجع عن جميع التعديلات لاستعادة السمة الأصلية في أي وقت.

---

## 🚀 التثبيت

<details dir="rtl">
<summary><b>🔌 عبر واجهة محررك (موصى به)</b></summary>

<br>

يعمل على Antigravity IDE و VS Code و Cursor و Windsurf و VSCodium وغيرها من النسخ المشتقة التي تستخدم VS Marketplace أو Open VSX.

1. افتح عرض **الإضافات** (Extensions) بالضغط على `Ctrl+Shift+X`.
2. ابحث عن `ARN-Skin`.
> 💡 **نصيحة:** رتّب نتائج البحث حسب **الاسم** (Name)، وليس حسب الشعبية أو مدى الصلة أو عدد مرات التثبيت، للعثور على الإضافة بسهولة.
3. انقر على **تثبيت** (Install) وقم بتفعيل الإضافة.

</details>

<details dir="rtl">
<summary><b>💻 التثبيت عبر VSIX</b></summary>

<br>

1. قم بتنزيل ملف [`arn-skin.vsix`](https://github.com/jzbakh/arn-skin/releases/latest/download/arn-skin.vsix).
2. في محررك، افتح عرض **الإضافات** (Extensions) بالضغط على `Ctrl+Shift+X`.
3. انقر على قائمة «...» (Views and More Actions) أعلى الشريط الجانبي.
4. حدد **Install from VSIX...** (تثبيت من VSIX).
5. اختر الملف الذي تم تنزيله وقم بتفعيل الإضافة.

</details>

<details dir="rtl">
<summary><b>🔧 التثبيت اليدوي</b></summary>

<br>

JavaScript خالص (Vanilla) بدون خطوة بناء (build step): الكود قابل للقراءة والتدقيق.

1. قم بإنشاء مجلد باسم `arn-skin`، ثم قم بتنزيل ووضع المجلدات `schemas` و `themes` و `media` بداخله، إلى جانب ملفات `extension.js` و `package.json` و `README.md`.
2. انسخ هذا المجلد إلى مجلد إضافات محررك:
   - في **Antigravity IDE:** `%USERPROFILE%\.antigravity-ide\extensions\` (Windows) أو `~/.antigravity-ide/extensions/` (macOS/Linux)
   - في **VS Code:** `%USERPROFILE%\.vscode\extensions\` (Windows) أو `~/.vscode/extensions/` (macOS/Linux)
3. أعد تشغيل المحرر وقم بتفعيل الإضافة.

</details>

---

## 🩵 دعم المشروع

<br>

<div align="center">

<p align="center">
  <b>💫 هل أعجبك هذا المشروع؟ اترك ⭐ على GitHub أو GitLab لدعمه!</b>
</p>
<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://img.shields.io/github/stars/jzbakh/arn-skin?style=social" alt="نجمة على GitHub">
  </a>
  <a href="https://gitlab.com/arn_inside/arn-skin">
    <img src="https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=social" alt="نجمة على GitLab">
  </a>
</p>
<p align="center">
  تقييمك على <a href="https://open-vsx.org/extension/jzbakh/antigravity-arn-skin/reviews">Open VSX</a> أو <a href="https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin&ssr=false#review-details">VS Marketplace</a> يساعد الآخرين أيضًا على اكتشافه.
</p>

<br>

<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://api.star-history.com/svg?repos=jzbakh/arn-skin&type=Date"  width="600" alt="مخطط تاريخ النجوم">
  </a>
</p>

</div>

---

### ☕ الدعم المالي

إذا كنت ترغب في المساهمة ماليًا في التطوير والتحديثات المستقبلية، يمكنك أن تشتري لي قهوة أو تتبرع بالعملات المشفرة. شكرًا جزيلاً لك! 🫶

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ARN_Inside)

</div>

**التبرعات بالعملات المشفرة:**

<details dir="rtl">
<summary><b>₿ بيتكوين (BTC)</b></summary>

<br>

`bc1q4zu08uxpfra9aecp28x6zelg23qdcdeg680hlg`

![بيتكوين (BTC)](./media/Bitcoin.png)

</details>

<details dir="rtl">
<summary><b>إيثريوم (ETH) ورموز ERC-20</b></summary>

<br>

`0xdc593BfaD6Be146400B713c2787DCCb9392AC206`

![إيثريوم (ETH) ورموز ERC-20](./media/Ethereum.png)

</details>

<details dir="rtl">
<summary><b>سولانا (SOL)</b></summary>

<br>

`FwBu1oqSCdfDvvFhy3crYBkgzjDuwDcU5gxXzVCqxTn9`

![سولانا (SOL)](./media/Solana.png)

</details>

---

<div align="center">
<p align="center">
  <b>صُنع بـ 🩵 بواسطة <a href="https://github.com/jzbakh">jzbakh</a></b>
</p>

---

<br>


<a id="th"></a>
## 🇹🇭 ภาษาไทย

<br>

**7 ธีมอวกาศระดับพรีเมียม + ปรับแต่งได้อย่างอิสระ** สำหรับ Antigravity IDE, VS Code, Cursor, VSCodium, Windsurf...

📦 **ไม่มี Dependency:** ใช้ Vanilla JavaScript ล้วน ไม่มีขั้นตอนการบิลด์ (build step) โค้ดอ่านง่ายและตรวจสอบได้

---

<div align="center">
  <h4> <a href="https://arn_inside.gitlab.io/arn-skin/"> ดูตัวอย่างการเน้นสีไวยากรณ์ (Syntax highlighting) ของ Markdown, Python, TypeScript, Rust, CSS, HTML, JSON, Shell และ SQL </a></h4>
</div><br>

| ธีม | สไตล์ | คำอธิบาย |
|:---|:---|:---|
| [<img src="./media/spaceport.png" width="64" alt="Spaceport"> **Spaceport**](https://arn_inside.gitlab.io/arn-skin/) | *Tungsten Grid* | สีเทาชาร์โคลแบบอินดัสเตรียลพร้อมลูกเล่นสีทอง |
| [<img src="./media/nebula.png" width="64" alt="Nebula"> **Nebula**](https://arn_inside.gitlab.io/arn-skin/) | *Amethyst Void* | ห้วงจักรวาลสีม่วง สีบานเย็น และสีฟ้าไซแอน |
| [<img src="./media/neptune.png" width="64" alt="Neptune"> **Neptune**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Navy* | สีน้ำแข็งในมหาสมุทรโทนเขียวอมฟ้า (teal) |
| [<img src="./media/uranus.png" width="64" alt="Uranus"> **Uranus**](https://arn_inside.gitlab.io/arn-skin/) | *Glacial Teal* | ธีมทางเลือกสีเขียวอมฟ้าและสีน้ำเงินอุลตรามารีน |
| [<img src="./media/io.png" width="64" alt="Io"> **Io**](https://arn_inside.gitlab.io/arn-skin/) | *Acid Haze* | สีเขียวมะนาวนีออนบนพื้นหลังสีดำสนิท |
| [<img src="./media/jupiter.png" width="64" alt="Jupiter"> **Jupiter**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Light* | สีแผ่นกระดาษพาร์ชเมนต์สว่าง (ธีมสว่างเพียงหนึ่งเดียว) |
| [<img src="./media/mars.png" width="64" alt="Mars"> **Mars**](https://arn_inside.gitlab.io/arn-skin/) | *Amber Storm* | สีส้มอิฐบนพื้นดินสีแดง |

</div><br>

---

### ✨ คุณสมบัติ

🚀 **Change Theme (เปลี่ยนธีม):** สลับใช้งานระหว่าง 7 ธีมได้ทันทีผ่านเมนูของส่วนขยาย เพียงคลิกที่ `Skin` บนแถบสถานะ (status bar)

*ปรับแต่งแบบเรียลไทม์ (ความหน่วง 400 มิลลิวินาที) ผ่านเครื่องมือเลือกสีแบบเนทีฟของ IDE:*

⚡ **Quick Customization (ปรับแต่งอย่างรวดเร็ว):** แก้ไขเพียง **12 สีหลัก และสวิตช์อัจฉริยะ 5 ตัว** ส่วนขยายจะสร้างสีอินเทอร์เฟซ (UI) ที่เกี่ยวข้องประมาณ 250 สีให้โดยอัตโนมัติ!

<div align="center">

แต่ละสวิตช์รับค่า `YES`, `NO` หรือ `INHERIT` *(คงพฤติกรรมเริ่มต้นของธีมไว้)*

| สวิตช์ | YES | NO |
| :--- | :--- | :--- |
| **Cursor Line Glow** *(เคอร์เซอร์เรืองแสง)* | ไฮไลต์บรรทัดปัจจุบันและเคอร์เซอร์ด้วยสีแอ็กเซนต์ | นำการไฮไลต์บรรทัดออกทั้งหมด |
| **Pure Black Mode** *(โหมดดำสนิท)* | ทำให้พื้นหลังทั้งหมดเกือบดำสนิท (เกือบขาวในธีมสว่าง) | คงเฉดสีพื้นหลังของธีมไว้ |
| **Vivid Selection** *(การเลือกที่สดใส)* | ใช้สีแอ็กเซนต์กับส่วนที่เลือกและคำที่ไฮไลต์ | ใช้สีเทากลางแบบนุ่มนวลกับส่วนที่เลือกและคำที่ไฮไลต์ |
| **Borderless Mode** *(โหมดไร้ขอบ)* | ซ่อนขอบ UI ทั้งหมด | แสดงขอบทั้งหมด ด้วยสี Borders หรือโทนสีอ่อนๆ ของตัวอักษร |
| **Active Tab Highlight** *(เน้นแท็บที่ใช้งาน)* | เน้นแท็บที่ใช้งาน: พื้นหลัง ตัวอักษร และขอบบนกับขอบล่างเป็นสีแอ็กเซนต์ | แท็บที่ใช้งานดูเรียบๆ ไม่มีสีแอ็กเซนต์และไม่มีขอบ |

</div>

💡 ย้อนการแก้ไขได้ง่ายๆ: คลิกที่ไอคอนหลอดไฟเพื่อคืนค่าเดิมของธีม

🌈 **Advanced: UI Colors (สีอินเทอร์เฟซ):** ควบคุมทุกองค์ประกอบบนหน้าจอได้อย่างละเอียด (แท็บ แถบด้านข้าง แถบกิจกรรม เทอร์มินัล...) Quick และ Advanced จะรวมกันทีละสี: การแก้ไขล่าสุดจะมีผล

⌨️ **Advanced: Syntax Colors (สีของไวยากรณ์):** ปรับแต่งการเน้นสีไวยากรณ์ (Syntax highlighting) ของโค้ดโดยการแก้ไข semantic tokens และกฎ TextMate ได้โดยตรง

💾 **Export / Import (ส่งออก / นำเข้า):** บันทึกการปรับแต่ง ARN-Skin ทั้งหมดของคุณลงในไฟล์ เพื่อนำกลับมาใช้บนเครื่องอื่นหรือหลังติดตั้งใหม่

♻️ **Reset (รีเซ็ต):** ย้อนกลับการแก้ไขทั้งหมดเพื่อคืนค่าเป็นธีมดั้งเดิมได้ทุกเมื่อ

---

## 🚀 การติดตั้ง

<details>
<summary><b>🔌 ผ่านอินเทอร์เฟซของโปรแกรมแก้ไข (แนะนำ)</b></summary>

<br>

รองรับการทำงานบน Antigravity IDE, VS Code, Cursor, Windsurf, VSCodium และเวอร์ชันแยกอื่นๆ ที่ใช้ VS Marketplace หรือ Open VSX

1. เปิดมุมมอง **ส่วนขยาย (Extensions)** โดยกด `Ctrl+Shift+X`
2. ค้นหา `ARN-Skin`
> 💡 **เคล็ดลับ:** จัดเรียงผลการค้นหาตาม **ชื่อ (Name)** (ไม่ใช่ตามความนิยม ความเกี่ยวข้อง หรือจำนวนการติดตั้ง) เพื่อหาส่วนขยายได้ง่ายขึ้น
3. คลิก **ติดตั้ง (Install)** และเปิดใช้งานส่วนขยาย

</details>

<details>
<summary><b>💻 การติดตั้งผ่าน VSIX</b></summary>

<br>

1. ดาวน์โหลดไฟล์ [`arn-skin.vsix`](https://github.com/jzbakh/arn-skin/releases/latest/download/arn-skin.vsix)
2. ในโปรแกรมแก้ไขของคุณ ให้เปิดมุมมอง **ส่วนขยาย (Extensions)** โดยกด `Ctrl+Shift+X`
3. คลิกที่เมนู "..." (Views and More Actions) ที่ด้านบนสุดของแถบด้านข้าง
4. เลือก **ติดตั้งจาก VSIX... (Install from VSIX...)**
5. เลือกไฟล์ที่ดาวน์โหลดมาและเปิดใช้งานส่วนขยาย

</details>

<details>
<summary><b>🔧 การติดตั้งด้วยตนเอง</b></summary>

<br>

ใช้ Vanilla JavaScript ล้วน ไม่มีขั้นตอนการบิลด์ (build step): โค้ดอ่านง่ายและตรวจสอบได้

1. สร้างโฟลเดอร์ชื่อ `arn-skin` จากนั้นดาวน์โหลดและวางโฟลเดอร์ `schemas`, `themes` และ `media` ไว้ด้านใน พร้อมกับไฟล์ `extension.js`, `package.json` และ `README.md`
2. คัดลอกโฟลเดอร์นี้ไปยังไดเรกทอรีส่วนขยายของโปรแกรมแก้ไข:
   - **Antigravity IDE:** `%USERPROFILE%\.antigravity-ide\extensions\` (Windows) หรือ `~/.antigravity-ide/extensions/` (macOS/Linux)
   - **VS Code:** `%USERPROFILE%\.vscode\extensions\` (Windows) หรือ `~/.vscode/extensions/` (macOS/Linux)
3. รีสตาร์ตโปรแกรมแก้ไขและเปิดใช้งานส่วนขยาย

</details>

---

## 🩵 สนับสนุนโครงการ

<br>

<div align="center">

<p align="center">
  <b>💫 ชอบโปรเจกต์นี้ไหม? กด ⭐ บน GitHub หรือ GitLab เพื่อสนับสนุนกันได้เลย!</b>
</p>
<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://img.shields.io/github/stars/jzbakh/arn-skin?style=social" alt="ให้ดาวบน GitHub">
  </a>
  <a href="https://gitlab.com/arn_inside/arn-skin">
    <img src="https://img.shields.io/gitlab/stars/arn_inside/arn-skin?style=social" alt="ให้ดาวบน GitLab">
  </a>
</p>
<p align="center">
  การรีวิวบน <a href="https://open-vsx.org/extension/jzbakh/antigravity-arn-skin/reviews">Open VSX</a> หรือ <a href="https://marketplace.visualstudio.com/items?itemName=jzbakh.antigravity-arn-skin&ssr=false#review-details">VS Marketplace</a> ก็ช่วยให้ผู้อื่นค้นพบโปรเจกต์นี้ได้เช่นกัน
</p>

<br>

<p align="center">
  <a href="https://github.com/jzbakh/arn-skin">
    <img src="https://api.star-history.com/svg?repos=jzbakh/arn-skin&type=Date"  width="600" alt="กราฟประวัติดาว">
  </a>
</p>

</div>

---

### ☕ การสนับสนุนทางการเงิน

หากคุณต้องการสนับสนุนทางการเงินสำหรับการพัฒนาและการอัปเดตในอนาคต ก็สามารถเลี้ยงกาแฟสักแก้วหรือบริจาคเป็นสกุลเงินดิจิทัลได้ ขอบคุณมาก! 🫶

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ARN_Inside)

</div>

**การบริจาคสกุลเงินดิจิทัล:**

<details>
<summary><b>₿ บิตคอยน์ (BTC)</b></summary>

<br>

`bc1q4zu08uxpfra9aecp28x6zelg23qdcdeg680hlg`

![บิตคอยน์ (BTC)](./media/Bitcoin.png)

</details>

<details>
<summary><b>อีเธอเรียม (ETH) และโทเคน ERC-20</b></summary>

<br>

`0xdc593BfaD6Be146400B713c2787DCCb9392AC206`

![อีเธอเรียม (ETH) และโทเคน ERC-20](./media/Ethereum.png)

</details>

<details>
<summary><b>โซลานา (SOL)</b></summary>

<br>

`FwBu1oqSCdfDvvFhy3crYBkgzjDuwDcU5gxXzVCqxTn9`

![โซลานา (SOL)](./media/Solana.png)

</details>

---

<div align="center">
<p align="center">
  <b>สร้างด้วย 🩵 โดย <a href="https://github.com/jzbakh">jzbakh</a></b>
</p>

---