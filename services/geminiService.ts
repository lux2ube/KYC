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

// Schema definitions broken down by document part for dynamic generation
const baseSchemaProperties = {
  documentType: {
    type: Type.STRING,
    enum: [DocumentType.ID_CARD, DocumentType.PASSPORT],
    description: "The type of the document, either 'id_card' or 'passport'."
  },
};

const idFrontSchemaProperties = {
  fullName: { type: Type.STRING, description: "The person's full name in Arabic (الاسم الكامل)." },
  nationalId: { type: Type.STRING, description: "The national identification number (رقم الهوية الوطنية)." },
  dateOfBirth: { type: Type.STRING, description: "Date of birth, preferably in YYYY-MM-DD format (تاريخ الميلاد)." },
  placeOfBirth: { type: Type.STRING, description: "The place of birth in Arabic (مكان الميلاد)." },
  gender: { type: Type.STRING, description: "Gender, as 'Male' or 'Female' or in Arabic 'ذكر'/'أنثى' (الجنس)." },
  bloodGroup: { type: Type.STRING, description: "The blood group, e.g., A+, O- (فصيلة الدم)." },
};

const idBackSchemaProperties = {
  issueDate: { type: Type.STRING, description: "The document's issue date, preferably in YYYY-MM-DD format (تاريخ الإصدار)." },
  expiryDate: { type: Type.STRING, description: "The document's expiry date, preferably in YYYY-MM-DD format (تاريخ الانتهاء)." },
};

const passportSchemaProperties = {
  fullName: { type: Type.STRING, description: "The person's full name in Arabic (الاسم الكامل)." },
  passportNumber: { type: Type.STRING, description: "The passport number (رقم جواز السفر)." },
  nationality: { type: Type.STRING, description: "The nationality in Arabic (الجنسية)." },
  dateOfBirth: { type: Type.STRING, description: "Date of birth, preferably in YYYY-MM-DD format (تاريخ الميلاد)." },
  placeOfBirth: { type: Type.STRING, description: "The place of birth in Arabic (مكان الميلاد)." },
  gender: { type: Type.STRING, description: "Gender, as 'Male' or 'Female' or in Arabic 'ذكر'/'أنثى' (الجنس)." },
  issueDate: { type: Type.STRING, description: "The document's issue date, preferably in YYYY-MM-DD format (تاريخ الإصدار)." },
  expiryDate: { type: Type.STRING, description: "The document's expiry date, preferably in YYYY-MM-DD format (تاريخ الانتهاء)." },
  mrz: { type: Type.STRING, description: "The full Machine Readable Zone (MRZ) text if available." },
};


export interface ExtractKycDataParams {
  docType: DocumentType;
  idFront?: File;
  idBack?: File;
  passport?: File;
}

export const extractKycData = async ({ docType, idFront, idBack, passport }: ExtractKycDataParams): Promise<KycData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];

  if (docType === DocumentType.ID_CARD) {
      if (idFront) {
          parts.push({ text: "--- ID CARD FRONT ---" });
          parts.push(await fileToGenerativePart(idFront));
      }
      if (idBack) {
          parts.push({ text: "--- ID CARD BACK ---" });
          parts.push(await fileToGenerativePart(idBack));
      }
  } else if (docType === DocumentType.PASSPORT) {
      if (passport) {
          parts.push({ text: "--- PASSPORT PHOTO PAGE ---" });
          parts.push(await fileToGenerativePart(passport));
      }
  }

  const getDynamicSchema = () => {
    let properties: any = { ...baseSchemaProperties };
    if (docType === DocumentType.ID_CARD) {
      if (idFront) {
        properties = { ...properties, ...idFrontSchemaProperties };
      }
      if (idBack) {
        properties = { ...properties, ...idBackSchemaProperties };
      }
    } else if (docType === DocumentType.PASSPORT) {
      if (passport) {
        properties = { ...properties, ...passportSchemaProperties };
      }
    }
    return {
      type: Type.OBJECT,
      properties,
    };
  };

  const dynamicKycSchema = getDynamicSchema();

  const systemInstruction = `You are an expert forensic document examiner with unparalleled expertise in Optical Character Recognition (OCR), specialized in extracting information from official Arabic identification documents, particularly from Yemen. Your precision is paramount, equivalent to the standards required by financial institutions for KYC processes. Your primary goal is maximum accuracy.`;

  const userPrompt = `**Task: Extract KYC Information**
You will be provided with one or more images of an official identification document, explicitly labeled. Your task is to extract the information based on the provided document type and image labels.

**Strict Adherence to Schema:**
Your response format is strictly controlled by a dynamically generated JSON schema that precisely matches the document parts you have been given.
- **You MUST ONLY return fields present in this dynamic schema.**
- **Do NOT output fields associated with document parts that were not provided (e.g., do not return \`expiryDate\` if only the ID Card Front is provided).**
- **Do NOT infer, guess, or hallucinate values.** If a field is not clearly visible in the provided image(s), return null for its value.

**Critical Task: Disambiguation of Similar Arabic Characters**
Pay forensic-level attention to the subtle nuances of the Arabic script. For example:
-   Differentiate between 'د' (Dal) and 'ط' (Ta).
-   Distinguish between 'ص' (Sad) and 'ح' (Ha).
-   Carefully analyze dots to differentiate: 'ب'/'ت'/'ث', 'ج'/'ح'/'خ', 'ر'/'ز', 'س'/'ش', 'ع'/'غ', and 'ف'/'ق'.

**Extraction Protocol:**
1.  **Analyze Labeled Images:** Examine the provided image(s), paying attention to their labels ('ID CARD FRONT', 'ID CARD BACK', 'PASSPORT PHOTO PAGE').
2.  **Targeted Extraction:** Extract information based on the fields allowed by the dynamic schema. Leverage your visual understanding to overcome poor lighting, shadows, glare, and low resolution.
3.  **Final Review:** Before finalizing the JSON output, perform a final review of every extracted field against the source image(s) to ensure the highest possible accuracy.

Return the identified document type and all other extracted fields, strictly adhering to the provided JSON schema.`;

  parts.push({ text: userPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: parts,
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: dynamicKycSchema,
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