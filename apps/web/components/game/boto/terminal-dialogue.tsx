type TerminalDialogueMessage = {
  speaker: "BOTO" | "ROI";
  text: string;
};

type TerminalDialogueProps = {
  messages: TerminalDialogueMessage[];
};

export function TerminalDialogue({ messages }: TerminalDialogueProps) {
  return (
    <section className="ik-terminal-dialogue" aria-label="Boto terminal dialogue">
      <div className="ik-terminal-dialogue__header">
        <span>COMPANION_CONSOLE.LOG</span>
        <span aria-label="Connection stable">ONLINE</span>
      </div>

      <div className="ik-terminal-dialogue__body">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;

          return (
            <p key={`${message.speaker}-${index}`} className="ik-terminal-dialogue__line">
              <span className="ik-terminal-dialogue__prompt">&gt; {message.speaker}</span>
              <span className="ik-terminal-dialogue__text">
                {message.text}
                {isLast ? <span className="ik-terminal-dialogue__cursor" aria-hidden="true" /> : null}
              </span>
            </p>
          );
        })}
      </div>
    </section>
  );
}
