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

  const svg: Record<QrAnimalId, string> = {
    cat: `<svg ${common}><path fill="${fg}" d="M12 25 9 7l17 10a28 28 0 0 1 12 0L55 7l-3 18c4 5 6 10 6 16 0 13-11 20-26 20S6 54 6 41c0-6 2-11 6-16Z"/><path fill="${bg}" d="M19 32c4-6 22-6 26 0 4 7 0 18-13 18S15 39 19 32Z"/><circle fill="${fg}" cx="24" cy="34" r="2.3"/><circle fill="${fg}" cx="40" cy="34" r="2.3"/><path fill="${fg}" d="m32 37 4 3-4 3-4-3 4-3Z"/><path stroke="${fg}" stroke-width="2.3" stroke-linecap="round" d="M23 43c3 3 6 3 9 0m9 0c-3 3-6 3-9 0" fill="none"/></svg>`,
    dog: `<svg ${common}><path fill="${fg}" d="M16 18C9 18 5 11 8 4c8 1 14 5 18 11 4-1 8-1 12 0C42 9 48 5 56 4c3 7-1 14-8 14 6 5 9 12 9 21 0 14-10 22-25 22S7 53 7 39c0-9 3-16 9-21Z"/><path fill="${bg}" d="M18 31c4-7 24-8 28 0 5 8 0 20-14 20S13 39 18 31Z"/><circle fill="${fg}" cx="24" cy="34" r="2.3"/><circle fill="${fg}" cx="40" cy="34" r="2.3"/><ellipse fill="${fg}" cx="32" cy="40" rx="4.5" ry="3.3"/><path stroke="${fg}" stroke-width="2.2" stroke-linecap="round" d="M32 43c-2 3-5 4-8 2m8-2c2 3 5 4 8 2" fill="none"/></svg>`,
    rabbit: `<svg ${common}><path fill="${fg}" d="M20 27C12 17 12 2 18 2c6 0 10 14 11 23h6c1-9 5-23 11-23 6 0 6 15-2 25 8 4 13 11 13 19 0 10-10 16-25 16S7 56 7 46c0-8 5-15 13-19Z"/><path fill="${bg}" d="M20 35c5-7 19-7 24 0 4 6 0 16-12 16S16 41 20 35Z"/><circle fill="${fg}" cx="24" cy="37" r="2.1"/><circle fill="${fg}" cx="40" cy="37" r="2.1"/><path fill="${fg}" d="m32 40 3.5 2.5L32 45l-3.5-2.5L32 40Z"/></svg>`,
    bear: `<svg ${common}><circle fill="${fg}" cx="16" cy="16" r="10"/><circle fill="${fg}" cx="48" cy="16" r="10"/><path fill="${fg}" d="M32 8c15 0 25 12 25 28 0 16-10 25-25 25S7 52 7 36C7 20 17 8 32 8Z"/><path fill="${bg}" d="M18 31c5-7 23-7 28 0 5 7 1 19-14 19S13 38 18 31Z"/><circle fill="${fg}" cx="24" cy="33" r="2.2"/><circle fill="${fg}" cx="40" cy="33" r="2.2"/><ellipse fill="${fg}" cx="32" cy="40" rx="4.6" ry="3.4"/></svg>`,
    panda: `<svg ${common}><circle fill="${fg}" cx="15" cy="15" r="10"/><circle fill="${fg}" cx="49" cy="15" r="10"/><path fill="${fg}" d="M32 7c15 0 25 12 25 29 0 16-10 25-25 25S7 52 7 36C7 19 17 7 32 7Z"/><ellipse fill="${bg}" cx="32" cy="35" rx="19" ry="17"/><ellipse fill="${fg}" cx="23" cy="31" rx="6" ry="8" transform="rotate(24 23 31)"/><ellipse fill="${fg}" cx="41" cy="31" rx="6" ry="8" transform="rotate(-24 41 31)"/><circle fill="${bg}" cx="24" cy="31" r="2"/><circle fill="${bg}" cx="40" cy="31" r="2"/><ellipse fill="${fg}" cx="32" cy="41" rx="4.4" ry="3.2"/></svg>`,
    chick: `<svg ${common}><path fill="${fg}" d="M31 8c15 0 25 11 25 26 0 6-2 11-5 15l8 5-12 1c-4 4-9 6-16 6C17 61 7 51 7 36 7 20 17 8 31 8Z"/><path fill="${bg}" d="M18 30c5-7 22-7 27 0 5 8 1 19-13 19S13 38 18 30Z"/><circle fill="${fg}" cx="24" cy="32" r="2.1"/><circle fill="${fg}" cx="39" cy="32" r="2.1"/><path fill="${fg}" d="m31.5 36 7 4-7 4-7-4 7-4Z"/><path fill="${fg}" d="M28 8 32 2l3 7 5-5-1 9Z"/></svg>`,
    fox: `<svg ${common}><path fill="${fg}" d="M8 8 26 20c4-1 8-1 12 0L56 8l-5 20c4 4 6 9 6 14 0 12-11 19-25 19S7 54 7 42c0-5 2-10 6-14L8 8Z"/><path fill="${bg}" d="M15 31c7-4 12-3 17 3 5-6 10-7 17-3-2 12-7 21-17 21S17 43 15 31Z"/><circle fill="${fg}" cx="23" cy="32" r="2.1"/><circle fill="${fg}" cx="41" cy="32" r="2.1"/><path fill="${fg}" d="m32 39 5 3-5 4-5-4 5-3Z"/></svg>`,
    penguin: `<svg ${common}><path fill="${fg}" d="M32 4c15 0 23 14 23 31 0 7-2 13-6 18l8 5-14-1c-3 3-7 5-11 5s-8-2-11-5L7 58l8-5c-4-5-6-11-6-18C9 18 17 4 32 4Z"/><path fill="${bg}" d="M20 25c3-7 8-10 12-6 4-4 9-1 12 6 5 11 2 27-12 27S15 36 20 25Z"/><circle fill="${fg}" cx="25" cy="27" r="2.1"/><circle fill="${fg}" cx="39" cy="27" r="2.1"/><path fill="${fg}" d="m32 32 5 4-5 4-5-4 5-4Z"/><path fill="${fg}" d="M21 56c-5 0-8 3-9 6h14l-5-6Zm22 0c5 0 8 3 9 6H38l5-6Z"/></svg>`,
    koala: `<svg ${common}><circle fill="${fg}" cx="14" cy="22" r="12"/><circle fill="${fg}" cx="50" cy="22" r="12"/><circle fill="${bg}" cx="14" cy="22" r="6.5"/><circle fill="${bg}" cx="50" cy="22" r="6.5"/><path fill="${fg}" d="M32 8c14 0 24 11 24 28 0 16-10 25-24 25S8 52 8 36C8 19 18 8 32 8Z"/><path fill="${bg}" d="M18 27c5-7 23-7 28 0 5 8 1 21-14 21S13 35 18 27Z"/><circle fill="${fg}" cx="24" cy="29" r="2.3"/><circle fill="${fg}" cx="40" cy="29" r="2.3"/><ellipse fill="${fg}" cx="32" cy="37" rx="6" ry="8"/><path stroke="${fg}" stroke-width="2.2" stroke-linecap="round" d="M32 45v4m0 0c-3 0-5-1-7-3m7 3c3 0 5-1 7-3" fill="none"/></svg>`,
    hedgehog: `<svg ${common}><path fill="${fg}" d="m5 37 7-5-6-7 9-1-3-9 9 3 1-10 8 7 6-9 5 10 10-5-1 11 9-1-5 9 7 4-7 6c-1 13-11 21-25 21C14 61 5 51 5 37Z"/><path fill="${bg}" d="M23 26c13-2 27 5 28 16-2 8-10 13-20 13-10 0-16-6-16-14 0-7 3-12 8-15Z"/><circle fill="${fg}" cx="29" cy="36" r="2.2"/><circle fill="${fg}" cx="42" cy="36" r="2.2"/><circle fill="${fg}" cx="49" cy="43" r="3.2"/></svg>`,
    hamster: `<svg ${common}><circle fill="${fg}" cx="18" cy="17" r="9"/><circle fill="${fg}" cx="46" cy="17" r="9"/><circle fill="${bg}" cx="18" cy="17" r="4.5"/><circle fill="${bg}" cx="46" cy="17" r="4.5"/><path fill="${fg}" d="M32 9c15 0 24 12 24 29 0 15-9 23-24 23S8 53 8 38C8 21 17 9 32 9Z"/><path fill="${bg}" d="M17 31c4-6 9-8 15-4 6-4 11-2 15 4 5 8 2 20-15 20S12 39 17 31Z"/><circle fill="${fg}" cx="24" cy="31" r="2.2"/><circle fill="${fg}" cx="40" cy="31" r="2.2"/><circle fill="${bg}" cx="20" cy="40" r="5.5"/><circle fill="${bg}" cx="44" cy="40" r="5.5"/><path fill="${fg}" d="m32 36 4 3-4 3-4-3 4-3Z"/><path stroke="${fg}" stroke-width="2.2" stroke-linecap="round" d="M32 42v3m0 0c-2.5 0-4.5-1-6-3m6 3c2.5 0 4.5-1 6-3" fill="none"/></svg>`,
  };
  return svg[id];
}
