import fs from "fs";
import mime from "mime-types";

/**
 * Get a list of PNG character images from a folder.
 * @param {string} folderPath - Path to the folder containing images.
 * @returns {string[]} - List of PNG file names.
 */
export function getCharacterImages(folderPath: string): string[] {
    try {
        const files: string[] = fs.readdirSync(folderPath);
        return files.filter(file => /\.png$/i.test(file)); // Only PNG images
    } catch (error: any) {
        console.error("Error reading character images:", error);
        return [];
    }
}

/**
 * Serve a file with the correct MIME type.
 * @param {string} filePath - Path to the file.
 * @param {string} [defaultType] - Fallback MIME type if not detected.
 * @returns {Response}
 */
export function serveFile(filePath: string, defaultType: string = "application/octet-stream"): Response {
    try {
        const stats: fs.Stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            return new Response("Cannot serve a directory", { status: 400 });
        }

        const file: any = Bun.file(filePath);
        if (file.size === 0) throw new Error("File not found");

        const contentType = mime.lookup(filePath) || defaultType;
        return new Response(file, {
            headers: { "Content-Type": contentType as string },
        });
    } catch (error: any) {
        console.error(`Error serving file "${filePath}":`, error.message);
        return new Response("Not found", { status: 404 });
    }
}