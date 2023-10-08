type Provider = {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
};
type ProviderResult = {
  link: string;
  rent: Provider[];
  buy: Provider[];
  flatrate: Provider[];
};

type Movie = {
  id: number;
  title: string;
  rating: number;
  original_title: string;
  overview: string;
  release_date: string;
  genres: {
    name: string;
    emoji: string;
  }[];
  images: {
    backdrop: string | null;
    poster: string | null;
  };
  providers?: ProviderResult;
};

export { Movie, Provider, ProviderResult };
