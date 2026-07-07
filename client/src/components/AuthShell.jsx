import { motion } from 'framer-motion';
import { BrandMark } from './BrandMark';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export const AuthShell = ({ eyebrow, title, description, points, children, footer }) => {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.aside
        variants={container}
        initial="hidden"
        animate="show"
        className="section-shell flex flex-col justify-between gap-8 p-6 sm:p-8"
      >
        <div className="space-y-6">
          <motion.div variants={item}>
            <BrandMark />
          </motion.div>
          <motion.div variants={item} className="space-y-4">
            <p className="section-label w-fit">{eyebrow}</p>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          </motion.div>
        </div>

        <motion.div variants={item} className="grid gap-3">
          {points.map((point) => (
            <div
              key={point}
              className="surface-card flex items-center justify-between px-4 py-3 text-sm text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:text-slate-300"
            >
              <span>{point}</span>
              <span className="flex items-center gap-1.5 text-cyan-500">
                <span className="size-1.5 rounded-full bg-cyan-500" />
                Ready
              </span>
            </div>
          ))}
        </motion.div>
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="surface-card p-6 sm:p-8"
      >
        {children}
        {footer ? <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">{footer}</div> : null}
      </motion.div>
    </section>
  );
};

