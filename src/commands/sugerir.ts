import type { IInteraction } from "../@types";

import { SlashCommandBuilder, userMention } from "discord.js";
import { searchMovie } from "../services/tmdb";
import { MovieListEmbed } from "../utils/embeds";

export default {
  data: new SlashCommandBuilder()
    .setName("sugerir")
    .addStringOption(option => {
      return option.setName("filme").setDescription("Título do filme").setRequired(true);
    })
    .addIntegerOption(option => {
      return option.setName("ano").setDescription("Ano de lançamento do filme").setRequired(false);
    })
    .setDescription("Adiciona um filme à lista de sugestões"),
  async execute(interaction: IInteraction) {
    const movie = interaction.options.getString("filme");
    const year = interaction.options.getInteger("ano");
    const user = userMention(interaction.user.id);

    if (!movie) return;

    const movies = await searchMovie(movie, year?.toString());
    if (movies.length === 0) {
      await interaction.reply(`${user}, não encontrei nenhum filme com esse nome.`);
      return;
    }
    const reply = await interaction.deferReply({ ephemeral: true });
    new MovieListEmbed(movies, reply);
  },
};
