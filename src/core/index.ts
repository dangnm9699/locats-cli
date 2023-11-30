import { OptionValues, Command } from "commander";
import DownloadCommand from "../commands/download.command";
import fs from "fs";
import path from "path";
import colors from "colors";
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
          .description('Download project')
          .option('-p, --path <path>', 'Specify the path that should be used')
          .action(async (options: OptionValues) => {
            let config;
            try {
                config = this.loadConfigFile(options.configPath);
            } catch (e) {}

            const apiKey = options.apiKey || config["api-key"];
            if(!apiKey) {
                console.log(colors.red('Error: missing required argument `apiKey`'));
                return;
            }

            const projectKey = options.projectKey || config["project-key"];
            if(!projectKey) {
                console.log(colors.red('Error: missing required argument `projectKey`'));
                return;
            }
    
            let distPath =
                options.path && options.path[0] === "/" 
                    ? options.path.substring(1) 
                    : options.path ||
                config.path || 
                process.cwd();
            
            distPath = path.resolve(distPath);

            const command = new DownloadCommand({
                apiUrl: options.apiUrl,
                apiKey: apiKey,
                projectKey: projectKey,
                distPath: distPath,
            });
            await command.run();
        })
    }
    private loadConfigFile(configPath?: string) {
        const rcFile = configPath || path.resolve(process.cwd(), 'locats.config.js');
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