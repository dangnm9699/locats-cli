import { OptionValues, Command } from "commander";
import DownloadCommand from "../commands/download.command";
import fs from "fs";
import path from "path";
import BaseCommand from "./base";
class Core extends BaseCommand {
    program: Command
    constructor() {
        super();
        this.program = this;
        this.configInfo();
        this.configureCommands();
    }

    private configInfo() {
        this.program
          .name('locats')
          .version(require('../../package.json').version, '-v, --version', 'output the current version');
    }
    private configureCommands() {
        this.program
          .command('download')
          .alias('dl')
          .description('Download files')
          .option('-p, --path <path>', 'The api-key that should be used')
          .action(async (options: OptionValues) => {
            let config;
            try {
                config = this.loadConfigFile(options.configPath);
            } catch (e) {}

            const projectKey = options.projectKey || config.projectKey;
            if(!projectKey) {
                console.error('Error: missing required argument `projectKey`');
                process.exit(1);
            }
    
            const apiKey = options.apiKey || config.apiKey;
            if(!apiKey) {
                console.error('Error: missing required argument `apiKey`');
                process.exit(1);
            }

            const distPath = options.path || config.path || path.resolve(process.cwd());
            const command = new DownloadCommand({
                apiUrl: options.apiUrl,
                projectKey: projectKey,
                apiKey: apiKey,
                distPath: distPath,
            });
            await command.run();
        })
    }
    private loadConfigFile(configPath?: string) {
        const rcFile = configPath || path.resolve(process.cwd(), '.locatsrc');
        const rcFileResolved = path.resolve(rcFile);
        return fs.existsSync(rcFileResolved)
            ? JSON.parse(JSON.stringify(require(rcFileResolved)))
            : {};
    }
    run() {
        this.program.parse(process.argv);
    }
}

export default Core;