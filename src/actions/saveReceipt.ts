"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side writes
);

export async function saveReceiptToDb(receiptData: any, userId: string) {
  try {
    // 1. Insert the main receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        store: receiptData.store,
        date: receiptData.date,
        total_amount: receiptData.totalAmount,
        uploaded_by: userId
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // 2. Insert items
    const itemsToInsert = receiptData.items.map((item: any) => ({
      receipt_id: receipt.id,
      name: item.name,
      category: item.category,
      price: item.price,
      is_shared: item.isShared
    }));

    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return { success: true };
  } catch (error: any) {
    console.error("Supabase Save Error:", error);
    return { success: false, error: error.message };
  }
}
