import { Command, CommandOptions, ExecutableCommandOptions } from "commander";

export default class BaseCommand extends Command {
    constructor() {
        super();
    }
    command(nameAndArgs: string, opts?: CommandOptions): ReturnType<this['createCommand']>;
    
    command(nameAndArgs: string, description: string, opts?: ExecutableCommandOptions): this;

    command(nameAndArgs: string, descriptionOrOpts?: string | CommandOptions, opts?: ExecutableCommandOptions): this | ReturnType<this['createCommand']> {
        let cmd;
        if (typeof descriptionOrOpts === 'string') {
            cmd = super.command(nameAndArgs, descriptionOrOpts, opts);
        } else {
            cmd = super.command(nameAndArgs, descriptionOrOpts);
        }
        cmd
            .option('-u, --api-url <apiUrl>', 'The api-url that should be used', 'http://localhost:3077')
            .option('-pk --project-key <projectKey>', 'The project-key that should be used')
            .option('-ak, --api-key <apiKey>', 'The api-key that should be used')

        return cmd;
    }
}