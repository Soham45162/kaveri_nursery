export default function SectionHeader({ eyebrow, title, text, center = false }) {
  return (
    <div className={`mb-12 ${center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.28em] text-soil dark:text-leaf-300">{eyebrow}</p>
      <h2 className="font-display text-4xl font-extrabold leading-tight text-leaf-900 dark:text-leaf-50 md:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-8 text-leaf-900/70 dark:text-leaf-100/80">{text}</p>}
    </div>
  );
}
