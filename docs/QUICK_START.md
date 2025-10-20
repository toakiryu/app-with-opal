# クイックスタートガイド / Quick Start Guide

このガイドでは、Opal で作成したアプリをこのリポジトリに追加する手順を説明します。

This guide explains how to add your Opal-created app to this repository.

## 準備 / Prerequisites

- GitHub アカウント / GitHub account
- Git の基本的な知識 / Basic Git knowledge
- Opal で作成したアプリ / An app created with Opal

## 手順 / Steps

### 1. リポジトリをフォーク / Fork the Repository

このリポジトリページの右上にある "Fork" ボタンをクリックします。

Click the "Fork" button at the top right of this repository page.

### 2. ローカルにクローン / Clone Locally

```bash
git clone https://github.com/YOUR_USERNAME/app-with-opal.git
cd app-with-opal
```

### 3. ブランチを作成 / Create a Branch

```bash
git checkout -b add-my-app
```

アプリ名に合わせてブランチ名を変更してください。

Change the branch name to match your app name.

### 4. アプリフォルダを作成 / Create App Folder

```bash
cd apps
mkdir my-app-name
cd my-app-name
```

### 5. アプリファイルをコピー / Copy App Files

Opal からエクスポートしたファイルをこのフォルダにコピーします。

Copy the files exported from Opal into this folder.

### 6. README.md を作成 / Create README.md

`apps/.template/README.md` をコピーして編集します：

Copy and edit `apps/.template/README.md`:

```bash
cp ../.template/README.md README.md
```

エディタで開いて、アプリの情報を記入します。

Open in an editor and fill in your app information.

### 7. 変更をコミット / Commit Changes

```bash
git add .
git commit -m "Add [your app name]"
```

### 8. プッシュ / Push

```bash
git push origin add-my-app
```

### 9. Pull Request を作成 / Create Pull Request

1. GitHub でフォークしたリポジトリにアクセス
2. "Compare & pull request" ボタンをクリック
3. 変更内容を説明
4. "Create pull request" をクリック

Steps:

1. Visit your forked repository on GitHub
2. Click "Compare & pull request"
3. Describe your changes
4. Click "Create pull request"

## テンプレートの使用 / Using the Template

`apps/.template/` フォルダには、完全なアプリテンプレートが含まれています：

The `apps/.template/` folder contains a complete app template:

```bash
cp -r apps/.template apps/my-new-app
cd apps/my-new-app
# ファイルを編集 / Edit files
```

## ヒント / Tips

✅ **推奨 / Recommended:**

- わかりやすいアプリ名を使用
- スクリーンショットを含める
- 使用方法を詳しく説明
- コードにコメントを追加

Use descriptive app names, include screenshots, explain usage in detail, add code comments

❌ **避けるべき / Avoid:**

- 他のアプリのファイルを変更
- 大きなファイル（動画など）をコミット
- 個人情報やAPIキーを含める

Don't modify other apps' files, commit large files (videos), or include personal info/API keys

## トラブルシューティング / Troubleshooting

### エラー: Permission denied

SSH キーが設定されていない可能性があります。HTTPS を使用するか、SSH キーを設定してください。

SSH keys may not be configured. Use HTTPS or set up SSH keys.

### エラー: Merge conflicts

最新の変更を取得してください：

Get the latest changes:

```bash
git fetch origin
git rebase origin/main
```

### 質問や問題 / Questions or Issues

Issue を作成してお気軽にお問い合わせください：

Feel free to open an issue:

- [新しい Issue を作成 / Create New Issue](../../issues/new)

## 次のステップ / Next Steps

- [貢献ガイドを読む / Read Contributing Guide](CONTRIBUTING.md)
- [Opal について学ぶ / Learn About Opal](ABOUT_OPAL.md)
- [他のアプリを見る / View Other Apps](../apps/)

## サポート / Support

問題が発生した場合は、以下の方法でサポートを受けられます：

If you encounter problems, you can get support through:

1. [GitHub Issues](../../issues)
2. [Discussions](../../discussions) (利用可能な場合 / if available)
3. [Pull Request でコメント / Comment on Pull Request]

---

Happy coding! 🚀
