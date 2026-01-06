# Minecraft Sound Browser

Minecraftのサウンドファイルを閲覧・検索し、DAWへドラッグ&ドロップできるデスクトップアプリケーション。

## 機能

- Minecraftアセットからサウンドイベントを自動インデックス
- カテゴリ別フィルタリング（ambient、block、entity など）
- キーワード検索
- サウンドのプレビュー再生
- DAWへのドラッグ&ドロップ対応
- ファイルエクスポート機能
- 日本語字幕（subtitle）表示対応

## 技術スタック

- **Electron** - クロスプラットフォームデスクトップアプリ
- **React 19** - UI
- **Vite 7** - ビルドツール
- **TypeScript** - 型安全性
- **Tailwind CSS 4** - スタイリング
- **Zustand** - 状態管理
- **Howler.js** - オーディオ再生
- **react-window** - 仮想化リスト

## セットアップ

### 必要条件

- Node.js 18+
- Bun（パッケージマネージャー）

### インストール

```bash
bun install
```

### 開発

```bash
bun run dev
```

### ビルド

```bash
bun run build
```

## 設定

アプリ起動後、設定画面でMinecraftのインストールディレクトリを指定してください。

### 自動設定（推奨）

1. Minecraftディレクトリを選択（例: `~/.minecraft`）
2. バージョン（インデックス）を選択
3. 設定が自動的に解決されます

### 手動設定

- **Asset Index Path**: `~/.minecraft/assets/indexes/{version}.json`
- **Objects Directory**: `~/.minecraft/assets/objects`
- **sounds.json Path**: サウンド定義ファイル
- **Language JSON Path**: 字幕翻訳ファイル（ja_jp.json）
- **Export Directory**: エクスポート先フォルダ

## 使い方

1. 設定でMinecraftのパスを指定
2. サウンド一覧から目的のサウンドを探す（カテゴリ or 検索）
3. サウンドをクリックしてプレビュー再生
4. DAWにドラッグ&ドロップ、またはエクスポートボタンでファイルを保存

## ライセンス

MIT
