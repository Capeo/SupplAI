import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { checkCompanyStatus } from "@/app/services/company";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export async function analyzeTenderAndResponse(
  tenderUrl: string,
  responseBuffer: Buffer,
  companyName: string
) {
  try {
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
      modelName: "gpt-4o-mini",
    });

    // Load response PDF
    const responseBlob = new Blob([responseBuffer]);
    const responseLoader = new PDFLoader(responseBlob);
    const responseDocs = await responseLoader.load();

    // Initial check for bemanningsforetak requirement
    const initialPrompt = new SystemMessage({
      content: `Du er en ekspert på å analysere anbudsdokumenter. Besøk denne lenken: ${tenderUrl} og sjekk om dette anbudet krever at selskapet er et 'Godkjent bemanningsforetak'. Svar kun 'JA' eller 'NEI'.`
    });

    const requiresApproval = await model.invoke([initialPrompt]);

    // Check company status if needed
    let companyStatus = false;
    if (requiresApproval.content.toString().includes('JA')) {
      companyStatus = await checkCompanyStatus(companyName);
    }

    // Main analysis comparing tender and response
    const analysisPrompt = new SystemMessage({
      content: `Du er en ekspert på å analysere anbudsdokumenter. Besøk denne lenken: ${tenderUrl} og analyser hvordan tilbudet fra ${companyName} møter kravene i anbudsdokumentet.

1. List opp hovedkravene fra anbudsdokumentet.
2. For hvert krav, vurder hvordan tilbudet svarer på dette:
   - Fullt oppfylt
   - Delvis oppfylt
   - Ikke oppfylt
   - Ikke adressert
3. Gi konkrete eksempler fra tilbudet.
${requiresApproval.content.toString().includes('JA') ? 
  `4. Merk: Selskapet er ${companyStatus ? 'godkjent' : 'ikke godkjent'} som bemanningsforetak.` : ''}`
    });

    const responseContent = new HumanMessage({
      content: responseDocs[0].pageContent
    });

    const analysis = await model.invoke([
      analysisPrompt,
      responseContent
    ]);

    return {
      analysis: analysis.content,
      requiresApproval: requiresApproval.content.toString().includes('JA'),
      companyStatus: requiresApproval.content.toString().includes('JA') ? companyStatus : undefined,
      success: true,
    };

  } catch (error) {
    console.error('OpenAI Service Error:', error);
    return {
      error: "Failed to analyze tender and response",
      success: false,
    };
  }
} 