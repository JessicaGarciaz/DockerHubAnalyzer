# DockerHub Analyzer

A tool to analyze Docker Hub repositories and extract insights about container usage patterns, vulnerabilities, and metadata.

## Features

- Analyze Docker images and their layers
- Extract metadata from Docker Hub repositories
- Layer-by-layer size analysis
- Repository statistics (stars, pulls, last updated)
- Detailed logging for debugging

## Installation

```bash
npm install
```

## Usage

```bash
# Analyze a Docker image (recommended)
node analyzer.js analyze -i nginx

# Analyze specific tag with verbose output
node analyzer.js analyze -i nginx:alpine --verbose

# Skip layer analysis for faster results
node analyzer.js analyze -i ubuntu:20.04 --no-layers

# Use custom config file
node analyzer.js analyze -i redis -c my-config.json

# Show current configuration
node analyzer.js config

# Show examples and info
node analyzer.js info

# View help
node analyzer.js --help
```

## Example Output

```
=== Repository Information ===
Name: library/nginx
Description: Official build of Nginx.
Stars: 15234
Pulls: 2500000000
Last Updated: 2025-04-28T10:15:30.123456Z

=== Layer Analysis ===
Total Layers: 7
Total Size: 142.48 MB

Layer Details:
  Layer 1: 32.45 MB
  Layer 2: 25.67 MB
  Layer 3: 55.23 MB
  ...
```

## TODO

- [x] Basic image analysis
- [x] Layer size analysis  
- [ ] Vulnerability scanning integration
- [ ] Report generation
- [ ] Web interface