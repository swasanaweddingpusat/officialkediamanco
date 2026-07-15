import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_locations",
  title: "List venue locations",
  description: "List all active Kediaman venue locations with their address, contact info, and facilities.",
  inputSchema: {
    include_coming_soon: z
      .boolean()
      .optional()
      .describe("Whether to include venues marked as coming soon. Defaults to false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_coming_soon }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("locations")
      .select("id, name, address, phone, email, category, facilities, is_coming_soon")
      .eq("is_active", true)
      .order("sort_order");
    if (!include_coming_soon) query = query.eq("is_coming_soon", false);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: { locations: data ?? [] },
        };
  },
});
