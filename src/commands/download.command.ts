require("isomorphic-fetch");

import { OptionValues } from "commander";
import colors from "colors";
import fs from "fs";
import path from "path";

type DownloadItem = {
    url: string;
    language: string;
    namespace: string;
}
type FulfilledResult = {
    dir: string;
    file: string;
    converted: any;
}
type IResponse = {
    success: boolean;
    data?: DownloadItem[];
    message?: string;
}
export class DownloadCommand {
    apiUrl: string
    distPath: string
    apiKey: string
    projectKey: string

    constructor(opt: OptionValues) {
        this.apiUrl = opt.apiUrl
        this.distPath = opt.distPath
        this.apiKey = opt.apiKey
        this.projectKey = opt.projectKey
    }

    async run() {
        console.log(colors.yellow(`downloading ${this.projectKey} to ${this.distPath}...`));
        const res = await fetch(`${this.apiUrl}/locale/download`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ 
                apiKey: this.apiKey,
                projectKey: this.projectKey,
            })
        });
        if (res.status === 200) {
            const resJson = await res.json() as IResponse;
            const downloads = resJson.data || [];
            await this.batchDownloader(this.distPath, downloads, 20);
        } else {
            res.text().then((error) => {
                console.log(colors.red(error));
            });
        }
    }

    private async batchDownloader(savePath: string, arr: DownloadItem[], size: number) {
        try {
            const downloads = [...arr];
            let promiseFulfilledResult: PromiseFulfilledResult<FulfilledResult>[] = [];
            while (downloads.length > 0) {
                const promiseForDownload: Promise<any>[] = [];
                const batch = downloads.splice(0, size);
                batch.forEach(item => {
                    promiseForDownload.push(
                        fetch(item.url)
                            .then(async (res) => {
                                if (res.status === 200 && item.language && item.namespace) {
                                    const converted = await res.json();
                                    return {
                                        dir: path.join(savePath, item.language),
                                        file: `${item.namespace}.json`,
                                        converted: converted ? converted : {},
                                    };
                                } else {
                                    return Promise.reject(`NO`);
                                }
                            })
                            .catch(e => {
                                return Promise.reject(`Cannot download ${item.url} to ${savePath}`);
                            })
                    );
                });
                let isError = false;
                await Promise.allSettled(promiseForDownload)
                    .then(result => {
                        const errors = result.filter(promise => promise.status === "rejected") as PromiseRejectedResult[];
                        if (errors && errors.length) {
                            errors.forEach(error => {
                                console.log(colors.red(error.reason));
                            });
                            isError = true;
                        } else {
                            const fulfilled = result.filter(promise => promise.status === "fulfilled") as PromiseFulfilledResult<FulfilledResult>[];
                            promiseFulfilledResult = [...promiseFulfilledResult, ...fulfilled];
                        }
                    });
                if(isError) {
                    console.log(colors.red(`Cannot download ${this.projectKey} to ${this.distPath}...`));
                    return;
                }
            }
            if(promiseFulfilledResult && promiseFulfilledResult.length) {
                promiseFulfilledResult.forEach((download) => {
                    const dir = download.value.dir;
                    const file = download.value.file;
                    const converted = download.value.converted;
        
                    fs.promises.mkdir(dir, { recursive: true }).then(() => {
                        fs.writeFile(path.join(dir, file), JSON.stringify(converted), (err: NodeJS.ErrnoException | null) => {
                            if (err) {
                                console.log(colors.red(`Cannot save file, reason: ${err.toString()}`));
                            }
                        });
                    });
                });
                console.log(colors.green(`downloaded ${this.projectKey} to ${this.distPath}...`));
            } else {
                console.log(colors.yellow(`No data in downloaded project`));
            }
        } catch (e) {
            console.log(colors.red(`Cannot download ${this.projectKey} to ${this.distPath}...`));
        }
    }
}

export default DownloadCommand;