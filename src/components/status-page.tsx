import Link from "next/link";

type Props = {
  scene: React.ReactNode;
  code?: string;
  title: string;
  text: string;
  children?: React.ReactNode;
};

// Общий каркас страниц ошибок: иллюстрация, текст и кнопки появляются по очереди.
export function StatusPage({ scene, code, title, text, children }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10 text-center">
      <div className="anim-fade-up">{scene}</div>
      {code && (
        <p className="anim-fade-up mt-4 text-sm font-medium tracking-widest text-neutral-400" style={{ animationDelay: "0.1s" }}>
          {code}
        </p>
      )}
      <h1 className="anim-fade-up mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ animationDelay: "0.15s" }}>
        {title}
      </h1>
      <p className="anim-fade-up mt-3 max-w-sm text-neutral-600" style={{ animationDelay: "0.2s" }}>
        {text}
      </p>
      <div className="anim-fade-up mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.3s" }}>
        {children ?? (
          <Link href="/" className="btn-primary">
            На главную
          </Link>
        )}
      </div>
    </main>
  );
}
