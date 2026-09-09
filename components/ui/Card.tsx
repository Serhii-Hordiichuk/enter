interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, className = '' }: CardProps): React.JSX.Element {
  return (
    <section className={'rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl shadow-black/30 ' + className}>
      {title ? <h2 className="text-lg font-semibold text-zinc-50">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      <div className={title || description ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}
