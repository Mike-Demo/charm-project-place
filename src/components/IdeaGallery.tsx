import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { signIdeaImage } from "@/lib/atelier-service";
import { getIdeaByToken, type IdeaView } from "@/lib/idea.functions";

function IdeaBody({ idea }: { idea: IdeaView }) {
  if (!idea.description && !idea.referenceUrl && !idea.sketchUrl) return null;
  return (
    <div className="mt-3 rounded-lg border border-dashed border-ink-dim/40 bg-paper-deep/40 p-3">
      <p className="font-mono text-xs text-ink-pencil">Tattoo idea</p>
      {idea.description && <p className="mt-1 whitespace-pre-wrap">{idea.description}</p>}
      <div className="mt-2 flex flex-wrap gap-3">
        {idea.referenceUrl && <a href={idea.referenceUrl} target="_blank" rel="noopener noreferrer"><img src={idea.referenceUrl} alt="Client reference photo" className="sketch-card h-28 w-28 object-cover p-1" /><span className="sr-only"> (opens in new tab)</span></a>}
        {idea.sketchUrl && <a href={idea.sketchUrl} target="_blank" rel="noopener noreferrer"><img src={idea.sketchUrl} alt="Pencil concept sketch" className="sketch-card h-28 w-28 object-cover p-1" /><span className="sr-only"> (opens in new tab)</span></a>}
      </div>
    </div>
  );
}

export function PassIdea({ token }: { token: string }) {
  const fetchIdea = useServerFn(getIdeaByToken);
  const query = useQuery({ queryKey: ["pass-idea", token], queryFn: () => fetchIdea({ data: { token } }), staleTime: 30 * 60_000 });
  return query.data ? <IdeaBody idea={query.data} /> : null;
}

export function AdminIdea({ id, description, referencePath, sketchPath }: { id: string; description: string | null; referencePath: string | null; sketchPath: string | null }) {
  const query = useQuery({
    queryKey: ["admin-idea", id, referencePath, sketchPath],
    enabled: Boolean(description || referencePath || sketchPath),
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<IdeaView> => ({
      description,
      referenceUrl: referencePath ? await signIdeaImage(referencePath) : null,
      sketchUrl: sketchPath ? await signIdeaImage(sketchPath) : null,
    }),
  });
  return query.data ? <IdeaBody idea={query.data} /> : null;
}
