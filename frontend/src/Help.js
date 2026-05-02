import React from "react";
import "./App.css";

function Help() {
  return (
    <div className="page">
      <div className="content">

        <h1 className="title">Help & Support</h1>

        {/* 🔹 OVERVIEW */}
        <div className="help-section">
          <h3> What is MediXAI?</h3>
          <p>
            MediXAI is an Explainable AI platform that analyzes drug reviews and
            explains the reasoning behind sentiment predictions. It helps users
            understand not just the result, but also the factors influencing it.
          </p>
        </div>

        {/* 🔹 EXPLAINABLE AI */}
        <div className="help-section">
          <h3> What is Explainable AI (XAI)?</h3>
          <p>
            Explainable AI refers to techniques that make machine learning models
            more transparent. Instead of acting as a black box, XAI systems show
            how and why a prediction was made.
          </p>
        </div>

        {/* 🔹 SHAP */}
        <div className="help-section">
          <h3> What is SHAP?</h3>
          <p>
            SHAP (SHapley Additive exPlanations) is a method used to interpret
            model predictions. It assigns importance values to each word or feature,
            showing how they contributed to the final output.
          </p>
        </div>

        {/* 🔹 HOW IT WORKS (EXPLAIN FEATURE) */}
        <div className="help-section">
          <h3> How does MediXAI work?</h3>
          <ul>
            <li>Input a drug review</li>
            <li>The model predicts sentiment (Positive / Neutral / Negative)</li>
            <li>SHAP highlights important words</li>
            <li>The system generates a human-readable explanation</li>
          </ul>
        </div>

        {/* 🔥 NEW — HOW TO USE PRODUCT */}
        <div className="help-section">
          <h3> How to Use the Platform</h3>
          <p><b>Dashboard:</b> Select a drug and condition to view insights, benefits, and side effects.</p>
          <p><b>Compare:</b> Compare two drugs based on real patient sentiment.</p>
          <p><b>Explain:</b> Click on any review to understand the model’s reasoning.</p>
          <p><b>CheckUp:</b> Enter your symptoms to get a predicted condition and recommended treatment.</p>
        </div>

        {/* 🔥 NEW — FEATURES */}
        <div className="help-section">
          <h3> Key Features</h3>
          <ul>
            <li>Drug sentiment analysis from real-world reviews</li>
            <li>Benefits and side-effect insight extraction</li>
            <li>Drug comparison system</li>
            <li>Explainable AI (SHAP) for transparency</li>
            <li>Symptom-based disease prediction</li>
          </ul>
        </div>

        {/* 🔥 NEW — LIMITATIONS */}
        <div className="help-section">
          <h3> Limitations</h3>
          <p>
            This system is designed for educational and research purposes.
            Predictions are based on datasets and machine learning models,
            and should not be considered as medical advice.
          </p>
        </div>

        {/* 🔥 NEW — SUPPORT */}
        <div className="help-section">
          <h3>📞 Support</h3>
          <p>
            For queries or feedback, please contact:
          </p>
          <p>
            📧 support@medixai.com <br />
            ☎ +91-6398691300
          </p>
        </div>

      </div>
    </div>
  );
}

export default Help;