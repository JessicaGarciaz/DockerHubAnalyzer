#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class DockerHubAnalyzer {
    constructor() {
        this.apiBase = 'https://registry.hub.docker.com/v2';
        this.hubBase = 'https://hub.docker.com/v2';
    }

    async analyzeImage(imageName) {
        try {
            console.log(`Analyzing Docker image: ${imageName}`);
            
            const [repository, tag = 'latest'] = imageName.split(':');
            const repoInfo = await this.getRepositoryInfo(repository);
            
            console.log('\n=== Repository Information ===');
            console.log(`Name: ${repoInfo.name}`);
            console.log(`Description: ${repoInfo.description || 'No description'}`);
            console.log(`Stars: ${repoInfo.star_count || 0}`);
            console.log(`Pulls: ${repoInfo.pull_count || 0}`);
            console.log(`Last Updated: ${repoInfo.last_updated || 'Unknown'}`);
            
            return repoInfo;
        } catch (error) {
            console.error(`Error analyzing image: ${error.message}`);
            process.exit(1);
        }
    }

    async getRepositoryInfo(repository) {
        const url = `${this.hubBase}/repositories/${repository}/`;
        const response = await axios.get(url);
        return response.data;
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
            console.error('Please specify an image with --image option');
            process.exit(1);
        }
        
        const analyzer = new DockerHubAnalyzer();
        await analyzer.analyzeImage(options.image);
    });

program.parse();