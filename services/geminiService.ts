
import { GoogleGenAI, Type } from "@google/genai";
import { KycData, DocumentType } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const kycSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: {
        type: Type.STRING,
        enum: [DocumentType.ID_CARD, DocumentType.PASSPORT],
        description: "The type of the document, either 'id_card' or 'passport'."
    },
    fullName: { type: Type.STRING, description: "The person's full name in Arabic (الاسم الكامل)." },
    nationalId: { type: Type.STRING, description: "The national identification number (رقم الهوية الوطنية)." },
    passportNumber: { type: Type.STRING, description: "The passport number (رقم جواز السفر)." },
    nationality: { type: Type.STRING, description: "The nationality in Arabic (الجنسية)." },
    dateOfBirth: { type: Type.STRING, description: "Date of birth, preferably in YYYY-MM-DD format (تاريخ الميلاد)." },
    placeOfBirth: { type: Type.STRING, description: "The place of birth in Arabic (مكان الميلاد)." },
    gender: { type: Type.STRING, description: "Gender, as 'Male' or 'Female' or in Arabic 'ذكر'/'أنثى' (الجنس)." },
    issueDate: { type: Type.STRING, description: "The document's issue date, preferably in YYYY-MM-DD format (تاريخ الإصدار)." },
    expiryDate: { type: Type.STRING, description: "The document's expiry date, preferably in YYYY-MM-DD format (تاريخ الانتهاء)." },
    mrz: { type: Type.STRING, description: "The full Machine Readable Zone (MRZ) text if available." },
    bloodGroup: { type: Type.STRING, description: "The blood group, e.g., A+, O- (فصيلة الدم)." },
  },
};

export const extractKycData = async (files: File[]): Promise<KycData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = await Promise.all(
    files.map(file => fileToGenerativePart(file))
  );

  const prompt = `You are a highly advanced Optical Character Recognition (OCR) system, specialized in extracting information from official Arabic identification documents from Yemen, even under challenging conditions.

Your first task is to automatically identify the type of document from the provided image(s). It will be either an ID card (which may have a front and back side provided as two separate images) or a passport.

Once you have identified the document type, proceed to extract all relevant information. Leverage your superior visual understanding to overcome issues like poor lighting, shadows, glare, low resolution, and awkward angles. Pay meticulous attention to the unique shapes and diacritics of Arabic letters. If a character is partially obscured or unclear, use the surrounding context and the document's structure to infer the correct information.

Your primary goal is maximum accuracy. Return the identified document type in the 'documentType' field, along with all other extracted fields. Strictly adhere to the provided JSON schema for your response. If a field is not visible or genuinely cannot be determined, return null for that field's value.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: [
        ...imageParts,
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: kycSchema,
    },
  });

  try {
    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Could not parse the extracted data. The AI may have returned an invalid format.");
  }
};
