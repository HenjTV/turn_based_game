import fs from "fs";

export function getCharacterImages(folderPath) {
    try {
        // Read the directory and filter for PNG image files
        const files = fs.readdirSync(folderPath);
        return files.filter(file => /\.png$/i.test(file)); // Filter only PNG images
    } catch (error) {
        console.error("Error reading character images:", error);
        return [];
    }
}