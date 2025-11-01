import React, { useState, useEffect } from 'react';
import { KycData } from '../types';
import { PencilIcon, CheckIcon, XMarkIcon } from './icons';

interface ExtractionResultProps {
  data: KycData;
  onUpdateField: (key: keyof KycData, value: string) => void;
}

const fieldLabels: Record<keyof KycData, string> = {
  documentType: "Document Type",
  fullName: "Full Name",
  nationalId: "National ID",
  passportNumber: "Passport No.",
  nationality: "Nationality",
  dateOfBirth: "Date of Birth",
  placeOfBirth: "Place of Birth",
  gender: "Gender",
  issueDate: "Issue Date",
  expiryDate: "Expiry Date",
  mrz: "Machine Readable Zone",
  bloodGroup: "Blood Group",
};

const formatValue = (key: keyof KycData, value: any): string => {
    if (!value) return '';
    if (key === 'documentType' && typeof value === 'string') {
        return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return String(value);
}

const EditableResultRow: React.FC<{
    fieldKey: keyof KycData;
    label: string;
    value?: string | null;
    onSave: (key: keyof KycData, value: string) => void;
}> = ({ fieldKey, label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  if (!value && !isEditing) return null;

  const handleSave = () => {
    onSave(fieldKey, inputValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value || '');
    setIsEditing(false);
  };

  return (
    <div className="py-3 px-4 grid grid-cols-3 gap-4 bg-gray-700/50 rounded-md items-center group">
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-white col-span-2 font-mono break-words flex items-center gap-2">
        {isEditing ? (
            <>
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-gray-900/50 border border-blue-500 rounded-md px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button onClick={handleSave} className="text-green-400 hover:text-green-300 p-1 rounded-full hover:bg-gray-600">
                    <CheckIcon className="w-5 h-5" />
                </button>
                <button onClick={handleCancel} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </>
        ) : (
            <>
                <span className="flex-1">{formatValue(fieldKey, value)}</span>
                <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-600">
                    <PencilIcon className="w-4 h-4" />
                </button>
            </>
        )}
      </dd>
    </div>
  );
};


const ExtractionResult: React.FC<ExtractionResultProps> = ({ data, onUpdateField }) => {
  const hasData = Object.values(data).some(value => value);

  if (!hasData) {
    return (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">No Data Extracted</h3>
            <p className="text-gray-400">The AI could not extract any information from the provided document(s). Please try again with a clearer image.</p>
        </div>
    );
  }

  const fieldOrder: (keyof KycData)[] = [
    'documentType',
    'fullName',
    // FIX: Removed typo 'toningc' which caused a syntax error.
    'nationalId',
    'passportNumber',
    'nationality',
    'dateOfBirth',
    'placeOfBirth',
    'gender',
    'issueDate',
    'expiryDate',
    'bloodGroup',
    'mrz',
  ];

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Extracted Information</h3>
      <dl className="space-y-2">
        {fieldOrder.map((key) => (
          <EditableResultRow 
            key={key} 
            fieldKey={key}
            label={fieldLabels[key]} 
            value={data[key]}
            onSave={onUpdateField}
            />
        ))}
      </dl>
    </div>
  );
};

export default ExtractionResult;