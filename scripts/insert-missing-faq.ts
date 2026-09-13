/// Insert missing FAQ
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase: any = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const mapped = {
  id: randomUUID(),
  question: "¿Cómo comprar?",
  answer: "Es muy sencillo. Navegá por nuestro catálogo, encontrá el producto que necesitás y hacé clic en el botón de WhatsApp. Te vamos a responder directamente para confirmar la disponibilidad, acordar el precio y organizar la entrega. <strong>No hay carrito de compras ni proceso de pago online</strong> — todo se gestiona por WhatsApp de forma directa.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { error } = await supabase.from("faqs").insert(mapped);
if (error) console.error("Error:", error.message);
else console.log("✅ Inserted: ¿Cómo comprar?");