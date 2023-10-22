import axios from "axios";
import $ from "cheerio";
import type { Movie } from "../@types/movie";

function parseTitle(title: string) {
  if (title.includes("Not found")) return null;
  const details = title
    .split("directed by")
    .map(el => {
      const newEl = el.split("•");
      if (newEl.length > 1) return newEl[0].trim();
      else {
        let movie = el.trim().split(" ");
        let year = movie.pop();
        return [movie.join(" "), year];
      }
    })
    .flatMap(el => el);
  return {
    title: details[0]!,
    year: details[1]!,
    director: details[2]!,
  };
}

async function getPageTitle(url: string) {
  const response = await axios.get(url);
  const html = response.data;
  const $html = $.load(html);
  const title = $html("title").text();

  return title;
}

function isSameMovie(movie: Movie, details: any) {
  const sameName = details.title.toLocaleLowerCase().includes(movie.original_title.toLowerCase());
  const sameYear = `(${movie.release_date.split("-")[0]})` === details.year;
  return sameName && sameYear;
}

async function getLetterboxdFilmUrl(movie: Movie, url?: string): Promise<string | null> {
  if (!url) {
    const formattedTitle = movie.original_title
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .toLowerCase();
    url = `https://letterboxd.com/film/${formattedTitle}`;
  }

  const pageTitle = await getPageTitle(url);
  const resMovie = parseTitle(pageTitle);

  if (resMovie === null) return null;

  const letterboxdFilm = resMovie;
  if (isSameMovie(movie, letterboxdFilm)) {
    return url;
  } else {
    const newUrl = `${url}-${movie.release_date.split("-")[0]}`;
    const res = await getLetterboxdFilmUrl(movie, newUrl);
    return res;
  }
}

export default { getLetterboxdFilmUrl };
