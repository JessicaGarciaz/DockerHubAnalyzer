const fs = require('fs');
const path = require('path');

class Config {
    constructor(configPath = null) {
        this.configPath = configPath || path.join(process.cwd(), 'config.json');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(configData);
            }
        } catch (error) {
            console.warn(`Warning: Could not load config file: ${error.message}`);
        }
        
        return this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            registry: {
                baseUrl: 'https://registry-1.docker.io/v2',
                authUrl: 'https://auth.docker.io/token',
                timeout: 10000
            },
            dockerHub: {
                baseUrl: 'https://hub.docker.com/v2',
                timeout: 5000
            },
            output: {
                format: 'console',
                logFile: 'analyzer.log',
                verbose: false
            },
            analysis: {
                includeLayerDetails: true,
                maxLayers: 100,
                timeout: 30000
            }
        };
    }

    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && current.hasOwnProperty(key)) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    set(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    save() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            return true;
        } catch (error) {
            console.error(`Failed to save config: ${error.message}`);
            return false;
        }
    }
}

module.exports = Config;