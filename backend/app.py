from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
import pandas as pd
from transformers import BertTokenizer, BertForSequenceClassification
import shap
from collections import Counter
import re
import pickle

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Model
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

model = BertForSequenceClassification.from_pretrained(
    'bert-base-uncased',
    num_labels=3
)

model.load_state_dict(torch.load("model.pth", map_location=torch.device('cpu')))
model.eval()

labels = ["Negative", "Neutral", "Positive"]

rf_model = pickle.load(open("RandomForest.pkl", "rb"))

# 🔹 Data
df = pd.concat([
    pd.read_csv("train.csv"),
    pd.read_csv("test.csv")
], ignore_index=True)

# 🔹 Medical datasets
med_df = pd.read_csv("medications.csv")
desc_df = pd.read_csv("description.csv")
prec_df = pd.read_csv("precautions_df.csv")

# 🔹 Clean columns
med_df["Disease"] = med_df["Disease"].str.lower().str.strip()
desc_df["Disease"] = desc_df["Disease"].str.lower().str.strip()
prec_df["Disease"] = prec_df["Disease"].str.lower().str.strip()

def get_sentiment(rating):
    if rating >= 8:
        return "Positive"
    elif rating >= 5:
        return "Neutral"
    else:
        return "Negative"

df["sentiment"] = df["rating"].apply(get_sentiment)
df["drugName"] = df["drugName"].astype(str).str.lower().str.strip()
df["condition"] = df["condition"].astype(str).str.lower().str.strip()

# 🔹 Utils
stopwords = set([
    "the","and","was","were","this","that","with","have","had","for",
    "but","very","after","before","from","they","them","been","being"
])

def clean_word(word):
    return re.sub(r'[^a-zA-Z]', '', word.lower())

# 🔥 ADD THIS JUST BELOW
def normalize_text(text):
    return str(text).lower().strip().replace("_", " ").replace("-", " ")

def normalize_disease(text):
    text = str(text).lower().strip()

    # remove brackets like (piles)
    text = re.sub(r"\(.*?\)", "", text)

    # fix common spelling issue
    text = text.replace("hemmorhoids", "hemorrhoids")

    # replace separators
    text = text.replace("_", " ").replace("-", " ")

    # remove extra spaces
    text = " ".join(text.split())

    return text

# 🔹 Category + Severity (UNCHANGED)
category_map = {
    "effectiveness": [
        "effective","worked","works","improved","improvement","cured","helped"
    ],
    "relief": [
        "relief","better","reduced","ease","comfortable"
    ],
    "side_effects": [
        "headache","nausea","pain","vomit","dizziness","fatigue",
        "dry","rash","itch","burn","swelling","infection",
        "bleeding","weight","loss","gain","diarrhea","constipation"
    ],
    "mental": [
        "anxiety","depression","stress","mood","panic"
    ],
    "sleep": [
        "sleep","insomnia","tired","drowsy"
    ]
}

severity_words = {
    "high": ["severe","extreme","worst"],
    "medium": ["moderate","bad"],
    "low": ["mild","slight"]
}

# 🔹 SHAP (ONLY FOR PREDICT)
def predict_proba(texts):
    if isinstance(texts, str):
        texts = [texts]

    inputs = tokenizer(texts, return_tensors="pt", truncation=True, padding=True, max_length=128)

    with torch.no_grad():
        outputs = model(**inputs)

    return torch.softmax(outputs.logits, dim=1).numpy()

masker = shap.maskers.Text(tokenizer)
explainer = shap.Explainer(predict_proba, masker)

# 🔹 Schema
class ReviewRequest(BaseModel):
    text: str
class SymptomTextRequest(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "MediXAI Backend Running 🚀"}

# 🔹 Predict
def predict(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=1).numpy()[0]
    pred = np.argmax(probs)

    return labels[pred], float(probs[pred])

