import { useI18n } from '../i18n/context';

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
      onClick={() => onGenerate(crypto.getRandomValues(new Uint32Array(1))[0])}
    >
      {t('seed.random')}
    </button>
  );
}
