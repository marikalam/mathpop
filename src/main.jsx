import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { playOpeningSound } from './openingSound.js';
// Fonts ship with the app (rather than loading from Google Fonts) so the
// iOS app looks right offline and doesn't contact a third party on launch.
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import '@fontsource/ibm-plex-mono/500.css';
import './App.css';
import './calm.css';

playOpeningSound();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
