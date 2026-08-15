import { useState, useEffect } from 'react'
import { AuthView } from './views/AuthView';
import { useAuth } from './context/AuthContext';

import './App.css';

function App() {
  const { usuario, carregando, logout} = useAuth()

  if (carregando) {

  }
}

export default App
