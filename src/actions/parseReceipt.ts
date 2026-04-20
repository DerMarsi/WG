"use server";

import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "Tarih (GG.AA.YYYY)" },
    store: { type: Type.STRING, description: "Market Adı" },
    totalAmount: { type: Type.NUMBER, description: "Fişin Toplam Tutarı (€)" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Ürün Adı" },
          category: {
            type: Type.STRING,
            description: "Şu listeden biri olmalı: Sebze & Meyve, Et & Tavuk, Kahvaltılık, Süt Ürünleri, Temel Gıda, Atıştırmalık, İçecekler, Temizlik, Kişisel Bakım, Depozito İadesi, Diğer"
          },
          price: { type: Type.NUMBER, description: "Ürün Fiyatı (€)" },
          isShared: { type: Type.BOOLEAN, description: "Ürün herkes için ortaksa true, tek kişiye ait olma ihtimali yüksekse false" }
        },
        required: ["name", "category", "price", "isShared"]
      }
    }
  },
  required: ["date", "store", "totalAmount", "items"]
};

export async function parseReceiptImage(base64Image: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            {
              text: "Lütfen bu Almanya market fişini oku. Tüm ürünleri, fiyatlarını ve market/tarih bilgilerini çıkart. Kategorileri verdiğim listeden mantıklı şekilde seç. Pfand veya Leergut varsa Depozito İadesi kategorisine eksi fiyatla ekle."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        temperature: 0.1,
      }
    });

    if (response.text) {
      return { success: true, data: JSON.parse(response.text) };
    }
    return { success: false, error: "Metin dönmedi." };
  } catch (error: any) {
    console.error("Gemini API Hatası:", error);
    let errorMsg = error.message || "Bilinmeyen bir hata oluştu.";
    if (errorMsg.includes("503") || errorMsg.includes("high demand")) {
      errorMsg = "Şu anda Google Gemini sunucularında yoğunluk var (503). Lütfen 1-2 dakika bekleyip tekrar deneyin.";
    }
    return { success: false, error: errorMsg };
  }
}
