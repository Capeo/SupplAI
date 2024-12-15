import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { checkRegisteredStaffingCompanyStatus } from "@/app/services/company";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AnalysisResponse } from "@/types/analysis";

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  modelName: "gpt-4o-mini",
});


const defaultSystemPrompt = 'Du er en ekspert på å analysere anbudsdokumenter. Svar alltid på norsk.'


async function checkStaffingRequirement(tenderContent: string): Promise<boolean> {
  const prompt = new SystemMessage({
    content: `Krever dette anbudet at konsulenten kommer fra er et bemanningsforetak? Les hele anbudet nøye. Svar kun 'JA' eller 'NEI'.

Anbudsdokument:
${tenderContent}`
  });

  const response = await model.invoke([defaultSystemPrompt, prompt]);
  return response.content.toString().includes('JA');
}

async function identifyTenderRequirements(tenderContent: string): Promise<string> {
  const prompt = new SystemMessage({
    content: `Les gjennom anbudsdokumentet og identifiser de viktigste kravene, både formelle og kvalifikasjonskrav. Fokuser spesielt på Må-ha krav. Svar kun med en liste med krav fra anbudsdokumentet.

Anbudsdokument:
${tenderContent}`
  });

  const response = await model.invoke([defaultSystemPrompt, prompt]);
  return response.content.toString();
}

async function evaluateResponseQualification(
  tenderRequirements: string, 
  responseContent: string, 
): Promise<string> {
  const prompt = new SystemMessage({
    content: `Analyser hvordan tilbudet møter disse kravene fra anbudsdokumentet.

Krav:
${tenderRequirements}

1. For hvert krav, vurder hvordan tilbudet svarer på dette:
   - Fullt oppfylt
   - Delvis oppfylt
   - Ikke oppfylt
   - Ikke adressert
2. Gi konkrete eksempler fra tilbudet.`
  });

  const response = await model.invoke([
    defaultSystemPrompt,
    prompt,
    new HumanMessage({ content: responseContent })
  ]);

  return response.content.toString();
}

async function getAllPagesContent(docs: any[]): Promise<string> {
  return docs.map(doc => doc.pageContent).join('\n\n');
}

export async function analyzeTenderAndResponse(
  tenderBuffer: Buffer,
  responseBuffer: Buffer,
  companyName: string
): Promise<AnalysisResponse> {
  try {
    const tenderBlob = new Blob([tenderBuffer]);
    const responseBlob = new Blob([responseBuffer]);
    
    const [tenderDocs, responseDocs] = await Promise.all([
      new PDFLoader(tenderBlob).load(),
      new PDFLoader(responseBlob).load()
    ]);

    const tenderContent = await getAllPagesContent(tenderDocs);
    const responseContent = await getAllPagesContent(responseDocs);

    const requiresApproval = await checkStaffingRequirement(tenderContent);

    let companyStatus: boolean | undefined;
    if (requiresApproval) {
      companyStatus = await checkRegisteredStaffingCompanyStatus(companyName);
    }

    const tenderRequirements = await identifyTenderRequirements(tenderContent);
    const qualificationAnalysis = await evaluateResponseQualification(
      tenderRequirements,
      responseContent,
    );

    return {
      tenderRequirements,
      qualificationAnalysis,
      requiresApproval,
      companyStatus: requiresApproval ? companyStatus : undefined,
      success: true,
    };

  } catch (error) {
    console.error('OpenAI Service Error:', error);
    return {
      tenderRequirements: '',
      qualificationAnalysis: '',
      success: false,
    };
  }
} 