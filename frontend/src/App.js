import React from 'react';
import LoginPage from './pages/LoginPage';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <LoginPage />
      <Footer />
    </div>
  );
}

export default App;