# 🔹 Predict API (SHAP WORKS HERE)
@app.post("/predict")
def get_prediction(req: ReviewRequest):
    label, confidence = predict(req.text)

    pos_words, neg_words = [], []

    try:
        shap_values = explainer([req.text])[0]
        values = shap_values.values
        words = shap_values.data

        pred_class = np.argmax(values.sum(axis=0))
        token_values = values[:, pred_class]

        word_importance = sorted(
            zip(words, token_values),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        for w, v in word_importance[:6]:
            w = clean_word(str(w))

            if not w or len(w) < 3:
                continue

            if v > 0:
                pos_words.append(w)
            else:
                neg_words.append(w)

    except Exception as e:
        print("SHAP error:", e)

    # fallback
    if not pos_words and not neg_words:
        words = [clean_word(w) for w in req.text.split()]
        words = [w for w in words if len(w) > 4]

        pos_words = words[:2]
        neg_words = words[2:4]

    explanation = f"Prediction influenced positively by {', '.join(pos_words[:2])} and negatively by {', '.join(neg_words[:2])}"
    
    if confidence > 0.75:
        confidence_label = "High confidence"
    elif confidence > 0.5:
        confidence_label = "Moderate confidence"
    else:
        confidence_label = "Low confidence"
    
    return {
        "input_text": req.text,
        "prediction": label,
        "confidence": round(confidence, 3),
        "explanation": explanation,
        "positive_words": pos_words,
        "confidence_label": confidence_label,
        "negative_words": neg_words
    }

# 🔥 INSIGHT EXTRACTION (IMPROVED)
def extract_insights(filtered):
    text = " ".join(filtered["review"].astype(str)).lower()

    words = [clean_word(w) for w in text.split()]

    # 🔥 FIX 1: allow smaller but meaningful words
    words = [
    w for w in words
    if len(w) > 3
    and w not in stopwords
    and w not in [
        "tablet","medicine","medication","doctor","day","time","take","taken",
        "feel","felt","like","really","very","much","also",
        "get","got","you","your","its","just","can","could",
        "would","one","two","use","used","using","first","will",
        "even","after","before","when","then","only"
    ]
]

    # 🔥 get most common words
    common = [w for w, _ in Counter(words).most_common(20)]

    # 🔥 FIX 2: smart separation (NOT random slicing)
    benefits = []
    limitations = []

    for w in common:
        assigned = False

        for cat, keys in category_map.items():
            if any(k in w for k in keys):

                # 🔥 STRICT RULE
                if cat == "side_effects":
                    limitations.append(w)
                else:
                    benefits.append(w)

                assigned = True
                break

        # ❌ ignore unrelated words
        if not assigned:
            continue

    # 🔥 REMOVE overlap (very important)
    benefits = [w for w in benefits if w not in limitations]

    # 🔥 fallback safety (in case one side is empty)
    if not benefits:
        benefits = common[:5]

    if not limitations:
        limitations = common[5:10]

    # 🔥 severity calculation (unchanged but safe)
    severity_counter = {"high": 0, "medium": 0, "low": 0}

    for review in filtered["review"].astype(str):
        r = review.lower()
        for level, words in severity_words.items():
            if any(w in r for w in words):
                severity_counter[level] += 1

    return benefits, limitations, severity_counter


# 🔹 GROUPING (IMPROVED)
def group_keywords(words, total):
    grouped = {}

    for word in words:
        found = False

        for cat, keys in category_map.items():
            # 🔥 FIX: flexible matching
            if any(k in word for k in keys):
                grouped.setdefault(cat, []).append(word)
                found = True
                break

        if not found:
            continue

    result = []

    for cat, items in grouped.items():
        count = len(items)
        percentage = round(min((count / max(total, 1)) * 300, 100), 1)

        result.append({
            "category": cat,
            "keywords": list(set(items))[:3],
            "percentage": percentage
        })

    # 🔥 FIX 3: remove useless "general" if better categories exist
    if len(result) > 1:
        result = [r for r in result if r["category"] != "general"]

    return result

# 🔥 Dashboard API (NOW STABLE)
@app.get("/analyze-drug")
def analyze_drug(drug: str, condition: str):

    drug = drug.lower().strip()
    condition = condition.lower().strip()

    filtered = df[
        df["drugName"].str.contains(drug, na=False) &
        df["condition"].str.contains(condition, na=False)
    ]

    if filtered.empty:
        return {"error": "No data found"}

    sentiment_counts = filtered["sentiment"].value_counts().to_dict()
    total = len(filtered)

    benefits_raw, limitations_raw, severity = extract_insights(filtered)

    benefits = group_keywords(benefits_raw, total)
    limitations = group_keywords(limitations_raw, total)

    severity_label = max(severity, key=severity.get)
    severity_text = {
        "high": "mostly severe",
        "medium": "moderate",
        "low": "mild"
    }.get(severity_label, "mixed")

    text = " ".join(filtered["review"].astype(str)).lower()
    words = [clean_word(w) for w in text.split() if len(clean_word(w)) > 4 and w not in stopwords]
    top_keywords = [w for w, _ in Counter(words).most_common(10)]

    dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)

    if benefits and limitations:
        insight = (
            f"For {condition}, {drug} is generally perceived as {dominant_sentiment.lower()}. "
            f"It is commonly associated with {benefits[0]['category']} benefits, "
            f"while users also report {severity_text} side effects such as {limitations[0]['keywords'][0]}."
        )
    else:
        insight = f"For {condition}, {drug} shows mixed user feedback."
    
    top_positive = filtered[filtered["sentiment"] == "Positive"]["review"].head(3).tolist()
    top_negative = filtered[filtered["sentiment"] == "Negative"]["review"].head(3).tolist()
    
    return {
        "total_reviews": total,
        "sentiment_distribution": sentiment_counts,
        "top_keywords": top_keywords,
        "benefits": benefits,
        "limitations": limitations,
        "severity": severity_text,
        "insight": insight,
        "top_positive_reviews": top_positive,
        "top_negative_reviews": top_negative,
        "sample_reviews": filtered["review"].head(3).tolist()
    }

