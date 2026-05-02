import React from "react";
import { Link } from "react-router-dom";

function Navbar({ toggleTheme, theme }) {
  return (
    <div
      style={{
        ...styles.navbar,
        background: theme === "dark" ? "#1e293b" : "#ffffff",
        color: theme === "dark" ? "white" : "#0f172a",
        borderBottom: theme === "light" ? "1px solid #e2e8f0" : "none"
      }}
    >
      <h2 style={styles.logo}>MediXAI</h2>

      <div style={styles.rightSection}>
        <Link to="/" style={{ ...styles.link, color: theme === "dark" ? "white" : "#0f172a" }}>Home</Link>
        <Link to="/explain" style={{ ...styles.link, color: theme === "dark" ? "white" : "#0f172a" }}>Explain</Link>
        <Link to="/dashboard" style={{ ...styles.link, color: theme === "dark" ? "white" : "#0f172a" }}>Dashboard</Link>
        <Link to="/checkup" style={{ ...styles.link, color: theme === "dark" ? "white" : "#0f172a" }}>CheckUp</Link>
        <Link to="/help" style={{ ...styles.link, color: theme === "dark" ? "white" : "#0f172a" }}>Help</Link>
        <Link to="/auth" style={{ ...styles.link, color: theme === "dark" ? "white" : "#0f172a" }}>Login</Link>

        {/* 🔥 PREMIUM TOGGLE */}
        <div
          onClick={toggleTheme}
          style={{
            marginLeft: "20px",
            cursor: "pointer"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "25px",
              borderRadius: "20px",
              background: theme === "dark" ? "#334155" : "#e2e8f0",
              position: "relative",
              transition: "0.3s"
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: theme === "dark" ? "#6366f1" : "#22c55e",
                position: "absolute",
                top: "2.5px",
                left: theme === "dark" ? "3px" : "27px",
                transition: "0.3s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
  },
  logo: {
    margin: 0,
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
  },
  link: {
    marginLeft: "15px",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default Navbar;