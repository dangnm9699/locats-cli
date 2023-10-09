import { OptionValues } from "commander";

require("isomorphic-fetch");
const fs = require("fs");
const path = require("path");


interface DownloadItem {
    url: string;
    language: string;
    namespace: string;
}

interface IResponse {
    success: boolean;
    data: DownloadItem[];
    message: string;
}

export class DownloadCommand {
    apiUrl: string
    distPath: string
    projectKey: string
    apiKey: string

    constructor(opt: OptionValues) {
        this.apiUrl = opt.apiUrl
        this.distPath = opt.distPath
        this.projectKey = opt.projectKey
        this.apiKey = opt.apiKey
    }

    async run() {
        const res = await fetch(`${this.apiUrl}/locale/download`, {
            headers: {
                "Content-Type": "application/json",
                "X-Locats-Api-Key": this.apiKey
            },
            method: "POST",
            body: JSON.stringify({ projectKey: this.projectKey })
        });
        if (res.status === 200) {
            const resJson = await res.json() as IResponse;
            const downloads = resJson.data || [];
            await this.batchDownloader(this.distPath, downloads, 20);
        }
    }

    private async batchDownloader(savePath: string, arr: DownloadItem[], size: number) {
        const downloads = [...arr];
        while (downloads.length > 0) {
            const promiseForDownload: Promise<any>[] = [];
            const batch = downloads.splice(0, size);
            batch.forEach(item => {
                promiseForDownload.push(
                    fetch(item.url)
                        .then(res => {
                            if (res.status === 200) {
                                return {
                                    dir: path.dirname(path.join(savePath, item.language)),
                                    file: `${item.namespace}.json`,
                                    converted: res.json(),
                                };
                            } else {
                                throw new Error(`Cannot download ${item.url} to ${savePath}`);
                            }
                        })
                        .catch(e => {
                            return `Cannot download ${item.url} to ${savePath}`;
                        })
                );
            });
            await Promise.allSettled(promiseForDownload)
                .then(result => {
                    const errors = result.filter(promise => promise.status === "rejected") as PromiseRejectedResult[];
                    if (errors && errors.length) {
                        errors.forEach(error => {
                            console.log(error.reason);
                        });
                    } else {
                        result.forEach(item => {
                            if (item.status === "fulfilled") {
                                const download = item as PromiseFulfilledResult<any>;
                                const dir = download.value.dir;
                                const file = download.value.file;
                                const converted = download.value.converted;
    
                                fs.promises.mkdir(dir, { recursive: true }).then(() => {
                                    fs.writeFile(path.join(dir, file), JSON.stringify(converted), (err: NodeJS.ErrnoException | null) => {
                                        if (err) {
                                            console.log(`Cannot save file, reason: ${err}`);
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
        }
    }
}

export default DownloadCommand;