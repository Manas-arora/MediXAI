import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { FaBrain, FaChartPie, FaMagic } from "react-icons/fa";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

// ✅ FIXED PATHS (RELATIVE — IMPORTANT)
import img1 from "C:/Manas/MediXAI/frontend/src/assets/images/img1.jpg";
import img2 from "C:/Manas/MediXAI/frontend/src/assets/images/img2.jpg";
import img3 from "C:/Manas/MediXAI/frontend/src/assets/images/img3.jpg";
import img4 from "C:/Manas/MediXAI/frontend/src/assets/images/img4.jpg";
import img5 from "C:/Manas/MediXAI/frontend/src/assets/images/img5.jpg";


const visuals = [img1, img2, img3, img4, img5];

function Home() {
  const navigate = useNavigate();

  // ✅ STEP 1: STATE
  const [index, setIndex] = useState(0);

  // ✅ STEP 2: AUTO SLIDE LOGIC
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % visuals.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="content">

        {/* HERO */}
        <motion.div 
          className="hero-split"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >

          {/* LEFT */}
          <div className="hero-left">

            <h1 className="hero-title">MediXAI</h1>

            <TypeAnimation
              sequence={[
                "Explainable AI for drug decisions",
                1500,
                "Understand why a drug works or fails",
                1500,
                "Analyze patient reviews with clarity",
                1500,
              ]}
              wrapper="p"
              speed={50}
              repeat={Infinity}
              className="hero-subtitle"
            />

            {/* ACTIONS */}
            <div className="hero-buttons">

              <button onClick={() => navigate("/dashboard")}>
                Explore Drug Insights
              </button>

              <button onClick={() => navigate("/explain")}>
                Analyze a Review
              </button>

              <button onClick={() => navigate("/?tour=true")}>
                Watch Demo
              </button>

              <button onClick={() => navigate("/checkup")}>
                🩺 AI Checkup
              </button>

            </div>
          </div>

          {/* RIGHT (IMAGE SLIDER STARTED) */}
          <div className="hero-right">
            <div className="carousel-wrapper">
              <div className="carousel-container">
                {visuals.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="visual"
                    className={`carousel-img ${i === index ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </motion.div>

        {/* SECTION LABEL */}
        <p className="section-label">FEATURES</p>

        {/* FEATURES */}
        <motion.div 
          className="features"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } }
          }}
        >

          {[
            {
              icon: <FaBrain />,
              title: "Explain AI",
              desc: "Understand why the model made a prediction using SHAP-based explanations."
            },
            {
              icon: <FaChartPie />,
              title: "Drug Insights",
              desc: "View benefits, limitations, and sentiment trends for drugs and conditions."
            },
            {
              icon: <FaMagic />,
              title: "What-If Analysis",
              desc: "Modify reviews and observe how predictions change in real-time."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              className="feature-card"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <h3>{item.icon} {item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}

        </motion.div>

        {/* CTA */}
        <motion.div 
          className="cta-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Make Better Decisions with AI</h2>

          <p>
            Explore drug effectiveness, identify side effects, and understand
            patient experiences using explainable AI insights.
          </p>

          <div className="cta-buttons">
            <button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>

            <button onClick={() => navigate("/?tour=true")}>
              View Guided Demo
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default Home;