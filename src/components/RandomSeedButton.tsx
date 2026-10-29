import { useI18n } from '../i18n/context';

/** One uniformly drawn uint32 seed, shared by the dice button and fresh drafts. */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

export default function RandomSeedButton({
  onGenerate,
  label,
}: {
  onGenerate: (seed: number) => void;
  label: string;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="small"
      aria-label={label}
      title={t('seed.title')}
      onClick={() => onGenerate(randomSeed())}
    >
      {t('seed.random')}
    </button>
  );
}
