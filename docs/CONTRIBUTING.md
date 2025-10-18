# 貢献ガイド / Contributing Guide

このリポジトリへの貢献を歓迎します！

We welcome contributions to this repository!

## アプリの追加方法 / How to Add an App

### ステップ 1: Fork とクローン / Step 1: Fork and Clone

1. このリポジトリを Fork してください
2. Fork したリポジトリをローカルにクローンします

```bash
git clone https://github.com/YOUR_USERNAME/app-with-opal.git
cd app-with-opal
```

### ステップ 2: ブランチの作成 / Step 2: Create a Branch

```bash
git checkout -b add-your-app-name
```

### ステップ 3: アプリの追加 / Step 3: Add Your App

1. `apps/` ディレクトリに新しいフォルダを作成します
2. Opal で作成したアプリのファイルをコピーします
3. README.md を追加し、以下の情報を含めます：

Create a new folder in the `apps/` directory, copy your Opal-created app files, and add a README.md with:

```markdown
# アプリ名 / App Name

## 概要 / Overview
[アプリの説明 / App description]

## 作成日 / Creation Date
YYYY-MM-DD

## 使用方法 / How to Use
[使用方法の説明 / Usage instructions]

## スクリーンショット / Screenshots
[可能であればスクリーンショットを追加 / Add screenshots if possible]

## リンク / Links
- [Opal プロジェクト / Opal Project]: (リンクがある場合 / if available)
```

### ステップ 4: コミットとプッシュ / Step 4: Commit and Push

```bash
git add .
git commit -m "Add [your app name]"
git push origin add-your-app-name
```

### ステップ 5: Pull Request の作成 / Step 5: Create a Pull Request

1. GitHub でリポジトリにアクセスします
2. "New Pull Request" をクリックします
3. 変更内容を説明します
4. Pull Request を作成します

## ガイドライン / Guidelines

- 各アプリは独自のフォルダに配置してください
- わかりやすい README.md を含めてください
- 適切なファイル構造を維持してください
- 他のアプリのファイルを変更しないでください
- コミットメッセージは明確にしてください

Each app should:
- Be in its own folder
- Include a clear README.md
- Maintain proper file structure
- Not modify other apps' files
- Have clear commit messages

## 質問がある場合 / Questions?

Issue を作成してお気軽にお問い合わせください。

Feel free to open an issue if you have any questions.

## 行動規範 / Code of Conduct

- 相互に尊重し合いましょう
- 建設的なフィードバックを心がけましょう
- オープンで友好的なコミュニティを維持しましょう

- Be respectful to others
- Provide constructive feedback
- Maintain an open and welcoming community

ご協力ありがとうございます！

Thank you for contributing!
