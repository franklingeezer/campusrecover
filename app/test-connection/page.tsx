
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestConnection() {
  const [status, setStatus] = useState("Checking connection...");

  useEffect(() => {
    async function testConnection() {
      const supabase = createClient();

      const { error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (error?.code === "42P01" || error?.code === "PGRST205") {
        setStatus("Supabase connected! Database table not created yet.");
      } else if (error) {
        setStatus(`Connection issue: ${error.message}`);
      } else {
        setStatus("Supabase connected successfully!");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#173D32]">
          CampusRecover
        </h1>
        <p className="mt-4 text-slate-600">{status}</p>
      </div>
    </main>
  );
}
