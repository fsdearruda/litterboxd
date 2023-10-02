import axios from "axios";
import genreType from "./genres";
import Movie from "../@types/movie";

const { TMDB_API_TOKEN } = process.env;
const defaultLanguage = "pt-BR";
const imageBaseUrl = "https://image.tmdb.org/t/p/original";

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer ${TMDB_API_TOKEN}`,
    "Content-Type": "application/json;charset=utf-8",
  },
  params: {
    language: defaultLanguage,
  },
});

function formatMovie(movie: any): Movie {
  const { id, title, original_title, overview, genre_ids, backdrop_path, poster_path, release_date } = movie;
  return {
    id,
    title,
    original_title,
    overview,
    release_date,
    genres: genre_ids.map((genreId: number) => genreType[genreId]),
    images: {
      backdrop: imageBaseUrl + backdrop_path,
      poster: imageBaseUrl + poster_path,
    },
  };
}

async function searchMovie(query: string): Promise<Movie[]> {
  const { data } = await api.get("/search/movie", {
    params: {
      query,
    },
  });

  const formattedMovies = data.results.map(formatMovie) as Movie[];

  return formattedMovies;
}

export { searchMovie };
