import { useEffect, useRef } from "react"
import "./FluidBackground.css"

const backWave =
  "M 525 911 C 742 750 771 384 967 204 C 1113 69 1254 171 1347 304 C 1426 420 1525 378 1665 444 L 1645 682 C 1522 600 1395 512 1267 454 C 1123 388 1028 463 925 641 C 819 823 673 979 525 911 Z"

const middleWave =
  "M 415 906 C 612 862 744 773 869 619 C 1009 447 1133 398 1267 454 C 1395 512 1522 600 1645 682 L 1615 992 L 1279 992 C 1340 855 1390 716 1283 627 C 1151 517 1024 651 888 766 C 719 910 550 989 415 906 Z"

const leftWave =
  "M -155 629 C 31 414 153 335 241 392 C 329 447 367 619 466 697 C 527 745 591 735 642 707 C 543 846 438 856 340 778 C 223 685 211 504 137 491 C 77 481 -25 614 -155 784 Z"

const leftFold =
  "M 127 569 C 150 447 240 417 316 454 C 395 492 440 642 526 705 C 570 736 614 724 642 707 C 552 831 449 825 365 759 C 280 692 258 556 210 537 C 176 524 148 539 127 569 Z"

const frontWave =
  "M -96 674 C 101 410 227 385 332 483 C 436 580 447 754 603 783 C 753 811 887 627 1049 526 C 1222 419 1413 440 1505 624 C 1547 708 1542 821 1499 986 L 1252 986 C 1370 794 1304 596 1189 580 C 1059 560 933 771 747 864 C 547 964 355 950 233 837 C 124 737 108 559 -96 818 Z"

