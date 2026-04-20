"use server";

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `Sen bir uzman veri analistisin. Sana verilen Almanya market fişinin fotoğrafını analiz et ve çıkarımlarını tam olarak aşağıdaki JSON formatında döndür. Çıktıda SADECE JSON olmalıdır, hiçbir ekstra açıklama veya metin YAZMA.

JSON Formatı:
{
  "date": "Fiş Tarihi (GG.AA.YYYY)",
  "store": "Market Adı",
  "totalAmount": 12.50,
  "items": [
    {
      "name": "Ürün Adı",
      "category": "Kategori",
      "price": 2.50,
      "isShared": true
    }
  ]
}

Kurallar:
1. "category" alanı SADECE şu kelimelerden biri olabilir: "Sebze & Meyve", "Et & Tavuk", "Kahvaltılık", "Süt Ürünleri", "Temel Gıda", "Atıştırmalık", "İçecekler", "Temizlik", "Kişisel Bakım", "Depozito İadesi", "Diğer".
2. "price" alanı mutlaka bir sayı olmalıdır (nokta ile ayrılmış).
3. "isShared" alanı, eğer ürün açıkça bir kişinin kişisel zevkiyse (örn. protein tozu, tekil bir çikolata) false, aksi halde evin genel ihtiyacıysa true olmalıdır.
4. "Pfand" veya "Leergut" yazan kısımları "Depozito İadesi" kategorisinde eksi (-) değerli price ile ekle.
`;

export async function parseReceiptImage(base64Image: string, mimeType: string) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { 
              type: "image_url", 
              image_url: { url: `data:${mimeType};base64,${base64Image}` } 
            }
          ]
        }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.1,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";
    
    // Extract JSON block if surrounded by markdown formatting
    let rawJson = responseText;
    if (responseText.includes("```json")) {
      rawJson = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      rawJson = responseText.split("```")[1].split("```")[0];
    }
    
    const data = JSON.parse(rawJson.trim());
    return { success: true, data };
  } catch (error: any) {
    console.error("Groq API Hatası:", error);
    return { success: false, error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}
