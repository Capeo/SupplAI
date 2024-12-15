'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FormField } from "@/components/form-field";

interface AnalysisResponse {
  analysis: string;
  requiresApproval?: boolean;
  companyStatus?: boolean;
  success: boolean;
}

export default function Home() {
  const [company, setCompany] = useState('');
  const [tenderUrl, setTenderUrl] = useState('');
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('company', company);
      formData.append('tenderUrl', tenderUrl);
      if (responseFile) formData.append('response', responseFile);

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            setAnalysis(data);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Nytt Anbud</h1>

        {!analysis ? (
          <div className="w-full space-y-4">
            <FormField
              id="company-input"
              label="Mitt selskap"
              placeholder="Fullt selskapsnavn..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              description='Skriv inn det fulle, registrerte selskapsnavnet (f.eks. "Bedrift AS")'
            />

            <FormField
              id="tender-url"
              type="url"
              label="Lenke til anbudsdokument"
              placeholder="https://..."
              value={tenderUrl}
              onChange={(e) => setTenderUrl(e.target.value)}
              description="Lim inn URL-en til anbudsdokumentet fra Doffin eller lignende plattform"
            />

            <FormField
              id="response-upload"
              type="file"
              label="Last opp tilbudsdokument (PDF)"
              accept=".pdf"
              onChange={(e) => setResponseFile(e.target.files?.[0] || null)}
              description="Last opp ditt tilbudsdokument i PDF-format (maks 10MB)"
            />

            <Button 
              className="w-full mt-6" 
              onClick={handleSubmit}
              disabled={isSubmitting || !company || !tenderUrl || !responseFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyserer...
                </>
              ) : 'Send inn'}
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Analyse av tilbud</h2>
              {analysis.requiresApproval && (
                <div className={`p-4 mb-4 rounded-md ${analysis.companyStatus ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <p className="font-medium">
                    {analysis.companyStatus 
                      ? '✓ Selskapet er godkjent bemanningsforetak' 
                      : '⚠️ Selskapet er ikke godkjent bemanningsforetak'}
                  </p>
                </div>
              )}
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{analysis.analysis}</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setAnalysis(null);
                setCompany('');
                setTenderUrl('');
                setResponseFile(null);
              }}
            >
              Ny analyse
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
