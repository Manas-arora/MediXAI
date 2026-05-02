import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import { useLocation } from "react-router-dom";

function Explain() {
  const [text, setText] = useState("");
  const [compareText, setCompareText] = useState("");
  const [result, setResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [mode, setMode] = useState("patient");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const isDemo = params.get("demo") === "true";
  const isTour = params.get("tour") === "true";
  const queryText = params.get("text");

  const [demoStep, setDemoStep] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasLoadedQuery = useRef(false);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  };

  const analyze = async (inputText, setter) => {
    if (!inputText.trim()) return;

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/predict", {
        text: inputText,
      });

      setTimeout(() => {
        setter(res.data);
        setLoading(false);
      }, 700);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryText && !isDemo && !hasLoadedQuery.current) {
      hasLoadedQuery.current = true;
      setText(queryText);
      analyze(queryText, setResult);
    }
  }, [queryText, isDemo]);

  useEffect(() => {
    if (!isDemo) return;

    const demoText =
      "This medicine helped a lot but caused severe headache";

    setText("");
    setResult(null);
    setDemoStep(0);
    setActiveIndex(-1);

    const runDemo = async () => {
      speak("Starting analysis");
      await new Promise((r) => setTimeout(r, 1000));

      setDemoStep(1);
      speak("Typing the review");
      typeText(demoText);

      await new Promise((r) => setTimeout(r, 2500));

      setDemoStep(2);
      speak("Analyzing the review using explainable AI");
      analyze(demoText, setResult);
    };

    runDemo();
  }, [isDemo]);

  const typeText = (fullText) => {
    let i = 0;
    setText("");

    const interval = setInterval(() => {
      setText((prev) => prev + fullText[i]);
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 35);
  };

  useEffect(() => {
    if (!result) return;

    let i = 0;
    const words = result.input_text.split(" ");

    const interval = setInterval(() => {
      setActiveIndex(i);
      i++;
      if (i >= words.length) clearInterval(interval);
    }, 70);

    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    if (!text.trim() || isDemo || queryText) return;

    const delay = setTimeout(() => {
      analyze(text, setResult);
    }, 700);

    return () => clearTimeout(delay);
  }, [text, isDemo, queryText]);

  useEffect(() => {
    if (!compareText.trim()) {
      setCompareResult(null);
      return;
    }

    const delay = setTimeout(() => {
      analyze(compareText, setCompareResult);
    }, 700);

    return () => clearTimeout(delay);
  }, [compareText]);

  const getColor = (prediction) => {
    if (prediction === "Positive") return "#22c55e";
    if (prediction === "Negative") return "#ef4444";
    return "#facc15";
  };

  const highlightText = (text, posWords, negWords) => {
    if (!text) return "";

    return text.split(" ").map((word, i) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, "");

      let style = {};

      if (posWords.includes(clean)) {
        style = { color: "#22c55e", fontWeight: "bold" };
      } else if (negWords.includes(clean)) {
        style = { color: "#ef4444", fontWeight: "bold" };
      }

      return (
        <span
          key={i}
          style={{
            ...style,
            opacity: i <= activeIndex ? 1 : 0.2,
            transition: "0.25s",
          }}
        >
          {word}{" "}
        </span>
      );
    });
  };

  const renderCard = (res) => (
    <div className="card fade-in">
      <h2 style={{ color: getColor(res.prediction) }}>
        {res.prediction}
      </h2>

      <div className="confidence-bar">
        <div
          className="confidence-fill"
          style={{ width: `${res.confidence * 100}%` }}
        ></div>
      </div>

      <p className="confidence-text">
        {Math.round(res.confidence * 100)}% Confidence
      </p>

      <p className="confidence-label">
        {res.confidence_label}
      </p>

      <div className="highlight-box">
        <h4>Highlighted Review</h4>
        <p>
          {highlightText(
            res.input_text,
            res.positive_words || [],
            res.negative_words || []
          )}
        </p>
      </div>

      <div className="explanation">
        <h4>Explanation</h4>
        <p>
          {mode === "patient"
            ? res.explanation
            : `SHAP:
+ (${res.positive_words?.join(", ")})
- (${res.negative_words?.join(", ")})`}
        </p>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="content">
        <h1 className="title">Explain Reviews</h1>

        {isTour && (
          <div className="tour-box">
            🧠 This section explains how AI interprets reviews
          </div>
        )}

        {isDemo && (
          <>
            <div className="demo-banner">
              🚀 Demo Mode
            </div>
            <p>Step {demoStep} / 3</p>
          </>
        )}

        <div className="compare-section">
          <textarea value={text} onChange={(e) => setText(e.target.value)} />
          <textarea value={compareText} onChange={(e) => setCompareText(e.target.value)} />
        </div>

        {loading && <div className="skeleton-card"></div>}

        <div className="results">
          {result && renderCard(result)}
          {compareResult && renderCard(compareResult)}
        </div>
      </div>
    </div>
  );
}

export default Explain;