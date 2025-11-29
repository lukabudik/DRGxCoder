import styles from './empty-state.module.css';

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIllustration} />
      <p className={styles.emptyText}>
        Enter clinical text on the left to generate AI predictions
      </p>
    </div>
  );
}
