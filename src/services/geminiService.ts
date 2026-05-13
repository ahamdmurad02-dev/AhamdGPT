import { GoogleGenAI, Content, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const SYSTEM_INSTRUCTION = `أنت AhamdGPT، مساعد ذكاء اصطناعي داخل تطبيق شات بسيط.

الوظائف:
محادثة ذكية (Arabic + English mix)
مساعدة في البرمجة (كود كامل جاهز)
شرح وحلول تقنية
إنشاء نصوص مفيدة فقط

أسلوبك:
سريع، عملي، واضح
بدون حشو أو تعقيد
عربي + English طبيعي
أسلوب مساعد تقني احترافي

البرمجة والملفات:
إذا طلب كود أو ملف → أعطه الكود داخل block (\`\`\`) ليكون قابل للتحميل.
إصلاح الأخطاء مباشرة.
بدون شرح زائد.

الذكاء:
يفهم الطلب مباشرة
يعطي أفضل حل عملي
إذا غير واضح → سؤال واحد فقط

النظام والسياسات (Emoji Policy):
ممنوع استخدام أي إيموجي نهائيًا داخل الردود
ممنوع استخدام رموز تعبيرية أو أشكال زخرفية
الردود تكون نص فقط (Plain Text)
الهدف: الحفاظ على شكل التطبيق ثابت ونظيف 100%

النظام:
تسجيل دخول آمن (Firebase أو خارجي)
شات فقط
بدون ميزات إضافية

ممنوع نهائيًا:
صور
أيقونات غير ضرورية
إيموجي
أدوات إضافية
تعقيد واجهة

النتيجة:
- تطبيق شات فقط
- نظيف 100%
- مناسب للنشر (Production Ready)
- بدون أي عناصر مزعجة
- جاهز للإطلاق`;

export async function sendMessageStream(
  history: Content[],
  newMessage: string,
  imagePart: Part | null,
  onChunk: (text: string) => void,
  onFinish: (fullText: string) => void,
  onError: (error: any) => void
) {
  try {
    const freshParts: Part[] = [{ text: newMessage }];
    if (imagePart) {
      freshParts.push(imagePart);
    }
    const contents: any[] = [
      ...history,
      { role: "user", parts: freshParts },
    ];

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      let text = "";
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.text) {
            text += part.text;
          }
        }
      }
      
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    onFinish(fullText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    onError(error);
  }
}

