const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// アイコンのサイズ
const sizes = [
  16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512,
];

// 出力ディレクトリ
const outputDir = path.join(__dirname, ".");

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🎨 Blackjack PWA アイコンを生成中...\n");

sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 背景のグラデーション（緑色のグラデーション）
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#0d5e3a");
  gradient.addColorStop(1, "#094029");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // カードのシンボルを描画
  ctx.fillStyle = "#d4af37";

  const centerX = size / 2;
  const centerY = size / 2;
  const scale = size / 150;

  // スペードの形を描画
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 30 * scale);
  ctx.bezierCurveTo(
    centerX - 15 * scale,
    centerY - 30 * scale,
    centerX - 30 * scale,
    centerY - 15 * scale,
    centerX - 20 * scale,
    centerY + 10 * scale,
  );
  ctx.bezierCurveTo(
    centerX - 15 * scale,
    centerY + 15 * scale,
    centerX - 10 * scale,
    centerY + 15 * scale,
    centerX,
    centerY + 20 * scale,
  );
  ctx.bezierCurveTo(
    centerX + 10 * scale,
    centerY + 15 * scale,
    centerX + 15 * scale,
    centerY + 15 * scale,
    centerX + 20 * scale,
    centerY + 10 * scale,
  );
  ctx.bezierCurveTo(
    centerX + 30 * scale,
    centerY - 15 * scale,
    centerX + 15 * scale,
    centerY - 30 * scale,
    centerX,
    centerY - 30 * scale,
  );
  ctx.fill();

  // "BJ" テキスト (Blackjackの略) - 大きいアイコンのみ
  if (size >= 72) {
    ctx.fillStyle = "#f0d678";
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BJ", centerX, centerY + 5 * scale);
  }

  // PNGとして保存
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filepath, buffer);

  console.log(`✅ ${filename} を生成しました`);
});

console.log("\n🎉 すべてのアイコンの生成が完了しました!");
console.log(`📁 保存先: ${outputDir}`);
