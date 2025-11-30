'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PredictResponse } from '@/types';
import { Clock, Sparkles, CheckCircle2 } from 'lucide-react';

interface PredictionResultProps {
  result: PredictResponse;
}

export function PredictionResult({ result }: PredictionResultProps) {
  const processingTimeSeconds = Math.round(result.processing_time / 1000);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">Prediction Complete</p>
          <p className="text-sm text-green-700">
            Processed in {processingTimeSeconds}s • Case #{result.case_id.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Main Diagnosis Card */}
      <Card className="border-2 border-[#5e6ad2]/20">
        <CardHeader className="border-b border-gray-200/80">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                  Main Diagnosis
                </span>
                <Badge variant="info" className="text-[11px]">
                  {Math.round(result.main_diagnosis.confidence * 100)}% Confidence
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                <code className="font-mono font-bold text-[#5e6ad2]">
                  {result.main_diagnosis.code}
                </code>
                {' · '}
                {result.main_diagnosis.name}
              </h2>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 pl-4 border-l-2 border-[#5e6ad2]">
            <Sparkles className="h-4 w-4 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
            <p className="text-[15px] text-gray-700 leading-relaxed">
              {result.main_diagnosis.reasoning}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Diagnoses */}
      {result.secondary_diagnoses.length > 0 && (
        <Card>
          <CardHeader className="border-b border-gray-200/80">
            <CardTitle className="text-[13px] font-semibold text-gray-600 uppercase tracking-wider">
              Secondary Diagnoses ({result.secondary_diagnoses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200/80">
              {result.secondary_diagnoses.map((diagnosis, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-start gap-1 min-w-[90px]">
                      <code className="text-[13px] font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {diagnosis.code}
                      </code>
                      {diagnosis.confidence && (
                        <span className="text-[11px] text-gray-400 font-medium tabular-nums">
                          {Math.round(diagnosis.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-gray-900 mb-1">
                        {diagnosis.name}
                      </p>
                      {diagnosis.reasoning && (
                        <p className="text-[13px] text-gray-600 leading-relaxed">
                          {diagnosis.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Codes (Step 1) */}
      <Card>
        <CardHeader className="border-b border-gray-200/80">
          <CardTitle className="text-[13px] font-semibold text-gray-600 uppercase tracking-wider">
            Selected Code Categories (Step 1)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {result.selected_codes.map((code) => (
              <Badge key={code} variant="default" className="font-mono text-[12px]">
                {code}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex items-center justify-center gap-6 py-4 text-[13px] text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Processing: {processingTimeSeconds}s</span>
        </div>
        <span>•</span>
        <span>Prediction ID: {result.prediction_id.slice(0, 12)}...</span>
        <span>•</span>
        <span>Case ID: {result.case_id.slice(0, 12)}...</span>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-6 pb-12">
        <button className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          View Feedback Form
        </button>
        <button className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
          ✓ Approve Prediction
        </button>
      </div>
    </div>
  );
}
