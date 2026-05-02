import React, { useState } from "react";
import axios from "axios";

function Checkup() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 NEW: Chat messages
  const [messages, setMessages] = useState([]);

  const [typingIndex, setTypingIndex] = useState(null);

  // 🔥 SIMPLE NLP (sentence → symptoms)
  const extractSymptoms = (text) => {
    const words = text
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .split(/\s+/);

    const stopwords = [
      "i","have","been","feeling","very","since","with","and",
      "the","is","am","are","was","were","it","my","me"
    ];

  const cleaned = words.filter(
    (w) => w.length > 3 && !stopwords.includes(w)
  );

  // 🔥 map common phrases → dataset symptoms
  const mapping = {
    "fever": "fever",
    "headache": "headache",
    "itching": "itching",
    "rash": "skin_rash",
    "sneezing": "continuous_sneezing",
    "chills": "chills",
    "pain": "pain",
    "stomach": "stomach_pain",
    "acidity": "acidity"
  };

  const finalSymptoms = cleaned.map(w => mapping[w] || w);

  return [...new Set(finalSymptoms)];
};

  const analyzeSymptoms = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const symptoms = extractSymptoms(input);

      const res = await axios.post(
        "http://localhost:8000/predict-from-symptoms",
        { symptoms }
      );

      const data = res.data;

      // 🔥 Chat messages update
      const newMessages = [
        ...messages,
        { type: "user", text: input }
      ];

      setMessages(newMessages);
      setTypingIndex(newMessages.length);

      // simulate typing delay
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { type: "bot", data: data }
       ]);
       setTypingIndex(null);
     }, 1200);

      setMessages(newMessages);

      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 600);

      setInput("");

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="content">

        <h1 className="title">AI Checkup 🩺</h1>

        {/* 🔥 CHAT BOX */}
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.type}`}>


              {/* USER */}
              {msg.type === "user" && <p>{msg.text}</p>}

              {/* BOT */}
              {msg.type === "bot" && (
                <div className="bot-response">
                  <p><b>🦠 {msg.data.predicted_disease}</b></p>
                  <p>💊 {msg.data.recommended_drug}</p>
                  <p className="bot-desc">{msg.data.description}</p>
                </div>
              )}

            </div>
          ))}
          {/* 🔥 STEP 4 — ADD THIS HERE */}
          {typingIndex !== null && (
            <div className="chat-msg bot typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
       )}
        </div>

        {/* INPUT */}
        <textarea
          placeholder="Describe your symptoms (e.g. I have fever and headache)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button onClick={analyzeSymptoms}>
          Run Checkup
        </button>

        {/* ERROR */}
        {error && (
          <p style={{ color: "#ef4444", marginTop: "10px" }}>
            ⚠️ {error}
          </p>
        )}

        {/* LOADING */}
        {loading && (
          <div className="skeleton-card">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        )}

        {/* RESULT CARD (UNCHANGED CORE UI) */}
        {result && !loading && !result.error && (
          <div className="card fade-in">

            {/* SYMPTOMS */}
            {result.input_symptoms && (
              <div className="symptom-tags">
                <h4>Detected Symptoms</h4>
                <div className="tags">
                  {result.input_symptoms.map((s, i) => (
                    <span key={i} className="tag">
                      {s.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <h2>🧠 Condition Detected</h2>
            <h2 className="disease">{result.predicted_disease}</h2>

            <h2>💊 Suggested Treatment</h2>
            <h2 className="drug">{result.recommended_drug}</h2>

            {/* DESCRIPTION */}
            {result.description && (
              <>
                <h3>📖 About Condition</h3>
                <p>{result.description}</p>
              </>
            )}

            {/* MEDICATIONS */}
            {result.all_medications && (
              <>
                <h3>💊 Available Medications</h3>
                <div className="keyword-box">
                  {result.all_medications.map((m, i) => (
                    <span key={i} className="keyword">{m}</span>
                  ))}
                </div>
              </>
            )}

            {/* PRECAUTIONS */}
            {result.precautions && (
              <>
                <h3>⚠️ Precautions</h3>
                <ul>
                  {result.precautions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </>
            )}

            {/* BENEFITS */}
            <h3>🟢 Benefits</h3>
            <div className="insight-grid">
              {result.benefits?.map((b, i) => (
                <div key={i} className="insight-card">
                  <h4>{b.category}</h4>

                  <p className="keywords">
                    {b.keywords?.join(", ")}
                  </p>

                  <div className="progress-bar">
                   <div
                      className="progress-fill"
                      style={{
                        width: `${b.percentage}%`,
                        background: "#22c55e"
                      }}
                   ></div>
                 </div>

               </div>
             ))}
          </div>

            {/* LIMITATIONS */}
            <h3>🔴 Possible Side Effects</h3>
            <div className="insight-grid">
              {result.limitations?.map((l, i) => (
                <div key={i} className="insight-card">
                  <h4>{l.category}</h4>

                  <p className="keywords">
                    {l.keywords?.join(", ")}
                  </p>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${l.percentage}%`,
                        background: "#ef4444"
                      }}
                    ></div>
                  </div>

                </div>
             ))}
           </div>

            {result.note && (
              <p className="note">{result.note}</p>
            )}
          </div>
        )}

        {/* BACKEND ERROR */}
        {result && result.error && (
          <p style={{ color: "#ef4444", marginTop: "10px" }}>
            ⚠️ {result.error}
          </p>
        )}

      </div>
    </div>
  );
}

export default Checkup;