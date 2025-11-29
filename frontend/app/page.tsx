import Link from 'next/link';
import { Sparkles, FileText, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200/80">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">DRGxCoder</h1>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">AI ICD-10 Prediction</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
            Welcome to DRGxCoder
          </h2>
          <p className="text-[17px] text-gray-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered medical coding assistant for ICD-10 diagnosis code prediction.
            Analyze patient data and generate accurate diagnosis codes in minutes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/predict"
            className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-[#5e6ad2] hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#5e6ad2]/10 rounded-lg group-hover:bg-[#5e6ad2]/20 transition-colors">
                <Sparkles className="h-5 w-5 text-[#5e6ad2]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                New Prediction
              </h3>
            </div>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Submit patient clinical data for AI diagnosis code prediction
            </p>
          </Link>
          
          <div className="group p-6 bg-white rounded-lg border border-gray-200 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500">
                View Cases
              </h3>
            </div>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Browse and review past patient cases (Coming soon)
            </p>
          </div>
          
          <div className="group p-6 bg-white rounded-lg border border-gray-200 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500">
                Search Codes
              </h3>
            </div>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Search ICD-10 codes and view usage statistics (Coming soon)
            </p>
          </div>
        </div>

        <div className="mt-16 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            How it works
          </h3>
          <div className="space-y-3 text-[15px] text-gray-700">
            <div className="flex gap-3">
              <span className="font-semibold text-[#5e6ad2]">1.</span>
              <p>Enter patient clinical text, lab results, and medications</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[#5e6ad2]">2.</span>
              <p>AI analyzes data in 2 steps (~2 minutes total processing time)</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[#5e6ad2]">3.</span>
              <p>Review predictions with confidence scores and AI reasoning</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[#5e6ad2]">4.</span>
              <p>Approve or provide corrections to improve future predictions</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
