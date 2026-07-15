import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listLocationsTool from "./tools/list-locations";
import listProgramsTool from "./tools/list-programs";
import listArticlesTool from "./tools/list-articles";
import myBookingsTool from "./tools/my-bookings";

// Build the direct Supabase auth issuer from the project ref (Vite inlines this
// at build time). Never derive it from SUPABASE_URL — on Lovable Cloud that is
// a `.lovable.cloud` proxy, and mcp-js rejects mismatched issuers.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kediaman-mcp",
  title: "Kediaman Corp MCP",
  version: "0.1.0",
  instructions:
    "Tools for Kediaman Corp — venue operator in Indonesia. Use `list_locations` for venue details, `list_programs` for special offers/Promosi, `list_articles` for blog content, and `my_bookings` to fetch the signed-in user's ballroom booking requests.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listLocationsTool, listProgramsTool, listArticlesTool, myBookingsTool],
});
