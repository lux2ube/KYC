import React from 'react';
import { KycData, SavedKycData } from '../types';
import Spinner from './Spinner';

interface DuplicateRecordViewProps {
    newRecord: KycData;
    existingRecord: SavedKycData;
    onUpdate: () => void;
    onDiscard: () => void;
    isUpdating: boolean;
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
  phoneNumber: "Phone Number",
  idFrontImage: "ID Front Image",
  idBackImage: "ID Back Image",
  passportImage: "Passport Image",
};

const fieldOrder: (keyof KycData)[] = [
    'documentType',
    'fullName',
    'nationalId',
    'passportNumber',
    'phoneNumber',
    'nationality',
    'dateOfBirth',
    'placeOfBirth',
    'gender',
    'issueDate',
    'expiryDate',
    'bloodGroup',
    'mrz',
];

const formatValue = (key: keyof KycData, value: any): string => {
    if (!value) return '';
    if (key === 'documentType' && typeof value === 'string') {
        return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return String(value);
}

const DiffRow: React.FC<{ label: string, existingValue?: string | null, newValue?: string | null }> = ({ label, existingValue, newValue }) => {
    const hasChanged = existingValue !== newValue;
    if (!existingValue && !newValue) return null;

    return (
        <div className={`py-3 px-4 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 rounded-md ${hasChanged ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-700/50'}`}>
            <dt className="text-sm font-medium text-gray-400 md:col-span-1">{label}</dt>
            <dd className="text-sm font-mono break-words md:col-span-1">
                <span className="text-xs text-gray-500 block md:hidden">Existing:</span>
                <span className={`${hasChanged ? 'text-red-400 line-through' : 'text-white'}`}>{existingValue || 'N/A'}</span>
            </dd>
            <dd className="text-sm font-mono break-words md:col-span-1">
                <span className="text-xs text-gray-500 block md:hidden">New:</span>
                <span className={`${hasChanged ? 'text-green-400' : 'text-white'}`}>{newValue || 'N/A'}</span>
            </dd>
        </div>
    );
};

const DuplicateRecordView: React.FC<DuplicateRecordViewProps> = ({ newRecord, existingRecord, onUpdate, onDiscard, isUpdating }) => {
    return (
        <div className="w-full space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Duplicate Record Detected</h3>
                <p className="text-gray-400">A record with a matching ID already exists. Review the changes below before proceeding.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 px-4">
                <div className="text-sm font-bold text-gray-300 md:col-start-2">Existing Record</div>
                <div className="text-sm font-bold text-gray-300">Newly Extracted Data</div>
            </div>

            <dl className="space-y-2">
                {fieldOrder.map(key => {
                    const existingValue = formatValue(key, existingRecord[key]);
                    const newValue = formatValue(key, newRecord[key]);
                    // Only show rows that have data in either old or new record
                    if (!existingValue && !newValue) return null;
                    return (
                         <DiffRow
                            key={key}
                            label={fieldLabels[key]}
                            existingValue={existingValue}
                            newValue={newValue}
                        />
                    )
                })}
            </dl>

            <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
                <button
                    onClick={onUpdate}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                >
                    {isUpdating ? <Spinner className="w-5 h-5" /> : 'Update Existing Record'}
                </button>
                <button
                    onClick={onDiscard}
                    disabled={isUpdating}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                >
                    Discard Changes
                </button>
            </div>
        </div>
    );
};

export default DuplicateRecordView;