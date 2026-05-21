import { useEffect, useState } from 'react';

export default function StatCard({ icon: Icon, label, value, suffix = '+' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = Number(value);
    const step = Math.max(1, Math.ceil(end / 70));
    const timer = setInterval(() => {
      setCount((current) => {
        const next = current + step;
        if (next >= end) {
          clearInterval(timer);
          return end;
        }
        return next;
      });
    }, 22);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="glass rounded-2xl p-6 text-center card-hover">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-leaf-700 text-white">
        <Icon size={22} />
      </div>
      <div className="font-display text-4xl font-extrabold">{count.toLocaleString()}{suffix}</div>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-leaf-900/60 dark:text-leaf-100/70">{label}</p>
    </div>
  );
}
