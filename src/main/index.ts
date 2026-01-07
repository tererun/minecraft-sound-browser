import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
  shell,
} from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import Store from "electron-store";
import { indexSoundData, type SoundEventItem } from "./fileSystem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 23 },
    vibrancy: "window",
    backgroundColor: "#1a1a1a",
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../../dist/index.html"));
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

// IPC Handlers

ipcMain.handle("settings:load", () => {
  return {
    assetIndexPath: store.get("assetIndexPath", "") as string,
    objectsDir: store.get("objectsDir", "") as string,
    soundsJsonPath: store.get("soundsJsonPath", "") as string,
    languageJsonPath: store.get("languageJsonPath", "") as string,
    exportDir: store.get("exportDir", "") as string,
  };
});

ipcMain.handle(
  "settings:save",
  (
    _,
    settings: {
      assetIndexPath: string;
      objectsDir: string;
      soundsJsonPath: string;
      languageJsonPath: string;
      exportDir: string;
    }
  ) => {
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
  async (
    _,
    options: { filters?: { name: string; extensions: string[] }[] }
  ) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile"],
      filters: options.filters || [
        { name: "JSON Files", extensions: ["json"] },
      ],
    });
    return result.canceled ? null : result.filePaths[0];
  }
);

ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle(
  "data:index",
  async (
    _,
    settings: {
      assetIndexPath: string;
      objectsDir: string;
      soundsJsonPath: string;
      languageJsonPath: string;
    }
  ): Promise<SoundEventItem[]> => {
    try {
      return await indexSoundData(settings);
    } catch (error) {
      console.error("Error indexing sound data:", error);
      return [];
    }
  }
);

ipcMain.handle("audio:load", (_, filePath: string): string | null => {
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
  (
    _,
    payload: { originalPath: string; targetFileName: string }
  ): string | null => {
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

// アイコンファイルのパス（本番ビルドではextraResourcesに配置される）
const iconPath = app.isPackaged
  ? join(process.resourcesPath, "resources", "drag-icon.png")
  : join(__dirname, "../../resources/drag-icon.png");

ipcMain.on("ondragstart", (event, filePath: string) => {
  if (!existsSync(filePath)) {
    console.error("File not found for drag:", filePath);
    return;
  }

  console.log("Starting drag for:", filePath);
  console.log("Icon path:", iconPath, "exists:", existsSync(iconPath));

  event.sender.startDrag({
    file: filePath,
    icon: iconPath,
  });

  console.log("startDrag called");
});

ipcMain.handle("file:showInFinder", (_, filePath: string) => {
  if (existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle(
  "file:export",
  (
    _,
    payload: { originalPath: string; fileName: string; exportDir: string }
  ): { success: boolean; path?: string; error?: string } => {
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

ipcMain.handle("file:openExportDir", (_, exportDir: string) => {
  if (existsSync(exportDir)) {
    shell.openPath(exportDir);
    return true;
  }
  return false;
});

// Minecraft簡単設定用API
ipcMain.handle(
  "minecraft:getIndexFiles",
  (_, minecraftDir: string): string[] => {
    const indexesDir = join(minecraftDir, "assets", "indexes");
    if (!existsSync(indexesDir)) {
      return [];
    }

    const { readdirSync } = require("fs");
    const files = readdirSync(indexesDir) as string[];
    return files
      .filter((f: string) => f.endsWith(".json"))
      .map((f: string) => f.replace(".json", ""))
      .sort((a: string, b: string) => {
        // 数字でソート（新しいバージョンが上）
        const numA = parseFloat(a) || 0;
        const numB = parseFloat(b) || 0;
        return numB - numA;
      });
  }
);

ipcMain.handle(
  "minecraft:resolveSettings",
  (
    _,
    payload: { minecraftDir: string; indexName: string }
  ): {
    assetIndexPath: string;
    objectsDir: string;
    soundsJsonPath: string | null;
    languageJsonPath: string | null;
  } | null => {
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

    // asset indexからsounds.jsonとja_jp.jsonのハッシュを取得
    try {
      const assetIndex = JSON.parse(readFileSync(assetIndexPath, "utf-8"));
      const objects = assetIndex.objects || {};

      let soundsJsonPath: string | null = null;
      let languageJsonPath: string | null = null;

      // sounds.jsonを探す
      const soundsEntry = objects["minecraft/sounds.json"];
      if (soundsEntry) {
        const hash = soundsEntry.hash;
        const hashPrefix = hash.substring(0, 2);
        const path = join(objectsDir, hashPrefix, hash);
        if (existsSync(path)) {
          soundsJsonPath = path;
        }
      }

      // 日本語言語ファイルを探す
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
        languageJsonPath,
      };
    } catch {
      return null;
    }
  }
);
