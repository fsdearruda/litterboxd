import {
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
} from "discord.js";

type IInteraction = ChatInputCommandInteraction<CacheType>;

type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: IInteraction) => Promise<void>;
};

interface FileExport {
  default: Command;
}

interface ClientWithCommands extends Client {
  commands: Collection<string, Command>;
}

export { ClientWithCommands, FileExport, IInteraction };
