import { dummyAnime, dummyBanners } from '../data/dummyAnime';

// Firebase client configuration detector
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "" && 
  firebaseConfig.apiKey !== "YOUR_API_KEY"
);

// Fallback Mock Service Implementation for immediate offline/out-of-box running
class MockAuthService {
  constructor() {
    this.listeners = [];
    this.currentUser = JSON.parse(localStorage.getItem('anistream_user')) || null;
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  signUp(email, password, name, preferences = []) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let users = JSON.parse(localStorage.getItem('anistream_users')) || [];
        if (users.find(u => u.email === email)) {
          reject(new Error("Email is already registered."));
          return;
        }

        const role = email.toLowerCase() === 'admin@anistream.com' ? 'admin' : 'user';
        const newUser = {
          uid: 'usr_' + Math.random().toString(36).substr(2, 9),
          email,
          name,
          role,
          preferences,
          createdAt: new Date().toISOString()
        };

        users.push({ ...newUser, password });
        localStorage.setItem('anistream_users', JSON.stringify(users));

        this.currentUser = newUser;
        localStorage.setItem('anistream_user', JSON.stringify(newUser));
        this._notifyListeners();
        resolve(newUser);
      }, 400);
    });
  }

  signIn(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('anistream_users')) || [];
        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        // Preseed a default administrator
        if (!user && email.toLowerCase() === 'admin@anistream.com' && password === 'admin123') {
          user = {
            uid: 'admin_default',
            email: 'admin@anistream.com',
            name: 'System Admin',
            role: 'admin',
            preferences: ["Action", "Sci-Fi"],
            createdAt: new Date().toISOString()
          };
          users.push({ ...user, password: 'admin123' });
          localStorage.setItem('anistream_users', JSON.stringify(users));
        }

        // Preseed a default demo user
        if (!user && email.toLowerCase() === 'user@anistream.com' && password === 'user123') {
          user = {
            uid: 'user_default',
            email: 'user@anistream.com',
            name: 'Gamer Wibu',
            role: 'user',
            preferences: ["Action", "Fantasy", "Sports"],
            createdAt: new Date().toISOString()
          };
          users.push({ ...user, password: 'user123' });
          localStorage.setItem('anistream_users', JSON.stringify(users));
        }

        if (user) {
          const { password: _, ...safeUser } = user;
          this.currentUser = safeUser;
          localStorage.setItem('anistream_user', JSON.stringify(safeUser));
          this._notifyListeners();
          resolve(safeUser);
        } else {
          reject(new Error("Invalid email or password combination."));
        }
      }, 500);
    });
  }

  signInAsGuest() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const guestUser = {
          uid: 'guest_' + Math.random().toString(36).substr(2, 9),
          email: 'guest@anistream.com',
          name: 'Guest Visitor',
          role: 'guest',
          preferences: [],
          createdAt: new Date().toISOString()
        };
        this.currentUser = guestUser;
        localStorage.setItem('anistream_user', JSON.stringify(guestUser));
        this._notifyListeners();
        resolve(guestUser);
      }, 300);
    });
  }

  signOut() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('anistream_user');
        this._notifyListeners();
        resolve();
      }, 200);
    });
  }

  updateProfile(name, preferences) {
    return new Promise((resolve, reject) => {
      if (!this.currentUser) {
        reject(new Error("No user signed in."));
        return;
      }
      this.currentUser.name = name;
      this.currentUser.preferences = preferences;
      localStorage.setItem('anistream_user', JSON.stringify(this.currentUser));
      
      let users = JSON.parse(localStorage.getItem('anistream_users')) || [];
      const index = users.findIndex(u => u.uid === this.currentUser.uid);
      if (index !== -1) {
        users[index] = { ...users[index], name, preferences };
        localStorage.setItem('anistream_users', JSON.stringify(users));
      }
      
      this._notifyListeners();
      resolve(this.currentUser);
    });
  }

  _notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }
}

class MockDbService {
  constructor() {
    this._initDb();
  }

  _initDb() {
    if (!localStorage.getItem('anistream_anime')) {
      localStorage.setItem('anistream_anime', JSON.stringify(dummyAnime));
    }
    if (!localStorage.getItem('anistream_banners')) {
      localStorage.setItem('anistream_banners', JSON.stringify(dummyBanners));
    }
    if (!localStorage.getItem('anistream_watchlist')) {
      localStorage.setItem('anistream_watchlist', JSON.stringify({}));
    }
    if (!localStorage.getItem('anistream_history')) {
      localStorage.setItem('anistream_history', JSON.stringify({}));
    }
  }

