# 🧠 MediXAI — Explainable AI for Drug Insights

MediXAI is a full-stack AI system that analyzes drug reviews, predicts sentiment, explains model decisions using SHAP, and provides symptom-based medical recommendations.

---

## 🚀 Features

- 🔍 Explainable AI (SHAP-based reasoning)
- 📊 Drug sentiment analysis
- 💊 Drug comparison system
- 🧠 Symptom-based disease prediction (CheckUp)
- 📈 Benefits & side-effect extraction

---

## 🏗️ Tech Stack

- Frontend: React.js
- Backend: FastAPI
- ML Models:
  - BERT (Sentiment Analysis)
  - Random Forest (Disease Prediction)
- Explainability: SHAP

---

## 📂 Project Structure
MediXAI/
├── frontend/
├── backend/
│ ├── app.py
│ ├── utils.py
├── notebooks/


---

## 📦 Dataset

Due to size limitations, datasets are not included in this repository.

👉 Download dataset from:
[GitHub Release](../../releases)

After downloading:
- Extract the files
- Place them inside `backend/`

---

## ⚙️ How to Run

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

###Frontend

cd frontend
npm install
npm start

🌐 Deployment
Backend: Render
Frontend: Vercel
⚠️ Disclaimer

This project is for educational and research purposes only. It should not be used as a substitute for professional medical advice.

## 📄 Documentation

- 📘 Final Report: docs/MediXAI_Report.docx  
- 📊 Presentation: docs/MediXAI_Presentation.pptx
👨‍💻 Author
Manas Arora