export default function FluidBackground({
  className = "",
}: {
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = rootRef.current
    if (!element) return

    const root = document.documentElement
    let frame = 0
    let listening = false

    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2
        const y = (event.clientY / window.innerHeight - 0.5) * 2
        element.style.setProperty("--pointer-x", `${x * 15}px`)
        element.style.setProperty("--pointer-y", `${y * 11}px`)
      })
    }

    // Follow the resolved motion preference on <html> (set by src/preferences.ts), including live changes.
    const sync = () => {
      const reduce = root.dataset.motion
        ? root.dataset.motion === "reduce"
        : window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      if (reduce && listening) {
        window.removeEventListener("pointermove", move)
        cancelAnimationFrame(frame)
        element.style.setProperty("--pointer-x", "0px")
        element.style.setProperty("--pointer-y", "0px")
        listening = false
      } else if (!reduce && !listening) {
        window.addEventListener("pointermove", move, { passive: true })
        listening = true
      }
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-motion"],
    })
    return () => {
      observer.disconnect()
      window.removeEventListener("pointermove", move)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`fluid-background ${className}`}
      aria-hidden="true"
    >
      <svg
        className="fluid-background__art"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="fluid-bg-light" cx="58%" cy="62%" r="83%">
            <stop offset="0%" stopColor="#071f55" />
            <stop offset="48%" stopColor="#031430" />
            <stop offset="100%" stopColor="#01040e" />
          </radialGradient>

          <radialGradient id="fluid-blue-bloom">
            <stop offset="0%" stopColor="#135ce8" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#135ce8" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="fluid-back" x1="12%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#71f0ff" />
            <stop offset="13%" stopColor="#24a5ef" />
            <stop offset="38%" stopColor="#1466d8" />
            <stop offset="62%" stopColor="#0944cb" />
            <stop offset="82%" stopColor="#111990" />
            <stop offset="100%" stopColor="#030d4f" />
          </linearGradient>

          <linearGradient id="fluid-middle" x1="32%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#46dbe9" />
            <stop offset="16%" stopColor="#096cca" />
            <stop offset="43%" stopColor="#0928a8" />
            <stop offset="71%" stopColor="#071674" />
            <stop offset="100%" stopColor="#020828" />
          </linearGradient>

          <linearGradient id="fluid-left" x1="0%" y1="2%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#8cecff" />
            <stop offset="18%" stopColor="#269af2" />
            <stop offset="48%" stopColor="#153dc0" />
            <stop offset="77%" stopColor="#102195" />
            <stop offset="100%" stopColor="#06104b" />
          </linearGradient>

          <linearGradient id="fluid-fold" x1="8%" y1="8%" x2="62%" y2="100%">
            <stop offset="0%" stopColor="#16b6f9" />
            <stop offset="22%" stopColor="#074bd1" />
            <stop offset="63%" stopColor="#101599" />
            <stop offset="100%" stopColor="#03094c" />
          </linearGradient>

          <linearGradient id="fluid-front" x1="16%" y1="0%" x2="66%" y2="95%">
            <stop offset="0%" stopColor="#60f4fa" />
            <stop offset="10%" stopColor="#10bddf" />
            <stop offset="28%" stopColor="#126adf" />
            <stop offset="51%" stopColor="#0b43d8" />
            <stop offset="75%" stopColor="#111b9a" />
            <stop offset="100%" stopColor="#060c4c" />
          </linearGradient>

          <linearGradient id="fluid-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dffff" stopOpacity="0.7" />
            <stop offset="35%" stopColor="#16d7ff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#1475ff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="fluid-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#69f8ff" stopOpacity="0" />
            <stop offset="28%" stopColor="#82ffff" stopOpacity="0.92" />
            <stop offset="72%" stopColor="#25e4ff" stopOpacity="0.73" />
            <stop offset="100%" stopColor="#48cbff" stopOpacity="0.06" />
          </linearGradient>

          <pattern
            id="fluid-dots"
            width="13"
            height="13"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-17)"
          >
            <circle cx="2" cy="2" r="0.95" fill="#b0ffff" opacity="0.62" />
            <circle cx="8.5" cy="8.5" r="0.55" fill="#6fe4ff" opacity="0.35" />
          </pattern>

          <clipPath id="fluid-front-clip">
            <path d={frontWave} />
          </clipPath>
          <clipPath id="fluid-left-clip">
            <path d={leftFold} />
          </clipPath>

          <filter id="fluid-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="56" />
          </filter>
          <filter
            id="fluid-shadow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        <rect width="1600" height="900" fill="url(#fluid-bg-light)" />
        <ellipse
          cx="900"
          cy="690"
          rx="900"
          ry="390"
          fill="url(#fluid-blue-bloom)"
        />
        <ellipse
          cx="1350"
          cy="710"
          rx="280"
          ry="190"
          fill="#0644d1"
          opacity="0.18"
          filter="url(#fluid-blur)"
        />

        <g className="fluid-layer fluid-layer--back">
          <path
            d={backWave}
            fill="#000320"
            opacity="0.8"
            transform="translate(13 23)"
            filter="url(#fluid-shadow)"
          />
          <path d={backWave} fill="url(#fluid-back)" />
          <path
            d="M 530 907 C 744 748 773 385 968 204 C 1114 68 1254 171 1346 305 C 1423 416 1528 379 1665 444"
            fill="none"
            stroke="url(#fluid-edge)"
            strokeWidth="3"
            opacity="0.9"
          />
          <path
            d="M 878 655 C 1000 407 1118 303 1311 407 C 1414 460 1499 526 1649 620"
            fill="none"
            stroke="#65bbff"
            strokeOpacity="0.22"
            strokeWidth="44"
            filter="url(#fluid-blur)"
          />
        </g>

        <g className="fluid-layer fluid-layer--left">
          <path
            d={leftWave}
            fill="#000626"
            transform="translate(12 24)"
            opacity="0.8"
            filter="url(#fluid-shadow)"
          />
          <path d={leftWave} fill="url(#fluid-left)" />
          <path d={leftFold} fill="url(#fluid-fold)" />
          <path
            d={leftFold}
            fill="url(#fluid-dots)"
            clipPath="url(#fluid-left-clip)"
            opacity="0.6"
          />
          <path
            d="M -145 631 C 31 414 154 335 241 392 C 328 447 367 619 466 697"
            fill="none"
            stroke="#67f3ff"
            strokeWidth="2.8"
            strokeOpacity="0.8"
          />
        </g>

        <g className="fluid-layer fluid-layer--middle">
          <path
            d={middleWave}
            fill="#000420"
            opacity="0.7"
            transform="translate(0 19)"
            filter="url(#fluid-shadow)"
          />
          <path d={middleWave} fill="url(#fluid-middle)" />
          <path
            d="M 426 899 C 612 862 744 773 869 619 C 1009 447 1133 398 1267 454"
            fill="none"
            stroke="#31dfff"
            strokeWidth="4"
            strokeOpacity="0.54"
          />
        </g>

        <g className="fluid-layer fluid-layer--front">
          <path
            d={frontWave}
            fill="#000522"
            transform="translate(8 23)"
            opacity="0.8"
            filter="url(#fluid-shadow)"
          />
          <path d={frontWave} fill="url(#fluid-front)" />
          <g clipPath="url(#fluid-front-clip)">
            <path
              d="M -130 672 C 99 382 248 404 342 485 C 458 610 461 773 610 795 C 780 818 919 614 1052 536 C 1266 409 1451 480 1520 628"
              fill="none"
              stroke="url(#fluid-sheen)"
              strokeWidth="76"
              opacity="0.72"
              filter="url(#fluid-blur)"
            />
            <path
              d="M 182 748 C 360 959 546 933 738 843 C 959 732 1057 539 1198 577 C 1328 615 1369 835 1228 1045 L 750 1060 L 200 944 Z"
              fill="url(#fluid-dots)"
              opacity="0.56"
            />
          </g>
          <path
            d="M -96 674 C 101 410 227 385 332 483 C 436 580 447 754 603 783 C 753 811 887 627 1049 526 C 1222 419 1413 440 1505 624"
            fill="none"
            stroke="url(#fluid-edge)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M -72 699 C 97 448 221 422 319 507 C 417 604 453 772 601 803 C 765 826 913 640 1062 549"
            fill="none"
            stroke="#b0ffff"
            strokeOpacity="0.22"
            strokeWidth="2"
          />
        </g>
      </svg>
      <div className="fluid-background__vignette" />
    </div>
  )
}
