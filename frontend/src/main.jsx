import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store/store'

import { GoogleOAuthProvider } from '@react-oauth/google';


const GOOGLE_CLIENT_ID = '349148435607-7h4n5dqeqjmt4jvo74i1v1r5lugmekhp.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </Provider>

  </StrictMode>
)