# (ONLY ADDITION: compare-drugs API — rest untouched)

# 🔥 ADD THIS AT THE END OF FILE

@app.get("/compare-drugs")
def compare_drugs(drug1: str, drug2: str, condition: str):

    drug1 = drug1.lower().strip()
    drug2 = drug2.lower().strip()
    condition = condition.lower().strip()

    def get_stats(drug):
        filtered = df[
            df["drugName"].str.contains(drug, na=False) &
            df["condition"].str.contains(condition, na=False)
        ]

        if filtered.empty:
            return None

        sentiment = filtered["sentiment"].value_counts(normalize=True).to_dict()

        return {
            "total": len(filtered),
            "positive": round(sentiment.get("Positive", 0) * 100, 1),
            "negative": round(sentiment.get("Negative", 0) * 100, 1),
            "neutral": round(sentiment.get("Neutral", 0) * 100, 1),
        }

    stats1 = get_stats(drug1)
    stats2 = get_stats(drug2)

    if not stats1 or not stats2:
        return {"error": "Data not found"}

    return {
        "drug1": stats1,
        "drug2": stats2
    }

@app.get("/suggest-alternative")
def suggest_alternative(drug: str, condition: str):

    drug = drug.lower().strip()
    condition = condition.lower().strip()

    filtered = df[
        df["condition"].str.contains(condition, na=False)
    ]

    if filtered.empty:
        return {"suggestion": None}

    # Count drugs for this condition
    top_drugs = filtered["drugName"].value_counts().index.tolist()

    # Remove current drug
    alternatives = [d for d in top_drugs if d != drug]

    if not alternatives:
        return {"suggestion": None}

    return {"suggestion": alternatives[0]}

# 🔹 Other APIs
@app.get("/get-drugs")
def get_drugs():
    return {"drugs": sorted(df["drugName"].unique())[:1000]}

@app.get("/get-conditions")
def get_conditions():
    return {"conditions": sorted(df["condition"].unique())[:1000]}

@app.get("/get-conditions-by-drug")
def get_conditions_by_drug(drug: str):
    return sorted(df[df["drugName"] == drug.lower().strip()]["condition"].unique())

@app.get("/get-top-drugs")
def get_top_drugs():
    return df["drugName"].value_counts().head(10).index.tolist()

# ================================
# 🔥 SYMPTOM → DISEASE PREDICTION
# ================================

# 🔹 Load trained model
disease_model = pickle.load(open("RandomForest.pkl", "rb"))

from sklearn.preprocessing import LabelEncoder

# 🔹 Load training data (for label decoding)
train_df_full = pd.read_csv("Training.csv")

# 🔹 Extract disease labels
y = train_df_full["prognosis"]

# 🔹 Create label encoder
le = LabelEncoder()
le.fit(y)

# 🔹 Load training columns (symptom list)
training_df = pd.read_csv("Training.csv")
if "prognosis" in training_df.columns:
    disease_labels = training_df["prognosis"].unique().tolist()
else:
    disease_labels = training_df.iloc[:, -1].unique().tolist()
# 🔹 Create label mapping
if "prognosis" in training_df.columns:
    disease_labels = training_df["prognosis"].unique().tolist()
else:
    raise Exception("Training.csv must contain 'prognosis' column")
