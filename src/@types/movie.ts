type Movie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  genres: string[];
  release_date: string;
  images: {
    backdrop: string;
    poster: string;
  };
};

export default Movie;
