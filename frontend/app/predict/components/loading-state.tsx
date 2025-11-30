import styles from './loading-state.module.css';

export function LoadingState() {
  return (
    <div className={styles.loadingState}>
      <div className={styles.skeleton} style={{ height: '200px' }} />
      <div className={styles.skeleton} style={{ height: '100px' }} />
      <div className={styles.skeleton} style={{ height: '100px' }} />
    </div>
  );
}
