import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { SendChatMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts: Record<string, string> = {
  sq: `Ti je asistenti i ImmoVia365-s, një platformë profesionale për rinovim dhe ndërtim. Ndihmo klientët me informacione për renovime, kostot e mundshme, materiale ndërtimi, dhe proceset e projekteve. Jij i sjellshëm, profesional dhe i dobishëm. Mos jep çmime ekzakte, por ofro vlerësime të arsyeshme dhe këshilla.`,
  en: `You are the ImmoVia365 assistant, a professional renovation and construction services platform. Help clients with information about renovations, possible costs, building materials, and project processes. Be friendly, professional, and helpful. Don't give exact prices, but offer reasonable estimates and advice.`,
  de: `Du bist der ImmoVia365-Assistent, eine professionelle Plattform für Renovierungs- und Bauleistungen. Helfe Kunden mit Informationen zu Renovierungen, möglichen Kosten, Baumaterialien und Projektabläufen. Sei freundlich, professionell und hilfreich. Gib keine genauen Preise an, aber biete vernünftige Schätzungen und Ratschläge.`,
};

router.post("/chat/message", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid chat message body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, language = "en" } = parsed.data;
  const lang = (language as string) in systemPrompts ? (language as string) : "en";
  const systemPrompt = systemPrompts[lang];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't process your request.";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "OpenAI API error");
    res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

export default router;
