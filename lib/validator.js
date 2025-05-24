class Validator {
    static validateImageName(imageName) {
        if (!imageName || typeof imageName !== 'string') {
            throw new Error('Image name must be a non-empty string');
        }

        // Basic Docker image name validation
        const imageRegex = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[a-z0-9]+(?:[._-][a-z0-9]+)*)?$/i;
        
        // Handle special cases like library/nginx -> nginx
        const normalizedName = imageName.startsWith('library/') ? imageName.substring(8) : imageName;
        
        if (!imageRegex.test(normalizedName)) {
            throw new Error(`Invalid Docker image name format: ${imageName}`);
        }

        const parts = imageName.split(':');
        if (parts.length > 2) {
            throw new Error(`Invalid Docker image format. Use format: repository[:tag]`);
        }

        return {
            repository: parts[0],
            tag: parts[1] || 'latest',
            original: imageName
        };
    }

    static validateConfigPath(configPath) {
        if (!configPath) return null;
        
        if (typeof configPath !== 'string') {
            throw new Error('Config path must be a string');
        }

        // Basic path validation
        if (configPath.includes('..') || configPath.includes('//')) {
            throw new Error('Invalid config path');
        }

        return configPath;
    }

    static sanitizeRepositoryName(repository) {
        // Handle official Docker Hub images (library prefix)
        if (!repository.includes('/') && repository !== 'scratch') {
            return `library/${repository}`;
        }
        return repository;
    }
}

module.exports = Validator;