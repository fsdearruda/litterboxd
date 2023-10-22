import { ClientWithCommands, FileExport } from "../@types";
import { Collection, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";

import { readdir } from "fs/promises";
import path from "path";

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DISCORD_DEV_GUILD_ID } = process.env;

const loadCommands = async (client: ClientWithCommands, root: string): Promise<void> => {
  const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  client.commands = new Collection();

  const commandsPath = path.join(root, "commands");

  // Addressing the issue of the file extension changing when compiled to JS
  const currentFileExtension = path.extname(__filename);

  const commandFiles = (await readdir(commandsPath)).filter(file => file.endsWith(currentFileExtension));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { default: command } = (await import(filePath)) as FileExport;

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  const rest = new REST().setToken(DISCORD_TOKEN as string);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = (await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID as string, DISCORD_DEV_GUILD_ID ?? (DISCORD_GUILD_ID as string)), {
      body: commands,
    })) as Array<any>;

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (err) {
    console.error(err);
  }
};

export default loadCommands;
