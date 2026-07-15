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
  name: "list_articles",
  title: "List published articles",
  description: "List published blog articles (Artikel) with title, slug, category, and excerpt.",
  inputSchema: {
    limit: z.number().int().optional().describe("Max number of articles to return. Server clamps to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const capped = Math.min(Math.max(limit ?? 20, 1), 50);
    const { data, error } = await supabaseForUser(ctx)
      .from("articles")
      .select("id, title, slug, category, excerpt, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(capped);
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: { articles: data ?? [] },
        };
  },
});
