import { SlashCommandBuilder, userMention } from "discord.js";
import { IInteraction } from "../@types";
import { searchMovie } from "../utils/tmdb";

import getAccentColor from "../utils/getAccentColors";

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
    const user = userMention(interaction.user.id);
    if (!movie) return;

    const movies = await searchMovie(movie);
    if (movies.length === 0) {
      await interaction.reply(`${user}, não encontrei nenhum filme com esse nome.`);
      return;
    }

    const movieSuggestion = movies[0];
    const movieAccent = await getAccentColor(movieSuggestion.images.poster);

    const [year, month, day] = movieSuggestion.release_date.split("-");
    console.log(movieAccent);
    const movieEmbed = {
      color: movieAccent,
      title: `${movieSuggestion.title} (${year})`,
      description: movieSuggestion.overview,
      fields: [
        {
          name: "Gêneros",
          value: movieSuggestion.genres.join(", "),
        },
      ],
      thumbnail: {
        url: movieSuggestion.images.poster,
      },
    };

    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [movieEmbed] });
    } catch (err) {
      console.log("Erro ao sugerir filme", err);
    }
  },
};
