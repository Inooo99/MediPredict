from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)
import os

base_dir = os.path.dirname(__file__)

# 1. Load ketiga model yang dikirim dari Colab
model_dt = joblib.load(os.path.join(base_dir, 'model_dt.pkl'))
model_rf = joblib.load(os.path.join(base_dir, 'model_rf.pkl'))
model_xgb = joblib.load(os.path.join(base_dir, 'model_xgb.pkl'))

df = pd.read_csv(os.path.join(base_dir, 'diabetes.csv'))

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Ambil tipe model yang dipilih dari frontend (default ke 'rf')
    model_type = data.get('model_type', 'rf')
    
    # Pilih model berdasarkan request
    if model_type == 'dt':
        model = model_dt
    elif model_type == 'xgb':
        model = model_xgb
    else:
        model = model_rf

    input_data = np.array([[
        data.get('pregnancies', 0),
        data.get('glucose', 0),
        data.get('blood_pressure', 0),
        data.get('skin_thickness', 0),
        data.get('insulin', 0),
        data.get('bmi', 0.0),
        data.get('diabetes_pedigree_function', 0.0),
        data.get('age', 0)
    ]])
    
    hasil = model.predict(input_data)
    prob = model.predict_proba(input_data)
    confidence = float(np.max(prob[0]))
    prediksi = "Diabetes" if hasil[0] == 1 else "Normal"
    
    # 2. FITUR NOMOR 2: Eksplanasi / Alasan Prediksi Klinis
    reasons = []
    glukosa = data.get('glucose', 0)
    bmi_val = data.get('bmi', 0.0)
    tensian = data.get('blood_pressure', 0)
    umur = data.get('age', 0)

    if glukosa >= 140:
        reasons.append(f"Kadar Glukosa Tinggi ({glukosa} mg/dL) memicu lonjakan gula darah mendadak.")
    if bmi_val >= 30:
        reasons.append(f"Indeks Massa Tubuh masuk kategori Obesitas ({bmi_val} kg/m²), meningkatkan resistensi insulin.")
    if tensian >= 90:
        reasons.append(f"Tekanan Darah Tinggi ({tensian} mmHg) memperberat komplikasi vaskular.")
    if umur >= 45:
        reasons.append(f"Faktor Usia Lansia ({umur} tahun) secara alami menurunkan fungsi metabolisme pankreas.")

    # Jika semua parameter lab normal, ambil fitur global yang paling mendominasi keputusan pohon AI
    if not reasons:
        try:
            importances = model.feature_importances_
            feature_names = ['Kehamilan', 'Glukosa', 'Tekanan Darah', 'Ketebalan Kulit', 'Insulin', 'BMI', 'Silsilah Keturunan', 'Usia']
            top_idx = np.argsort(importances)[::-1][0]
            reasons.append(f"Kondisi lab normal. Keputusan klasifikasi didominasi oleh sensitivitas fitur {feature_names[top_idx]}.")
        except:
            reasons.append("Seluruh indikator klinis berada dalam batas aman.")

    return jsonify({
        "prediction": prediksi, 
        "confidence": confidence,
        "reasons": reasons # Mengirim array alasan ke web
    })

@app.route('/patient/<id>', methods=['GET'])
def get_patient(id):
    clean_id = id.upper().replace('P-', '').strip()
    try:
        idx = int(clean_id)
        if idx < 0 or idx >= len(df):
            return jsonify({"error": "Pasien tidak ditemukan"}), 404
        
        row = df.iloc[idx]
        return jsonify({
            "id": f"P-{idx}",
            "name": f"Pasien {idx}",
            "gender": "P" if row['Pregnancies'] > 0 else "L",
            "age": int(row['Age']),
            "history": "Data diambil langsung dari dataset rekam medis.",
            "vitals": {
                "pregnancies": int(row['Pregnancies']),
                "glucose": float(row['Glucose']),
                "blood_pressure": float(row['BloodPressure']),
                "skin_thickness": float(row['SkinThickness']),
                "insulin": float(row['Insulin']),
                "bmi": float(row['BMI']),
                "diabetes_pedigree_function": float(row['DiabetesPedigreeFunction']),
                "age": int(row['Age'])
            }
        })
    except ValueError:
        return jsonify({"error": "Format ID salah"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)