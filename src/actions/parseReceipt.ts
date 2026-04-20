"use server";

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `Sen bir uzman veri analistisin. Sana verilen metin, bir Almanya market fişinden Optik Karakter Tanıma (OCR) ile çıkarılmış ham metindir. Metin hatalı veya karışık olabilir. Senin görevin bu metni mantıksal olarak analiz edip çıkarımlarını tam olarak aşağıdaki JSON formatında döndürmektir. Çıktıda SADECE JSON olmalıdır, hiçbir ekstra açıklama veya metin YAZMA.

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
    // 1. Adım: Ücretsiz OCR.space API ile resmi metne çevir
    const formData = new FormData();
    formData.append('base64image', `data:${mimeType};base64,${base64Image}`);
    formData.append('language', 'ger');
    formData.append('isTable', 'true');
    formData.append('scale', 'true');

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'helloworld' // Genel ücretsiz kullanım anahtarı
      },
      body: formData
    });

    const ocrResult = await ocrResponse.json();
    
    if (ocrResult.IsErroredOnProcessing || !ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
      throw new Error("OCR Hatası: Fişteki yazılar okunamadı. Lütfen daha net bir fotoğraf çekin.");
    }

    const rawText = ocrResult.ParsedResults[0].ParsedText;

    if (!rawText || rawText.trim() === "") {
      throw new Error("Fişte okunabilir metin bulunamadı.");
    }

    // 2. Adım: Çıkan ham metni Groq (Llama 3.3 70B Text Modeli) ile JSON'a çevir
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Lütfen bu OCR metnini analiz et ve ürünleri çıkar:\n\n" + rawText }
      ],
      model: "llama-3.3-70b-versatile",
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
    console.error("İşlem Hatası:", error);
    return { success: false, error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}
