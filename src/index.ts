import { ClientWithCommands } from "./@types";
import { config } from "dotenv";
config();

import { Client, GatewayIntentBits, Events } from "discord.js";
import loadCommands from "./utils/loadCommands";
import interactionHandler from "./utils/interactionHandler";

const { DISCORD_TOKEN } = process.env;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as ClientWithCommands;
loadCommands(client, __dirname);

client.once("ready", c => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, interaction => interactionHandler(interaction, client));

client.login(DISCORD_TOKEN);
