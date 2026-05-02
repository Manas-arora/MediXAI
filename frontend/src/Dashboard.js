import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { useLocation, useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [drug, setDrug] = useState("");
  const [condition, setCondition] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [drugOptions, setDrugOptions] = useState([]);
  const [conditionOptions, setConditionOptions] = useState([]);

  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [suggestedDrug, setSuggestedDrug] = useState("");
  const [comparison, setComparison] = useState(null);

  const [mode, setMode] = useState("patient");

  const location = useLocation();
  const navigate = useNavigate();
  const isTour = new URLSearchParams(location.search).get("tour") === "true";

  // 🔹 FETCH DRUGS
  useEffect(() => {
    const fetchDrugs = async () => {
      const drugsRes = await axios.get("http://localhost:8000/get-drugs");
      const topRes = await axios.get("http://localhost:8000/get-top-drugs");

      const merged = [...new Set([...topRes.data, ...drugsRes.data.drugs])];

      setDrugOptions(merged.map((d) => ({ value: d, label: d })));
    };
    fetchDrugs();
  }, []);

  // 🔹 FETCH CONDITIONS
  useEffect(() => {
    const fetchConditions = async () => {
      if (drug) {
        const res = await axios.get(
          "http://localhost:8000/get-conditions-by-drug",
          { params: { drug } }
        );

        setConditionOptions(res.data.map((c) => ({ value: c, label: c })));
      } else {
        const res = await axios.get("http://localhost:8000/get-conditions");

        setConditionOptions(
          res.data.conditions.map((c) => ({ value: c, label: c }))
        );
      }
    };

    fetchConditions();
  }, [drug]);

  // 🔹 SUGGESTION LOGIC
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!drug || !condition) return;

      try {
        const res = await axios.get("http://localhost:8000/suggest-alternative", {
          params: { drug, condition }
        });

        if (res.data.suggestion) {
          setDrug1(drug);
          setDrug2(res.data.suggestion);
          setSuggestedDrug(res.data.suggestion);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchSuggestion();
  }, [drug, condition]);

  // 🔹 ANALYZE
  const analyzeDrug = async () => {
    if (!drug || !condition) return;

    setLoading(true);

    try {
      const res = await axios.get("http://localhost:8000/analyze-drug", {
        params: { drug, condition },
      });

      setTimeout(() => {
        setData(res.data);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // 🔹 COMPARE (🔥 FIXED WITHOUT TOUCHING OTHER LOGIC)
  const compareDrugs = async () => {
    if (!drug1 || !drug2) {
      alert("Please enter both drugs");
      return;
    }

    if (!condition) {
      alert("Please select a condition first");
      return;
    }

    // 🔥 reset previous result
    setComparison(null);

    try {
      const res = await axios.get("http://localhost:8000/compare-drugs", {
        params: {
          drug1: drug1.toLowerCase().trim(),
          drug2: drug2.toLowerCase().trim(),
          condition: condition.toLowerCase().trim()
        },
      });

      console.log("COMPARE RESPONSE:", res.data);

      if (!res.data || res.data.error) {
        setComparison({ error: res.data?.error || "No data found" });
      } else {
        setComparison(res.data);
      }

    } catch (err) {
      console.error(err);
      setComparison({ error: "Failed to fetch comparison" });
    }
  };

  // 🔥 SCROLL REVEAL
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [data]);

  // 🔥 3D TILT EFFECT (SAFE)
  useEffect(() => {
    const cards = document.querySelectorAll(".card, .insight-card, .review-card");

    const handleMove = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotateX = -(y / rect.height - 0.5) * 6;
      const rotateY = (x / rect.width - 0.5) * 6;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const reset = (card) => {
      card.style.transform = "rotateX(0) rotateY(0)";
    };

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => handleMove(e, card));
      card.addEventListener("mouseleave", () => reset(card));
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("mousemove", handleMove);
        card.removeEventListener("mouseleave", reset);
      });
    };
  }, [data]);

  const chartData = data && {
    labels: Object.keys(data.sentiment_distribution),
    datasets: [
      {
        data: Object.values(data.sentiment_distribution),
        backgroundColor: ["#22c55e", "#ef4444", "#facc15"],
      },
    ],
  };

  const renderInsightCards = (items, color) => {
    return items.map((item, i) => (
      <div key={i} className="insight-card reveal">
        <div className="insight-header">
          <h4>{item.category}</h4>
          <span>{item.percentage}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${item.percentage}%`,
              background: color
            }}
          ></div>
        </div>

        <p className="keywords">
          {item.keywords.join(", ")}
        </p>
      </div>
    ));
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      color: "white",
    }),
    singleValue: (base) => ({
      ...base,
      color: "white",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1e293b",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#334155" : "#1e293b",
      color: "white",
    }),
  };

  return (
    <div className="page">
      <div className="content">
        <h1 className="title">Drug Dashboard</h1>

        {isTour && (
          <div className="tour-box">
            📊 Explore insights across drug reviews
          </div>
        )}

        <div className="mode-toggle">
          <button
            className={mode === "patient" ? "active" : ""}
            onClick={() => setMode("patient")}
          >
            Patient
          </button>
          <button
            className={mode === "doctor" ? "active" : ""}
            onClick={() => setMode("doctor")}
          >
            Doctor
          </button>
        </div>

        <div className="input-group">
          <Select
            options={drugOptions}
            styles={customStyles}
            placeholder="Select drug..."
            onChange={(s) => {
              setDrug(s.value);
              setCondition("");
              setSuggestedDrug("");
              setComparison(null);
            }}
          />

          <Select
            options={conditionOptions}
            styles={customStyles}
            placeholder="Select condition..."
            onChange={(s) => setCondition(s.value)}
          />

          <button onClick={analyzeDrug}>Analyze</button>
        </div>

        <div className="compare-section">
          <input
            value={drug1}
            placeholder="Drug 1"
            onChange={(e) => setDrug1(e.target.value)}
          />

          <input
            value={drug2}
            placeholder="Drug 2"
            onChange={(e) => setDrug2(e.target.value)}
          />

          <button onClick={compareDrugs}>Compare</button>
        </div>

        {suggestedDrug && (
          <p className="suggestion-text">
            💡 Suggested alternative: <b>{suggestedDrug}</b>
          </p>
        )}

        {comparison && (
          <div className="compare-box">
            <h3>🔍 Drug Comparison</h3>

            {comparison.error ? (
            <p style={{ color: "#ef4444" }}>
              ⚠️ {comparison.error}
            </p>
          ) : (
            <div className="compare-grid">

              {/* Drug 1 */}
              <div className="compare-card">
                <h4>{drug1}</h4>

                <div className="bar">
                  <span>Positive</span>
                    <div className="bar-bg">
                    <div
                      className="bar-fill green"
                      style={{ width: `${comparison.drug1.positive}%` }}
                    />
                </div>
                <span>{comparison.drug1.positive}%</span>
              </div>

              <div className="bar">
                <span>Negative</span>
                <div className="bar-bg">
                  <div
                    className="bar-fill red"
                    style={{ width: `${comparison.drug1.negative}%` }}
                  />
              </div>
              <span>{comparison.drug1.negative}%</span>
          </div>

          <div className="bar">
            <span>Neutral</span>
            <div className="bar-bg">
              <div
                className="bar-fill yellow"
                style={{ width: `${comparison.drug1.neutral}%` }}
              />
            </div>
            <span>{comparison.drug1.neutral}%</span>
          </div>
        </div>

        {/* Drug 2 */}
        <div className="compare-card">
          <h4>{drug2}</h4>

          <div className="bar">
            <span>Positive</span>
            <div className="bar-bg">
              <div
                className="bar-fill green"
                style={{ width: `${comparison.drug2.positive}%` }}
              />
            </div>
            <span>{comparison.drug2.positive}%</span>
          </div>

          <div className="bar">
            <span>Negative</span>
            <div className="bar-bg">
              <div
                className="bar-fill red"
                style={{ width: `${comparison.drug2.negative}%` }}
              />
            </div>
            <span>{comparison.drug2.negative}%</span>
          </div>

          <div className="bar">
            <span>Neutral</span>
            <div className="bar-bg">
              <div
                className="bar-fill yellow"
                style={{ width: `${comparison.drug2.neutral}%` }}
              />
            </div>
            <span>{comparison.drug2.neutral}%</span>
          </div>
        </div>

      </div>
    )}
  </div>
)}

        {loading && (
          <div className="skeleton-card">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        )}

        {data && !loading && !data.error && (
          <>
            <h3>Total Reviews: {data.total_reviews}</h3>

            <div className="insight-box reveal">
              💡 {mode === "patient"
                ? data.insight
                : `Clinical view: ${data.insight}`}
            </div>

            <div className="chart-container reveal">
              <Pie data={chartData} />
            </div>

            <h3> Benefits</h3>
            <div className="insight-grid">
              {renderInsightCards(data.benefits, "#22c55e")}
            </div>

            <h3> Limitations ({data.severity})</h3>
            <div className="insight-grid">
              {renderInsightCards(data.limitations, "#ef4444")}
            </div>

            <h3> Top Positive Reviews</h3>
            {data.top_positive_reviews.map((rev, i) => (
              <div key={i} className="review-card reveal positive">{rev}</div>
            ))}

            <h3> Top Negative Reviews</h3>
            {data.top_negative_reviews.map((rev, i) => (
              <div key={i} className="review-card reveal negative">{rev}</div>
            ))}

            <h3>Top Keywords</h3>
            <div className="keyword-box">
              {data.top_keywords.map((w, i) => (
                <span key={i} className="keyword">{w}</span>
              ))}
            </div>

            <h3>Sample Reviews</h3>
            {data.sample_reviews.map((rev, i) => (
              <div
                key={i}
                className="review-card reveal"
                onClick={() =>
                  navigate(`/explain?text=${encodeURIComponent(rev)}`)
                }
              >
                {rev}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;