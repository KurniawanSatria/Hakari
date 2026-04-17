// spotify.js

const axios = require("axios");
const config = require("./config");

class SpotifyAPI {
    constructor() {
        this.clientId = config.spotify.clientId;
        this.clientSecret = config.spotify.clientSecret;
        this.accessToken = null;
        this.tokenExpires = null;
    }

    /**
     * Get access token from Spotify
     */
    async getAccessToken() {
        const now = Date.now();
        
        // Return cached token if still valid
        if (this.accessToken && this.tokenExpires && now < this.tokenExpires) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
            const response = await axios.post(
                "https://accounts.spotify.com/api/token",
                "grant_type=client_credentials",
                {
                    headers: {
                        "Authorization": `Basic ${auth}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpires = now + response.data.expires_in * 1000;
            return this.accessToken;
        } catch (error) {
            console.error("[SPOTIFY] Error getting access token:", error.message);
            throw error;
        }
    }

    /**
     * Get user's playlists
     * @param {string} userId - Spotify user ID
     */
    async getUserPlaylists(userId) {
        try {
            const token = await this.getAccessToken();
            const response = await axios.get(
                `https://api.spotify.com/v1/users/${userId}/playlists`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    params: {
                        limit: 50,
                    },
                }
            );

            return response.data.items.map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                image: playlist.images[0]?.url,
                tracks: playlist.tracks.total,
                external_url: playlist.external_urls.spotify,
                uri: playlist.uri,
            }));
        } catch (error) {
            console.error("[SPOTIFY] Error getting user playlists:", error.message);
            throw error;
        }
    }

    /**
     * Search for playlists
     * @param {string} query - Search query
     */
    async searchPlaylists(query) {
        try {
            const token = await this.getAccessToken();
            const response = await axios.get(
                "https://api.spotify.com/v1/search",
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    params: {
                        q: query,
                        type: "playlist",
                        limit: 20,
                    },
                }
            );

            return response.data.playlists.items.map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                image: playlist.images[0]?.url,
                tracks: playlist.tracks.total,
                external_url: playlist.external_urls.spotify,
                uri: playlist.uri,
                owner: playlist.owner.display_name,
            }));
        } catch (error) {
            console.error("[SPOTIFY] Error searching playlists:", error.message);
            throw error;
        }
    }

    /**
     * Get playlist details
     * @param {string} playlistId - Spotify playlist ID
     */
    async getPlaylistDetails(playlistId) {
        try {
            const token = await this.getAccessToken();
            const response = await axios.get(
                `https://api.spotify.com/v1/playlists/${playlistId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                image: data.images[0]?.url,
                images: data.images,
                tracks: data.tracks.total,
                external_url: data.external_urls.spotify,
                uri: data.uri,
                owner: data.owner.display_name,
                followers: data.followers.total,
                public: data.public,
            };
        } catch (error) {
            console.error("[SPOTIFY] Error getting playlist details:", error.message);
            throw error;
        }
    }

    /**
     * Get playlist tracks
     * @param {string} playlistId - Spotify playlist ID
     */
    async getPlaylistTracks(playlistId, limit = 50) {
        try {
            const token = await this.getAccessToken();
            const response = await axios.get(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    params: {
                        limit,
                    },
                }
            );

            return response.data.items.map(item => ({
                id: item.track.id,
                name: item.track.name,
                artist: item.track.artists.map(a => a.name).join(", "),
                duration: item.track.duration_ms,
                external_url: item.track.external_urls.spotify,
                uri: item.track.uri,
                image: item.track.album.images[0]?.url,
            }));
        } catch (error) {
            console.error("[SPOTIFY] Error getting playlist tracks:", error.message);
            throw error;
        }
    }
}

module.exports = new SpotifyAPI();
