import * as fs from "node:fs";
import * as fsP from "node:fs/promises";

/** creates dir if it doesn't exist, doesn't error if it does */
export const silentMkdir = (dir) => fsP.access(dir, fs.constants.F_OK)
	.catch(async () => {
		await fsP.mkdir(dir, { recursive: true });
	});
