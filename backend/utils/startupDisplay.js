const consoleUtils = require('./consoleUtils');
const mongoose = require('mongoose');
const { version } = require('../package.json');

/**
 * Professional Startup Display for Library Management System
 * Creates a comprehensive and visually appealing server startup display
 */
class StartupDisplay {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Display compact startup information
   */
  async displayStartup(port, environment = 'development') {
    try {
      // Clear console for clean display
      consoleUtils.clearConsole();

      // Simple title
      const title = await consoleUtils.createTitle();
      console.log('\n' + title);

      // Compact server info
      const url = `http://localhost:${port}`;
      const startupTime = Date.now() - this.startTime;

      console.log(consoleUtils.createSeparator('─', 60, 'cyan'));
      console.log(`${consoleUtils.symbols.success} Server: ${consoleUtils.colors.success('Running')} | Port: ${consoleUtils.colors.highlight(port)} | Env: ${consoleUtils.colors.warning(environment.toUpperCase())}`);
      console.log(`${consoleUtils.symbols.database} Database: ${await this.getDatabaseStatus()}`);
      console.log(`${consoleUtils.symbols.rocket} Ready in ${startupTime}ms | ${consoleUtils.colors.highlight(url)}`);

      // Compact endpoints info
      console.log(consoleUtils.createSeparator('─', 60, 'cyan'));
      console.log(`${consoleUtils.symbols.api} Endpoints: /health | /api/auth | /api/books | /api-docs`);

      // Security warnings (compact)
      const warnings = await this.getSecurityWarnings(environment);
      if (warnings.length > 0) {
        console.log(`${consoleUtils.symbols.warning} ${consoleUtils.colors.warning(warnings.join(' | '))}`);
      }

      console.log(consoleUtils.createSeparator('─', 60, 'green'));
      console.log(consoleUtils.colors.bold.green(`🎉 Ready! Visit: ${consoleUtils.colors.highlight(url)}\n`));

    } catch (error) {
      consoleUtils.logError('Failed to display startup information', error);
    }
  }

  /**
   * Get compact database status
   */
  async getDatabaseStatus() {
    try {
      const isConnected = mongoose.connection.readyState === 1;
      return isConnected ?
        consoleUtils.colors.success('Connected') :
        consoleUtils.colors.error('Disconnected');
    } catch (error) {
      return consoleUtils.colors.error('Error');
    }
  }

  /**
   * Get compact security warnings
   */
  async getSecurityWarnings(environment) {
    const warnings = [];

    // Check for default JWT secret
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
      warnings.push('Default JWT');
    }

    // Check for development environment
    if (environment === 'development') {
      warnings.push('Dev Mode');
    }

    // Check for missing environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      warnings.push(`Missing: ${missingVars.join(', ')}`);
    }

    return warnings;
  }



  /**
   * Display shutdown message
   */
  displayShutdown() {
    console.log('\n' + consoleUtils.createSeparator('═', 80, 'red'));
    consoleUtils.logInfo('Shutting down Library Management System...');
    
    const shutdownMessage = `
${consoleUtils.symbols.info} Closing database connections...
${consoleUtils.symbols.info} Cleaning up resources...
${consoleUtils.symbols.success} Server shutdown complete
    `;
    
    console.log(consoleUtils.createBox(shutdownMessage.trim(), {
      title: '👋 Shutdown',
      borderColor: 'yellow',
      padding: 1
    }));
    
    console.log(consoleUtils.colors.bold.yellow('\nThank you for using Library Management System! 📚\n'));
  }
}

module.exports = new StartupDisplay();
