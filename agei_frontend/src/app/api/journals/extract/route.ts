import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';


// Define the exact schema we expect Gemini to return
const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clean_transcript: {
      type: Type.STRING,
      description: "A cleaned, properly formatted version of the meeting notes."
    },
    extracted_capsules: {
      type: Type.ARRAY,
      description: "A list of deliverables, due dates, findings, or action items extracted from the notes.",
      items: {
        type: Type.OBJECT,
        properties: {
          capsule_type: {
            type: Type.STRING,
            description: "The type of capsule.",
            enum: ['Finding', 'Recommendation', 'Decision', 'Risk', 'Issue', 'Evidence', 'Observation', 'Deliverable']
          },
          title: {
            type: Type.STRING,
            description: "A short, punchy 3-5 word title for this capsule (e.g. 'Security Audit Complete')."
          },
          summary: {
            type: Type.STRING,
            description: "A 1-2 sentence description of the finding or deliverable."
          },
          supporting_context: {
            type: Type.STRING,
            description: "Brief context around why this was extracted."
          },
          due_date: {
            type: Type.STRING,
            description: "Extracted due date if present (YYYY-MM-DD), otherwise leave null.",
            nullable: true
          }
        },
        required: ["capsule_type", "title", "summary", "supporting_context"]
      }
    }
  },
  required: ["clean_transcript", "extracted_capsules"]
};

export async function POST(req: Request) {
  try {
    // Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key_for_build' });
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // Initialize Supabase Service Client for Audit Logging (Bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE || 'dummy_key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { text, principalId, organizationId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const prompt = `You are a strict deterministic extraction engine.
    Parse the following raw meeting transcript.
    1. Clean up the formatting and spelling into a professional 'clean_transcript'.
    2. Extract all deliverables, objectives, due dates, and key findings into the 'extracted_capsules' array.
    
    Raw Notes:
    ${text}`;

    // Call Gemini with Structured Outputs
    // Using GEMINI_MODEL from .env or defaulting to gemini-2.0-flash
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionSchema,
        temperature: 0.1, // Low temperature for deterministic behavior
      }
    });

    const rawResponseText = response.text || '{}';
    const jsonResponse = JSON.parse(rawResponseText);
    const usage = response.usageMetadata;

    // CAIF-LCM Cryptographic Audit Hashing
    const timestamp = new Date().toISOString();
    const hashPayload = prompt + rawResponseText + timestamp + (principalId || 'system');
    const transactionHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    // Asynchronously log to the database (fire and forget)
    // In production, you might want to await this to ensure audit compliance before returning
    supabase.from('caif_audit_logs').insert({
      principal_id: principalId || null,
      organization_id: organizationId || null,
      model_used: model || 'gemini-3.6-flash',
      prompt_tokens: usage?.promptTokenCount || 0,
      completion_tokens: usage?.candidatesTokenCount || 0,
      total_tokens: usage?.totalTokenCount || 0,
      raw_prompt: prompt,
      raw_response: jsonResponse,
      transaction_hash: transactionHash,
    }).then(({ error }) => {
      if (error) console.error('CAIF-LCM Audit Error:', error);
      else console.log(`[CAIF-LCM] Audit Logged: ${transactionHash}`);
    });

    return NextResponse.json(jsonResponse, { status: 200 });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
