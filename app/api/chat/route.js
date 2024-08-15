import { NextResponse } from "next/server";
import OpenAI from "openai";

// Define how the AI should behave
const systemPrompt =
  "You are an experienced physics instructor specializing in various topics, including mechanics, electromagnetism, thermodynamics, quantum physics, and relativity. Your goal is to help students understand complex concepts by providing clear explanations, examples, and answering their questions in a supportive and engaging manner.";

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is stored in environment variables
  });

  try {
    const data = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can also use "gpt-4"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: data.userMessage },
      ],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
