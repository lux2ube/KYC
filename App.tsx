import React, { useState, useMemo } from 'react';
import { KycData } from './types';
import ImageUploader from './components/ImageUploader';
import ExtractionResult from './components/ExtractionResult';
import Spinner from './components/Spinner';
import PreviousRecords from './components/PreviousRecords';
import { extractKycData } from './services/geminiService';
import { saveKycData } from './services/firebaseService';
import { IdCardIcon, DatabaseIcon } from './components/icons';

type View = 'extractor' | 'records';

const App: React.FC = () => {
  const [view, setView] = useState<View>('extractor');
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<KycData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);


  const isExtractionDisabled = useMemo(() => {
    if (isLoading) return true;
    return !image1;
  }, [isLoading, image1]);

  const resetFilesAndResult = () => {
    setImage1(null);
    setImage2(null);
    setExtractedData(null);
    setError(null);
    setIsSaving(false);
    setIsSaved(false);
    setSaveError(null);
  };
  
  const handleReset = () => {
    resetFilesAndResult();
    setIsLoading(false);
  }

  const handleExtract = async () => {
    setError(null);
    setSaveError(null);
    setIsSaved(false);
    setExtractedData(null);
    setIsLoading(true);

    const filesToProcess: File[] = [];
    if (image1) filesToProcess.push(image1);
    if (image2) filesToProcess.push(image2);
    
    if (filesToProcess.length === 0) {
      setError("Please upload at least one document image.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await extractKycData(filesToProcess);
      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during extraction.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!extractedData) return;
    setSaveError(null);
    setIsSaving(true);
    try {
        await saveKycData(extractedData);
        setIsSaved(true);
    } catch (err: any) {
        setSaveError(err.message || 'An unknown error occurred while saving.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleUpdateField = (key: keyof KycData, value: string) => {
    setExtractedData(prevData => {
        if (!prevData) return null;
        // When a field is edited, we reset the "saved" status
        setIsSaved(false); 
        return { ...prevData, [key]: value };
    });
  };

  const NavTab: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
  }> = ({ label, isActive, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
        ${isActive
          ? 'border-blue-500 text-white'
          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500/30">
      <main className="w-full max-w-2xl mx-auto bg-gray-800 shadow-2xl shadow-blue-500/10 rounded-xl">
        <div className="p-6 md:p-8 space-y-6">
            <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Arabic KYC Smart Extractor</h1>
            <p className="text-gray-400 mt-2">Upload your ID or Passport to let AI smartly extract the details.</p>
            </div>
        </div>

        <div className="flex border-b border-t border-gray-700 bg-gray-800/50 sticky top-0 z-10">
            <NavTab label="Extractor" isActive={view === 'extractor'} onClick={() => setView('extractor')} icon={IdCardIcon} />
            <NavTab label="Records" isActive={view === 'records'} onClick={() => setView('records')} icon={DatabaseIcon} />
        </div>

        <div className="p-6 md:p-8 space-y-6">
            {view === 'extractor' && (
                <>
                    {!extractedData && !isLoading && (
                    <div className="space-y-6">
                        <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Document Image(s)</label>
                         <p className="text-xs text-gray-500 mb-4">Upload one image for a passport, or two for the front and back of an ID card.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploader label="Image 1" file={image1} onFileChange={setImage1} disabled={isLoading} />
                            <ImageUploader label="Image 2 (Optional)" file={image2} onFileChange={setImage2} disabled={isLoading} />
                        </div>
                        </div>
                    </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">
                            <p><span className="font-bold">Error:</span> {error}</p>
                        </div>
                    )}

                    {isLoading && (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Spinner className="w-12 h-12 text-blue-500"/>
                        <p className="mt-4 text-lg font-semibold text-gray-300">Detecting & Extracting...</p>
                        <p className="text-sm text-gray-500">AI is analyzing your document. Please wait.</p>
                    </div>
                    )}

                    {extractedData && !isLoading && (
                    <div>
                        <ExtractionResult data={extractedData} onUpdateField={handleUpdateField} />
                    </div>
                    )}

                    <div className="pt-4 border-t border-gray-700">
                        {extractedData && !isLoading ? (
                             <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleSaveRecord}
                                        disabled={isSaving || isSaved}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                                    >
                                        {isSaving ? <Spinner className="w-5 h-5"/> : (isSaved ? '✓ Saved' : 'Save Record')}
                                    </button>
                                     <button
                                        onClick={handleExtract}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                                    >
                                        Retry Extraction
                                    </button>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                                >
                                    Start New Verification
                                </button>
                                 {saveError && (
                                    <p className="text-red-400 text-sm text-center">Failed to save: {saveError}</p>
                                 )}
                            </div>
                        ) : (
                            <button
                                onClick={handleExtract}
                                disabled={isExtractionDisabled}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                            >
                                {isLoading ? <Spinner /> : 'Extract Information'}
                            </button>
                        )}
                    </div>
                </>
            )}
            {view === 'records' && (
                <PreviousRecords />
            )}
        </div>
      </main>
      <footer className="text-center mt-8 text-gray-600 text-xs max-w-2xl mx-auto">
        <p>
            Disclaimer: This is an AI-powered tool. The extracted information may not be 100% accurate. 
            Always verify the data manually. Uploaded images are processed for extraction and are not stored.
        </p>
      </footer>
    </div>
  );
};

export default App;