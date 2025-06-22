import React from 'react';
import './About.css';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'John Smith',
      role: 'Chief Technology Officer',
      bio: 'Experienced tech leader with 15+ years in software development',
      image: '👨‍💻'
    },
    {
      name: 'Sarah Johnson',
      role: 'Head of Human Resources',
      bio: 'HR expert specializing in employee engagement and organizational development',
      image: '👩‍💼'
    },
    {
      name: 'Mike Wilson',
      role: 'Product Manager',
      bio: 'Product strategist focused on creating user-centric solutions',
      image: '👨‍💼'
    },
    {
      name: 'Emma Davis',
      role: 'Lead Developer',
      bio: 'Full-stack developer passionate about building scalable applications',
      image: '👩‍💻'
    }
  ];

  const features = [
    {
      icon: '🚀',
      title: 'Modern Technology',
      description: 'Built with the latest technologies including React, Node.js, and MongoDB'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data storage and regular backups'
    },
    {
      icon: '📱',
      title: 'Mobile Responsive',
      description: 'Access your HRMS from any device with our responsive design'
    },
    {
      icon: '⚡',
      title: 'Fast Performance',
      description: 'Optimized for speed with real-time updates and efficient data processing'
    },
    {
      icon: '🎨',
      title: 'User-Friendly',
      description: 'Intuitive interface designed for ease of use and minimal learning curve'
    },
    {
      icon: '📊',
      title: 'Analytics & Reports',
      description: 'Comprehensive reporting tools with customizable dashboards and insights'
    }
  ];

  return (
    <div className="about-page">
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">About Our HRMS</h1>
          <p className="hero-subtitle">
            Revolutionizing Human Resource Management with Modern Technology
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="container">
          {/* Mission Section */}
          <section className="mission-section">
            <div className="section-content">
              <h2 className="section-title">Our Mission</h2>
              <p className="mission-text">
                We're dedicated to simplifying human resource management through innovative technology. 
                Our HRMS platform empowers organizations to streamline their HR processes, improve 
                employee engagement, and make data-driven decisions that drive business success.
              </p>
              <div className="mission-stats">
                <div className="mission-stat">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Companies Trust Us</div>
                </div>
                <div className="mission-stat">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Employees Managed</div>
                </div>
                <div className="mission-stat">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime Guarantee</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="features-section">
            <h2 className="section-title">Why Choose Our HRMS?</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team Section */}
          <section className="team-section">
            <h2 className="section-title">Meet Our Team</h2>
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-card">
                  <div className="team-avatar">
                    <span className="avatar-emoji">{member.image}</span>
                  </div>
                  <div className="team-info">
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-bio">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Technology Section */}
          <section className="technology-section">
            <h2 className="section-title">Technology Stack</h2>
            <div className="tech-stack">
              <div className="tech-category">
                <h3>Frontend</h3>
                <div className="tech-items">
                  <span className="tech-item">React</span>
                  <span className="tech-item">TypeScript</span>
                  <span className="tech-item">CSS3</span>
                  <span className="tech-item">React Router</span>
                </div>
              </div>
              <div className="tech-category">
                <h3>Backend</h3>
                <div className="tech-items">
                  <span className="tech-item">Node.js</span>
                  <span className="tech-item">Express.js</span>
                  <span className="tech-item">RESTful APIs</span>
                  <span className="tech-item">JWT Authentication</span>
                </div>
              </div>
              <div className="tech-category">
                <h3>Database</h3>
                <div className="tech-items">
                  <span className="tech-item">MongoDB</span>
                  <span className="tech-item">Mongoose</span>
                  <span className="tech-item">Data Encryption</span>
                  <span className="tech-item">Backup Systems</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="contact-section">
            <h2 className="section-title">Get In Touch</h2>
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>Email</h4>
                  <p>contact@hrms-company.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Phone</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h4>Address</h4>
                  <p>123 Business Ave, Suite 100<br />Tech City, TC 12345</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
