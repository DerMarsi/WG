"use server";

import { createClient } from '@supabase/supabase-js';

export async function deleteReceiptFromDb(receiptId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Auth error" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }
}
