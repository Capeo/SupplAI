import { NextResponse } from "next/server";
import { analyzeTenderAndResponse } from "@/app/services/openai";

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const tenderUrl = formData.get('tenderUrl') as string;
    const responseFile = formData.get('response') as File;
    
    if (!company || !tenderUrl || !responseFile) {
      throw new Error("Missing required fields");
    }

    const responseBuffer = Buffer.from(await responseFile.arrayBuffer());
    
    const response = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    (async () => {
      try {
        const analysis = await analyzeTenderAndResponse(tenderUrl, responseBuffer, company);
        await writer.write(encoder.encode(`data: ${JSON.stringify(analysis)}\n\n`));
      } catch (error) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Analysis failed' })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
} 