  getAnimeList() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const anime = JSON.parse(localStorage.getItem('anistream_anime')) || [];
        resolve(anime);
      }, 300);
    });
  }

  getAnimeById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const anime = JSON.parse(localStorage.getItem('anistream_anime')) || [];
        const item = anime.find(a => a.id === id);
        if (item) {
          resolve(item);
        } else {
          reject(new Error("Anime catalog item not found."));
        }
      }, 200);
    });
  }

  saveAnime(animeData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let anime = JSON.parse(localStorage.getItem('anistream_anime')) || [];
        const index = anime.findIndex(a => a.id === animeData.id);
        
        if (index !== -1) {
          anime[index] = { ...anime[index], ...animeData };
        } else {
          anime.push({
            ...animeData,
            episodes: animeData.episodes || [],
            episodesCount: animeData.episodesCount || 0
          });
        }
        
        localStorage.setItem('anistream_anime', JSON.stringify(anime));
        resolve(animeData);
      }, 400);
    });
  }

  deleteAnime(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let anime = JSON.parse(localStorage.getItem('anistream_anime')) || [];
        anime = anime.filter(a => a.id !== id);
        localStorage.setItem('anistream_anime', JSON.stringify(anime));
        resolve();
      }, 200);
    });
  }

  saveEpisode(animeId, episodeData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let anime = JSON.parse(localStorage.getItem('anistream_anime')) || [];
        const animeIdx = anime.findIndex(a => a.id === animeId);
        if (animeIdx === -1) {
          reject(new Error("Associated anime entry not found."));
          return;
        }

        const currentEpisodes = anime[animeIdx].episodes || [];
        const epIdx = currentEpisodes.findIndex(e => e.id === episodeData.id);

        if (epIdx !== -1) {
          currentEpisodes[epIdx] = { ...currentEpisodes[epIdx], ...episodeData };
        } else {
          currentEpisodes.push(episodeData);
        }

        currentEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
        anime[animeIdx].episodes = currentEpisodes;
        anime[animeIdx].episodesCount = currentEpisodes.length;

        localStorage.setItem('anistream_anime', JSON.stringify(anime));
        resolve(episodeData);
      }, 300);
    });
  }

  getBanners() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const banners = JSON.parse(localStorage.getItem('anistream_banners')) || [];
        resolve(banners);
      }, 200);
    });
  }

  saveBanner(bannerData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let banners = JSON.parse(localStorage.getItem('anistream_banners')) || [];
        const index = banners.findIndex(b => b.id === bannerData.id);
        if (index !== -1) {
          banners[index] = { ...banners[index], ...bannerData };
        } else {
          banners.push(bannerData);
        }
        localStorage.setItem('anistream_banners', JSON.stringify(banners));
        resolve(bannerData);
      }, 300);
    });
  }

  getWatchlist(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allWatchlists = JSON.parse(localStorage.getItem('anistream_watchlist')) || {};
        resolve(allWatchlists[userId] || []);
      }, 200);
    });
  }

  toggleWatchlist(userId, animeItem) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allWatchlists = JSON.parse(localStorage.getItem('anistream_watchlist')) || {};
        let userWatchlist = allWatchlists[userId] || [];
        
        const existsIdx = userWatchlist.findIndex(item => item.id === animeItem.id);
        let added = false;

        if (existsIdx !== -1) {
          userWatchlist = userWatchlist.filter(item => item.id !== animeItem.id);
        } else {
          userWatchlist.push({
            id: animeItem.id,
            title: animeItem.title,
            poster: animeItem.poster,
            genres: animeItem.genres,
            rating: animeItem.rating,
            status: animeItem.status,
            year: animeItem.year,
            addedAt: new Date().toISOString()
          });
          added = true;
        }

        allWatchlists[userId] = userWatchlist;
        localStorage.setItem('anistream_watchlist', JSON.stringify(allWatchlists));
        resolve({ added, watchlist: userWatchlist });
      }, 250);
    });
  }

  getHistory(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allHistories = JSON.parse(localStorage.getItem('anistream_history')) || {};
        resolve(allHistories[userId] || []);
      }, 200);
    });
  }

  updateWatchProgress(userId, progressData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allHistories = JSON.parse(localStorage.getItem('anistream_history')) || {};
        let userHistory = allHistories[userId] || [];

        const key = `${progressData.animeId}_${progressData.episodeId}`;
        const existingIdx = userHistory.findIndex(h => h.key === key);

        const newRecord = {
          key,
          ...progressData,
          lastWatchedAt: new Date().toISOString()
        };

        if (existingIdx !== -1) {
          userHistory[existingIdx] = newRecord;
        } else {
          userHistory.push(newRecord);
        }

        // Sort so the most recently watched episodes appear first
        userHistory.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));

        allHistories[userId] = userHistory;
        localStorage.setItem('anistream_history', JSON.stringify(allHistories));
        resolve(userHistory);
      }, 100);
    });
  }

  clearHistory(userId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allHistories = JSON.parse(localStorage.getItem('anistream_history')) || {};
        allHistories[userId] = [];
        localStorage.setItem('anistream_history', JSON.stringify(allHistories));
        resolve([]);
      }, 200);
    });
  }
}

// In the future, real Firebase initialization code can be written here:
// Example:
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);

// Exporting mock configuration
export const authService = new MockAuthService();
export const dbService = new MockDbService();
export { isFirebaseConfigured };
