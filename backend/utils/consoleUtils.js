const chalk = require('chalk');
const boxen = require('boxen');
const figlet = require('figlet');
const Table = require('cli-table3');
const gradient = require('gradient-string');

/**
 * Professional Console Output Utilities for Library Management System
 * Provides styled console output with colors, boxes, and ASCII art
 */
class ConsoleUtils {
  constructor() {
    // Define color themes
    this.colors = {
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      highlight: chalk.cyan,
      muted: chalk.gray,
      bold: chalk.bold,
      dim: chalk.dim
    };

    // Define symbols
    this.symbols = {
      success: '✓',
      error: '✗',
      warning: '⚠️',
      info: 'ℹ️',
      rocket: '🚀',
      book: '📚',
      gear: '🔧',
      shield: '🛡️',
      database: '🗄️',
      api: '🔗'
    };
  }

  /**
   * Create ASCII art title
   */
  async createTitle(text = 'LIBRARY MGMT') {
    return new Promise((resolve) => {
      figlet(text, {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      }, (err, data) => {
        if (err) {
          // Fallback to simple text if figlet fails
          resolve(chalk.bold.cyan(`\n${text}\n`));
        } else {
          resolve(gradient.rainbow(data));
        }
      });
    });
  }

  /**
   * Create a styled box with content
   */
  createBox(content, options = {}) {
    const defaultOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: 'black'
    };

    return boxen(content, { ...defaultOptions, ...options });
  }

  /**
   * Create server status display
   */
  createServerStatus(port, environment, url) {
    const statusItems = [
      `${this.symbols.success} ${this.colors.bold('Server Status:')} ${this.colors.success('Running')}`,
      `${this.symbols.gear} ${this.colors.bold('Environment:')} ${this.colors.warning(environment.toUpperCase())}`,
      `${this.symbols.api} ${this.colors.bold('Port:')} ${this.colors.highlight(port)}`,
      `${this.symbols.rocket} ${this.colors.bold('URL:')} ${this.colors.highlight(url)}`
    ];

    return statusItems.join('\n');
  }

  /**
   * Create API endpoints table
   */
  createEndpointsTable() {
    const table = new Table({
      head: [
        chalk.bold.cyan('Method'),
        chalk.bold.cyan('Endpoint'),
        chalk.bold.cyan('Description')
      ],
      colWidths: [10, 35, 45],
      style: {
        head: [],
        border: ['cyan']
      }
    });

    const endpoints = [
      ['GET', '/health', 'Server health check'],
      ['POST', '/api/auth/register', 'User registration'],
      ['POST', '/api/auth/login', 'User authentication'],
      ['GET', '/api/books', 'Browse books catalog'],
      ['POST', '/api/books', 'Add new book (Librarian)'],
      ['POST', '/api/borrows', 'Borrow a book'],
      ['GET', '/api/reviews', 'Book reviews'],
      ['GET', '/api/categories', 'Book categories'],
      ['POST', '/api/contact', 'Contact messages'],
      ['GET', '/api-docs', 'API Documentation (Swagger)']
    ];

    endpoints.forEach(([method, endpoint, description]) => {
      const methodColor = method === 'GET' ? chalk.green : 
                         method === 'POST' ? chalk.blue : 
                         method === 'PUT' ? chalk.yellow : 
                         chalk.red;
      
      table.push([
        methodColor(method),
        chalk.cyan(endpoint),
        chalk.white(description)
      ]);
    });

    return table.toString();
  }

  /**
   * Create development mode indicators
   */
  createDevModeInfo() {
    const devFeatures = [
      `${this.symbols.gear} Hot reload enabled`,
      `${this.symbols.info} Detailed logging active`,
      `${this.symbols.shield} CORS enabled for localhost:3000`,
      `${this.symbols.database} MongoDB connection monitoring`
    ];

    return devFeatures.map(feature => this.colors.muted(feature)).join('\n');
  }

  /**
   * Create security warnings display
   */
  createSecurityWarnings(warnings = []) {
    if (warnings.length === 0) return '';

    const warningBox = warnings.map(warning => 
      `${this.symbols.warning} ${this.colors.warning(warning)}`
    ).join('\n');

    return this.createBox(warningBox, {
      title: chalk.bold.red('Security Warnings'),
      borderColor: 'red',
      padding: 1
    });
  }

  /**
   * Create database status display
   */
  createDatabaseStatus(isConnected, host = 'localhost') {
    const status = isConnected ? 
      `${this.symbols.success} ${this.colors.success('Connected')}` :
      `${this.symbols.error} ${this.colors.error('Disconnected')}`;

    return `${this.symbols.database} ${this.colors.bold('Database:')} ${status} ${this.colors.muted(`(${host})`)}\n`;
  }

  /**
   * Log success message
   */
  logSuccess(message) {
    console.log(`${this.colors.success(this.symbols.success)} ${this.colors.success(message)}`);
  }

  /**
   * Log error message
   */
  logError(message, error = null) {
    console.log(`${this.colors.error(this.symbols.error)} ${this.colors.error(message)}`);
    if (error && process.env.NODE_ENV === 'development') {
      console.log(this.colors.muted(error.stack || error.message));
    }
  }

  /**
   * Log warning message
   */
  logWarning(message) {
    console.log(`${this.colors.warning(this.symbols.warning)} ${this.colors.warning(message)}`);
  }

  /**
   * Log info message
   */
  logInfo(message) {
    console.log(`${this.colors.info(this.symbols.info)} ${this.colors.info(message)}`);
  }

  /**
   * Create separator line
   */
  createSeparator(char = '─', length = 80, color = 'cyan') {
    return chalk[color](char.repeat(length));
  }

  /**
   * Clear console and show cursor
   */
  clearConsole() {
    process.stdout.write('\x1Bc');
  }
}

module.exports = new ConsoleUtils();
