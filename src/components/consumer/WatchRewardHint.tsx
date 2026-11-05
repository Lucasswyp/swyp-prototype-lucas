import { SwypToken } from "@/components/ui/SwypToken";

interface Props {
  tokens: number;
  progress: number; // 0 tot 100, richting het doel
  loggedIn: boolean;
  onLogin: () => void;
}

/** Linksboven op de video: wat kijken tot het eind oplevert, met een balkje dat vult. */
export function WatchRewardHint({ tokens, progress, loggedIn, onLogin }: Props) {
  const body = loggedIn ? (
    <>
      <span>Kijk tot het eind</span>
      <span className="flex items-center gap-1 font-bold">
        +{tokens} <SwypToken size={13} />
      </span>
    </>
  ) : (
    <span>Log in en verdien +{tokens} tokens</span>
  );
  const className =
    "absolute left-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 flex max-w-[60%] flex-col gap-1 rounded-2xl bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur";
  const content = (
    <>
      <span className="flex items-center gap-2">{body}</span>
      {loggedIn && (
        <span className="h-1 w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span className="block h-full rounded-full bg-gradient-to-r from-violet to-magenta transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </span>
      )}
    </>
  );
  return loggedIn ? (
    <div className={`pointer-events-none ${className}`}>{content}</div>
  ) : (
    <button type="button" onClick={onLogin} className={className}>
      {content}
    </button>
  );
}
