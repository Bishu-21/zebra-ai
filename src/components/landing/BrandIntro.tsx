import Image from "next/image";
import styles from "./BrandIntro.module.css";

export function BrandIntro() {
  return (
    <div className={styles.intro} aria-hidden="true">
      <div className={styles.lockup}>
        <span className={styles.wordLeft}>Zebra</span>
        <span className={styles.markFrame}>
          <Image
            className={styles.mark}
            src="/zebra_star.png"
            alt=""
            width={128}
            height={128}
            priority
            unoptimized
          />
        </span>
        <span className={styles.wordRight}>AI</span>
        <span className={styles.line} />
      </div>
    </div>
  );
}
