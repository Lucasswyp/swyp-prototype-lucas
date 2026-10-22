// De tekst van een pushmelding voor een nieuw bericht. Los van de route zodat
// het testbaar is.
const MAX_BODY = 110;

export interface DmPushPayload {
  title: string;
  body: string;
  url: string;
  threadId: string;
}

export function buildDmPushPayload(args: {
  senderUsername: string | null;
  kind: "text" | "video";
  body: string | null;
  conversationId: string;
}): DmPushPayload {
  const name = args.senderUsername ? `@${args.senderUsername}` : "Nieuw bericht";
  let body: string;
  if (args.kind === "video") {
    body = args.body?.trim() ? `Stuurde je een video: ${args.body.trim()}` : "Stuurde je een video 🎬";
  } else {
    body = (args.body ?? "").trim();
  }
  // Regeleinden en lange teksten maken een melding onleesbaar.
  body = body.replace(/\s+/g, " ");
  if (body.length > MAX_BODY) body = `${body.slice(0, MAX_BODY - 1).trimEnd()}…`;
  return { title: name, body: body || "Nieuw bericht", url: `/app/messages/${args.conversationId}`, threadId: args.conversationId };
}
