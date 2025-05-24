#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./utils/logger');
const ImageAnalyzer = require('./lib/imageAnalyzer');
const Config = require('./lib/config');
const Validator = require('./lib/validator');

class DockerHubAnalyzer {
    constructor(configPath = null) {
        this.config = new Config(configPath);
        this.apiBase = 'https://registry.hub.docker.com/v2';
        this.hubBase = this.config.get('dockerHub.baseUrl', 'https://hub.docker.com/v2');
        this.imageAnalyzer = new ImageAnalyzer(this.config);
    }

    async analyzeImage(imageName) {
        try {
            // Validate and parse image name
            const imageInfo = Validator.validateImageName(imageName);
            logger.info(`Starting analysis for Docker image: ${imageInfo.original}`);
            
            const repository = Validator.sanitizeRepositoryName(imageInfo.repository);
            const tag = imageInfo.tag;
            const repoInfo = await this.getRepositoryInfo(repository);
            
            console.log('\n=== Repository Information ===');
            console.log(`Name: ${repoInfo.name}`);
            console.log(`Description: ${repoInfo.description || 'No description'}`);
            console.log(`Stars: ${repoInfo.star_count || 0}`);
            console.log(`Pulls: ${repoInfo.pull_count || 0}`);
            console.log(`Last Updated: ${repoInfo.last_updated || 'Unknown'}`);
            
            if (this.config.get('analysis.includeLayerDetails', true)) {
                try {
                    const layerInfo = await this.imageAnalyzer.analyzeImageLayers(repository, tag);
                    console.log('\n=== Layer Analysis ===');
                    console.log(`Total Layers: ${layerInfo.layerCount}`);
                    console.log(`Total Size: ${this.imageAnalyzer.formatSize(layerInfo.totalSize)}`);
                    
                    const maxLayers = this.config.get('analysis.maxLayers', 100);
                    const layersToShow = layerInfo.layers.slice(0, maxLayers);
                    
                    console.log('\nLayer Details:');
                    layersToShow.forEach(layer => {
                        console.log(`  Layer ${layer.index}: ${this.imageAnalyzer.formatSize(layer.size)}`);
                    });
                    
                    if (layerInfo.layers.length > maxLayers) {
                        console.log(`  ... and ${layerInfo.layers.length - maxLayers} more layers`);
                    }
                } catch (layerError) {
                    logger.warn(`Layer analysis failed: ${layerError.message}`);
                    console.log('\n=== Layer Analysis ===');
                    console.log('Layer analysis unavailable for this image');
                }
            }
            
            logger.info(`Successfully analyzed image: ${imageName}`);
            return repoInfo;
        } catch (error) {
            logger.error(`Failed to analyze image ${imageName}: ${error.message}`);
            throw error;
        }
    }

    async getRepositoryInfo(repository) {
        try {
            const url = `${this.hubBase}/repositories/${repository}/`;
            logger.info(`Fetching repository info from: ${url}`);
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Repository '${repository}' not found on Docker Hub`);
            }
            throw new Error(`Failed to fetch repository info: ${error.message}`);
        }
    }
}

const program = new Command();

program
    .name('dockerhub-analyzer')
    .description('Analyze Docker Hub repositories and extract insights')
    .version('0.1.0');

program
    .command('analyze')
    .description('Analyze a Docker image')
    .requiredOption('-i, --image <image>', 'Docker image to analyze (e.g., nginx:latest)')
    .option('-c, --config <path>', 'Custom config file path')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--no-layers', 'Skip layer analysis')
    .action(async (options) => {
        try {
            // Validate inputs
            const configPath = Validator.validateConfigPath(options.config);
            const analyzer = new DockerHubAnalyzer(configPath);
            
            if (options.verbose) {
                analyzer.config.set('output.verbose', true);
            }
            
            if (!options.layers) {
                analyzer.config.set('analysis.includeLayerDetails', false);
            }
            
            await analyzer.analyzeImage(options.image);
        } catch (error) {
            if (error.message.includes('Invalid Docker image') || error.message.includes('Config path')) {
                logger.error(`Input validation failed: ${error.message}`);
            } else {
                logger.error(`Analysis failed: ${error.message}`);
            }
            process.exit(1);
        }
    });

program
    .command('config')
    .description('Show current configuration')
    .option('-c, --config <path>', 'Config file path')
    .action((options) => {
        try {
            const configPath = Validator.validateConfigPath(options.config);
            const config = new Config(configPath);
            console.log('Current Configuration:');
            console.log(JSON.stringify(config.config, null, 2));
        } catch (error) {
            logger.error(`Config operation failed: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('info')
    .description('Show tool information and examples')
    .action(() => {
        console.log('DockerHub Analyzer v0.1.0');
        console.log('');
        console.log('Examples:');
        console.log('  dockerhub-analyzer analyze -i nginx');
        console.log('  dockerhub-analyzer analyze -i ubuntu:20.04 --verbose');
        console.log('  dockerhub-analyzer analyze -i redis:alpine --no-layers');
        console.log('  dockerhub-analyzer config');
        console.log('');
        console.log('For more help: dockerhub-analyzer --help');
    });

// Fallback for backward compatibility
program
    .option('-i, --image <image>', '(deprecated) Use "analyze -i <image>" instead')
    .option('-c, --config <path>', 'Config file path')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options) => {
        if (options.image) {
            console.log('Note: Direct --image option is deprecated. Use "analyze -i <image>" instead.\n');
            
            try {
                const configPath = Validator.validateConfigPath(options.config);
                const analyzer = new DockerHubAnalyzer(configPath);
                
                if (options.verbose) {
                    analyzer.config.set('output.verbose', true);
                }
                
                await analyzer.analyzeImage(options.image);
            } catch (error) {
                if (error.message.includes('Invalid Docker image') || error.message.includes('Config path')) {
                    logger.error(`Input validation failed: ${error.message}`);
                } else {
                    logger.error(`Analysis failed: ${error.message}`);
                }
                process.exit(1);
            }
        }
    });

program.parse();