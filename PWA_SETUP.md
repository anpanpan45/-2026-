# 🏠 宅建クエスト PWA実装ガイド

このドキュメントは、宅建学習アプリのPWA（Progressive Web App）化が完全に実装されたことを示します。

---

## ✅ 実装内容

### 1. **manifest.json** - 完全なPWA設定

```json
{
  "name": "宅建攻略クエスト",
  "short_name": "宅建クエスト",
  "display": "standalone",          // ← ブラウザUI非表示（フルスクリーン）
  "start_url": "./index.html",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "icons": [...],                   // ← 複数サイズ対応
  "shortcuts": [...]                // ← ショートカット機能
}
```

**主な機能**:
- ✅ `display: "standalone"` - ブラウザのURLバー・ツールバーを非表示
- ✅ `start_url` - アプリ起動時のランディングページ設定
- ✅ `theme_color` / `background_color` - 起動スプラッシュ画面のカラー
- ✅ `icons` - デバイスホーム画面用アイコン（SVG + PNG）
- ✅ `screenshots` - インストール時のプレビュー画像
- ✅ `shortcuts` - クイックアクションショートカット

---

### 2. **index.html** - iOS対応メタタグ

#### 追加したメタタグ

```html
<!-- PWA基本設定 -->
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#667eea">

<!-- iOS PWA対応 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="宅建クエスト">
<link rel="apple-touch-icon" href="...">

<!-- Android PWA対応 -->
<meta name="mobile-web-app-capable" content="yes">
```

**各タグの役割**:

| タグ | 説明 |
|------|------|
| `<link rel="manifest">` | PWA設定ファイルを参照 |
| `apple-mobile-web-app-capable` | iOS でホーム画面追加可能に |
| `apple-mobile-web-app-status-bar-style` | ステータスバーのスタイル設定 |
| `apple-mobile-web-app-title` | ホーム画面に表示されるアプリ名 |
| `apple-touch-icon` | iOS ホーム画面用アイコン |
| `mobile-web-app-capable` | Android PWA サポート |

---

## 📱 スマートフォンでのインストール手順

### **iPhone / iPad (Safari)**
1. Safari でアプリを開く
2. 共有ボタン → 「ホーム画面に追加」
3. アプリ名「宅建クエスト」を確認 → 追加
4. ホーム画面からアプリ起動

**動作**: 紫色のスプラッシュ画面 → フルスクリーン表示

### **Android (Chrome)**
1. Chrome でアプリを開く
2. メニュー → 「インストール」または「アプリをインストール」
3. 確認画面で「インストール」
4. ホーム画面にアプリ追加

**動作**: インストール後、スタンドアロンアプリとして起動

---

## 🎨 PWA外観設定

### **スプラッシュ画面**
- **背景色**: `#ffffff`（白）
- **テーマカラー**: `#667eea`（紫）
- **アプリ名**: 「宅建クエスト」
- **アイコン**: SVG + PNG 対応

### **ステータスバー (iOS)**
- **スタイル**: `black-translucent`
- **動作**: ステータスバーがアプリと同じ背景色で表示

---

## 🔧 技術仕様

### **対応プラットフォーム**

| プラットフォーム | ブラウザ | フルスクリーン | ホーム追加 |
|---|---|---|---|
| iOS | Safari | ✅ | ✅ |
| iPad | Safari | ✅ | ✅ |
| Android | Chrome | ✅ | ✅ |
| Android | Firefox | ✅ | ✅ |
| Desktop | Chrome | ✅ | ✅ |

### **必須ファイル**

```
宅建ツール/
├── index.html         （PWAメタタグ装備）
├── manifest.json      （アプリ設定）
├── style.css
├── script.js
├── questions.js
└── sw.js             （Service Worker）
```

---

## 🚀 デプロイ時の確認項目

### ✅ チェックリスト

- [ ] `manifest.json` が `<head>` で読み込まれている
  ```html
  <link rel="manifest" href="manifest.json">
  ```

- [ ] iOS メタタグが実装されている
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="宅建クエスト">
  ```

- [ ] Service Worker が登録されている（script.js に実装済み）
  ```javascript
  if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js');
  }
  ```

- [ ] HTTPS で提供されている（PWA必須）
  > PWAはHTTPSが必須です。ローカル（localhost）ではHTTPでも動作します。

- [ ] `start_url` が正しく設定されている
  ```json
  "start_url": "./index.html"
  ```

---

## 🧪 デバッグ方法

### **Chrome DevTools での確認**

1. **マニフェスト検証**:
   - DevTools → Application → Manifest
   - 設定内容が正しく読み込まれているか確認

2. **Service Worker確認**:
   - DevTools → Application → Service Workers
   - ステータスが「running」か確認

3. **キャッシュ確認**:
   - DevTools → Application → Cache Storage
   - データが正しく保存されているか確認

### **Lighthouse での監査**

```bash
# Chrome Lighthouse を実行
# DevTools → Lighthouse → Progressive Web App
```

期待される結果:
- ✅ Installable
- ✅ App capable
- ✅ Uses HTTPS
- ✅ Manifest metadata

---

## 📝 カスタマイズ例

### **アプリ名を変更する場合**

**manifest.json**:
```json
{
  "name": "新しいアプリ名",
  "short_name": "短い名前"
}
```

**index.html**:
```html
<meta name="apple-mobile-web-app-title" content="新しいアプリ名">
<title>新しいアプリ名</title>
```

### **カラーを変更する場合**

**manifest.json**:
```json
{
  "theme_color": "#新しい色",
  "background_color": "#背景色"
}
```

**index.html**:
```html
<meta name="theme-color" content="#新しい色">
```

---

## 🎯 PWA のメリット

✨ **このアプリで享受できるメリット**:

1. **ネイティブアプリのような体験**
   - URLバーなし
   - スムーズな起動
   - オフライン対応（Service Worker）

2. **ホーム画面アイコン**
   - アプリと同じように見える
   - ワンタップで起動

3. **プッシュ通知対応（将来拡張）
   - 学習リマインダー機能
   - 復習通知

4. **高速化**
   - キャッシュ戦略
   - オフラインサポート

5. **データ同期**
   - ServiceWorker + LocalStorage
   - 学習履歴の同期

---

## 📞 トラブルシューティング

### **「インストール」オプションが表示されない**

**原因**: Manifest が正しく読み込まれていない

**解決**:
1. `manifest.json` の場所を確認
2. `href` パスを確認（`./` で始まるか）
3. ブラウザキャッシュをクリア
4. HTTPS で提供されているか確認

### **アイコンが表示されない**

**原因**: アイコンのパスが無効

**解決**:
- SVG データURIを使用（インライン埋め込み）✅
- または外部画像 URLを使用（192x192, 512x512）
- MIME タイプを正しく指定

### **iOS でホーム画面追加ができない**

**原因**: Safari が PWA をサポート していない（iOS 15 未満）

**解決**:
- iOS 15 以上にアップデート
- Safari > 共有 > ホーム画面に追加

---

## 🎓 参考資料

- [MDN: Web App Manifest](https://developer.mozilla.org/ja/docs/Web/Manifest)
- [Google: PWA チェックリスト](https://web.dev/installable-web-apps/)
- [Apple: Safari PWA ガイド](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

**実装日**: 2026年1月21日  
**ステータス**: ✅ 完全実装  
**対応プラットフォーム**: iOS 15+, Android 5+, Chrome 36+
