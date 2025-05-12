const axios = require('axios');
const logger = require('../utils/logger');

class ImageAnalyzer {
    constructor() {
        this.registryBase = 'https://registry-1.docker.io/v2';
        this.authBase = 'https://auth.docker.io/token';
    }

    async getAuthToken(repository) {
        try {
            const url = `${this.authBase}?service=registry.docker.io&scope=repository:${repository}:pull`;
            const response = await axios.get(url);
            return response.data.token;
        } catch (error) {
            logger.warn(`Failed to get auth token: ${error.message}`);
            return null;
        }
    }

    async getManifest(repository, tag = 'latest') {
        try {
            const token = await this.getAuthToken(repository);
            const headers = {
                'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = `${this.registryBase}/${repository}/manifests/${tag}`;
            logger.info(`Fetching manifest for ${repository}:${tag}`);
            
            const response = await axios.get(url, { headers });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Tag '${tag}' not found for repository '${repository}'`);
            }
            throw new Error(`Failed to get manifest: ${error.message}`);
        }
    }

    async analyzeImageLayers(repository, tag = 'latest') {
        try {
            const manifest = await this.getManifest(repository, tag);
            
            if (!manifest.layers) {
                logger.warn('No layers found in manifest');
                return { layers: [], totalSize: 0 };
            }

            const layers = manifest.layers.map((layer, index) => ({
                index: index + 1,
                digest: layer.digest,
                size: layer.size,
                mediaType: layer.mediaType
            }));

            const totalSize = layers.reduce((sum, layer) => sum + layer.size, 0);
            
            return {
                layers,
                totalSize,
                layerCount: layers.length
            };
        } catch (error) {
            logger.error(`Layer analysis failed: ${error.message}`);
            throw error;
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = ImageAnalyzer;