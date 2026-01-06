import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, mkdirSync, copyFileSync } from "fs";
import Store from "electron-store";
async function indexSoundData(settings) {
  const { assetIndexPath, objectsDir, soundsJsonPath, languageJsonPath } = settings;
  if (!existsSync(assetIndexPath) || !existsSync(soundsJsonPath)) {
    throw new Error("Required files not found");
  }
  const assetIndex = JSON.parse(readFileSync(assetIndexPath, "utf-8"));
  const soundsJson = JSON.parse(readFileSync(soundsJsonPath, "utf-8"));
  let languageJson = {};
  if (existsSync(languageJsonPath)) {
    languageJson = JSON.parse(readFileSync(languageJsonPath, "utf-8"));
  }
  const soundEvents = [];
  for (const [eventId, eventData] of Object.entries(soundsJson)) {
    const category = extractCategory(eventId);
    const displayName = resolveDisplayName(eventId, languageJson);
    const sounds = [];
    for (const sound of eventData.sounds) {
      const soundName = typeof sound === "string" ? sound : sound.name;
      const assetPath = `minecraft/sounds/${soundName}.ogg`;
      const assetEntry = assetIndex.objects[assetPath];
      if (assetEntry) {
        const hash = assetEntry.hash;
        const hashPrefix = hash.substring(0, 2);
        const absolutePath = join(objectsDir, hashPrefix, hash);
        if (existsSync(absolutePath)) {
          const variantName = soundName.split("/").pop() || soundName;
          sounds.push({
            name: variantName,
            hash,
            absolutePath
          });
        }
      }
    }
    if (sounds.length > 0) {
      soundEvents.push({
        id: eventId,
        displayName,
        category,
        sounds
      });
    }
  }
  return soundEvents.sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));
}
function extractCategory(eventId) {
  const parts = eventId.split(".");
  return parts[0] || "unknown";
}
function resolveDisplayName(eventId, languageJson) {
  const parts = eventId.split(".");
  const searchPatterns = generateSearchPatterns(parts, eventId);
  for (const pattern of searchPatterns) {
    if (languageJson[pattern]) {
      const action = extractAction(eventId);
      const baseName = languageJson[pattern];
      return action ? `${baseName} (${action})` : baseName;
    }
  }
  return formatEventIdAsDisplay(eventId);
}
function generateSearchPatterns(parts, eventId) {
  const patterns = [];
  if (parts.length >= 2) {
    const category = parts[0];
    const blockOrEntity = parts.slice(1, -1).join("_");
    if (category === "block" || category === "entity" || category === "item") {
      patterns.push(`${category}.minecraft.${blockOrEntity}`);
      patterns.push(`${category}.minecraft.${blockOrEntity.replace(/_/g, "")}`);
      if (blockOrEntity.includes("_")) {
        const simplified = blockOrEntity.split("_")[0];
        patterns.push(`${category}.minecraft.${simplified}`);
      }
      patterns.push(`${category}.minecraft.${parts[1]}`);
    }
    if (category === "ambient" || category === "music" || category === "weather") {
      patterns.push(`subtitles.${eventId}`);
    }
  }
  patterns.push(`subtitles.${parts.join(".")}`);
  return patterns;
}
function extractAction(eventId) {
  const parts = eventId.split(".");
  const lastPart = parts[parts.length - 1];
  const actionMap = {
    break: "破壊",
    place: "設置",
    step: "足音",
    hit: "ヒット",
    fall: "落下",
    ambient: "環境音",
    hurt: "ダメージ",
    death: "死亡",
    attack: "攻撃",
    eat: "食べる",
    drink: "飲む",
    idle: "待機",
    say: "鳴き声"
  };
  return actionMap[lastPart] || "";
}
function formatEventIdAsDisplay(eventId) {
  return eventId.split(".").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
const store = new Store();
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname$1, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 23 },
    vibrancy: "window",
    backgroundColor: "#1a1a1a"
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname$1, "../../dist/index.html"));
  }
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.handle("settings:load", () => {
  return {
    assetIndexPath: store.get("assetIndexPath", ""),
    objectsDir: store.get("objectsDir", ""),
    soundsJsonPath: store.get("soundsJsonPath", ""),
    languageJsonPath: store.get("languageJsonPath", ""),
    exportDir: store.get("exportDir", "")
  };
});
ipcMain.handle(
  "settings:save",
  (_, settings) => {
    store.set("assetIndexPath", settings.assetIndexPath);
    store.set("objectsDir", settings.objectsDir);
    store.set("soundsJsonPath", settings.soundsJsonPath);
    store.set("languageJsonPath", settings.languageJsonPath);
    store.set("exportDir", settings.exportDir);
    return true;
  }
);
ipcMain.handle(
  "dialog:openFile",
  async (_, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: options.filters || [
        { name: "JSON Files", extensions: ["json"] }
      ]
    });
    return result.canceled ? null : result.filePaths[0];
  }
);
ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });
  return result.canceled ? null : result.filePaths[0];
});
ipcMain.handle(
  "data:index",
  async (_, settings) => {
    try {
      return await indexSoundData(settings);
    } catch (error) {
      console.error("Error indexing sound data:", error);
      return [];
    }
  }
);
ipcMain.handle("audio:load", (_, filePath) => {
  try {
    if (!existsSync(filePath)) {
      console.error("Audio file not found:", filePath);
      return null;
    }
    const buffer = readFileSync(filePath);
    return `data:audio/ogg;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Error loading audio:", error);
    return null;
  }
});
ipcMain.handle(
  "drag:prepare",
  (_, payload) => {
    const { originalPath, targetFileName } = payload;
    if (!existsSync(originalPath)) {
      console.error("Original file not found:", originalPath);
      return null;
    }
    const tempDir = app.getPath("temp");
    const mcSoundsDir = join(tempDir, "minecraft-sounds");
    if (!existsSync(mcSoundsDir)) {
      mkdirSync(mcSoundsDir, { recursive: true });
    }
    const tempFilePath = join(mcSoundsDir, targetFileName);
    try {
      copyFileSync(originalPath, tempFilePath);
      return tempFilePath;
    } catch (error) {
      console.error("Error copying file:", error);
      return null;
    }
  }
);
const iconPath = join(__dirname$1, "../../resources/drag-icon.png");
ipcMain.on("ondragstart", (event, filePath) => {
  if (!existsSync(filePath)) {
    console.error("File not found for drag:", filePath);
    return;
  }
  console.log("Starting drag for:", filePath);
  console.log("Icon path:", iconPath, "exists:", existsSync(iconPath));
  event.sender.startDrag({
    file: filePath,
    icon: iconPath
  });
  console.log("startDrag called");
});
ipcMain.handle("file:showInFinder", (_, filePath) => {
  if (existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});
ipcMain.handle(
  "file:export",
  (_, payload) => {
    const { originalPath, fileName, exportDir } = payload;
    if (!existsSync(originalPath)) {
      return { success: false, error: "Source file not found" };
    }
    if (!existsSync(exportDir)) {
      try {
        mkdirSync(exportDir, { recursive: true });
      } catch {
        return { success: false, error: "Failed to create export directory" };
      }
    }
    const destPath = join(exportDir, fileName);
    try {
      copyFileSync(originalPath, destPath);
      return { success: true, path: destPath };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
);
ipcMain.handle("file:openExportDir", (_, exportDir) => {
  if (existsSync(exportDir)) {
    shell.openPath(exportDir);
    return true;
  }
  return false;
});
ipcMain.handle(
  "minecraft:getIndexFiles",
  (_, minecraftDir) => {
    const indexesDir = join(minecraftDir, "assets", "indexes");
    if (!existsSync(indexesDir)) {
      return [];
    }
    const { readdirSync } = require("fs");
    const files = readdirSync(indexesDir);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numB - numA;
    });
  }
);
ipcMain.handle(
  "minecraft:resolveSettings",
  (_, payload) => {
    const { minecraftDir, indexName } = payload;
    const assetIndexPath = join(
      minecraftDir,
      "assets",
      "indexes",
      `${indexName}.json`
    );
    const objectsDir = join(minecraftDir, "assets", "objects");
    if (!existsSync(assetIndexPath) || !existsSync(objectsDir)) {
      return null;
    }
    try {
      const assetIndex = JSON.parse(readFileSync(assetIndexPath, "utf-8"));
      const objects = assetIndex.objects || {};
      let soundsJsonPath = null;
      let languageJsonPath = null;
      const soundsEntry = objects["minecraft/sounds.json"];
      if (soundsEntry) {
        const hash = soundsEntry.hash;
        const hashPrefix = hash.substring(0, 2);
        const path = join(objectsDir, hashPrefix, hash);
        if (existsSync(path)) {
          soundsJsonPath = path;
        }
      }
      const langEntry = objects["minecraft/lang/ja_jp.json"];
      if (langEntry) {
        const hash = langEntry.hash;
        const hashPrefix = hash.substring(0, 2);
        const path = join(objectsDir, hashPrefix, hash);
        if (existsSync(path)) {
          languageJsonPath = path;
        }
      }
      return {
        assetIndexPath,
        objectsDir,
        soundsJsonPath,
        languageJsonPath
      };
    } catch {
      return null;
    }
  }
);
