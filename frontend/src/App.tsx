import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { Home } from './pages/Home';
import { Segmentacion } from './pages/Segmentacion';
import { Especies } from './pages/Especies';
import { Espacios } from './pages/Espacios';
import { EspacioDetalle } from './pages/EspacioDetalle';
import { Monitoreo } from './pages/Monitoreo';
import { Ranking } from './pages/Ranking';
import { Municipio } from './pages/Municipio';
import { Polinizadores } from './pages/Polinizadores';
import { Sello } from './pages/Sello';
import { SelloVerificar } from './pages/SelloVerificar';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { NotFound } from './pages/NotFound';

/** Vuelve al inicio de la página cuando cambia la ruta. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          {/* Rutas públicas: inicio, acceso y verificación de QR del Sello */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/sello/verificar/:slug" element={<SelloVerificar />} />

          {/* Módulos: solo con sesión iniciada */}
          <Route element={<RequireAuth />}>
            <Route path="/segmentacion" element={<Segmentacion />} />
            <Route path="/especies" element={<Especies />} />
            <Route path="/polinizadores" element={<Polinizadores />} />
            <Route path="/espacios" element={<Espacios />} />
            <Route path="/espacios/:id" element={<EspacioDetalle />} />
            <Route path="/monitoreo" element={<Monitoreo />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/municipio" element={<Municipio />} />
            <Route path="/sello" element={<Sello />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
