const API_BASE_URL = '/api/tmdb';
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZWJiYjQwMTA5ZDBmZDYyYjI3OTY3MGE2MDU4NDA2MyIsIm5iZiI6MTc1MTY5NTcwOC43NzIsInN1YiI6IjY4NjhjMTVjYzhlYzE3NDVhM2NlZGM1OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.t_nlKGADApnBaOxU2sdH8eSQK9JR8qanrBulfD8rUEE';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

export const tmdb = {
  // Get trending movies or TV shows
  getTrending: async (mediaType: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'day') => {
    const response = await fetch(`${API_BASE_URL}/trending/${mediaType}/${timeWindow}`, options);
    return response.json();
  },

  // Get popular movies or TV shows
  getPopular: async (mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/popular`, options);
    return response.json();
  },

  // Get top rated movies or TV shows
  getTopRated: async (mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/top_rated`, options);
    return response.json();
  },

  // Get upcoming movies
  getUpcoming: async () => {
    const response = await fetch(`${API_BASE_URL}/movie/upcoming`, options);
    return response.json();
  },

  // Search movies or TV shows
  search: async (query: string, mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(
      `${API_BASE_URL}/search/${mediaType}?query=${encodeURIComponent(query)}`,
      options
    );
    return response.json();
  },

  // Search across all types (movies, TV shows)
  searchMulti: async (query: string) => {
    const response = await fetch(
      `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}`,
      options
    );
    return response.json();
  },

  // Get movie or TV show details
  getDetails: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/${id}`, options);
    return response.json();
  },

  // Get credits (cast and crew)
  getCredits: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/${id}/credits`, options);
    return response.json();
  },

  // Get videos (trailers, teasers, etc.)
  getVideos: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/${id}/videos`, options);
    return response.json();
  },

  // Get similar movies or TV shows
  getSimilar: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/${id}/similar`, options);
    return response.json();
  },

  // Get reviews
  getReviews: async (id: number, mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/${mediaType}/${id}/reviews`, options);
    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/discover/${mediaType}?${params}`, options);
    return response.json();
  },

  // Get genres
  getGenres: async (mediaType: 'movie' | 'tv' = 'movie') => {
    const response = await fetch(`${API_BASE_URL}/genre/${mediaType}/list`, options);
    return response.json();
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
