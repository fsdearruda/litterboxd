import type { IInteraction } from "../@types";
import type { Movie } from "../@types/movie";

import { ActionRowBuilder, SlashCommandBuilder, userMention, ButtonBuilder, ButtonStyle, APIEmbed, ComponentType } from "discord.js";
import { searchMovie } from "../services/tmdb";

import getAccentColor from "../utils/getAccentColors";

async function createMovieEmbed(movie: Movie, user: string): Promise<APIEmbed> {
  const movieAccent = await getAccentColor(movie.images.poster);

  const [releaseYear, releaseMonth, releaseDay] = movie.release_date.split("-");

  const movieEmbed: APIEmbed = {
    color: movieAccent,
    title: `${movie.title} (${releaseYear})`,
    description: movie.overview.split(/\s+/).slice(0, 30).join(" ") + "...",
    fields: [
      {
        name: "Gêneros",
        value: `${movie.genres.map(genre => `${genre.emoji} ${genre.name}`).join("\n")}`,
        inline: true,
      },
      {
        name: "⭐ Nota",
        value: `${movie.rating}/10`,
        inline: true,
      },
    ],
    thumbnail: {
      url: movie.images.poster,
    },
  };

  return movieEmbed;
}

async function getButtons({ nextEnabled, previousEnabled }: { nextEnabled: boolean; previousEnabled: boolean }) {
  const confirm = new ButtonBuilder().setCustomId("confirm").setLabel("Confirmar").setStyle(ButtonStyle.Success);
  const cancel = new ButtonBuilder().setCustomId("cancel").setLabel("Cancelar").setStyle(ButtonStyle.Danger);

  const previous = new ButtonBuilder().setCustomId("previous").setLabel("Anterior").setStyle(ButtonStyle.Secondary).setEmoji("⬅️").setDisabled(!previousEnabled);
  const next = new ButtonBuilder().setCustomId("next").setLabel("Próximo").setStyle(ButtonStyle.Secondary).setEmoji("➡️").setDisabled(!nextEnabled);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next);
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);
  return [row1, row2];
}

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
    try {
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

      // Embed message
      const results = await Promise.allSettled(movies.map(movie => createMovieEmbed(movie, user)));
      const embeds = results.filter((r): r is PromiseFulfilledResult<APIEmbed> => r.status === "fulfilled").map(r => r.value);

      let currentEmbed = 0;
      const movieEmbed = embeds[currentEmbed];

      const collector = reply.createMessageComponentCollector({ time: 60000, componentType: ComponentType.Button });

      collector.on("collect", async buttonInteraction => {
        const buttonId = buttonInteraction.customId;
        switch (buttonId) {
          case "confirm":
            movieEmbed.fields?.push({
              name: "Sugerido por",
              value: `||${user}||`,
            });
            movieEmbed.description = movies[currentEmbed].overview;
            const message = await buttonInteraction.channel?.send({ embeds: [movieEmbed] });
            await message?.pin();
            await buttonInteraction.update({ content: `${movieEmbed.title} foi adicionado à lista de sugestões!`, embeds: [], components: [] });
            break;
          case "cancel":
            await buttonInteraction.update({ content: "Sugestão cancelada", embeds: [], components: [] });
            break;
          case "previous":
            currentEmbed -= 1;
            const previousEmbed = embeds[currentEmbed];
            await buttonInteraction.update({
              content: `Encontrei ${embeds.length} filmes com esses parâmetros\n (${currentEmbed + 1}/${embeds.length})`,
              embeds: [previousEmbed],
              components: await getButtons({ nextEnabled: currentEmbed < embeds.length - 1, previousEnabled: currentEmbed > 0 }),
            });
            break;
          case "next":
            currentEmbed += 1;
            const nextEmbed = embeds[currentEmbed];
            await buttonInteraction.update({
              content: `Encontrei ${embeds.length} filmes com esses parâmetros\n (${currentEmbed + 1}/${embeds.length})`,
              embeds: [nextEmbed],
              components: await getButtons({ nextEnabled: currentEmbed < embeds.length - 1, previousEnabled: currentEmbed > 0 }),
            });
            break;
        }
      });

      const buttons = await getButtons({ nextEnabled: currentEmbed < embeds.length - 1, previousEnabled: currentEmbed > 0 });
      // Send message
      await reply.edit({ content: `Encontrei ${embeds.length} filmes com esses parâmetros\n (1/${embeds.length})`, embeds: [movieEmbed], components: buttons });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "Houve um erro ao executar esse comando!" });
    }
  },
};
