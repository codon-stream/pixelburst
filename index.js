const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const srcDir = path.join(__dirname, "src");
const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory "${srcDir}" not found.`);

  process.exit(1);
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDirExists(distDir);

const palette = path.join(__dirname, "palette.json");

if (!fs.existsSync(palette)) {
  console.error(`Color directory file "${palette}" not found.`);

  process.exit(1);
}

const colors = JSON.parse(fs.readFileSync(palette, "utf-8"));

let passCount = 0;
let failCount = 0;

function parseData(data) {
  return data
    .trim()
    .split("\n")
    .map((line) => {
      const tokens = [];
      const matches = line.match(/\[(.*?)\]/g) || [];

      matches.forEach((match) => {
        const [colorToken, repeatToken] = match.slice(1, -1).split(":");
        const [color, opacity] = colorToken.split("/");
        const repeat = repeatToken ? parseInt(repeatToken, 10) - 1 : 0;

        const colorData = {
          color: color || "transparent",
          opacity: opacity ? parseInt(opacity, 10) : 100,
        };

        for (let i = 0; i <= repeat; i++) {
          tokens.push(colorData);
        }
      });

      return tokens;
    });
}

function getColorAndOpacity(color, opacity) {
  if (color === "transparent") {
    return { color: "transparent", opacity: 0 };
  }

  const hexColor = colors[color.toLowerCase()] || color;

  if (hexColor) {
    return {
      color: hexColor,
      opacity: opacity,
    };
  }

  console.log(`Color "${color}" not found in color directory.`);

  return null;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);

  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

async function drawImage(parsedData, outputPath) {
  const rows = parsedData.length;

  // Ensure all rows have the same number of columns
  const colsArray = parsedData.map((row) => row.length);
  const uniqueCols = [...new Set(colsArray)];

  if (uniqueCols.length !== 1) {
    console.log(
      `Skipping file "${outputPath}" due to inconsistent column sizes (rows: ${rows}, columns per row: ${colsArray.join(
        ", "
      )})`
    );

    failCount++;

    return;
  }

  const cols = uniqueCols[0];
  const cellSize = 1;
  const width = cols * cellSize;
  const height = rows * cellSize;

  const imageBuffer = Buffer.alloc(width * height * 4, 0);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cellData = parsedData[y][x];

      if (!cellData) {
        console.log(
          `Skipping cell at row ${y}, col ${x} in file "${outputPath}" due to missing data.`
        );

        continue;
      }

      const { color, opacity } = cellData;
      const colorData = getColorAndOpacity(color, opacity);

      if (!colorData) {
        console.log(`Skipping file "${outputPath}" due to invalid color.`);

        failCount++;

        return;
      }

      const offset = (y * cellSize * width + x * cellSize) * 4;

      if (colorData.color === "transparent") {
        imageBuffer.writeUInt8(0, offset);
        imageBuffer.writeUInt8(0, offset + 1);
        imageBuffer.writeUInt8(0, offset + 2);
        imageBuffer.writeUInt8(0, offset + 3);
      } else {
        const [r, g, b] = hexToRgb(colorData.color);
        const alpha = Math.round((colorData.opacity / 100) * 255);

        imageBuffer.writeUInt8(r, offset);
        imageBuffer.writeUInt8(g, offset + 1);
        imageBuffer.writeUInt8(b, offset + 2);
        imageBuffer.writeUInt8(alpha, offset + 3);
      }
    }
  }

  try {
    await sharp(imageBuffer, { raw: { width, height, channels: 4 } }).toFile(
      outputPath
    );

    console.log(`Created image: ${outputPath}`);

    passCount++;
  } catch (error) {
    console.error(
      `Failed to create image for file "${outputPath}": ${error.message}`
    );

    failCount++;
  }
}

async function processFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const parsedData = parseData(data);
    const relativePath = path.relative(srcDir, filePath);
    const outputPath = path.join(distDir, relativePath.replace(".tt", ".png"));

    ensureDirExists(path.dirname(outputPath));

    await drawImage(parsedData, outputPath);
  } catch (error) {
    console.error(`Failed to process file "${filePath}": ${error.message}`);

    failCount++;
  }
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      await processDirectory(filePath);
    } else if (filePath.endsWith(".tt")) {
      await processFile(filePath);
    }
  }
}

async function main() {
  await processDirectory(srcDir);

  console.log(
    `\nProcessing complete. Total Pass: ${passCount}, Total Fail: ${failCount}`
  );
}

main();
