import { APIEmbed, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ComponentType, InteractionResponse } from "discord.js";
import { Movie } from "../@types/movie";
import getAccentColor from "./getAccentColors";

function createButton(properties: { label: string; style: ButtonStyle; customId: string; disabled: boolean; emoji?: string }) {
  const button = new ButtonBuilder();
  properties.label && button.setLabel(properties.label);
  properties.style && button.setStyle(properties.style);
  properties.customId && button.setCustomId(properties.customId);
  properties.disabled && button.setDisabled(properties.disabled);
  properties.emoji && button.setEmoji(properties.emoji);
  return button;
}

async function createMovieEmbed(movie: Movie, details?: { user: string; letterboxdUrl: string; providers: string[] }): Promise<APIEmbed> {
  let movieAccent = 0x000000;
  console.log(movie.images.poster);
  if (movie.images.poster) movieAccent = await getAccentColor(movie.images.poster);

  const [releaseYear, releaseMonth, releaseDay] = movie.release_date.split("-");

  const movieEmbed: APIEmbed = {
    color: movieAccent ?? 0x000000,
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
      url: movie.images.poster ?? "",
    },
  };

  return movieEmbed;
}

class MovieListEmbed {
  movies: Movie[];
  length: number;
  currentPage: number;
  reply: InteractionResponse<boolean>;
  embeds: APIEmbed[];

  constructor(movies: Movie[], reply: InteractionResponse<boolean>) {
    this.reply = reply;
    this.movies = movies;
    this.length = movies.length;
    this.currentPage = 0;
    this.embeds = [];
    this.init();
    this.listen();
  }

  private async listen() {
    const collector = this.reply.createMessageComponentCollector({ time: 60000, componentType: ComponentType.Button });
    collector.on("collect", this.interactionHandler.bind(this));
  }

  private async init() {
    await this.createEmbed(this.movies[0]);
    await this.update();
  }

  private async createEmbed(movie: Movie) {
    const embed = await createMovieEmbed(movie);
    this.embeds.push(embed);
    return embed;
  }

  async interactionHandler(interaction: ButtonInteraction<CacheType>) {
    switch (interaction.customId) {
      case "confirm":
        await this.confirm();
        break;
      case "cancel":
        await this.cancel();
        break;
      case "previous":
        await interaction.deferUpdate();
        await this.previous();
        break;
      case "next":
        await interaction.deferUpdate();
        await this.next();
        break;
    }
  }

  async confirm() {
    await this.reply.delete();
  }
  async cancel() {
    await this.reply.delete();
  }

  async next() {
    if (this.currentPage === this.length - 1) return;
    this.currentPage++;
    console.log(this.currentPage);
    if (!this.embeds[this.currentPage]) {
      await this.createEmbed(this.movies[this.currentPage]);
      await this.update();
    }
    await this.update();
  }

  async previous() {
    if (this.currentPage === 0) return;
    this.currentPage--;
    await this.update();
  }

  async update() {
    const isLastPage = this.currentPage === this.length - 1;
    const isFirstPage = this.currentPage === 0;

    const confirm = createButton({ label: "Confirmar", style: ButtonStyle.Success, customId: "confirm", disabled: false });
    const cancel = createButton({ label: "Cancelar", style: ButtonStyle.Danger, customId: "cancel", disabled: false });

    const previous = createButton({ label: "Anterior", style: ButtonStyle.Secondary, customId: "previous", disabled: isFirstPage, emoji: "⬅️" });
    const next = createButton({ label: "Próximo", style: ButtonStyle.Secondary, customId: "next", disabled: isLastPage, emoji: "➡️" });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, next);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

    const rows = [row1, row2];

    await this.reply.edit({ content: `Encontrei ${this.length} filmes com esses parâmetros (${this.currentPage+1}/${this.length}) `, embeds: [this.embeds[this.currentPage]], components: rows });
  }
}

export { createButton, createMovieEmbed, MovieListEmbed };
