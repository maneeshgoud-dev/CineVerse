import { Client, Databases, ID, Query, Account } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TABLE_ID;
const WATCHLIST_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WATCHLIST_COLLECTION_ID || 'watchlist';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)

const database = new Databases(client);
const account = new Account(client);

export const updateSearchCount = async (searchTerm, movie) => {
  // 1. Use Appwrite SDK to check if the search term exists in the database
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('searchTerm', searchTerm),
  ])

  // 2. If it does, update the count
  if(result.documents.length > 0) {
   const doc = result.documents[0];

   await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
    count: doc.count + 1,
   })
  // 3. If it doesn't, create a new document with the search term and count as 1
  } else {
   await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    searchTerm,
    count: 1,
    movie_id: movie.id,
    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
   })
  }
 } catch (error) {
  console.error(error);
 }
}

export const getTrendingMovies = async () => {
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.limit(5),
    Query.orderDesc("count")
  ])

  return result.documents;
 } catch (error) {
  console.error(error);
 }
}

// ── AUTHENTICATION ──────────────────────────────────────────────────
export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
}

export const registerUser = async (email, password, name) => {
  try {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    return await account.get();
  } catch (error) {
    throw error;
  }
}

export const loginUser = async (email, password) => {
  try {
    await account.createEmailPasswordSession(email, password);
    return await account.get();
  } catch (error) {
    throw error;
  }
}

export const logoutUser = async () => {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// ── WATCHLIST ────────────────────────────────────────────────────────
export const addToWatchlist = async (userId, movieData) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.equal('movieId', movieData.id)
    ])

    if (result.documents.length > 0) {
      return result.documents[0];
    }

    const doc = await database.createDocument(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        movieId: movieData.id,
        title: movieData.title || movieData.name || 'Untitled',
        poster_path: movieData.poster_path,
        vote_average: movieData.vote_average,
        addedAt: new Date().toISOString()
      }
    );
    return doc;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

export const removeFromWatchlist = async (userId, movieId) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.equal('movieId', movieId)
    ])

    if (result.documents.length > 0) {
      await database.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, result.documents[0].$id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

export const getWatchlist = async (userId) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.orderDesc('addedAt')
    ])
    return result.documents;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
}

export const isInWatchlist = async (userId, movieId) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.equal('movieId', movieId)
    ])
    return result.documents.length > 0;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}