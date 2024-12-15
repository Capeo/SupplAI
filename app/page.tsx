'use client';

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { DownloadLink } from "@/components/ui/download-link";
import { AnalysisResponse } from "@/types/analysis";
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [company, setCompany] = useState('');
  const [tenderFile, setTenderFile] = useState<File | null>(null);
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [showNotImplemented, setShowNotImplemented] = useState(false);
  const [showRegistrationHelp, setShowRegistrationHelp] = useState(false);

  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('company', company);
      if (tenderFile) formData.append('tender', tenderFile);
      if (responseFile) formData.append('response', responseFile);

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setAnalysis(data);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-[90%] md:max-w-2xl">
        {!analysis ? (
          <>
            <h1 className="text-3xl font-bold mb-6">Nytt Anbud</h1>
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
                id="tender-upload"
                type="file"
                label="Last opp anbudsdokument (PDF)"
                accept=".pdf"
                onChange={(e) => setTenderFile(e.target.files?.[0] || null)}
                description={<>
                  Last opp anbudsdokumentet i PDF-format (maks 10MB).
                  <br />
                  <DownloadLink filename="Anbud_eksempel.pdf" label="Se eksempel på anbudsdokument" />
                </>}
              />

              <FormField
                id="response-upload"
                type="file"
                label="Last opp tilbudsdokument (PDF)"
                accept=".pdf"
                onChange={(e) => setResponseFile(e.target.files?.[0] || null)}
                description={<>
                  Last opp ditt tilbudsdokument i PDF-format (maks 10MB).
                  <br />
                  <DownloadLink filename="Besvarelse_eksempel.pdf" label="Se eksempel på tilbudsdokument" />
                </>}
              />

              <Button 
                className="w-full mt-6" 
                onClick={handleFormSubmit}
                disabled={isSubmitting || !company || !tenderFile || !responseFile}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyserer...
                  </>
                ) : 'Send inn'}
              </Button>
              {isSubmitting && (
                <p className="text-sm text-muted-foreground text-center">
                  Dette kan ta litt tid. Takk for tålmodigheten!
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="w-full space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Analyse av tilbud</h2>
              {analysis.requiresApproval && (
                <div className="space-y-2">
                  <div className={`p-4 rounded-md ${analysis.companyStatus ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <p className="font-medium">
                      {analysis.companyStatus 
                        ? '✓ Selskapet er godkjent bemanningsforetak' 
                        : '⚠️ Selskapet er ikke godkjent bemanningsforetak'}
                    </p>
                  </div>
                  {!analysis.companyStatus && (
                    <div className="space-y-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowRegistrationHelp(true)}
                      >
                        Få hjelp til å bli registrert
                      </Button>
                      {showRegistrationHelp && (
                        <p className="text-sm text-muted-foreground text-center">
                          Takk for interessen! Denne funksjonen er ikke implementert enda.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <h3 className="text-xl font-semibold mb-4">Hovedkrav fra tilbudet</h3>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {analysis.tenderRequirements}
                </ReactMarkdown>
              </div>
              <h3 className="text-xl font-semibold mb-4">Vurdering av besvarelse</h3>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {analysis.qualificationAnalysis}
                </ReactMarkdown>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setShowNotImplemented(true)}
              >
                Generer forbedret tilbud
              </Button>
              {showNotImplemented && (
                <p className="text-sm text-muted-foreground text-center">
                  Takk for interessen! Denne funksjonen er ikke implementert enda.
                </p>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setAnalysis(null);
                  setCompany('');
                  setTenderFile(null);
                  setResponseFile(null);
                  setShowNotImplemented(false);
                  setShowRegistrationHelp(false);
                }}
              >
                Ny analyse
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
