
import React, { useState, useEffect } from 'react';
import { getKycRecords } from '../services/firebaseService';
import { SavedKycData, KycData } from '../types';
import Spinner from './Spinner';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

// FIX: Add missing 'documentType' to satisfy the Record type and align with KycData.
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

// IMPROVEMENT: Add fieldOrder for consistent display order, matching ExtractionResult.
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

// IMPROVEMENT: Add formatValue function for consistent data presentation, matching ExtractionResult.
const formatValue = (key: keyof KycData, value: any): string | null => {
    if (!value) return null;
    if (key === 'documentType' && typeof value === 'string') {
        return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return String(value);
}

const RecordItem: React.FC<{ record: SavedKycData }> = ({ record }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-gray-700/50 rounded-lg transition-shadow hover:shadow-lg hover:shadow-blue-500/10">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{record.fullName || 'Unnamed Record'}</p>
            <p className="text-sm text-gray-400 font-mono truncate">{record.nationalId || record.passportNumber}</p>
        </div>
        <div className="flex items-center gap-4 pl-4">
            <span className="text-xs text-gray-500 hidden sm:block">{new Date(record.timestamp).toLocaleString()}</span>
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
        </div>
      </button>
      {isOpen && (
         <div className="p-4 border-t border-gray-600">
            {(record.idFrontImage || record.idBackImage || record.passportImage) && (
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-200 mb-2">Scanned Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {record.idFrontImage && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">ID Card Front</p>
                      <img src={record.idFrontImage} alt="ID Card Front" className="rounded-lg w-full object-contain" />
                    </div>
                  )}
                  {record.idBackImage && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">ID Card Back</p>
                      <img src={record.idBackImage} alt="ID Card Back" className="rounded-lg w-full object-contain" />
                    </div>
                  )}
                  {record.passportImage && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Passport</p>
                      <img src={record.passportImage} alt="Passport" className="rounded-lg w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <dl className="space-y-2">
                {/* IMPROVEMENT: Use fieldOrder and formatValue for consistent display. */}
                {fieldOrder.map((key) => {
                    const value = record[key as keyof KycData];
                    const formattedValue = formatValue(key, value);
                    if (!formattedValue) return null;
                    return (
                        <div key={key} className="py-2 px-3 grid grid-cols-3 gap-4 bg-gray-800/50 rounded-md">
                            <dt className="text-sm font-medium text-gray-400 col-span-1">{fieldLabels[key]}</dt>
                            <dd className="text-sm text-white col-span-2 font-mono break-words">{formattedValue}</dd>
                        </div>
                    );
                })}
            </dl>
         </div>
      )}
    </div>
  )
};

const PreviousRecords: React.FC = () => {
    const [records, setRecords] = useState<SavedKycData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setError(null);
                const fetchedRecords = await getKycRecords();
                setRecords(fetchedRecords);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch records.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, []);

    if (isLoading) {
        return <div className="flex flex-col items-center justify-center p-12 text-center">
            <Spinner className="w-12 h-12 text-blue-500"/>
            <p className="mt-4 text-lg font-semibold text-gray-300">Loading Records...</p>
          </div>;
    }

    if (error) {
        return <div className="text-center p-8 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg">
            <p><span className="font-bold">Error:</span> {error}</p>
        </div>;
    }
    
    if (records.length === 0) {
        return <div className="text-center text-gray-400 p-12 bg-gray-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white">No Saved Records</h3>
            <p className="mt-1 text-sm">Use the 'Extractor' tab to scan a document and save the result.</p>
        </div>;
    }

    return (
        <div className="space-y-4">
             <h3 className="text-xl font-bold text-white">Saved Records</h3>
            {records.map(record => <RecordItem key={record.id} record={record} />)}
        </div>
    );
};

export default PreviousRecords;