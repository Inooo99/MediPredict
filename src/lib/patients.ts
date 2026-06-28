export type Patient = {
  id: string;
  name: string;
  gender: "L" | "P";
  age: number;
  history: string;
  vitals: {
    pregnancies: number;
    glucose: number;
    blood_pressure: number;
    skin_thickness: number;
    insulin: number;
    bmi: number;
    diabetes_pedigree_function: number;
    age: number;
  };
};

export async function findPatient(id: string): Promise<Patient | null> {
  try {
    const res = await fetch(`http://127.0.0.1:5000/patient/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Gagal mengambil data", error);
    return null;
  }
}