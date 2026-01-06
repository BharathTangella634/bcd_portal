import React from 'react';
import tanuhLogo from '../assets/tanuh.png';
import iiscLogo from '../assets/IISc_logo.png';

const LoginPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#fff5f7', // Mild pink (Breast cancer awareness color)
      fontFamily: '"Inter", sans-serif'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <a href={process.env.REACT_APP_WEBSITE_URL} target="_blank" rel="noopener noreferrer">
          <img 
            src={tanuhLogo} 
            alt="Tanuh Logo" 
            style={{ 
              height: '96px', // Approx 1 inch
              width: '96px',  // Approx 1 inch
              objectFit: 'contain'
            }} 
          />
        </a>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#333', 
          textAlign: 'center',
          flex: '1 1 auto',
          margin: '0 20px'
        }}>
          AI enabled Breast Cancer Screening Tool
        </h1>
        <img 
          src={iiscLogo} 
          alt="IISc Logo" 
          style={{ 
            height: '96px', // Approx 1 inch
            width: '96px',  // Approx 1 inch
            objectFit: 'contain'
          }} 
        />
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', border: '1px solid #ccc', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: 'white' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Login</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="hospitalName">Hospital Name</label>
              <input type="text" id="hospitalName" name="hospitalName" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="role">Role</label>
              <select id="role" name="role" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">Select Role</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="email">Email address</label>
              <input type="email" id="email" name="email" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
              Login
            </button>
          </form>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>
              Forgot password / Reset password
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
