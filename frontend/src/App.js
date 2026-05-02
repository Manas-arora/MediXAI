import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "./Navbar";
import Explain from "./Explain";
import Dashboard from "./Dashboard";
import Home from "./Home";
import Auth from "./Auth";
import Help from "./Help";
import Checkup from "./Checkup";
import Footer from "./Footer";

/* Cursor Glow */
function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return <div className="cursor-glow" style={{ left: pos.x, top: pos.y }} />;
}

/* 🔥 TOUR FLOW */
function TourController() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const isTour = params.get("tour") === "true";

  useEffect(() => {
    if (!isTour) return;

    if (location.pathname === "/") {
      const timer = setTimeout(() => {
        navigate("/explain?demo=true&tour=true");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isTour, location.pathname, navigate]);

  return null;
}

/* Animated Routes */
function AnimatedRoutes({ toggleTheme, theme }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Home toggleTheme={toggleTheme} theme={theme} />
            </PageWrapper>
          }
        />
        <Route
          path="/explain"
          element={
            <PageWrapper>
              <Explain toggleTheme={toggleTheme} theme={theme} />
            </PageWrapper>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageWrapper>
              <Dashboard toggleTheme={toggleTheme} theme={theme} />
            </PageWrapper>
          }
        />
        <Route
          path="/checkup"
          element={
            <PageWrapper>
              <Checkup toggleTheme={toggleTheme} theme={theme} />
            </PageWrapper>
         }
       />
        <Route
          path="/auth"
          element={
            <PageWrapper>
              <Auth toggleTheme={toggleTheme} theme={theme} />
            </PageWrapper>
          }
        />
        <Route
          path="/help"
          element={
            <PageWrapper>
              <Help toggleTheme={toggleTheme} theme={theme} />
            </PageWrapper>
          }
        />
        <Route
          path="/checkup"
          element={
            <PageWrapper>
              <Checkup />
            </PageWrapper>
        }
        />
      </Routes>
    </AnimatePresence>
  );
}

/* Page Animation */
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/* MAIN */
function App() {
  const [theme, setTheme] = useState("dark");

  // ✅ LOAD THEME CORRECTLY
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);

    // 🔥 IMPORTANT FIX
    document.body.className = savedTheme;
  }, []);

  // ✅ TOGGLE THEME CORRECTLY
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";

    setTheme(newTheme);

    // 🔥 IMPORTANT FIX
    document.body.className = newTheme;

    localStorage.setItem("theme", newTheme);
  };

  return (
    <Router>
      <CursorGlow />
      <TourController />
      <Navbar toggleTheme={toggleTheme} theme={theme} />
      <AnimatedRoutes toggleTheme={toggleTheme} theme={theme} />
      <Footer />
    </Router>
  );
}

export default App;