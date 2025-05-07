const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFile = 'analyzer.log') {
        this.logFile = path.join(process.cwd(), logFile);
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level}: ${message}\n`;
        
        console.log(`${level}: ${message}`);
        
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    info(message) {
        this.log(message, 'INFO');
    }

    warn(message) {
        this.log(message, 'WARN');
    }

    error(message) {
        this.log(message, 'ERROR');
    }
}

module.exports = new Logger();