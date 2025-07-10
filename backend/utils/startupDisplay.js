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
   * Display complete startup information
   */
  async displayStartup(port, environment = 'development') {
    try {
      // Clear console for clean display
      consoleUtils.clearConsole();

      // Create ASCII art title
      const title = await consoleUtils.createTitle('LIBRARY MGMT');
      console.log(title);

      // Create subtitle
      const subtitle = consoleUtils.colors.bold.cyan('📚 Professional Library Management System 📚');
      console.log(consoleUtils.createBox(subtitle, {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderColor: 'cyan',
        textAlignment: 'center'
      }));

      // Server information
      const url = `http://localhost:${port}`;
      const serverStatus = consoleUtils.createServerStatus(port, environment, url);
      console.log(consoleUtils.createBox(serverStatus, {
        title: '🚀 Server Information',
        borderColor: 'green',
        padding: 1
      }));

      // Database status
      await this.displayDatabaseStatus();

      // API endpoints
      console.log(consoleUtils.createBox(consoleUtils.createEndpointsTable(), {
        title: '🔗 Available API Endpoints',
        borderColor: 'blue',
        padding: 1
      }));

      // Development mode info
      if (environment === 'development') {
        const devInfo = consoleUtils.createDevModeInfo();
        console.log(consoleUtils.createBox(devInfo, {
          title: '🔧 Development Mode Features',
          borderColor: 'yellow',
          padding: 1
        }));
      }

      // Security warnings
      await this.displaySecurityWarnings(environment);

      // System information
      this.displaySystemInfo();

      // Footer with useful links
      this.displayFooter(url);

      // Startup complete message
      const startupTime = Date.now() - this.startTime;
      consoleUtils.logSuccess(`Server started successfully in ${startupTime}ms`);
      
      console.log(consoleUtils.createSeparator('═', 80, 'green'));
      console.log(consoleUtils.colors.bold.green(`\n🎉 Library Management System is ready! Visit: ${consoleUtils.colors.highlight(url)}\n`));

    } catch (error) {
      consoleUtils.logError('Failed to display startup information', error);
    }
  }

  /**
   * Display database connection status
   */
  async displayDatabaseStatus() {
    try {
      const isConnected = mongoose.connection.readyState === 1;
      const host = process.env.MONGODB_URI ? 
        new URL(process.env.MONGODB_URI).host : 
        'localhost:27017';
      
      const dbStatus = consoleUtils.createDatabaseStatus(isConnected, host);
      
      if (isConnected) {
        console.log(consoleUtils.createBox(dbStatus, {
          title: '🗄️ Database Status',
          borderColor: 'green',
          padding: 1
        }));
      } else {
        console.log(consoleUtils.createBox(dbStatus, {
          title: '🗄️ Database Status',
          borderColor: 'red',
          padding: 1
        }));
        consoleUtils.logWarning('Database connection not established. Some features may not work.');
      }
    } catch (error) {
      consoleUtils.logError('Failed to check database status', error);
    }
  }

  /**
   * Display security warnings
   */
  async displaySecurityWarnings(environment) {
    const warnings = [];

    // Check for default JWT secret
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
      warnings.push('Using default JWT secret - Change in production!');
    }

    // Check for development environment
    if (environment === 'development') {
      warnings.push('Running in development mode - Not suitable for production');
    }

    // Check for missing environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      warnings.push(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Display warnings if any
    if (warnings.length > 0) {
      const warningDisplay = consoleUtils.createSecurityWarnings(warnings);
      console.log(warningDisplay);
    } else if (environment === 'production') {
      consoleUtils.logSuccess('Security configuration validated');
    }
  }

  /**
   * Display system information
   */
  displaySystemInfo() {
    const systemInfo = [
      `${consoleUtils.symbols.gear} Node.js: ${process.version}`,
      `${consoleUtils.symbols.book} App Version: v${version}`,
      `${consoleUtils.symbols.info} Platform: ${process.platform}`,
      `${consoleUtils.symbols.gear} Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    ];

    const systemDisplay = systemInfo.map(info => consoleUtils.colors.muted(info)).join('\n');
    console.log(consoleUtils.createBox(systemDisplay, {
      title: '💻 System Information',
      borderColor: 'gray',
      padding: 1
    }));
  }

  /**
   * Display footer with useful links
   */
  displayFooter(baseUrl) {
    const links = [
      `📖 API Documentation: ${consoleUtils.colors.highlight(`${baseUrl}/api-docs`)}`,
      `🏥 Health Check: ${consoleUtils.colors.highlight(`${baseUrl}/health`)}`,
      `📚 Books API: ${consoleUtils.colors.highlight(`${baseUrl}/api/books`)}`,
      `🔐 Authentication: ${consoleUtils.colors.highlight(`${baseUrl}/api/auth`)}`
    ];

    const footerContent = links.join('\n');
    console.log(consoleUtils.createBox(footerContent, {
      title: '🔗 Quick Links',
      borderColor: 'cyan',
      padding: 1
    }));
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
