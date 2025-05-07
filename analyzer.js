#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./utils/logger');

class DockerHubAnalyzer {
    constructor() {
        this.apiBase = 'https://registry.hub.docker.com/v2';
        this.hubBase = 'https://hub.docker.com/v2';
    }

    async analyzeImage(imageName) {
        try {
            logger.info(`Starting analysis for Docker image: ${imageName}`);
            
            const [repository, tag = 'latest'] = imageName.split(':');
            const repoInfo = await this.getRepositoryInfo(repository);
            
            console.log('\n=== Repository Information ===');
            console.log(`Name: ${repoInfo.name}`);
            console.log(`Description: ${repoInfo.description || 'No description'}`);
            console.log(`Stars: ${repoInfo.star_count || 0}`);
            console.log(`Pulls: ${repoInfo.pull_count || 0}`);
            console.log(`Last Updated: ${repoInfo.last_updated || 'Unknown'}`);
            
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
    .description('Analyze Docker Hub repositories')
    .version('0.1.0');

program
    .option('-i, --image <image>', 'Docker image to analyze')
    .action(async (options) => {
        if (!options.image) {
            logger.error('No image specified. Use --image option.');
            process.exit(1);
        }
        
        const analyzer = new DockerHubAnalyzer();
        try {
            await analyzer.analyzeImage(options.image);
        } catch (error) {
            logger.error(`Analysis failed: ${error.message}`);
            process.exit(1);
        }
    });

program.parse();