import React from 'react';
import { Globe, Linkedin, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { icon: <Globe size={20} />, url: process.env.REACT_APP_WEBSITE_URL, label: 'Website' },
    { icon: <Linkedin size={20} />, url: process.env.REACT_APP_LINKEDIN_URL, label: 'LinkedIn' },
    { icon: <Twitter size={20} />, url: process.env.REACT_APP_TWITTER_URL, label: 'Twitter' },
    { icon: <Youtube size={20} />, url: process.env.REACT_APP_YOUTUBE_URL, label: 'YouTube' },
  ];

  return (
    <footer style={{ 
      padding: '40px 20px', 
      borderTop: '1px solid #eee', 
      backgroundColor: '#fffafb', // Slightly lighter hue of the page background (#fff5f7)
      color: '#555',
      fontSize: '14px',
      lineHeight: '1.6',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '30px'
      }}>
        {/* 2-column layout for Address and Contact */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '40px', 
          width: '100%',
          textAlign: 'left'
        }}>
          {/* Left Column: Address */}
          <div>
            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}>Address:</strong>
            AI Centre of Excellence in Healthcare<br />
            Indian Institute of Science<br />
            Seventh Floor, TCS Smart-X Hub<br />
            Bengaluru, India - 560 012
          </div>

          {/* Right Column: Contact */}
          <div>
            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}>Contact Information:</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Study related details: <a href="mailto:breastcancerdetection@tanuh.ai" style={{ color: '#007bff', textDecoration: 'none' }}>breastcancerdetection@tanuh.ai</a></div>
              <div>General Email: <a href="mailto:info@tanuh.ai" style={{ color: '#007bff', textDecoration: 'none' }}>info@tanuh.ai</a></div>
              <div style={{ marginTop: '10px' }}>
                <strong>Telephone:</strong><br />
                (080) 2293 4106 &nbsp;|&nbsp; (080) 2293 4107
              </div>
            </div>
          </div>
        </div>

        {/* Social Links - Moved below address table */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {socialLinks.map((link, index) => (
            <a 
              key={index} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: '#555', 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
              title={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', width: '100%', fontSize: '12px' }}>
          Copyright 2025 by TANUH Foundation
        </div>
      </div>
    </footer>
  );
};

export default Footer;