symptom_list = training_df.columns.tolist()
symptom_list.remove("prognosis") if "prognosis" in symptom_list else None

# 🔹 Clean symptom text
def normalize_symptom(sym):
    return sym.strip().lower().replace(" ", "_")

symptom_list = [normalize_symptom(s) for s in symptom_list]

# 🔹 Schema
class SymptomRequest(BaseModel):
    symptoms: list[str]


# ================================
# 🔥 SYMPTOM → DISEASE (UPGRADED)
# ================================

# 🔹 Load medical datasets ONCE (top of file, after df load)
med_df = pd.read_csv("medications.csv")
desc_df = pd.read_csv("description.csv")
prec_df = pd.read_csv("precautions_df.csv")

# 🔹 Clean columns
med_df["Disease"] = med_df["Disease"].apply(normalize_disease)
desc_df["Disease"] = desc_df["Disease"].apply(normalize_disease)
prec_df["Disease"] = prec_df["Disease"].apply(normalize_disease)


@app.post("/predict-from-symptoms")
def predict_from_symptoms(req: SymptomRequest):
    user_symptoms = [normalize_symptom(s) for s in req.symptoms]

    # 🔹 Create input vector
    input_vector = [0] * len(symptom_list)

    for sym in user_symptoms:
        if sym in symptom_list:
            idx = symptom_list.index(sym)
            input_vector[idx] = 1

    # 🔹 Predict disease
    pred_encoded = disease_model.predict([input_vector])[0]

    # 🔥 Decode properly
    prediction = le.inverse_transform([pred_encoded])[0]

    # 🔥 STRONG NORMALIZATION
    disease = normalize_text(prediction)

    # ================================
    # 🔥 FETCH MEDICAL DATA (FIXED)
    # ================================

    # 🔹 Normalize dataset columns ONCE here
    med_df["Disease"] = med_df["Disease"].apply(normalize_text)
    desc_df["Disease"] = desc_df["Disease"].apply(normalize_text)
    prec_df["Disease"] = prec_df["Disease"].apply(normalize_text)

    # 🔹 Description (SMART MATCH)
    description_row = desc_df[
        desc_df["Disease"].str.contains(disease, na=False)
    ]

    description = (
        description_row["Description"].values[0]
        if not description_row.empty else "No description available"
    )

    # 🔹 Medications
    med_row = med_df[
        med_df["Disease"].str.contains(disease, na=False)
    ]

    if not med_row.empty:
        meds_raw = med_row["Medication"].values[0]

        try:
            meds = eval(meds_raw)
        except Exception:
            meds = [meds_raw]
    else:
        meds = []

    recommended_drug = meds[0] if meds else "Not available"

    # 🔹 Precautions
    prec_row = prec_df[
        prec_df["Disease"].str.contains(disease, na=False)
    ]

    precautions = []
    if not prec_row.empty:
        for col in prec_row.columns:
            if "Precaution" in col:
                val = prec_row[col].values[0]
                if pd.notna(val):
                    precautions.append(val)

    # ================================
    # 🔥 REVIEW INSIGHTS (FIXED)
    # ================================

    # 🔥 SMART MATCHING FOR REVIEWS
    filtered = df[
        df["condition"].apply(lambda x: disease in str(x))
    ]

    # 🔥 fallback (if still empty)
    if filtered.empty:
        filtered = df[
            df["condition"].apply(lambda x: any(word in str(x) for word in disease.split()))
        ]

    benefits, limitations = [], []

    if not filtered.empty:
        b_raw, l_raw, _ = extract_insights(filtered)

        benefits = group_keywords(b_raw, len(b_raw))
        limitations = group_keywords(l_raw, len(l_raw))

    # ================================
    # 🔥 FINAL RESPONSE
    # ================================

    return {
        "predicted_disease": prediction,
        "description": description,
        "recommended_drug": recommended_drug,
        "all_medications": meds,
        "precautions": precautions,
        "benefits": benefits,
        "limitations": limitations,
        "note": "Prediction based on symptoms + medical dataset + user reviews"
    }

    # ================================
# 🔥 TEXT → SYMPTOMS EXTRACTION
# ================================

def extract_symptoms_from_text(text):
    text = text.lower()

    detected = []

    for sym in symptom_list:
        readable = sym.replace("_", " ")

        # match both "headache" & "head ache"
        if readable in text or sym in text:
            detected.append(sym)

    return list(set(detected))