
import React from 'react';
import { DocumentType } from '../types';
// FIX: PassportIcon was not exported from ./icons, it is now.
import { IdCardIcon, PassportIcon } from './icons';

interface DocumentSelectorProps {
  selectedType: DocumentType;
  onChange: (type: DocumentType) => void;
  disabled: boolean;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ selectedType, onChange, disabled }) => {
  const options = [
    { type: DocumentType.ID_CARD, label: 'ID Card', icon: IdCardIcon },
    { type: DocumentType.PASSPORT, label: 'Passport', icon: PassportIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option) => {
        const isSelected = selectedType === option.type;
        return (
          <button
            key={option.type}
            disabled={disabled}
            onClick={() => onChange(option.type)}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500
              ${isSelected ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option.icon className={`w-10 h-10 mb-2 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
            <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DocumentSelector;
