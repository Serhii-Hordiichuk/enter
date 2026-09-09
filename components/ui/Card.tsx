interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, className = '' }: CardProps): React.JSX.Element {
  return (
    <section className={'rounded-2xl border border-gotoap-line bg-gotoap-panel p-5 shadow-xl shadow-black/30 ' + className}>
      {title ? <h2 className="text-lg font-semibold text-gotoap-ink">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-gotoap-ink-muted">{description}</p> : null}
      <div className={title || description ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}
