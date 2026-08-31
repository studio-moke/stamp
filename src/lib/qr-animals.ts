export const QR_ANIMAL_IDS = [
  "cat",
  "dog",
  "rabbit",
  "bear",
  "panda",
  "chick",
  "fox",
  "penguin",
  "koala",
  "hedgehog",
  "hamster",
] as const;

export type QrAnimalId = (typeof QR_ANIMAL_IDS)[number];

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderQrAnimalSvg(id: QrAnimalId, foreground = "#342f33", background = "#ffffff") {
  const fg = esc(foreground);
  const bg = esc(background);
  const common = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"`;
  const eye = (x:number,y:number,r=1.8)=>`<circle fill="${fg}" cx="${x}" cy="${y}" r="${r}"/>`;

  const svg: Record<QrAnimalId, string> = {
    cat: `<svg ${common}>
      <path fill="${fg}" d="M12 25 11 9l12 8c6-3 12-3 18 0l12-8-1 16c4 5 6 10 6 16 0 13-11 20-26 20S6 54 6 41c0-6 2-11 6-16Z"/>
      <path fill="${bg}" d="M16 27c4-4 9-6 16-6s12 2 16 6v10c0 10-6 17-16 17s-16-7-16-17V27Z"/>
      <path fill="${fg}" d="M16 27c4-4 7-7 12-8-1 5-5 9-12 11Zm32 0c-4-4-7-7-12-8 1 5 5 9 12 11Z"/>
      ${eye(24,34)}${eye(40,34)}
      <path fill="${fg}" d="m32 38 3 2.3-3 2.3-3-2.3 3-2.3Z"/>
      <path stroke="${fg}" stroke-width="1.9" stroke-linecap="round" fill="none" d="M32 42v2m0 0c-2 2-4 2-6 0m6 0c2 2 4 2 6 0M18 40l-7-2m7 5-7 1m35-4 7-2m-7 5 7 1"/>
    </svg>`,

    dog: `<svg ${common}>
      <path fill="${fg}" d="M10 17c1-7 8-10 16-6 4-2 8-2 12 0 8-4 15-1 16 6 2 9-3 18-10 22-2 12-8 19-12 19s-10-7-12-19C13 35 8 26 10 17Z"/>
      <path fill="${bg}" d="M19 18c4-4 9-6 13-6s9 2 13 6v17c0 11-5 18-13 18s-13-7-13-18V18Z"/>
      ${eye(25,31)}${eye(39,31)}
      <ellipse fill="${fg}" cx="32" cy="37" rx="3.7" ry="2.8"/>
      <path stroke="${fg}" stroke-width="1.9" stroke-linecap="round" fill="none" d="M32 40v2m0 0c-2 2-4 2-6 0m6 0c2 2 4 2 6 0"/>
    </svg>`,

    rabbit: `<svg ${common}>
      <path fill="${fg}" d="M20 30c-6-10-8-27-1-29 7-1 11 15 12 25h2c1-10 5-26 12-25 7 2 5 19-1 29 8 4 13 10 13 18 0 9-10 14-25 14S7 57 7 48c0-8 5-14 13-18Z"/>
      <path fill="${bg}" d="M22 29c3-8 5-21 1-23-3 1-2 14 2 22Zm20 0c-3-8-5-21-1-23 3 1 2 14-2 22Z"/>
      <ellipse fill="${bg}" cx="32" cy="44" rx="15" ry="12"/>
      ${eye(25,42)}${eye(39,42)}
      <path fill="${fg}" d="m32 46 3 2-3 2.3-3-2.3 3-2Z"/>
      <path stroke="${fg}" stroke-width="1.8" stroke-linecap="round" fill="none" d="M32 50v2m0 0c-2 1-4 1-5 0m5 0c2 1 4 1 5 0"/>
    </svg>`,

    bear: `<svg ${common}>
      <circle fill="${fg}" cx="17" cy="16" r="9"/><circle fill="${fg}" cx="47" cy="16" r="9"/>
      <circle fill="${fg}" cx="32" cy="36" r="25"/>
      <ellipse fill="${bg}" cx="32" cy="38" rx="16" ry="15"/>
      ${eye(25,34)}${eye(39,34)}
      <ellipse fill="${fg}" cx="32" cy="40" rx="3.5" ry="2.6"/>
      <path stroke="${fg}" stroke-width="1.8" stroke-linecap="round" fill="none" d="M32 43v2m0 0c-2 2-4 2-6 0m6 0c2 2 4 2 6 0"/>
    </svg>`,

    panda: `<svg ${common}>
      <circle fill="${fg}" cx="17" cy="15" r="9"/><circle fill="${fg}" cx="47" cy="15" r="9"/>
      <circle fill="${fg}" cx="32" cy="36" r="25"/>
      <ellipse fill="${bg}" cx="32" cy="37" rx="18" ry="17"/>
      <ellipse fill="${fg}" cx="23" cy="34" rx="5.5" ry="7" transform="rotate(28 23 34)"/>
      <ellipse fill="${fg}" cx="41" cy="34" rx="5.5" ry="7" transform="rotate(-28 41 34)"/>
      ${eye(24,34,1.5)}${eye(40,34,1.5)}
      <ellipse fill="${fg}" cx="32" cy="42" rx="3.3" ry="2.5"/>
      <path stroke="${fg}" stroke-width="1.8" stroke-linecap="round" fill="none" d="M32 45v2m0 0c-2 2-4 2-6 0m6 0c2 2 4 2 6 0"/>
    </svg>`,

    chick: `<svg ${common}>
      <path fill="${fg}" d="M31 6c2 0 3 4 3 6 14 1 23 11 23 25 0 6-2 10-5 14l6 5-10 1c-4 3-9 5-16 5C18 62 7 52 7 38 7 24 16 14 29 12c0-2 0-6 2-6Z"/>
      <path fill="${bg}" d="M17 31c4-8 24-9 29 0 5 9 0 21-14 21S12 40 17 31Z"/>
      ${eye(24,34)}${eye(40,34)}
      <path fill="${fg}" d="m32 38 5 3-5 3-5-3 5-3Z"/>
      <path fill="${fg}" d="M12 37 5 42l8 1m39-6 7 5-8 1"/>
      <path stroke="${fg}" stroke-width="1.8" stroke-linecap="round" d="M26 53l-3 4m15-4 3 4"/>
    </svg>`,

    fox: `<svg ${common}>
      <path fill="${fg}" d="M7 8 25 20c5-2 9-2 14 0L57 8l-5 21c3 4 5 8 5 13 0 11-10 19-25 19S7 53 7 42c0-5 2-9 5-13L7 8Z"/>
      <path fill="${bg}" d="M13 33c7-5 12-5 19 2 7-7 12-7 19-2-3 12-9 20-19 20S16 45 13 33Z"/>
      ${eye(23,33)}${eye(41,33)}
      <path fill="${fg}" d="m32 40 4 3-4 4-4-4 4-3Z"/>
    </svg>`,

    penguin: `<svg ${common}>
      <path fill="${fg}" d="M32 4c14 0 22 13 22 30 0 5-1 10-3 14l7 7-10-2c-4 6-9 9-16 9s-12-3-16-9L6 55l7-7c-2-4-3-9-3-14C10 17 18 4 32 4Z"/>
      <path fill="${bg}" d="M20 24c3-6 7-9 12-5 5-4 9-1 12 5 5 10 3 27-12 27S15 34 20 24Z"/>
      ${eye(25,28)}${eye(39,28)}
      <path fill="${fg}" d="m32 33 4 3-4 3-4-3 4-3Z"/>
      <path fill="${fg}" d="M20 54c-4 1-7 4-8 7h13l-5-7Zm24 0c4 1 7 4 8 7H39l5-7Z"/>
    </svg>`,

    koala: `<svg ${common}>
      <circle fill="${fg}" cx="15" cy="22" r="12"/><circle fill="${fg}" cx="49" cy="22" r="12"/>
      <circle fill="${bg}" cx="15" cy="22" r="6"/><circle fill="${bg}" cx="49" cy="22" r="6"/>
      <ellipse fill="${fg}" cx="32" cy="36" rx="24" ry="24"/>
      <ellipse fill="${bg}" cx="32" cy="36" rx="18" ry="17"/>
      ${eye(24,32)}${eye(40,32)}
      <ellipse fill="${fg}" cx="32" cy="39" rx="5.5" ry="7"/>
      <path stroke="${fg}" stroke-width="1.8" stroke-linecap="round" fill="none" d="M32 46v3m0 0c-3 0-5-1-7-3m7 3c3 0 5-1 7-3"/>
    </svg>`,

    hedgehog: `<svg ${common}>
      <path fill="${fg}" d="m32 3 5 7 7-5 2 9 9-2-2 9 8 3-6 7 6 6-8 4 2 9-9-1-3 9-7-5-6 7-5-8-8 4-1-9-9 1 3-9-8-4 6-6-6-7 8-3-2-9 9 2 2-9 7 5 5-7Z"/>
      <ellipse fill="${bg}" cx="32" cy="38" rx="18" ry="16"/>
      ${eye(25,35)}${eye(39,35)}
      <ellipse fill="${fg}" cx="46" cy="40" rx="3.2" ry="2.8"/>
      <path fill="${fg}" d="m32 40 3 2-3 2-3-2 3-2Z"/>
      <path stroke="${fg}" stroke-width="1.7" stroke-linecap="round" fill="none" d="M32 44v2m0 0c-2 1-4 1-5 0m5 0c2 1 4 1 5 0"/>
    </svg>`,

    hamster: `<svg ${common}>
      <circle fill="${fg}" cx="18" cy="16" r="8"/><circle fill="${fg}" cx="46" cy="16" r="8"/>
      <circle fill="${bg}" cx="18" cy="16" r="4"/><circle fill="${bg}" cx="46" cy="16" r="4"/>
      <path fill="${fg}" d="M32 9c10 0 15 5 18 11 7 3 9 10 6 16 4 6 1 13-5 16-3 7-11 10-19 9-8 1-16-2-19-9-6-3-9-10-5-16-3-6-1-13 6-16 3-6 8-11 18-11Z"/>
      <path fill="${bg}" d="M17 30c4-6 9-8 15-4 6-4 11-2 15 4 5 8 2 20-15 20S12 38 17 30Z"/>
      ${eye(24,31)}${eye(40,31)}
      <circle fill="${bg}" cx="19" cy="40" r="5"/><circle fill="${bg}" cx="45" cy="40" r="5"/>
      <path fill="${fg}" d="m32 36 3 2.2-3 2.4-3-2.4 3-2.2Z"/>
      <path stroke="${fg}" stroke-width="1.8" stroke-linecap="round" fill="none" d="M32 41v3m0 0c-2.5 0-4.5-1-6-3m6 3c2.5 0 4.5-1 6-3M23 39l-5-2m5 5-5 1m23-4 5-2m-5 5 5 1"/>
    </svg>`,
  };

  return svg[id];
}
