"use server";

import { createClient } from '@supabase/supabase-js';

export async function saveReceiptToDb(receiptData: any, userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Sunucu tarafında Supabase anahtarları eksik. Lütfen Vercel ayarlarını kontrol edin." };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Insert the main receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        store: receiptData.store,
        date: receiptData.date,
        total_amount: Number(receiptData.totalAmount),
        uploaded_by: userId
      })
      .select()
      .single();

    if (receiptError) {
      console.error("Receipt Insert Error:", receiptError);
      return { success: false, error: `Fiş ana tablosuna kaydedilemedi: ${receiptError.message}` };
    }

    // 2. Insert items
    const itemsToInsert = receiptData.items.map((item: any) => ({
      receipt_id: receipt.id,
      name: item.name,
      category: item.category,
      price: Number(item.price),
      is_shared: item.isShared
    }));

    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Items Insert Error:", itemsError);
      // Optional: Delete the receipt if items fail
      await supabase.from('receipts').delete().eq('id', receipt.id);
      return { success: false, error: `Ürünler kaydedilemedi: ${itemsError.message}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Supabase Save Error:", error);
    return { success: false, error: error.message || "Veritabanı bağlantısında bilinmeyen hata." };
  }
}
