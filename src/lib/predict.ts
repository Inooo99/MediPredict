export type PredictInput = {
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree_function: number;
  age: number;
  model_type?: string; 
};

export type PredictResult = {
  prediction: "Diabetes" | "Normal";
  confidence: number;
  reasons?: string[]; 
};

export async function predict(data: PredictInput): Promise<PredictResult> {
  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Server ML merespons dengan status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saat menghubungi API Python:", error);
    throw error;
  }
}