import { NextResponse } from "next/server";
import { analyzeTenderAndResponse } from "@/app/services/openai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const tenderFile = formData.get('tender') as File;
    const responseFile = formData.get('response') as File;
    
    if (!company || !tenderFile || !responseFile) {
      throw new Error("Missing required fields");
    }

    const tenderBuffer = Buffer.from(await tenderFile.arrayBuffer());
    const responseBuffer = Buffer.from(await responseFile.arrayBuffer());
    
    const analysis = await analyzeTenderAndResponse(tenderBuffer, responseBuffer, company);
    return NextResponse.json(analysis);

  } catch (error) {
    console.log(`Failed to process submission ${error}`)
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
} 