import { supabase } from './supabaseClient';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

/**
 * Calls TMDB directly or falls back to Supabase proxy if needed
 */
const callTmdbApi = async (endpoint: string, params?: string) => {
  // Try direct API call first
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB API key not configured');
    }

    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      ...(params && Object.fromEntries(new URLSearchParams(params))),
    });

    const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}`);
    }

    return await response.json();
  } catch (directError) {
    console.warn('Direct TMDB API call failed, trying Supabase proxy:', directError);

    // Fallback to Supabase proxy
    try {
      const { data, error } = await supabase.functions.invoke('tmdb-proxy', {
        body: { endpoint, params },
      });

      if (error) {
        console.error('TMDB Proxy Error:', error);
        throw error;
      }

      return data;
    } catch (proxyError) {
      console.error('Both TMDB API and proxy failed:', proxyError);
      throw proxyError;
    }
  }
};

export const tmdb = {
  // Get trending movies or TV shows
  getTrending: async (mediaType: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'day') => {
    return callTmdbApi(`/trending/${mediaType}/${timeWindow}`);
  },

  // Get popular movies or TV shows
  getPopular: async (mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/popular`);
  },

  // Get top rated movies or TV shows
  getTopRated: async (mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/top_rated`);
  },

  // Get upcoming movies
  getUpcoming: async () => {
    return callTmdbApi('/movie/upcoming');
  },

  // Search movies or TV shows
  search: async (query: string, mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/search/${mediaType}`, `query=${encodeURIComponent(query)}`);
  },

  // Search across all types (movies, TV shows)
  searchMulti: async (query: string) => {
    return callTmdbApi('/search/multi', `query=${encodeURIComponent(query)}`);
  },

  // Get movie or TV show details
  getDetails: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/${id}`);
  },

  // Get credits (cast and crew)
  getCredits: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/${id}/credits`);
  },

  // Get videos (trailers, teasers, etc.)
  getVideos: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/${id}/videos`);
  },

  // Get similar movies or TV shows
  getSimilar: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/${id}/similar`);
  },

  // Get reviews
  getReviews: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/${mediaType}/${id}/reviews`);
  },

  // Discover movies or TV shows with filters
  discover: async (mediaType: 'movie' | 'tv' = 'movie', filters?: {
    with_genres?: string;
    sort_by?: string;
    year?: number;
  }) => {
    const params = new URLSearchParams({
      ...(filters?.with_genres && { with_genres: filters.with_genres }),
      ...(filters?.sort_by && { sort_by: filters.sort_by }),
      ...(filters?.year && { 
        [`${mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'}`]: filters.year.toString() 
      }),
    });
    return callTmdbApi(`/discover/${mediaType}`, params.toString());
  },

  // Get genres
  getGenres: async (mediaType: 'movie' | 'tv' = 'movie') => {
    return callTmdbApi(`/genre/${mediaType}/list`);
  },

  // Get TV season details (for episodes)
  getTvSeason: async (tvId: number, seasonNumber: number) => {
    return callTmdbApi(`/tv/${tvId}/season/${seasonNumber}`);
  },
};

// Helper functions for images
export const getImageUrl = (path: string | null, size: 'w200' | 'w500' | 'original' = 'w500') => {
  if (!path) return '/placeholder.svg';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null) => {
  return getImageUrl(path, 'original');
};

/**
 * Fetches Anilist and MAL IDs using a TMDB ID.
 * @param tmdbId The TMDB ID of the movie or TV show.
 * @param mediaType 'movie' or 'tv'.
 * @returns { id: number, idMal: number } | null
 */
export async function fetchAnimeIdsFromTmdb(tmdbId: number, mediaType: 'movie' | 'tv') {
  const anilistType = mediaType === 'movie' ? 'MOVIE' : 'TV';

  const query = `
    query ($tmdbId: Int, $type: MediaType) {
      Media (tmdbId: $tmdbId, type: $type) {
        id      # This is the Anilist ID
        idMal   # This is the MyAnimeList (MAL) ID
        title {
          romaji
        }
      }
    }
  `;

  const variables = {
    tmdbId: tmdbId,
    type: anilistType,
  };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  });

  const { data } = await response.json();
  
  if (data && data.Media) {
    return {
      anilistId: data.Media.id,
      malId: data.Media.idMal,
    };
  }
  
  return null;
}